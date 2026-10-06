import {
  artifactRefs,
  attemptsOnLine,
  CHANNELS_COMMAND,
  claudeCodeArtifacts,
  promptHash,
  resolvePrompt,
  type ArtifactAction,
  type ClaudeCodeArtifact,
} from "@/lib/claude-code";
import {
  effectivePrompt,
  MAX_SUGGESTION,
  MAX_SUGGESTIONS,
  MAX_WHY,
  replaceProblem,
} from "@/lib/dig";
import type {
  BoundBranch,
  BranchAction,
  BranchReport,
  BranchRow,
  BranchView,
  ClaudeCodeAgent,
  FileDiff,
  LaunchRequest,
  LaunchResult,
  LocalBranch,
  PromptSuggestion,
  ReplacedAttempt,
  RetryPreflight,
  RunPatch,
  RunSnapshot,
  RunStatus,
  RunSummary,
  SpinoffRequest,
  TaskLink,
  TaskPreview,
  WorktreeState,
} from "@/lib/desktop";
import { conversationText } from "@/lib/replies";
import { chatTitle, countToolCalls } from "@/lib/runs";
import type { DynamicToolUIPart, UIMessage } from "ai";
import {
  type ChildProcessWithoutNullStreams,
  execFile,
  spawn,
} from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  closeSync,
  fstatSync,
  openSync,
  readFileSync,
  readSync,
  statSync,
  unwatchFile,
  watchFile,
} from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { getPlugin } from "../plugins/store";
import { readJson, writeJson } from "../store";
import { SessionAgents } from "./agents";
import { approvalHub, AUTO_APPROVED } from "./approval-hub";
import { writeContext } from "./spinoff-context";
import {
  claudeCodeInfo,
  configDir,
  findTranscript,
  rewindFiles,
  sessionCwd,
  turnArgs,
  turnEnv,
} from "./claude-cli";
import {
  type Caller,
  CHANNEL,
  mcpServer,
  type PermissionRequest,
} from "./server";
import {
  EDIT_TOOLS,
  editedChanges,
  editedFileDiff,
  MAX_LISTED_FILES,
  worktreeChanges,
  worktreeFileDiff,
} from "./changes";
import {
  commentsPrompt,
  mergePrompt,
  newBranchPrompt,
  openPrPrompt,
  type PromptSource,
  type PromptTarget,
  pushPrompt,
  splitPrompt,
  syncPrompt,
  testPrompt,
  updatePrPrompt,
} from "./branch-prompts";
import {
  branchExists,
  branchState,
  commitsSince,
  defaultBase,
  doneWhen,
  filesSince,
  localBranches,
  mergedInto,
  testFiles,
  worktreeOf,
} from "./branches";
import { DIG_DISALLOWED, digMarker, digNote, digPrompt, MAX_RUNNING_DIGS } from "./dig";
import { git, inspect } from "./git";
import { loadPluginOperations } from "./tenant-bridge";
import { originNote, spinoffNote, toolOf, Transcript, withRegenerateNote } from "./transcript";
import type { ApprovalRequest } from "./types";
import {
  createWorktree,
  nextBranch,
  removeWorktree,
  settled as creationSettled,
  worktreeOutcome,
  worktreeState,
} from "./worktrees";

// Claude Code sessions: attached from a terminal through the plugin's hooks, or
// run by the app one headless turn at a time. The transcript is the source of truth.

const INDEX = "claude-code-sessions.json";
const SESSION_ID = /^[\w-]{1,64}$/;
const POLL_MS = 250;
// Subagents write to their own transcripts, which aren't watched.
const AGENTS_POLL_MS = 1000;
// Claude Code may not have written the call yet when the approval arrives.
const CLAIM_TRIES = 20;
const CLAIM_WAIT_MS = 100;
const STOP_GRACE_MS = 3000;
const INTERRUPTED = "Interrupted when Agent Desktop closed.";
// An idle process's input closes after this; Claude Code then finishes any background work and exits.
const IDLE_MS = 10 * 60_000;
const FINISHING =
  "Claude Code is finishing background work; your message goes when it's done.";
// How long an idle terminal session gets to take a channel message.
const PICKUP_MS = 15_000;
const PICKUP_CHECK_MS = 3000;
const SUBAGENT_TOOLS = new Set(["Agent", "Task"]);
const LISTED_FILES = 20;
// A task's process closes sooner: a bulk run would otherwise leave many idle.
const TASK_IDLE_MS = 60_000;
/** The queue starts tasks only while fewer than this many run. */
export const MAX_RUNNING_TASKS = 4;
const STOPPED_EARLY = "Stopped before it started.";
const TIMED_OUT = "An approval timed out";
const ANSWER_CHARS = 8_000;
const ANSWER_CHARS_ONE = 50_000;
const CONVERSATION_CHARS = 50_000;
const NOT_STARTED = "This task hasn't sent its first message yet. Use Start now.";
// A tool of the session's Claude Code that files Jira tickets.
const TICKET_TOOL = /atlassian|jira/i;
const STATUS_WORDS: Record<RunStatus, string> = {
  queued: "queued",
  running: "running",
  awaiting_approval: "awaiting approval",
  completed: "completed",
  failed: "failed",
  stopped: "stopped",
};
const notTaken = (texts: string[]) =>
  `The terminal session didn't take ${texts.map((t) => `"${t}"`).join(", ") || "the message"}. Start Claude Code with: ${CHANNELS_COMMAND}`;

/** What every Claude Code hook posts. */
export interface HookInput {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  hook_event_name?: string;
}

/** A task's first message stays here, out of the summary the window gets, until the transcript has it. */
type Stored = RunSummary & { transcriptPath: string; start?: { text: string } };

/** What the MCP tools know about the session that calls them. */
export interface SessionInfo {
  runId: string;
  cwd: string;
  depth: number;
  task?: TaskLink;
}

/** A task needs the user: an approval or question waits, or it failed. */
export interface Attention {
  rootId: string;
  taskId: string;
  kind: "approval" | "question" | "failed";
}

const isDirectory = (dir: string) => {
  try {
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
};

/** A message on its way: over a terminal's channel, into the app's process, or held for its next one. */
type Pending = { id: string; text: string } & (
  | { via: "channel"; due: number }
  | { via: "input"; after: number }
  | { via: "queued" }
);

const textOf = (message: UIMessage) =>
  message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("\n")
    .trim();

const newTranscript = (startAt?: string) =>
  new Transcript((id) => getPlugin(id)?.label ?? id, startAt);

// A forked dig's window starts at its own first message, not the parent's conversation.
const startOf = (summary: RunSummary) => {
  const task = summary.claudeCode?.task;
  return task?.kind === "dig" && task.fork ? digMarker(summary.id) : undefined;
};

function readTranscript(file: string): Transcript | undefined {
  const transcript = newTranscript();
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) if (line) transcript.feed(line);
  } catch {
    return undefined;
  }
  return transcript;
}

/** A session's checkpoint before a user message, and the files it changed after it: path → created. */
type Restorable = { sessionId: string; checkpoint?: string; files: Map<string, boolean> };

function editedFiles(messages: UIMessage[]): Map<string, boolean> {
  const files = new Map<string, boolean>();
  for (const part of messages.flatMap((m) => m.parts)) {
    if (part.type !== "dynamic-tool" || !EDIT_TOOLS.has(part.toolName)) continue;
    if (part.state !== "output-available") continue;
    const input = (part.input ?? {}) as { file_path?: string; notebook_path?: string };
    const file = input.file_path ?? input.notebook_path;
    if (file && !files.has(file))
      files.set(file, part.toolName === "Write" && /created/i.test(String(part.output)));
  }
  return files;
}

type Read = { changed: number[]; mtime?: number };

class Session {
  transcript = newTranscript();
  agents = new SessionAgents();
  agentsTimer?: NodeJS.Timeout;
  /** The agents the window was last sent, as JSON. */
  agentsSent = "[]";
  loaded = false;
  /** Mid-turn in a terminal, by its hooks. */
  running = false;
  failed = false;
  /** The `claude -p` process the app runs for it; it takes messages while its input is open. */
  turn?: ChildProcessWithoutNullStreams;
  /** That process is mid-turn: from a message written, or a turn it starts itself, to its result. */
  busy = false;
  idleTimer?: NodeJS.Timeout;
  stopped = false;
  notice?: string;
  /** A task waiting for a slot. */
  queued = false;
  /** When it joined the queue; the oldest starts first. */
  queuedAt = 0;
  /** Queued when the app last closed: it waits for Resume. */
  held = false;
  /** It holds a slot on its way to its first turn. */
  starting = false;
  /** Bumped by each start, so an earlier one that was stopped can tell. */
  attempt = 0;
  /** A task's first message, until the transcript has it. */
  start?: { text: string };
  /** An approval in this turn timed out. */
  timedOut = false;
  /** The Claude Code process a terminal session runs in, from its hooks. */
  pid?: number;
  /** Sent, not yet in the transcript. */
  pending: Pending[] = [];
  pendingTimer?: NodeJS.Timeout;
  /** How many transcript messages the window has. */
  shown = 0;
  /** The transcript being watched, if any. */
  watched?: string;
  /** Set by a retry until its fork's transcript shows up; the window sees history up to `at`, then `text`. */
  retrying?: {
    previous: { sessionId?: string; transcriptPath: string };
    at: number;
    text: string;
    restored: boolean;
    /** The run shows the fork now; if its process ends without a transcript, the retry is undone. */
    forked: boolean;
  };
  private offset = 0;
  private rest = Buffer.alloc(0);

  constructor(
    public summary: RunSummary,
    public transcriptPath: string,
  ) {
    this.transcript = newTranscript(startOf(summary));
  }

  get live() {
    return this.summary.claudeCode?.live ?? false;
  }

  get task() {
    return this.summary.claudeCode?.task;
  }

  /** The Claude Code session it shows now. */
  get sessionId() {
    return this.summary.claudeCode?.sessionId ?? this.summary.id;
  }

  /** Reads `file` from its start: a new session's, or a retry's fork. */
  attach(file: string) {
    this.transcriptPath = file;
    this.transcript = newTranscript(startOf(this.summary));
    this.agents.reset();
    this.offset = 0;
    this.rest = Buffer.alloc(0);
  }

  /** Reads what was appended since; returns the changed message indices. */
  read(): Read {
    let fd: number;
    try {
      fd = openSync(this.transcriptPath, "r");
    } catch {
      return { changed: [] };
    }
    try {
      const { size, mtimeMs } = fstatSync(fd);
      const changed = new Set<number>();
      // Rewritten from the start: read it again.
      if (size < this.offset) {
        const length = this.transcript.messages.length;
        this.transcript = newTranscript(startOf(this.summary));
        this.agents.reset();
        this.offset = 0;
        this.rest = Buffer.alloc(0);
        for (let i = 0; i < length; i++) changed.add(i);
      }
      if (size > this.offset) {
        const chunk = Buffer.alloc(size - this.offset);
        readSync(fd, chunk, 0, chunk.length, this.offset);
        this.offset = size;
        const data = Buffer.concat([this.rest, chunk]);
        // Only whole lines, so a character split across reads stays whole.
        const end = data.lastIndexOf(0x0a);
        this.rest = end < 0 ? data : data.subarray(end + 1);
        if (end >= 0) {
          for (const line of data.subarray(0, end).toString("utf8").split("\n")) {
            if (!line) continue;
            for (const i of this.transcript.feed(line)) changed.add(i);
            this.agents.feed(line);
          }
        }
      }
      this.loaded = true;
      return { changed: [...changed], mtime: mtimeMs };
    } finally {
      closeSync(fd);
    }
  }
}

// The transcript messages the window has: mid-retry, only those before the retried one.
const shownOf = (session: Session) =>
  Math.min(session.transcript.messages.length, session.retrying?.at ?? Infinity);

const listed = (run: RunSummary) =>
  JSON.stringify([
    run.title,
    run.status,
    run.notice,
    run.toolCalls,
    run.artifacts?.map((a) => [a.id, a.title, a.bookmarks]),
    run.claudeCode,
  ]);

const lastAnswer = (messages: UIMessage[]) => {
  const at = messages.findLastIndex((m) => m.role === "assistant");
  const text = at < 0 ? undefined : messages[at].parts.findLast((p) => p.type === "text");
  return text?.type === "text" ? { at, text: text.text } : undefined;
};

// Only Claude Code's own layout: <config>/projects/<project>/<session>.jsonl.
function isTranscript(file: string, sessionId: string) {
  return (
    path.isAbsolute(file) &&
    path.basename(file) === `${sessionId}.jsonl` &&
    path.basename(path.dirname(path.dirname(file))) === "projects"
  );
}

export class ClaudeCodeSessions {
  private sessions = new Map<string, Session>();
  private pumping = false;
  /** The app is quitting: what's queued stays queued, to be held at the next start. */
  private quitting = false;
  private heldSent = 0;
  private attentionListeners: ((event: Attention) => void)[] = [];
  // Pending approvals by id, with the session and call that asked.
  private approvals = new Map<
    string,
    { runId: string; toolUseId: string; reason: string; question: boolean }
  >();
  /** A spin-off's context being written, by the session it reads. */
  private contexts = new Map<string, AbortController>();

  constructor(
    private readonly patch: (patch: RunPatch) => void,
    private readonly broadcast: (channel: string, payload: unknown) => void,
  ) {
    for (const [order, stored] of readJson<Stored[]>(INDEX, []).entries()) {
      const { transcriptPath, start, ...summary } = stored;
      // Tasks queued when the app closed wait for Resume.
      const queued = summary.status === "queued";
      // A turn the app ran was cut off when it quit; a terminal's turn is its own.
      const interrupted =
        summary.status === "stopped" ||
        (!summary.claudeCode?.live &&
          (summary.status === "running" || summary.status === "awaiting_approval"));
      const notice = interrupted ? (summary.notice ?? INTERRUPTED) : summary.notice;
      const session = new Session(
        {
          ...summary,
          notice,
          status: queued
            ? "queued"
            : interrupted
              ? "stopped"
              : summary.status === "failed"
                ? "failed"
                : "completed",
          claudeCode: {
            ...summary.claudeCode,
            cwd: summary.claudeCode?.cwd ?? "",
            live: false,
          },
        },
        transcriptPath,
      );
      session.stopped = interrupted;
      session.failed = summary.status === "failed";
      session.notice = notice;
      session.queued = session.held = queued;
      session.queuedAt = order;
      session.start = start && { text: start.text };
      this.sessions.set(summary.id, session);
    }
    this.heldSent = this.queue().held;
    approvalHub.onResolved((id, response) => {
      const approval = this.approvals.get(id);
      if (!approval) return;
      this.approvals.delete(id);
      const session = this.sessions.get(approval.runId);
      if (session && response.timedOut) session.timedOut = true;
      const index = session?.transcript.locate(approval.toolUseId);
      if (session)
        this.update(session, { changed: index === undefined ? [] : [index] });
    });
    this.listOldChanges();
  }

  // Tasks saved before outcomes listed files get the list once, as a turn's end would.
  private listOldChanges() {
    for (const session of this.sessions.values()) {
      if (!session.task?.outcome || session.task.outcome.files || session.queued) continue;
      // A refresh rebuilds the summary from the transcript, so it's read first.
      if (!session.loaded) this.update(session, session.read());
      void this.refreshChanges(session);
    }
  }

  has(runId: string) {
    return this.sessions.has(runId);
  }

  list(): RunSummary[] {
    return [...this.sessions.values()].map((s) => s.summary);
  }

  get(runId: string): RunSnapshot {
    const session = this.sessions.get(runId)!;
    if (!session.loaded) this.update(session, session.read());
    const messages = this.messages(session);
    session.shown = shownOf(session);
    return {
      messages,
      status: "ready",
      running: session.summary.status === "running",
    };
  }

  agents(runId: string): ClaudeCodeAgent[] {
    const session = this.sessions.get(runId);
    return session?.watched ? session.agents.list() : [];
  }

  // The session behind an MCP connection. A run header counts only with no pid or that
  // session's own process, so a `claude` started inside a task isn't taken for it.
  private sessionOf({ pid, runId }: Caller): Session | undefined {
    const named = runId ? this.sessions.get(runId) : undefined;
    if (named && (pid === undefined || named.turn?.pid === pid)) return named;
    if (pid === undefined) return undefined;
    const sessions = [...this.sessions.values()];
    return (
      sessions.find((s) => s.live && s.pid === pid) ??
      sessions.find((s) => s.turn?.pid === pid)
    );
  }

  /** The transcript of the session behind an MCP connection. */
  messagesOf(caller: Caller): UIMessage[] | undefined {
    const session = this.sessionOf(caller);
    if (!session) return undefined;
    this.load(session);
    return session.transcript.messages;
  }

  /** Where the session behind an MCP connection runs, and whether it's a task. */
  infoOf(caller: Caller): SessionInfo | undefined {
    const session = this.sessionOf(caller);
    if (!session) return undefined;
    const task = session.task;
    return {
      runId: session.summary.id,
      cwd: session.summary.claudeCode?.cwd ?? "",
      depth: task?.depth ?? 0,
      task,
    };
  }

  isTask(runId: string | undefined) {
    return !!(runId && this.sessions.get(runId)?.task);
  }

  /** A task moved into awaiting approval or failed. */
  onAttention(listener: (event: Attention) => void) {
    this.attentionListeners.push(listener);
  }

  /** The topmost session above `runId`, through the tasks' links. */
  rootOf(runId: string): string {
    let id = runId;
    for (let depth = 0; depth < 10; depth++) {
      const task = this.sessions.get(id)?.task;
      if (!task || task.parentRemoved || !this.sessions.has(task.parentRunId)) return id;
      id = task.parentRunId;
    }
    return id;
  }

  private load(session: Session) {
    this.locate(session);
    this.update(session, session.read());
  }

  /** The session an approval belongs to, once it is claimed. */
  runOfApproval(id: string): string | undefined {
    return this.approvals.get(id)?.runId;
  }

  /** Ties an approval to the session whose call asked for it, if there is one. */
  async claim(request: ApprovalRequest): Promise<string | undefined> {
    const { toolUseId } = request;
    if (!toolUseId) return undefined;
    const only = request.runId ? this.sessions.get(request.runId) : undefined;
    for (let attempt = 0; attempt < CLAIM_TRIES; attempt++) {
      for (const session of only ? [only] : this.sessions.values()) {
        if (!session.live && !session.turn) continue;
        this.locate(session);
        this.update(session, session.read());
        const index = session.transcript.locate(toolUseId);
        if (index === undefined) continue;
        const question = request.kind === "question";
        if (session.summary.claudeCode?.autoApprove && !question) {
          approvalHub.respond(request.id, true, AUTO_APPROVED);
          return session.summary.id;
        }
        this.approvals.set(request.id, {
          runId: session.summary.id,
          toolUseId,
          reason: request.description,
          question,
        });
        this.update(session, { changed: [index] });
        return session.summary.id;
      }
      await new Promise((resolve) => setTimeout(resolve, CLAIM_WAIT_MS));
    }
    return undefined;
  }

  /** Auto mode: every approval the session asks for is given, starting with those waiting. */
  setAutoApprove(runId: string, on: boolean) {
    const session = this.sessions.get(runId);
    if (!session?.summary.claudeCode) return;
    session.summary = {
      ...session.summary,
      claudeCode: { ...session.summary.claudeCode, autoApprove: on || undefined },
    };
    if (on) {
      for (const [id, approval] of this.approvals)
        if (approval.runId === runId && !approval.question)
          approvalHub.respond(id, true, AUTO_APPROVED);
    }
    this.update(session, { changed: [] }, true);
  }

  // ---- Tasks: sessions launched from an action on another session's artifact.

  private tasksOfRun(runId: string): Session[] {
    return [...this.sessions.values()].filter(
      (s) => s.task?.parentRunId === runId && !s.task.parentRemoved,
    );
  }

  private descendants(runId: string): Session[] {
    return this.tasksOfRun(runId).flatMap((s) => [s, ...this.descendants(s.summary.id)]);
  }

  // The parent's current artifacts, as accepted renders left them.
  private actionOf(parent: Session, artifactId: string, actionId: string) {
    this.load(parent);
    const artifact = claudeCodeArtifacts(parent.transcript.messages).find(
      (a) => a.id === artifactId,
    );
    const action = artifact?.actions.find((a) => a.id === actionId);
    return artifact && action ? { artifact, action } : undefined;
  }

  private setTask(session: Session, change: Partial<TaskLink>) {
    const claudeCode = session.summary.claudeCode!;
    session.summary = {
      ...session.summary,
      claudeCode: { ...claudeCode, task: { ...claudeCode.task!, ...change } },
    };
  }

  /** Where each action would run if launched now. */
  async preview(
    parentRunId: string,
    actions: { artifactId: string; actionId: string }[],
  ): Promise<TaskPreview[]> {
    const parent = this.sessions.get(parentRunId);
    const tops = new Map<string, Promise<string | undefined>>();
    const topOf = (dir: string) => {
      if (!tops.has(dir))
        tops.set(dir, inspect(dir).then((c) => c.top, () => undefined));
      return tops.get(dir)!;
    };
    // One inspection per checkout and base, however many rows name it.
    const checkouts = new Map<string, ReturnType<typeof inspect>>();
    const inspected = (dir: string, base: string) => {
      const key = `${dir}\0${base}`;
      if (!checkouts.has(key)) checkouts.set(key, inspect(dir, base));
      return checkouts.get(key)!;
    };
    // Tasks running in a checkout without a worktree of their own.
    const running = [...this.sessions.values()].filter(
      (s) =>
        s.task &&
        !s.task.worktree &&
        (s.busy || s.starting || this.status(s) === "awaiting_approval"),
    );
    return Promise.all(
      actions.map(async ({ artifactId, actionId }): Promise<TaskPreview> => {
        const found = parent && this.actionOf(parent, artifactId, actionId);
        const cwd = found?.action.cwd ?? parent?.summary.claudeCode?.cwd ?? "";
        if (!found) return { actionId, cwd, error: "Its action is gone" };
        if (!isDirectory(cwd)) return { actionId, cwd, error: `Folder not found: ${cwd}` };
        const { action } = found;
        if (action.worktree) {
          try {
            const base = action.base ?? "HEAD";
            const checkout = await inspected(cwd, base);
            const branch = await nextBranch(
              { repo: checkout.repo, common: checkout.common, base, commit: checkout.commit!, source: checkout.top },
              parentRunId,
              actionId,
            );
            return {
              actionId,
              cwd,
              repo: checkout.repo,
              common: checkout.common,
              branch,
              base,
              commit: checkout.commit,
              dirty: checkout.dirty,
            };
          } catch (error) {
            return { actionId, cwd, error: (error as Error).message };
          }
        }
        const top = await topOf(cwd);
        let sharedRunning = 0;
        if (top)
          for (const s of running)
            if ((await topOf(s.summary.claudeCode?.cwd ?? "")) === top) sharedRunning++;
        return { actionId, cwd, top, sharedRunning };
      }),
    );
  }

  /** Creates a queued task per request, in order; each is checked against the parent's current artifacts. */
  async launch(parentRunId: string, requests: LaunchRequest[]): Promise<LaunchResult[]> {
    const parent = this.sessions.get(parentRunId);
    const results: LaunchResult[] = [];
    const checkouts = new Map<string, ReturnType<typeof inspect>>();
    for (const request of requests) {
      const { actionId } = request;
      try {
        if (!parent) throw new Error("The parent session was removed.");
        const depth = parent.task?.depth ?? 0;
        if (depth >= 2) throw new Error("Sub-tasks can't launch tasks.");
        const found = this.actionOf(parent, request.artifactId, actionId);
        if (!found) throw new Error("Its action is gone");
        const { artifact, action } = found;
        const cwd = action.cwd ?? parent.summary.claudeCode?.cwd ?? sessionCwd();
        if (!isDirectory(cwd)) throw new Error(`Folder not found: ${cwd}`);
        const text = request.text.trim();
        const title = request.title.trim();
        if (!text || !title) throw new Error("A task needs a title and a prompt.");
        const prompt = this.promptOf(parent, artifact, action).text;
        let worktree: TaskLink["worktree"];
        if (action.worktree) {
          const base = request.base?.trim() || action.base || "HEAD";
          const key = `${cwd}\0${base}`;
          if (!checkouts.has(key)) checkouts.set(key, inspect(cwd, base));
          const checkout = await checkouts.get(key)!;
          worktree = {
            repo: checkout.repo,
            common: checkout.common,
            base,
            commit: checkout.commit!,
            source: checkout.top,
            sub: checkout.sub,
          };
        }
        const now = Date.now();
        const id = randomUUID();
        const session = new Session(
          {
            id,
            trigger: "manual",
            title,
            status: "queued",
            toolCalls: 0,
            createdAt: now,
            updatedAt: now,
            claudeCode: {
              cwd,
              live: false,
              task: {
                parentRunId,
                artifactId: artifact.id,
                actionId,
                depth: (depth + 1) as 1 | 2,
                launchedAt: now,
                promptEdited: text !== prompt.trim(),
                promptHash: promptHash(prompt),
                ...(worktree && { worktree }),
              },
            },
          },
          "",
        );
        session.queued = true;
        session.queuedAt = now + results.length / 1000;
        session.start = { text };
        this.sessions.set(id, session);
        this.update(session, { changed: [] }, true);
        results.push({ actionId, runId: id });
      } catch (error) {
        results.push({ actionId, error: (error as Error).message });
      }
    }
    this.pump();
    return results;
  }

  // Starts the oldest queued sessions while fewer than their lane's cap are starting or
  // mid-turn: tasks and digs have a lane each, so a dig never waits behind running tasks.
  private pump() {
    if (this.pumping || this.quitting) return;
    this.pumping = true;
    try {
      for (;;) {
        const sessions = [...this.sessions.values()];
        const lane = (s: Session) => (s.task?.kind === "dig" ? "dig" : "task");
        const caps = { task: MAX_RUNNING_TASKS, dig: MAX_RUNNING_DIGS };
        const running = { task: 0, dig: 0 };
        for (const s of sessions)
          if (s.task && (s.starting || (s.busy && !this.awaiting(s)))) running[lane(s)]++;
        const next = sessions
          .filter((s) => s.queued && !s.held && !s.starting && running[lane(s)] < caps[lane(s)])
          .sort((a, b) => a.queuedAt - b.queuedAt)[0];
        if (!next) return;
        this.begin(next);
      }
    } finally {
      this.pumping = false;
    }
  }

  private awaiting(session: Session) {
    const id = session.summary.id;
    return [...this.approvals.values()].some((a) => a.runId === id);
  }

  // Takes the slot in the same tick, so launches made together never start a fifth.
  private begin(session: Session) {
    session.queued = session.held = false;
    session.stopped = session.failed = false;
    session.notice = undefined;
    session.starting = true;
    void this.startTask(session);
  }

  private async startTask(session: Session) {
    const attempt = ++session.attempt;
    const id = session.summary.id;
    const alive = () =>
      this.sessions.get(id) === session && session.attempt === attempt && session.starting;
    const fail = (message: string) => {
      if (!alive()) return;
      session.starting = false;
      session.failed = true;
      session.notice = message;
      this.update(session, { changed: [] }, true);
    };
    this.update(session, { changed: [] }, true);
    try {
      const task = session.task!;
      if (task.worktree) {
        const worktree = await createWorktree({
          taskId: id,
          parentId: task.parentRunId,
          actionId: task.actionId!,
          worktree: task.worktree,
          record: (w) => {
            this.setTask(session, { worktree: w });
            this.save();
          },
        });
        this.setTask(session, { worktree });
        this.save();
        if (!alive()) return;
        const cwd = path.join(worktree.path!, worktree.sub ?? "");
        session.summary = {
          ...session.summary,
          claudeCode: { ...session.summary.claudeCode!, cwd },
        };
      }
      const cwd = session.summary.claudeCode!.cwd;
      if (!isDirectory(cwd)) return fail(`Folder not found: ${cwd}`);
      // An earlier start's process wrote the transcript: --session-id would refuse the id.
      this.locate(session);
      this.update(session, session.read());
      if (!session.start) {
        session.starting = false;
        return this.update(session, { changed: [] }, true);
      }
      const note = await this.taskNote(session, false);
      if (!alive()) return;
      const fork = task.kind === "dig" && !session.transcriptPath ? task.fork : undefined;
      await this.runTurn(session, session.start.text, {
        content: note + session.start.text,
        resume: session.transcriptPath ? session.sessionId : fork?.sessionId,
        resumeAt: fork?.at,
        alive,
      });
    } catch (error) {
      fail((error as Error).message);
    }
  }

  // The origin note in front of a task's first message; `retry` describes the earlier attempt.
  private async taskNote(session: Session, retry: boolean): Promise<string> {
    const task = session.task!;
    if (task.kind === "dig") return this.digNoteOf(session);
    const parent = this.sessions.get(task.parentRunId);
    if (task.kind === "spinoff")
      return spinoffNote({
        parentId: task.parentRunId,
        parentTitle: parent?.summary.title ?? "a removed session",
        depth: task.depth,
        context: task.context,
      });
    if (parent) this.load(parent);
    const artifact = parent
      ? claudeCodeArtifacts(parent.transcript.messages).find((a) => a.id === task.artifactId)
      : undefined;
    const { worktree } = task;
    let earlier: { commits: number; dirty: boolean } | undefined;
    if (retry && worktree?.path) {
      const outcome = await worktreeOutcome(worktree).catch(() => undefined);
      earlier = { commits: outcome?.commitsAhead ?? 0, dirty: outcome?.dirty ?? false };
    }
    return originNote({
      parentId: task.parentRunId,
      parentTitle: parent?.summary.title ?? "a removed session",
      artifactId: task.artifactId!,
      artifactTitle: artifact?.title ?? task.artifactId!,
      actionId: task.actionId!,
      depth: task.depth,
      worktree:
        worktree?.branch
          ? { branch: worktree.branch, base: worktree.base, commit: worktree.commit, earlier }
          : undefined,
    });
  }

  // ---- Spin-offs: a prompt from a session's message box, run as a session under it.

  /** What the session's conversation says that bears on `prompt`; empty when nothing does. */
  async writeContext(parentRunId: string, prompt: string): Promise<string> {
    const parent = this.sessions.get(parentRunId);
    if (!parent) throw new Error("The session was removed.");
    if (!prompt.trim()) throw new Error("Write the prompt first.");
    this.cancelContext(parentRunId);
    const controller = new AbortController();
    this.contexts.set(parentRunId, controller);
    try {
      const { found } = await claudeCodeInfo();
      if (!found) throw new Error("Claude Code isn't found. Set it up in Options.");
      this.load(parent);
      return await writeContext({
        command: found.path,
        title: parent.summary.title,
        cwd: parent.summary.claudeCode?.cwd ?? "",
        messages: parent.transcript.messages.slice(0, shownOf(parent)),
        prompt: prompt.trim(),
        signal: controller.signal,
      });
    } finally {
      if (this.contexts.get(parentRunId) === controller) this.contexts.delete(parentRunId);
    }
  }

  cancelContext(parentRunId: string) {
    this.contexts.get(parentRunId)?.abort();
    this.contexts.delete(parentRunId);
  }

  /** Starts the prompt as a session under this one, now: the user sent it, so it skips the queue. */
  spinoff(parentRunId: string, request: SpinoffRequest): string {
    const parent = this.sessions.get(parentRunId);
    if (!parent) throw new Error("The session was removed.");
    if (parent.task?.kind === "dig") throw new Error("A dig can't start sessions.");
    const depth = parent.task?.depth ?? 0;
    if (depth >= 2) throw new Error("Sub-tasks can't start sessions under them.");
    const prompt = request.prompt.trim();
    const title = request.title.trim();
    if (!prompt || !title) throw new Error("A session needs a title and a prompt.");
    const cwd = parent.summary.claudeCode?.cwd || sessionCwd();
    if (!isDirectory(cwd)) throw new Error(`Folder not found: ${cwd}`);
    const context = request.context?.trim();
    const now = Date.now();
    const id = randomUUID();
    const session = new Session(
      {
        id,
        trigger: "manual",
        title,
        status: "running",
        toolCalls: 0,
        createdAt: now,
        updatedAt: now,
        claudeCode: {
          cwd,
          live: false,
          task: {
            kind: "spinoff",
            parentRunId,
            depth: (depth + 1) as 1 | 2,
            launchedAt: now,
            promptEdited: false,
            promptHash: promptHash(prompt),
            ...(context && { context }),
          },
        },
      },
      "",
    );
    session.start = { text: prompt };
    this.sessions.set(id, session);
    this.begin(session);
    return id;
  }

  // ---- Digs: read-only sessions into an action, whose suggestions go on top of its prompt.

  /** The action's prompt as a task would get it: the agent's, with accepted suggestions. */
  private promptOf(
    parent: Session,
    artifact: ClaudeCodeArtifact,
    action: ArtifactAction,
  ): { agent: string; text: string; accepted: number } {
    const agent = resolvePrompt(artifact, action) ?? "";
    const mine = (parent.summary.claudeCode?.suggestions ?? []).filter(
      (s) => s.artifactId === artifact.id && s.actionId === action.id,
    );
    const { text, applied } = effectivePrompt(agent, mine);
    return { agent, text, accepted: applied.length };
  }

  private digsOf(parentRunId: string, artifactId: string, actionId: string): Session[] {
    return this.tasksOfRun(parentRunId).filter(
      (s) =>
        s.task!.kind === "dig" && s.task!.artifactId === artifactId && s.task!.actionId === actionId,
    );
  }

  isDig(runId: string | undefined) {
    return !!(runId && this.sessions.get(runId)?.task?.kind === "dig");
  }

  /** Starts a dig into an action, or returns the one already running for the same prompt. */
  async dig(parentRunId: string, artifactId: string, actionId: string): Promise<string> {
    const parent = this.sessions.get(parentRunId);
    if (!parent) throw new Error("The parent session was removed.");
    const depth = parent.task?.depth ?? 0;
    if (depth >= 2) throw new Error("Sub-tasks can't launch tasks, so their actions aren't dug into.");
    const found = this.actionOf(parent, artifactId, actionId);
    if (!found) throw new Error("Its action is gone");
    const { artifact, action } = found;
    const { text: prompt } = this.promptOf(parent, artifact, action);
    if (!prompt.trim()) throw new Error("This action has no prompt to dig into.");
    const hash = promptHash(prompt);
    const digs = this.digsOf(parentRunId, artifactId, actionId);
    const same = digs.find(
      (d) => d.task!.promptHash === hash && (d.queued || d.starting || d.busy),
    );
    if (same) return same.summary.id;
    for (const d of digs) this.archiveDig(d, true);

    const parentCwd = parent.summary.claudeCode?.cwd ?? "";
    const cwd = isDirectory(parentCwd) ? parentCwd : sessionCwd();
    const target = action.cwd ?? cwd;
    const reads =
      isDirectory(target) && path.resolve(target) !== path.resolve(cwd) ? target : undefined;
    // A fork has the conversation that wrote the action. It resumes from the parent's folder,
    // and only a session the app runs; mid-turn, it stops where that turn began.
    const { found: cli } = await claudeCodeInfo();
    const lastPrompt = parent.transcript.messages.findLastIndex((m) => m.role === "user");
    const at = parent.busy ? parent.transcript.prompt(lastPrompt)?.resumeAt : undefined;
    const fork =
      cli?.retry &&
      cwd === parentCwd &&
      !parent.live &&
      !parent.retrying &&
      parent.transcriptPath &&
      (!parent.busy || at)
        ? { sessionId: parent.sessionId, ...(at && { at }) }
        : undefined;

    const now = Date.now();
    const id = randomUUID();
    const session = new Session(
      {
        id,
        trigger: "manual",
        title: `Dig · ${action.title}`,
        status: "queued",
        toolCalls: 0,
        createdAt: now,
        updatedAt: now,
        claudeCode: {
          cwd,
          live: false,
          task: {
            kind: "dig",
            parentRunId,
            artifactId,
            actionId,
            depth: (depth + 1) as 1 | 2,
            launchedAt: now,
            promptEdited: false,
            promptHash: hash,
            ...(fork && { fork }),
            ...(reads && { reads }),
          },
        },
      },
      "",
    );
    session.queued = true;
    session.queuedAt = now;
    session.start = { text: digPrompt(action.title, prompt) };
    this.sessions.set(id, session);
    this.update(session, { changed: [] }, true);
    this.pump();
    return id;
  }

  // What the dig is told about the launch it looks into, read when it starts.
  private async digNoteOf(session: Session): Promise<string> {
    const task = session.task!;
    const parent = this.sessions.get(task.parentRunId);
    const found = parent && this.actionOf(parent, task.artifactId!, task.actionId!);
    const action = found?.action;
    const cwd = action?.cwd ?? parent?.summary.claudeCode?.cwd ?? session.summary.claudeCode!.cwd;
    let worktree: Parameters<typeof digNote>[0]["worktree"];
    if (action?.worktree) {
      const base = action.base ?? "HEAD";
      const checkout = await inspect(cwd, base).catch(() => undefined);
      const branch =
        checkout &&
        (await nextBranch(
          { repo: checkout.repo, common: checkout.common, base, commit: checkout.commit!, source: checkout.top },
          task.parentRunId,
          task.actionId!,
        ).catch(() => undefined));
      worktree = { repo: checkout?.repo ?? path.basename(cwd), base, commit: checkout?.commit, branch };
    }
    const tasks = this.tasksOfRun(task.parentRunId)
      .filter(
        (t) =>
          t.task!.kind !== "dig" &&
          t.task!.artifactId === task.artifactId &&
          t.task!.actionId === task.actionId,
      )
      .map((t) => {
        const branch = t.task!.worktree?.branch ? ` on ${t.task!.worktree.branch}` : "";
        const answer = t.task!.outcome?.answer ? `: ${t.task!.outcome.answer.slice(0, 160)}` : "";
        return `${t.summary.title} (${t.summary.status}${branch})${answer}`;
      });
    const { found: cli } = await claudeCodeInfo();
    return digNote({
      runId: session.summary.id,
      parentId: task.parentRunId,
      parentTitle: parent?.summary.title ?? "a removed session",
      artifactId: task.artifactId!,
      artifactTitle: found?.artifact.title ?? task.artifactId!,
      actionId: task.actionId!,
      actionTitle: action?.title ?? session.summary.title,
      forked: !!task.fork,
      cwd,
      worktree,
      tasks,
      accepted: found ? this.promptOf(parent!, found.artifact, found.action).accepted : 0,
      acceptEdits: !!cli?.acceptEdits,
    });
  }

  // A dig folds away once replaced, or once the user settled all it suggested.
  private archiveDig(dig: Session, superseded: boolean) {
    const parent = this.sessions.get(dig.task!.parentRunId);
    if (superseded && parent)
      this.setSuggestions(
        parent,
        (parent.summary.claudeCode?.suggestions ?? []).map((s) =>
          s.digRunId === dig.summary.id && s.status === "pending"
            ? { ...s, status: "superseded" as const }
            : s,
        ),
      );
    if (dig.task!.archived) return;
    this.setTask(dig, { archived: true });
    this.update(dig, { changed: [] }, true);
  }

  private setSuggestions(parent: Session, suggestions: PromptSuggestion[]) {
    parent.summary = {
      ...parent.summary,
      claudeCode: { ...parent.summary.claudeCode!, suggestions },
    };
    this.update(parent, { changed: [] }, true);
  }

  /** ui_suggest_prompt_changes: a dig's changes to its action's prompt, in place of its pending ones. */
  suggest(caller: Caller, changes: unknown): string {
    const session = this.sessionOf(caller);
    const task = session?.task;
    if (!session || task?.kind !== "dig") throw new Error("Only a dig suggests prompt changes.");
    const parent = task.parentRemoved ? undefined : this.sessions.get(task.parentRunId);
    if (!parent) throw new Error("The parent session was removed.");
    const found = this.actionOf(parent, task.artifactId!, task.actionId!);
    if (!found) throw new Error("Its action is gone");
    const { agent, text: prompt } = this.promptOf(parent, found.artifact, found.action);
    if (!Array.isArray(changes)) throw new Error("changes must be an array.");
    const problems: string[] = [];
    if (changes.length > MAX_SUGGESTIONS)
      problems.push(`Send at most ${MAX_SUGGESTIONS} changes; these are ${changes.length}.`);
    const list = changes.map((raw, i) => {
      const c = (raw ?? {}) as Record<string, unknown>;
      const name = `Change ${i + 1}`;
      const kind = c.kind === "replace" ? "replace" : "append";
      if (c.kind !== "append" && c.kind !== "replace")
        problems.push(`${name}: kind must be "append" or "replace".`);
      const text = typeof c.text === "string" ? c.text.trim() : "";
      const why = typeof c.why === "string" ? c.why.trim() : "";
      const find = typeof c.find === "string" ? c.find : undefined;
      if (!text) problems.push(`${name}: it needs text.`);
      else if (text.length > MAX_SUGGESTION)
        problems.push(`${name}: its text has ${text.length} characters; the most is ${MAX_SUGGESTION}.`);
      if (!why) problems.push(`${name}: it needs a why.`);
      else if (why.length > MAX_WHY)
        problems.push(`${name}: its why has ${why.length} characters; the most is ${MAX_WHY}.`);
      if (kind === "replace") {
        const problem = replaceProblem(prompt, find);
        if (problem) problems.push(`${name}: ${problem} Quote it exactly as the prompt has it.`);
      }
      return { kind, text, why, find } as const;
    });
    if (problems.length > 0) throw new Error(problems.join("\n"));
    const now = Date.now();
    const kept = (parent.summary.claudeCode?.suggestions ?? []).filter(
      (s) => !(s.digRunId === session.summary.id && s.status === "pending"),
    );
    const added = list.map(
      (c, i): PromptSuggestion => ({
        id: randomUUID().slice(0, 8),
        artifactId: task.artifactId!,
        actionId: task.actionId!,
        digRunId: session.summary.id,
        agentHash: promptHash(agent),
        kind: c.kind,
        ...(c.kind === "replace" && { find: c.find }),
        text: c.text,
        why: c.why,
        status: "pending",
        createdAt: now + i,
      }),
    );
    this.setSuggestions(parent, [...kept, ...added]);
    return added.length === 0
      ? "No changes sent."
      : `Sent ${added.length} suggested change${added.length === 1 ? "" : "s"} to the user, who accepts or dismisses each.`;
  }

  /** The user accepts or dismisses a suggestion, or takes that back. */
  decide(parentRunId: string, suggestionId: string, status: "accepted" | "dismissed" | "pending") {
    const parent = this.sessions.get(parentRunId);
    const list = parent?.summary.claudeCode?.suggestions ?? [];
    const suggestion = list.find((s) => s.id === suggestionId);
    if (!parent || !suggestion) throw new Error("That suggestion is gone.");
    if (status === "accepted") {
      const found = this.actionOf(parent, suggestion.artifactId, suggestion.actionId);
      if (!found) throw new Error("Its action is gone");
      const { agent, text } = this.promptOf(parent, found.artifact, found.action);
      if (promptHash(agent) !== suggestion.agentHash)
        throw new Error("The agent changed this prompt since the dig. Dig again.");
      const problem = suggestion.kind === "replace" && replaceProblem(text, suggestion.find);
      if (problem) throw new Error(problem);
    }
    const next = list.map((s) => (s.id === suggestionId ? { ...s, status } : s));
    this.setSuggestions(parent, next);
    const dig = this.sessions.get(suggestion.digRunId);
    if (!dig?.task) return;
    const settled = next
      .filter((s) => s.digRunId === suggestion.digRunId)
      .every((s) => s.status !== "pending");
    if (settled) this.archiveDig(dig, false);
    else if (dig.task.archived && next.some((s) => s.digRunId === dig.summary.id && s.status === "pending")) {
      this.setTask(dig, { archived: undefined });
      this.update(dig, { changed: [] }, true);
    }
  }

  /** Starts a queued, held or never-started task now, past the cap. */
  startNow(runId: string) {
    const session = this.sessions.get(runId);
    if (!session?.start || session.starting || session.turn) return;
    this.begin(session);
  }

  /** Queues a task whose first message was never sent, again. */
  startAgain(runId: string) {
    const session = this.sessions.get(runId);
    if (!session?.start || session.starting || session.queued || session.turn) return;
    session.queued = true;
    session.queuedAt = Date.now();
    session.stopped = session.failed = false;
    session.notice = undefined;
    this.update(session, { changed: [] }, true);
    this.pump();
  }

  /** Tasks queued when the app last closed, waiting for Resume. */
  queue() {
    return {
      held: [...this.sessions.values()].filter((s) => s.queued && s.held).length,
    };
  }

  resumeQueue() {
    for (const session of this.sessions.values()) session.held = false;
    this.syncQueue();
    this.pump();
  }

  private syncQueue() {
    const { held } = this.queue();
    if (held === this.heldSent) return;
    this.heldSent = held;
    this.broadcast("claudeCode:queue", { held });
  }

  /** Stops every running and queued task below the session. */
  stopTasks(runId: string) {
    for (const session of this.descendants(runId)) {
      if (session.queued || session.starting || session.busy || this.awaiting(session))
        this.stop(session.summary.id);
    }
  }

  // What the task changed, taken after its answer: in its worktree, or with its own edits.
  private async refreshChanges(session: Session) {
    const worktree = session.task?.worktree;
    const counts = worktree?.path
      ? await worktreeOutcome(worktree).catch(() => undefined)
      : await editedChanges(session.transcript.messages, session.summary.claudeCode!.cwd).then(
          (files) => ({ filesChanged: files.length, files: files.slice(0, MAX_LISTED_FILES) }),
          () => undefined,
        );
    const task = session.task;
    if (!counts || !task?.outcome || this.sessions.get(session.summary.id) !== session) return;
    this.setTask(session, { outcome: { ...task.outcome, ...counts } });
    this.update(session, { changed: [] }, true);
  }

  /** A file the task changed, before and after, as they are now. */
  async fileDiff(runId: string, file: string): Promise<FileDiff> {
    const session = this.sessions.get(runId);
    if (!session?.task) throw new Error(`No task ${runId}.`);
    const worktree = session.task.worktree;
    if (worktree?.path) {
      const changed = (await worktreeChanges(worktree)).find((f) => f.path === file);
      if (changed) return worktreeFileDiff(worktree, changed);
    } else {
      if (!session.loaded) this.update(session, session.read());
      const cwd = session.summary.claudeCode!.cwd;
      const diff = await editedFileDiff(session.transcript.messages, cwd, file);
      if (diff) return diff;
    }
    throw new Error("This file has no changes now.");
  }

  /** The worktrees of these tasks, as they are now. */
  async worktreeStates(runIds: string[]): Promise<Record<string, WorktreeState>> {
    const states: Record<string, WorktreeState> = {};
    for (const runId of runIds) {
      const worktree = this.sessions.get(runId)?.task?.worktree;
      if (worktree?.path) states[runId] = await worktreeState(worktree);
    }
    return states;
  }

  // ---- Branches: what a session binds, and the task branches under it that merge up.

  private setClaudeCode(session: Session, change: Partial<NonNullable<RunSummary["claudeCode"]>>) {
    session.summary = {
      ...session.summary,
      claudeCode: { ...session.summary.claudeCode!, ...change },
    };
  }

  /** The session's bindings; a task's own worktree branch counts in its repo. */
  private bindingsOf(session: Session): (BoundBranch & { implicit?: boolean })[] {
    const worktree = session.task?.worktree;
    const own =
      worktree?.branch && worktree.path && session.task?.kind !== "dig"
        ? [
            {
              common: worktree.common,
              repo: worktree.repo,
              name: worktree.branch,
              boundAt: session.task!.launchedAt,
              report: session.task!.report,
              implicit: true,
            },
          ]
        : [];
    const explicit = (session.summary.claudeCode?.branches ?? []).filter(
      (b) => !own.some((o) => o.common === b.common),
    );
    return [...own, ...explicit];
  }

  /** A task's upstream: the nearest ancestor's binding in the task's repo. */
  private upstreamOf(session: Session): (BoundBranch & { owner: string }) | undefined {
    const common = session.task?.worktree?.common;
    let current = session;
    for (let depth = 0; common && depth < 10; depth++) {
      const task = current.task;
      const parent = task && !task.parentRemoved ? this.sessions.get(task.parentRunId) : undefined;
      if (!parent) return undefined;
      const bound = this.bindingsOf(parent).find((b) => b.common === common);
      if (bound) return { ...bound, owner: parent.summary.id };
      current = parent;
    }
    return undefined;
  }

  /** A session without a branch of its own acts on its nearest ancestor's, in repos it binds none in. */
  private inheritedOf(session: Session): (BoundBranch & { implicit?: boolean; owner: string })[] {
    if (session.task?.kind === "dig" || session.task?.worktree?.branch) return [];
    const own = new Set(this.bindingsOf(session).map((b) => b.common));
    const found = new Map<string, BoundBranch & { implicit?: boolean; owner: string }>();
    let current = session;
    for (let depth = 0; depth < 10; depth++) {
      const task = current.task;
      const parent = task && !task.parentRemoved ? this.sessions.get(task.parentRunId) : undefined;
      if (!parent) break;
      for (const b of this.bindingsOf(parent))
        if (!own.has(b.common) && !found.has(b.common)) found.set(b.common, { ...b, owner: parent.summary.id });
      current = parent;
    }
    return [...found.values()];
  }

  // A process takes its folders when it starts: an idle one ends, so the next message starts one with them.
  private restartIdle(session: Session) {
    if (session.turn && !session.busy && !session.turn.stdin.writableEnded) session.turn.stdin.end();
  }

  // The worktrees of the session's own bindings, and of those it inherits: its turns may edit them.
  private async boundWorktrees(session: Session): Promise<string[]> {
    const list = [...(session.summary.claudeCode?.branches ?? []), ...this.inheritedOf(session)];
    const found = await Promise.all(
      list.map((b) => worktreeOf(b.common, b.name).catch(() => undefined)),
    );
    return found.filter((dir): dir is string => !!dir);
  }

  /** From the init event: whether the session's Claude Code can file tickets. */
  private noteTools(session: Session, tools: unknown) {
    if (!Array.isArray(tools)) return;
    const tickets =
      tools.some((t) => typeof t === "string" && TICKET_TOOL.test(t) && !/__authenticate$/.test(t)) ||
      undefined;
    if (session.summary.claudeCode?.tickets === tickets) return;
    this.setClaudeCode(session, { tickets });
    this.update(session, { changed: [] }, true);
  }

  // What the merge and split prompts say about a task's branch.
  private async sourceOf(task: Session): Promise<PromptSource> {
    const link = task.task!;
    const worktree = link.worktree!;
    const branch = worktree.branch!;
    const commits = await commitsSince(worktree.common, worktree.commit, branch);
    const files = await filesSince(worktree.common, worktree.commit, branch);
    // The brief as launched, edits included; the action's, if the transcript is gone.
    this.load(task);
    const first = task.transcript.messages.find((m) => m.role === "user");
    const parent = this.sessions.get(link.parentRunId);
    const found = parent && this.actionOf(parent, link.artifactId!, link.actionId!);
    const brief =
      (first && textOf(first)) ||
      task.start?.text ||
      (found ? this.promptOf(parent!, found.artifact, found.action).text : "");
    return {
      title: task.summary.title,
      branch,
      worktree: worktree.path,
      base: worktree.commit,
      commits,
      files,
      doneWhen: doneWhen(brief),
      tests: testFiles(files),
    };
  }

  // A task branch as a Merge menu lists it, against `target` in its repo.
  private async rowOf(
    task: Session,
    target: BoundBranch | undefined,
    why?: string,
  ): Promise<BranchRow> {
    const link = task.task!;
    const worktree = link.worktree!;
    const branch = worktree.branch!;
    const exists = await branchExists(worktree.common, branch);
    const commits = exists ? await commitsSince(worktree.common, worktree.commit, branch) : [];
    const merged =
      !!target &&
      target.name !== branch &&
      exists &&
      (await mergedInto(
        worktree.common,
        worktree.commit,
        branch,
        target.name,
        commits.map((c) => c.hash),
      ).catch(() => false));
    const state = exists ? await worktreeState(worktree).catch(() => undefined) : undefined;
    const dirty = !!state?.exists && state.dirty;
    const status = task.summary.status;
    const reason = !exists
      ? "branch gone"
      : merged
        ? "merged"
        : (why ??
          (link.report?.remote
            ? "split out"
            : status !== "completed"
              ? STATUS_WORDS[status]
              : commits.length === 0
                ? "no commits"
                : dirty
                  ? "uncommitted changes"
                  : !target
                    ? `${worktree.repo} has no bound branch`
                    : undefined));
    return {
      runId: task.summary.id,
      title: task.summary.title,
      artifactId: link.artifactId!,
      actionId: link.actionId!,
      depth: link.depth,
      repo: worktree.repo,
      common: worktree.common,
      branch,
      status,
      dirty,
      commits: commits.length,
      merged,
      ready: !reason,
      reason,
      report: link.report,
    };
  }

  // Every task branch under the session; only each action's newest direct task can merge here.
  private async rowsOf(session: Session): Promise<BranchRow[]> {
    const bindings = this.bindingsOf(session);
    const id = session.summary.id;
    const tasks = this.descendants(id).filter(
      (s) => s.task!.kind !== "dig" && s.task!.worktree?.branch,
    );
    const newest = new Map<string, Session>();
    for (const s of tasks) {
      if (s.task!.parentRunId !== id) continue;
      const key = `${s.task!.artifactId}/${s.task!.actionId}`;
      const seen = newest.get(key);
      if (!seen || s.task!.launchedAt >= seen.task!.launchedAt) newest.set(key, s);
    }
    return Promise.all(
      tasks.map((s) => {
        const link = s.task!;
        const target = bindings.find((b) => b.common === link.worktree!.common);
        const why =
          link.parentRunId !== id
            ? "sub-task: it merges into its task's branch"
            : newest.get(`${link.artifactId}/${link.actionId}`) !== s
              ? "earlier attempt"
              : undefined;
        return this.rowOf(s, target, why);
      }),
    );
  }

  /** The session's branches and the task branches under it, as git has them now. */
  async branchView(runId: string): Promise<BranchView> {
    const session = this.sessions.get(runId);
    if (!session?.summary.claudeCode) throw new Error(`No Claude Code session ${runId}.`);
    // A branch New branch… asked for counts as made once it exists.
    const creating = (session.summary.claudeCode.branches ?? []).filter((b) => b.creating);
    for (const b of creating)
      if (await branchExists(b.common, b.name)) this.settleCreating(session, b.common);
    const bases = new Map<string, Promise<string | undefined>>();
    const baseOf = (common: string) => {
      if (!bases.has(common)) bases.set(common, defaultBase(common).catch(() => undefined));
      return bases.get(common)!;
    };
    const bindings = this.bindingsOf(session);
    const bound = await Promise.all(
      bindings.map(async (b) => ({
        ...b,
        state: await branchState(b.common, b.name, await baseOf(b.common)),
      })),
    );
    const up = this.upstreamOf(session);
    const upstream = up && {
      ...up,
      state: await branchState(up.common, up.name, await baseOf(up.common)),
    };
    const self =
      session.task?.worktree?.branch && session.task.kind !== "dig"
        ? await this.rowOf(session, up)
        : undefined;
    const inherited = await Promise.all(
      this.inheritedOf(session).map(async (b) => ({
        ...b,
        ownerTitle: this.sessions.get(b.owner)?.summary.title ?? "",
        state: await branchState(b.common, b.name, await baseOf(b.common)),
      })),
    );
    // Rows only matter under a binding the user made.
    const rows = session.summary.claudeCode.branches?.length ? await this.rowsOf(session) : [];
    // Where a binding can be: the session's folder's repo, and every repo its tasks used.
    const repos = new Map<string, { common: string; repo: string; dir: string }>();
    const cwd = session.summary.claudeCode.cwd;
    const here = isDirectory(cwd) ? await inspect(cwd).catch(() => undefined) : undefined;
    if (here) repos.set(here.common, { common: here.common, repo: here.repo, dir: here.top });
    for (const s of [session, ...this.descendants(runId)]) {
      const w = s.task?.worktree;
      if (w && !repos.has(w.common)) repos.set(w.common, { common: w.common, repo: w.repo, dir: w.source });
    }
    for (const b of bindings)
      if (!repos.has(b.common))
        repos.set(b.common, { common: b.common, repo: b.repo, dir: path.dirname(b.common) });
    const defaultBases: Record<string, string> = {};
    for (const common of repos.keys()) {
      const base = await baseOf(common);
      if (base) defaultBases[common] = base;
    }
    return { bound, upstream, self, inherited, rows, repos: [...repos.values()], defaultBases };
  }

  async localBranches(common: string): Promise<LocalBranch[]> {
    return localBranches(common);
  }

  private settleCreating(session: Session, common: string) {
    const list = session.summary.claudeCode?.branches ?? [];
    this.setClaudeCode(session, {
      branches: list.map((b) => (b.common === common ? { ...b, creating: undefined } : b)),
    });
    this.update(session, { changed: [] }, true);
  }

  /** Binds a branch of the repo `dir` is in to the session, in place of its binding there. */
  async bindBranch(
    runId: string,
    binding: { dir: string; name: string; prefix?: string; creating?: { base: string } },
  ) {
    const session = this.sessions.get(runId);
    if (!session?.summary.claudeCode) throw new Error(`No Claude Code session ${runId}.`);
    if (session.task?.kind === "dig") throw new Error("A dig can't have a branch.");
    const checkout = await inspect(binding.dir).catch(() => {
      throw new Error(`${binding.dir} isn't inside a git work tree.`);
    });
    const name = binding.name.trim();
    await git(["check-ref-format", "--branch", name], checkout.top).catch(() => {
      throw new Error(`${name || "An empty name"} isn't a valid branch name.`);
    });
    if (session.task?.worktree?.common === checkout.common)
      throw new Error("A task's own branch is already bound in its repo.");
    if (!binding.creating && !(await branchExists(checkout.common, name)))
      throw new Error(`${checkout.repo} has no branch ${name}.`);
    const list = session.summary.claudeCode.branches ?? [];
    const previous = list.find((b) => b.common === checkout.common);
    const bound: BoundBranch = {
      common: checkout.common,
      repo: checkout.repo,
      name,
      ...(binding.prefix?.trim() && { prefix: binding.prefix.trim() }),
      ...(binding.creating && { creating: binding.creating }),
      boundAt: Date.now(),
      ...(previous?.name === name && previous.report && { report: previous.report }),
    };
    this.setClaudeCode(session, {
      branches: [...list.filter((b) => b.common !== checkout.common), bound],
    });
    this.update(session, { changed: [] }, true);
    this.restartIdle(session);
  }

  unbindBranch(runId: string, common: string) {
    const session = this.sessions.get(runId);
    const list = session?.summary.claudeCode?.branches;
    if (!session || !list) return;
    const next = list.filter((b) => b.common !== common);
    this.setClaudeCode(session, { branches: next.length > 0 ? next : undefined });
    this.update(session, { changed: [] }, true);
    this.restartIdle(session);
  }

  private async promptTarget(session: Session, bound: BoundBranch): Promise<PromptTarget> {
    const base = await defaultBase(bound.common).catch(() => undefined);
    const state = await branchState(bound.common, bound.name, base);
    const cwd = session.summary.claudeCode?.cwd ?? "";
    const outside = isDirectory(cwd)
      ? await inspect(cwd).then((c) => c.common !== bound.common, () => true)
      : true;
    return {
      repo: bound.repo,
      name: bound.name,
      worktree: state.worktree,
      tip: state.tip,
      pushed: state.pushed,
      ahead: state.ahead,
      prefix: bound.prefix,
      defaultBase: base,
      outside,
      pr: bound.report?.pr,
    };
  }

  // A task the session may act on: itself, or one under it, with a worktree branch.
  private taskBranch(session: Session, taskId: string): Session {
    const task =
      taskId === session.summary.id
        ? session
        : this.descendants(session.summary.id).find((s) => s.summary.id === taskId);
    if (!task?.task?.worktree?.branch || task.task.kind === "dig")
      throw new Error("That task has no branch under this session.");
    return task;
  }

  // The fixes merged into a bound branch, in launch order.
  private async mergedSources(session: Session, bound: BoundBranch): Promise<PromptSource[]> {
    const rows = (await this.rowsOf(session)).filter((r) => r.merged && r.common === bound.common);
    return Promise.all(rows.map((r) => this.sourceOf(this.sessions.get(r.runId)!)));
  }

  /** The prompt a branch menu item puts in the session's composer. */
  async branchPrompt(runId: string, action: BranchAction): Promise<string> {
    const session = this.sessions.get(runId);
    if (!session?.summary.claudeCode) throw new Error(`No Claude Code session ${runId}.`);
    if (action.kind === "new-branch") {
      const checkout = await inspect(action.dir);
      if (await branchExists(checkout.common, action.name))
        throw new Error(`${checkout.repo} already has a branch ${action.name}: bind it instead.`);
      await git(["check-ref-format", "--branch", action.name], checkout.top).catch(() => {
        throw new Error(`${action.name || "An empty name"} isn't a valid branch name.`);
      });
      return newBranchPrompt({ repo: checkout.repo, dir: checkout.top, name: action.name, base: action.base });
    }
    if (action.kind === "merge") {
      if (action.taskIds.length === 0) throw new Error("Pick a task to merge.");
      const selfMerge = action.taskIds.includes(runId);
      const target = selfMerge
        ? this.upstreamOf(session)
        : this.bindingsOf(session).find((b) => b.common === action.common);
      if (!target || target.common !== action.common)
        throw new Error("No branch is bound in that repo to merge into.");
      const tasks = action.taskIds.map((id) => this.taskBranch(session, id));
      if (tasks.some((t) => t.task!.worktree!.common !== target.common))
        throw new Error("Those tasks aren't all in the bound branch's repo.");
      return mergePrompt(
        await this.promptTarget(session, target),
        await Promise.all(tasks.map((t) => this.sourceOf(t))),
      );
    }
    if (action.kind === "split") {
      const task = this.taskBranch(session, action.taskId);
      const worktree = task.task!.worktree!;
      const base = await defaultBase(worktree.common).catch(() => undefined);
      const onDefault =
        !!base &&
        (await git(["--git-dir", worktree.common, "merge-base", "--is-ancestor", worktree.commit, base], worktree.common).then(
          () => true,
          () => false,
        ));
      const remote = action.remote.trim();
      await git(["check-ref-format", "--branch", remote], worktree.common).catch(() => {
        throw new Error(`${remote || "An empty name"} isn't a valid branch name.`);
      });
      return splitPrompt(await this.sourceOf(task), {
        remote,
        ticket: action.ticket,
        defaultBase: base,
        onDefault,
      });
    }
    // Sync, tests, push and PRs: on a bound branch, a task's own, or an inherited one.
    const inherited = action.common
      ? this.inheritedOf(session).find((b) => b.common === action.common)
      : undefined;
    const bound = action.common
      ? (this.bindingsOf(session).find((b) => b.common === action.common) ?? inherited)
      : this.bindingsOf(session).find((b) => b.implicit);
    if (!bound) throw new Error("This session has no branch in that repo.");
    // Whose tasks the branch holds: the ancestor's, when inherited.
    const owner = (bound === inherited && this.sessions.get(inherited.owner)) || session;
    const target = await this.promptTarget(session, bound);
    const own = !!bound.implicit;
    const fixes = async () => (own ? [await this.sourceOf(owner)] : await this.mergedSources(owner, bound));
    switch (action.kind) {
      case "sync": {
        if (!own) return syncPrompt(target);
        const worktree = owner.task!.worktree!;
        const up = this.upstreamOf(owner);
        const onto = up && worktree.base === up.name ? up.name : target.defaultBase;
        return syncPrompt({ ...target, defaultBase: onto }, { base: worktree.commit });
      }
      case "test": {
        const sources = await fixes();
        if (sources.length === 0) throw new Error("Nothing is merged into this branch yet.");
        return testPrompt(target, sources);
      }
      case "push":
        return pushPrompt(target);
      case "open-pr":
        return openPrPrompt(target, await fixes());
      case "update-pr":
        return updatePrPrompt(target, await fixes());
      case "comments":
        return commentsPrompt(target);
    }
  }

  /** ui_report_branch: what the agent did to a branch of its own, its tasks' or its upstream. */
  async reportBranch(caller: Caller, args: Record<string, unknown>): Promise<string> {
    const session = this.sessionOf(caller);
    if (!session) throw new Error("Only a session Agent Desktop shows can report on a branch.");
    const name = typeof args.branch === "string" ? args.branch.trim() : "";
    if (!name) throw new Error("branch is required: the local branch you worked on.");
    const remote = typeof args.remote === "string" && args.remote.trim() ? args.remote.trim() : undefined;
    const raw = (args.pr ?? undefined) as { url?: unknown; number?: unknown } | undefined;
    if (raw !== undefined && (typeof raw?.url !== "string" || !/^https?:\/\//.test(raw.url)))
      throw new Error("pr needs a url starting with https://.");
    const pr = raw && {
      url: raw.url as string,
      ...(typeof raw.number === "number" && { number: raw.number }),
    };
    const base = typeof args.base === "string" && args.base.trim() ? args.base.trim() : undefined;
    const report = (previous?: BranchReport): BranchReport | undefined =>
      remote || pr
        ? { ...previous, ...(remote && { remote }), ...(pr && { pr }), at: Date.now() }
        : previous;
    const done: string[] = [];

    // A branch the session, or one above it, bound.
    const inherited = this.inheritedOf(session);
    const above = [this.upstreamOf(session)?.owner, ...inherited.filter((b) => !b.implicit).map((b) => b.owner)];
    const owners = [session, ...[...new Set(above)].flatMap((id) => (id ? [this.sessions.get(id)!] : []))];
    for (const owner of owners) {
      const list = owner.summary.claudeCode?.branches ?? [];
      const bound = list.find((b) => b.name === name);
      if (!bound) continue;
      const exists = await branchExists(bound.common, name);
      this.setClaudeCode(owner, {
        branches: list.map((b) =>
          b === bound
            ? { ...b, report: report(b.report), ...(exists && { creating: undefined }) }
            : b,
        ),
      });
      this.update(owner, { changed: [] }, true);
      done.push(`the bound branch ${name}`);
      break;
    }

    // A task's branch: the session's own, one under it, or an inherited one.
    const aboveTasks = inherited.filter((b) => b.implicit).map((b) => this.sessions.get(b.owner)!);
    const task = [session, ...this.descendants(session.summary.id), ...aboveTasks].find(
      (s) => s.task?.worktree?.branch === name && s.task.kind !== "dig",
    );
    if (task) {
      const worktree = task.task!.worktree!;
      let commit = worktree.commit;
      if (base) {
        const resolved = await git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`], worktree.path ?? worktree.common).catch(() => "");
        if (!resolved.trim()) throw new Error(`base ${base} isn't a commit in ${worktree.repo}.`);
        commit = resolved.trim();
      }
      this.setTask(task, { worktree: { ...worktree, commit }, report: report(task.task!.report) });
      this.update(task, { changed: [] }, true);
      if (base) void this.refreshChanges(task);
      done.push(`the task branch ${name}`);
    }

    if (done.length === 0)
      throw new Error(`${name} isn't bound to this session, and isn't the branch of a task under it.`);
    return `Recorded for ${done.join(" and ")}. Agent Desktop shows it now.`;
  }

  /**
   * Removes a session, with its tasks unless `tasks` is false; those then stay at the root.
   * Deletes the worktrees named, once their processes exit. Returns the removed ids.
   */
  async remove(
    runId: string,
    options: { tasks: boolean; worktrees: string[] } = { tasks: true, worktrees: [] },
  ): Promise<string[]> {
    const root = this.sessions.get(runId);
    if (!root) return [];
    const removed = options.tasks ? [root, ...this.descendants(runId)] : [root];
    const kept = options.tasks ? [] : this.tasksOfRun(runId);
    const exits = removed.map(
      (s) => new Promise<void>((resolve) => (s.turn ? s.turn.once("close", () => resolve()) : resolve())),
    );
    for (const s of removed) {
      s.queued = s.held = s.starting = false;
      s.stopped = true;
    }
    await Promise.all(
      removed.flatMap((s) => (s.task?.worktree ? [creationSettled(s.task.worktree)] : [])),
    );
    for (const s of removed) this.forget(s.summary.id);
    // A removed dig's pending suggestions go with it; what was accepted stays in the prompt.
    const gone = new Set(removed.map((s) => s.summary.id));
    for (const s of removed) {
      const parent = s.task?.kind === "dig" ? this.sessions.get(s.task.parentRunId) : undefined;
      const list = parent?.summary.claudeCode?.suggestions;
      if (parent && list?.some((x) => gone.has(x.digRunId) && x.status === "pending"))
        this.setSuggestions(
          parent,
          list.filter((x) => !(gone.has(x.digRunId) && x.status === "pending")),
        );
    }
    for (const s of kept) {
      this.setTask(s, { parentRemoved: true });
      this.update(s, { changed: [] }, true);
    }
    await Promise.all(exits);
    for (const s of removed) {
      const worktree = s.task?.worktree;
      if (!worktree?.path || !options.worktrees.includes(s.summary.id)) continue;
      const state = await worktreeState(worktree).catch(() => undefined);
      await removeWorktree(worktree, !!state?.dirty).catch((error) =>
        console.warn(`[Tasks] Couldn't delete ${worktree.path}:`, error),
      );
    }
    return removed.map((s) => s.summary.id);
  }

  /** ui_read_parent: the task's parent, its source artifact and action. */
  parentOf(caller: Caller, conversation: boolean): string {
    const session = this.sessionOf(caller);
    if (!session) throw new Error("Only a session Agent Desktop shows has a parent.");
    const task = session.task;
    if (!task) return "This session isn't a task.";
    const parent = task.parentRemoved ? undefined : this.sessions.get(task.parentRunId);
    if (!parent) return "The parent session was removed.";
    this.load(parent);
    const messages = parent.transcript.messages;
    const artifact = claudeCodeArtifacts(messages).find((a) => a.id === task.artifactId);
    const action = artifact?.actions.find((a) => a.id === task.actionId);
    return JSON.stringify(
      {
        title: parent.summary.title,
        cwd: parent.summary.claudeCode?.cwd,
        ...(task.kind === "spinoff"
          ? { sentFrom: "The user sent your prompt from this session's message box; there is no artifact or action." }
          : {
              artifact: artifact
                ? { id: artifact.id, title: artifact.title, format: artifact.format, content: artifact.content }
                : "The source artifact is gone.",
              action: action
                ? { ...action, prompt: this.promptOf(parent, artifact!, action).text }
                : "Its action is gone",
            }),
        ...(conversation && { conversation: conversationText(messages, CONVERSATION_CHARS) }),
      },
      null,
      2,
    );
  }

  /** ui_list_tasks: the caller's direct tasks, or one of them with its whole answer. */
  tasksOf(caller: Caller, id?: string): string {
    const session = this.sessionOf(caller);
    if (!session) throw new Error("Only a session Agent Desktop shows has tasks.");
    const tasks = this.tasksOfRun(session.summary.id).filter(
      (t) => t.task!.kind !== "dig" && (!id || t.summary.id === id),
    );
    if (id && tasks.length === 0) throw new Error(`No task ${id} under this session.`);
    const max = id ? ANSWER_CHARS_ONE : ANSWER_CHARS;
    return JSON.stringify(
      tasks.map((t) => {
        const task = t.task!;
        const { outcome, worktree } = task;
        return {
          id: t.summary.id,
          title: t.summary.title,
          ...(task.kind === "spinoff" && { sentFromMessageBox: true }),
          artifact: task.artifactId,
          action: task.actionId,
          status: t.summary.status,
          launchedAt: new Date(task.launchedAt).toISOString(),
          ...(worktree?.branch && { branch: worktree.branch, worktree: worktree.path }),
          ...(outcome?.commitsAhead !== undefined && {
            commitsAhead: outcome.commitsAhead,
            filesChanged: outcome.filesChanged,
            dirty: outcome.dirty,
          }),
          ...(t.summary.notice && { notice: t.summary.notice }),
          finalAnswer: outcome ? this.finalAnswer(t, outcome, max) : undefined,
        };
      }),
      null,
      2,
    );
  }

  // The last text of the outcome's message, from whichever transcript it's in.
  private finalAnswer(
    session: Session,
    outcome: NonNullable<TaskLink["outcome"]>,
    max: number,
  ): string | undefined {
    const messages =
      outcome.sessionId === session.sessionId && session.loaded
        ? session.transcript.messages
        : (() => {
            const file =
              outcome.sessionId === session.sessionId && session.transcriptPath
                ? session.transcriptPath
                : findTranscript(outcome.sessionId);
            return (file && readTranscript(file)?.messages) || [];
          })();
    const part = messages[outcome.at]?.parts.findLast((p) => p.type === "text");
    const text = part?.type === "text" ? part.text : undefined;
    return text && text.length > max ? `${text.slice(0, max)}…` : text;
  }

  /** Starts a session here with its first message. */
  async start(runId: string, text: string) {
    if (!SESSION_ID.test(runId)) throw new Error(`Invalid run id: ${runId}`);
    const now = Date.now();
    const session = new Session(
      {
        id: runId,
        trigger: "manual",
        title: chatTitle([
          { id: "", role: "user", parts: [{ type: "text", text }] },
        ]),
        status: "running",
        toolCalls: 0,
        createdAt: now,
        updatedAt: now,
        claudeCode: { cwd: sessionCwd(), live: false },
      },
      "",
    );
    this.sessions.set(runId, session);
    await this.runTurn(session, text);
  }

  /** A message for the session: to the process the app runs for it, over its channel while a terminal has it open, else a new turn. */
  async send(runId: string, text: string) {
    const session = this.sessions.get(runId)!;
    if (session.start) throw new Error(NOT_STARTED);
    if (session.turn) return this.write(session, text);
    if (!session.live) return this.runTurn(session, text, { resume: session.sessionId });
    const id = randomUUID().slice(0, 8);
    const sent =
      session.pid !== undefined &&
      (await mcpServer.notify(session.pid, CHANNEL, {
        content: text,
        meta: { id },
      }));
    session.notice = sent ? undefined : notTaken([text]);
    if (sent)
      session.pending.push({ id, text, via: "channel", due: Date.now() + PICKUP_MS });
    session.pendingTimer ??= setInterval(
      () => this.checkPending(session),
      PICKUP_CHECK_MS,
    );
    this.update(session, { changed: [] }, true);
  }

  // A busy session queues the message; an idle one that doesn't take it has no channel.
  private checkPending(session: Session) {
    const now = Date.now();
    if (session.running)
      for (const p of session.pending) if (p.via === "channel") p.due = now + PICKUP_MS;
    const late = session.pending.filter((p) => p.via === "channel" && p.due < now);
    if (late.length > 0) {
      session.pending = session.pending.filter((p) => !late.includes(p));
      session.notice = notTaken(late.map((p) => p.text));
      this.update(session, { changed: [] }, true);
    }
    if (!session.pending.some((p) => p.via === "channel")) {
      clearInterval(session.pendingTimer);
      session.pendingTimer = undefined;
    }
  }

  /** A permission prompt in a terminal session, answered here or there, whichever is first. */
  async relayPermission(pid: number, request: PermissionRequest) {
    const session = [...this.sessions.values()].find(
      (s) => s.live && s.pid === pid,
    );
    if (!session) return;
    const { toolName } = toolOf(request.tool_name);
    let toolUseId: string | undefined;
    for (let attempt = 0; attempt < CLAIM_TRIES && !toolUseId; attempt++) {
      this.update(session, session.read());
      toolUseId = session.transcript.openCall(toolName);
      if (!toolUseId) await new Promise((r) => setTimeout(r, CLAIM_WAIT_MS));
    }
    const answer = await approvalHub.requestApproval({
      tenantId: "",
      action: toolName,
      description: request.description
        ? `Claude Code asks to use ${toolName}: ${request.description}`
        : `Claude Code asks to use ${toolName}.`,
      riskLevel: "medium",
      payload: {},
      toolUseId,
    });
    await mcpServer.answerPermission(pid, request.request_id, answer.approved);
  }

  // What the window shows: the transcript, then what hasn't reached it yet.
  private messages(session: Session): UIMessage[] {
    const { retrying } = session;
    const shown = session.transcript.messages.slice(0, retrying?.at);
    // Until the fork's process takes the text, the window shows it as pending.
    const taken = session.pending.some((p) => p.via === "input");
    const starting =
      retrying && !taken
        ? [{ id: `retry-${retrying.at}`, text: retrying.text }]
        : session.start && !taken
          ? [{ id: "start", text: session.start.text }]
          : [];
    return [
      ...shown.map((_, i) => this.view(session, i)),
      ...[...starting, ...session.pending].map(
        (p): UIMessage => ({
          id: `pending-${p.id}`,
          role: "user",
          parts: [{ type: "text", text: p.text }],
          metadata: { pending: true },
        }),
      ),
    ];
  }

  stop(runId: string) {
    const session = this.sessions.get(runId);
    if (!session) return;
    // A task that hasn't spawned yet leaves the queue, or aborts its start.
    if (session.queued || (session.starting && !session.turn)) {
      session.queued = session.held = session.starting = false;
      session.stopped = true;
      session.notice = STOPPED_EARLY;
      this.update(session, { changed: [] }, true);
      return this.pump();
    }
    const turn = session.turn;
    if (!turn) return;
    session.stopped = true;
    turn.kill("SIGINT");
    setTimeout(() => turn.exitCode === null && turn.kill("SIGTERM"), STOP_GRACE_MS);
  }

  /** Ends every process the app runs, when it quits. */
  stopAll() {
    this.quitting = true;
    for (const session of this.sessions.values()) {
      const turn = session.turn;
      if (!turn) continue;
      // A turn in progress is cut off; an idle process just ends.
      if (session.busy) {
        session.stopped = true;
        session.notice = INTERRUPTED;
      } else turn.removeAllListeners("close");
      turn.kill("SIGTERM");
    }
  }

  // Mid-turn, Claude Code takes the message into the turn; once its input is closed, the next process does.
  private write(
    session: Session,
    text: string,
    content = text,
    after = session.transcript.messages.length,
  ) {
    const turn = session.turn!;
    const id = randomUUID().slice(0, 8);
    if (turn.stdin.writableEnded) {
      session.pending.push({ id, text, via: "queued" });
      session.notice = FINISHING;
      return this.update(session, { changed: [] }, true);
    }
    clearTimeout(session.idleTimer);
    if (!session.busy) session.timedOut = false;
    session.busy = true;
    session.starting = false;
    session.pending.push({
      id,
      text,
      via: "input",
      after,
    });
    const message = {
      type: "user",
      message: { role: "user", content },
      parent_tool_use_id: null,
      session_id: session.sessionId,
    };
    turn.stdin.write(`${JSON.stringify(message)}\n`);
    this.update(session, { changed: [] }, true);
  }

  // One `claude -p` per stretch of work, taking messages on its input; the transcript, not its output, is what the chat shows.
  private async runTurn(
    session: Session,
    text: string,
    options: {
      resume?: string;
      resumeAt?: string;
      content?: string;
      after?: number;
      /** A task's start: whether it should still go on after the lookup. */
      alive?: () => boolean;
    } = {},
  ) {
    const { resume, resumeAt, content, after, alive } = options;
    session.stopped = false;
    session.failed = false;
    session.notice = undefined;
    const { found } = await claudeCodeInfo();
    if (alive && !alive()) return;
    const port = mcpServer.getPort();
    if (!found || !port) {
      session.failed = true;
      session.starting = false;
      session.notice = found
        ? "The MCP server isn't running."
        : "Claude Code isn't found. Set it up in Options.";
      return this.update(session, { changed: [] }, true);
    }
    const task = session.task;
    const cwd = session.summary.claudeCode?.cwd || sessionCwd();
    // Node reports a missing cwd as the binary missing.
    if (!isDirectory(cwd)) {
      session.failed = true;
      session.starting = false;
      session.notice = `This session's folder no longer exists: ${cwd}`;
      return this.update(session, { changed: [] }, true);
    }
    // A worktree task's mode comes from the session, so resumes and retries keep it.
    const root = task?.worktree?.path;
    const acceptEdits = !!root && !!found.acceptEdits;
    const dig = task?.kind === "dig";
    const own = dig
      ? task.reads
      : acceptEdits && path.resolve(cwd) !== path.resolve(root) ? root : undefined;
    const bound = dig ? [] : await this.boundWorktrees(session);
    const addDirs = [...new Set([own, ...bound])].filter(
      (dir): dir is string => !!dir && path.resolve(dir) !== path.resolve(cwd),
    );
    if (alive && !alive()) return;
    const turn = spawn(
      found.path,
      turnArgs({
        sessionId: session.sessionId,
        runId: session.summary.id,
        resume,
        resumeAt,
        port,
        acceptEdits,
        addDirs,
        disallowedTools: dig ? DIG_DISALLOWED : undefined,
      }),
      {
        cwd,
        env: turnEnv(port, { runId: session.summary.id, task: !!task }),
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    session.turn = turn;
    let error: string | undefined;
    let stderr = "";
    createInterface({ input: turn.stdout }).on("line", (line) => {
      let event: {
        type?: string;
        subtype?: string;
        is_error?: boolean;
        result?: unknown;
        tools?: unknown;
      };
      try {
        event = JSON.parse(line);
      } catch {
        return;
      }
      if (event.type === "system" && event.subtype === "init") {
        this.locate(session);
        this.noteTools(session, event.tools);
      }
      // A background task's report starts a turn nobody wrote.
      if ((event.type === "assistant" || event.type === "user") && !session.busy) {
        clearTimeout(session.idleTimer);
        session.timedOut = false;
        session.busy = true;
        this.update(session, { changed: [] });
      }
      if (event.type === "result") {
        error = !event.is_error
          ? undefined
          : typeof event.result === "string" && event.result
            ? event.result
            : `Claude Code stopped: ${event.subtype}.`;
        // Claude Code took the timeout as a denial; the task didn't do its job.
        if (session.task && session.timedOut) error ??= TIMED_OUT;
        session.busy = false;
        session.failed = error !== undefined;
        session.notice = error;
        session.idleTimer = setTimeout(
          () => turn.stdin.end(),
          session.task ? TASK_IDLE_MS : IDLE_MS,
        );
        this.update(session, session.read(), true);
        if (session.task) void this.refreshChanges(session);
      }
    });
    turn.stderr.on("data", (chunk) => (stderr = (stderr + chunk).slice(-2000)));
    turn.on("error", (e) => (error = e.message));
    turn.on("close", (code) => {
      clearTimeout(session.idleTimer);
      session.turn = undefined;
      session.busy = false;
      session.starting = false;
      if (!session.stopped && (code !== 0 || error)) {
        session.failed = true;
        session.notice =
          error ??
          (stderr.trim().split("\n").at(-1) || `Claude Code exited with code ${code}.`);
      }
      this.locate(session);
      if (session.retrying?.forked) this.undoRetry(session);
      this.rewatch(session);
      this.update(session, session.read());
      // What the process never took is gone with it; what waited for it goes next.
      const queued = session.pending.filter((p) => p.via === "queued");
      session.pending = session.pending.filter((p) => p.via === "channel");
      if (session.notice === FINISHING) session.notice = undefined;
      if (queued.length > 0 && !session.stopped) {
        void this.runTurn(session, queued.map((p) => p.text).join("\n\n"), {
          resume: session.sessionId,
        });
        return;
      }
      this.update(session, { changed: [] }, true);
    });
    this.rewatch(session);
    this.write(session, text, content, after);
  }

  // A turn's transcript, before any hook has named it.
  private locate(session: Session) {
    if (session.transcriptPath) return;
    const file = findTranscript(session.sessionId);
    if (file) this.attach(session, file);
  }

  private attach(session: Session, file: string) {
    session.attach(file);
    session.retrying = undefined;
    this.rewatch(session);
    this.update(session, session.read());
  }

  // The fork never started: the run goes back to the session it showed.
  private undoRetry(session: Session) {
    const { previous, restored } = session.retrying!;
    session.retrying = undefined;
    const claudeCode = session.summary.claudeCode!;
    const attempts = claudeCode.attempts?.slice(0, -1);
    session.summary = {
      ...session.summary,
      claudeCode: {
        ...claudeCode,
        sessionId: previous.sessionId,
        attempts: attempts?.length ? attempts : undefined,
      },
    };
    session.transcriptPath = previous.transcriptPath;
    const why = session.notice ?? "Claude Code stopped.";
    session.notice = restored
      ? `Files were restored, but the retry didn't start: ${why}`
      : `The retry didn't start: ${why}`;
    session.failed = true;
  }

  private bySession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session?.sessionId === sessionId) return session;
    return [...this.sessions.values()].find((s) => s.sessionId === sessionId);
  }

  // A user message that started a turn, in a session the app can run.
  private retryable(runId: string, index: number) {
    const session = this.sessions.get(runId);
    if (!session) throw new Error(`No Claude Code session ${runId}.`);
    if (session.live)
      throw new Error("This session is open in a terminal. Use /rewind there.");
    if (!session.loaded) this.update(session, session.read());
    const prompt = session.transcript.prompt(index);
    if (!prompt || session.retrying) throw new Error("That message can't be retried.");
    if (prompt.midTurn)
      throw new Error(
        "That message joined a running turn. Retry from the message that started it.",
      );
    return { session, prompt };
  }

  // Every session whose edits since the user message at `index` may still be in the files, newest
  // first: the one shown (unless left out) and the replaced attempts on its line that reached it.
  private restorable(session: Session, index: number, shown: boolean): Restorable[] {
    const chain: Restorable[] = [];
    const add = (sessionId: string, transcript: Transcript, from: number) => {
      const prompt = transcript.prompt(index);
      chain.push({
        sessionId,
        checkpoint: prompt?.checkpoint ? prompt.uuid : undefined,
        files: editedFiles(transcript.messages.slice(from + 1)),
      });
    };
    if (shown) add(session.sessionId, session.transcript, index);
    const onLine = attemptsOnLine(session.summary.claudeCode?.attempts);
    for (const attempt of onLine.filter((a) => a.at >= index).reverse()) {
      const transcript = readTranscript(attempt.transcriptPath);
      if (transcript) add(attempt.sessionId, transcript, attempt.at);
    }
    return chain.filter((c) => c.files.size > 0);
  }

  private async rewind(session: Session, chain: Restorable[]) {
    const { found } = await claudeCodeInfo();
    const port = mcpServer.getPort();
    if (!found || !port) throw new Error("Claude Code isn't found. Set it up in Options.");
    for (const { sessionId, checkpoint } of chain)
      await rewindFiles({
        command: found.path,
        cwd: session.summary.claudeCode?.cwd || sessionCwd(),
        sessionId,
        checkpoint: checkpoint!,
        port,
      });
  }

  /** What retrying the user message at `index` would replace. */
  async preflight(runId: string, index: number): Promise<RetryPreflight> {
    const { session } = this.retryable(runId, index);
    const later = session.transcript.messages.slice(index + 1);
    const chain = this.restorable(session, index, true);
    const files = new Map<string, boolean>();
    for (const c of chain)
      for (const [file, created] of c.files) files.set(file, created || !!files.get(file));
    const replacing = chain[0]?.sessionId === session.sessionId ? chain[0].files : undefined;
    const shellCommands: string[] = [];
    const tenantChanges: RetryPreflight["tenantChanges"] = [];
    let subagents = 0;
    for (const message of later) {
      const stamps =
        (message.metadata as { stamps?: Record<string, { plugin: string; label: string }> })
          ?.stamps ?? {};
      for (const part of message.parts) {
        if (part.type !== "dynamic-tool") continue;
        const stamp = stamps[part.toolCallId];
        if (part.toolName === "Bash") {
          shellCommands.push(String((part.input as { command?: string })?.command ?? ""));
        } else if (SUBAGENT_TOOLS.has(part.toolName)) {
          subagents++;
        } else if (stamp && part.state === "output-available") {
          const plugin = getPlugin(stamp.plugin);
          const ops = plugin ? await loadPluginOperations(plugin) : undefined;
          if (ops?.get(`tenant__${stamp.plugin}__${part.toolName}`)?.write)
            tenantChanges.push({ tenant: stamp.label, operation: part.toolName });
        }
      }
    }
    return {
      later: later.length,
      running: session.busy,
      files: [...files].map(([path, created]) => ({
        path,
        created,
        ...(!replacing?.has(path) && { earlier: true }),
      })),
      checkpoint: chain.every((c) => c.checkpoint),
      shellCommands,
      subagents,
      tenantChanges,
    };
  }

  /** Replaces the user message at `index` and everything after it with a new turn from `text`. */
  async retry(runId: string, index: number, text: string, restoreFiles: boolean) {
    const { session, prompt } = this.retryable(runId, index);
    const { found } = await claudeCodeInfo();
    if (!found?.retry || !mcpServer.getPort())
      throw new Error(
        found
          ? "This Claude Code can't fork a session at a message. Update it to retry."
          : "Claude Code isn't found. Set it up in Options.",
      );
    const preflight = await this.preflight(runId, index);
    if (restoreFiles && !preflight.checkpoint)
      throw new Error("Some of these files have no checkpoint to restore them from.");
    const chain = this.restorable(session, index, true);
    const original = textOf(session.transcript.messages[index]);
    const claudeCode = session.summary.claudeCode!;
    session.retrying = {
      previous: { sessionId: claudeCode.sessionId, transcriptPath: session.transcriptPath },
      at: index,
      text,
      restored: restoreFiles,
      forked: false,
    };
    session.shown = index;
    this.update(session, { changed: [] }, true);
    try {
      await this.end(session);
      if (restoreFiles) await this.rewind(session, chain);
    } catch (error) {
      session.retrying = undefined;
      this.update(session, { changed: [] }, true);
      throw error;
    }
    const replaced = session.sessionId;
    const attempt: ReplacedAttempt = {
      sessionId: replaced,
      transcriptPath: session.transcriptPath,
      at: index,
      messages: session.transcript.messages.length - index,
      tenantChanges: preflight.tenantChanges.length,
      replacedAt: Date.now(),
    };
    session.retrying.forked = true;
    // A task's first message keeps its origin note, now naming what the attempt left.
    const origin =
      claudeCode.task && index === 0 ? await this.taskNote(session, true) : "";
    session.summary = {
      ...session.summary,
      claudeCode: {
        ...claudeCode,
        sessionId: randomUUID(),
        attempts: [...(claudeCode.attempts ?? []), attempt],
        ...(claudeCode.task && { task: { ...claudeCode.task, outcome: undefined } }),
      },
    };
    session.transcriptPath = "";
    this.rewatch(session);
    const note = regenerateNote({
      attempt,
      uuid: prompt.uuid,
      edited: text.trim() !== original,
      restored: restoreFiles,
      preflight,
      checkpoints: chain.flatMap((c) => (c.checkpoint ? [c.sessionId] : [])),
    });
    // The first message has nothing before it to fork from: its retry is a new session.
    await this.runTurn(session, text, {
      resume: prompt.resumeAt && replaced,
      resumeAt: prompt.resumeAt,
      content: origin + withRegenerateNote(text, note),
      after: index,
    });
  }

  /** The ui_restore_files tool: puts back the files the attempts the last retry replaced had changed. */
  async restoreFiles({ runId }: Caller): Promise<string> {
    const session = runId ? this.sessions.get(runId) : undefined;
    const attempt = session?.summary.claudeCode?.attempts?.at(-1);
    if (!session || !attempt)
      throw new Error("No message in this session was regenerated, so there are no files to restore.");
    const chain = this.restorable(session, attempt.at, false);
    if (chain.length === 0)
      return "The replaced attempt changed no files with Write, Edit or NotebookEdit, so nothing was restored.";
    if (chain.some((c) => !c.checkpoint))
      throw new Error("Some of the replaced attempt's files have no checkpoint, so nothing was restored.");
    await this.rewind(session, chain);
    return "Restored the files the replaced attempt changed with Write, Edit or NotebookEdit to how they were before the regenerated message.";
  }

  /** A replaced attempt's messages, from its retried message on. */
  replaced(runId: string, index: number): UIMessage[] {
    const attempt = this.sessions.get(runId)?.summary.claudeCode?.attempts?.[index];
    const transcript = attempt && readTranscript(attempt.transcriptPath);
    return transcript ? transcript.messages.slice(attempt.at) : [];
  }

  // Ends the session's process, mid-turn or idle; what it queued goes with it.
  private end(session: Session): Promise<void> {
    const turn = session.turn;
    for (const [id, approval] of this.approvals)
      if (approval.runId === session.summary.id)
        approvalHub.respond(id, false, "Replaced by a retry.");
    if (!turn) return Promise.resolve();
    session.pending = session.pending.filter((p) => p.via === "channel");
    return new Promise((resolve) => {
      turn.once("close", () => resolve());
      this.stop(session.summary.id);
    });
  }

  /** A hook fired in a session: from a terminal, it is attached and maybe mid-turn. */
  hook(input: HookInput, fromApp = false, pid?: number) {
    const { session_id: id, transcript_path: file, cwd = "" } = input;
    if (!id || !SESSION_ID.test(id) || !file || !isTranscript(file, id)) return;
    // A turn the app runs: its hooks only name the transcript.
    if (fromApp) {
      const session = this.bySession(id);
      if (session && !session.transcriptPath) this.attach(session, file);
      return;
    }
    const owner = this.sessions.get(id);
    // A replaced attempt's session belongs to the run that replaced it, not to a terminal.
    if (owner && owner.sessionId !== id) return;
    let session = owner ?? this.bySession(id);
    if (!session) {
      const now = Date.now();
      session = new Session(
        {
          id,
          trigger: "manual",
          title: "Claude Code session",
          status: "completed",
          toolCalls: 0,
          createdAt: now,
          updatedAt: now,
          claudeCode: { cwd, live: true },
        },
        file,
      );
      this.sessions.set(id, session);
    }
    session.transcriptPath = file;
    if (pid && pid !== session.pid) {
      session.pid = pid;
      void this.checkChannels(session, pid);
    }
    const ended = input.hook_event_name === "SessionEnd";
    switch (input.hook_event_name) {
      case "UserPromptSubmit":
        session.running = true;
        session.failed = false;
        break;
      case "Stop":
      case "SessionEnd":
        session.running = false;
        break;
      case "StopFailure":
        session.running = false;
        session.failed = true;
        break;
    }
    this.setLive(session, !ended, cwd || session.summary.claudeCode?.cwd);
    // A session that ends before its first prompt leaves nothing to show.
    if (ended && !session.transcript.messages.some((m) => m.role === "user")) {
      this.forget(id);
      this.broadcast("runs:deleted", id);
    }
  }

  // A session takes channel messages only when Claude Code started with this plugin's channel.
  private async checkChannels(session: Session, pid: number) {
    const args = await new Promise<string | undefined>((resolve) =>
      execFile("ps", ["-o", "args=", "-p", String(pid)], (error, stdout) =>
        resolve(error ? undefined : stdout),
      ),
    );
    const channels =
      args === undefined
        ? undefined
        : /--(dangerously-load-development-)?channels\b.*agent-desktop/.test(args);
    if (session.pid !== pid || session.summary.claudeCode?.channels === channels)
      return;
    session.summary = {
      ...session.summary,
      claudeCode: {
        ...session.summary.claudeCode!,
        channels,
      },
    };
    this.update(session, { changed: [] }, true);
  }

  /** No Claude Code is connected any more, so none is live. */
  detachAll() {
    for (const session of this.sessions.values()) {
      if (!session.live) continue;
      session.running = false;
      this.setLive(session, false);
    }
  }

  /** Drops the session from the list; its transcript stays where Claude Code keeps it. */
  forget(runId: string) {
    const session = this.sessions.get(runId);
    if (!session) return;
    session.turn?.kill("SIGTERM");
    clearInterval(session.pendingTimer);
    this.sessions.delete(runId);
    this.rewatch(session);
    // Otherwise they wait out their timeout and turn up in the global dialog.
    for (const [id, approval] of this.approvals) {
      if (approval.runId !== runId) continue;
      this.approvals.delete(id);
      approvalHub.respond(id, false, "Session removed.");
    }
    this.save();
    this.pump();
    this.syncQueue();
  }

  private setLive(session: Session, live: boolean, cwd?: string) {
    session.summary = {
      ...session.summary,
      claudeCode: {
        ...session.summary.claudeCode,
        cwd: cwd ?? session.summary.claudeCode?.cwd ?? "",
        live,
      },
    };
    this.rewatch(session);
    this.update(session, session.read(), true);
  }

  // Watched while a terminal has it open or the app runs a turn, and still listed.
  private rewatch(session: Session) {
    const want =
      (session.live || session.turn) &&
      this.sessions.has(session.summary.id) &&
      session.transcriptPath
        ? session.transcriptPath
        : undefined;
    if (want === session.watched) return this.syncAgents(session);
    if (session.watched) unwatchFile(session.watched);
    session.watched = want;
    if (want) {
      watchFile(want, { interval: POLL_MS }, () =>
        this.update(session, session.read()),
      );
    }
    this.syncAgents(session);
  }

  // Polled while one runs: only a watched, listed session's agents are running.
  private syncAgents(session: Session) {
    const shown = session.watched && this.sessions.get(session.summary.id) === session;
    if (shown) session.agents.poll(session.transcriptPath);
    const agents = shown ? session.agents.list() : [];
    const sent = JSON.stringify(agents);
    if (sent !== session.agentsSent) {
      session.agentsSent = sent;
      this.broadcast("claudeCode:agents", { runId: session.summary.id, agents });
    }
    const running = agents.some((a) => a.status === "running");
    if (running && !session.agentsTimer)
      session.agentsTimer = setInterval(() => this.syncAgents(session), AGENTS_POLL_MS);
    if (!running && session.agentsTimer) {
      clearInterval(session.agentsTimer);
      session.agentsTimer = undefined;
    }
  }

  private status(session: Session): RunStatus {
    const id = session.summary.id;
    if ([...this.approvals.values()].some((a) => a.runId === id))
      return "awaiting_approval";
    if (session.running || session.busy || session.starting) return "running";
    if (session.queued) return "queued";
    if (session.stopped) return "stopped";
    return session.failed ? "failed" : "completed";
  }

  // A call waiting on the operator shows Approve and Deny in the chat.
  private view(session: Session, index: number): UIMessage {
    const message = session.transcript.messages[index];
    const waiting = new Map(
      [...this.approvals]
        .filter(([, a]) => a.runId === session.summary.id)
        .map(([id, a]) => [a.toolUseId, { id, requestReason: a.reason }]),
    );
    if (waiting.size === 0) return message;
    return {
      ...message,
      parts: message.parts.map((part) =>
        part.type === "dynamic-tool" &&
        part.state === "input-available" &&
        waiting.has(part.toolCallId)
          ? ({
              ...part,
              state: "approval-requested",
              approval: waiting.get(part.toolCallId)!,
            } as DynamicToolUIPart)
          : part,
      ),
    };
  }

  private update(session: Session, { changed, mtime }: Read, force = false) {
    // A forgotten session's process may still report as it ends.
    if (this.sessions.get(session.summary.id) !== session) return;
    const previous = session.summary;
    const { messages, title } = session.transcript;
    // Delivered: the transcript has the message now. Mid-retry, it's the old transcript.
    const settled = session.retrying ? [] : messages;
    const delivered = new Set(
      settled.map((m) => (m.metadata as { channel?: string } | undefined)?.channel),
    );
    session.pending = session.pending.filter((p) =>
      p.via === "channel"
        ? !delivered.has(p.id)
        : p.via === "queued" ||
          !settled
            .slice(p.after)
            .some((m) => m.role === "user" && textOf(m) === p.text.trim()),
    );
    this.dropSettled(session);
    const status = this.status(session);
    const task = previous.claudeCode?.task;
    // A task keeps the action's title; only a /rename replaces it.
    const named = task
      ? session.transcript.customTitle
      : (title ??
        (messages.some((m) => m.role === "user") ? chatTitle(messages) : undefined));
    // The transcript has the first message now: the copy kept for a start can go.
    const started = !!session.start && settled.some((m) => m.role === "user");
    if (started) session.start = undefined;
    session.summary = {
      ...previous,
      title: named ?? previous.title,
      status,
      notice: session.notice,
      toolCalls: countToolCalls(messages),
      artifacts: artifactRefs(messages),
      // The transcript's own time, so opening an old session doesn't reorder the list.
      updatedAt: changed.length > 0 && mtime ? Math.round(mtime) : previous.updatedAt,
    };
    if (task && !session.busy && !session.starting && !session.retrying) {
      const answer = lastAnswer(messages);
      // The counts belong to the answer they were taken after; refreshChanges takes new ones.
      const same =
        task.outcome?.at === answer?.at && task.outcome?.sessionId === session.sessionId;
      const outcome = answer && {
        ...(same && task.outcome),
        answer: answer.text.trim().split("\n")[0].slice(0, 300),
        sessionId: session.sessionId,
        at: answer.at,
      };
      if (outcome && JSON.stringify(outcome) !== JSON.stringify(task.outcome))
        session.summary = {
          ...session.summary,
          claudeCode: { ...session.summary.claudeCode!, task: { ...task, outcome } },
        };
    }
    if (changed.length > 0 || status !== previous.status || force) {
      // Past what the window had, queued messages may have turned into transcript ones.
      const all = this.messages(session);
      const indices = new Set(changed);
      for (let i = Math.min(session.shown, messages.length); i < all.length; i++)
        indices.add(i);
      session.shown = shownOf(session);
      this.patch({
        runId: previous.id,
        length: all.length,
        messages: [...indices].sort((a, b) => a - b).map((i) => [i, all[i]]),
        status: "ready",
        running: status === "running",
      });
    }
    if (force || started || listed(session.summary) !== listed(previous)) {
      this.save();
      this.broadcast("runs:changed", session.summary);
    }
    this.syncAgents(session);
    if (task && status !== previous.status) {
      this.attention(session, status);
      this.pump();
    }
    this.syncQueue();
  }

  private attention(session: Session, status: RunStatus) {
    const taskId = session.summary.id;
    const waiting = [...this.approvals.values()].filter((a) => a.runId === taskId);
    const kind =
      status === "failed"
        ? "failed"
        : status === "awaiting_approval"
          ? waiting.every((a) => a.question)
            ? "question"
            : "approval"
          : undefined;
    if (!kind) return;
    const event: Attention = { rootId: this.rootOf(taskId), taskId, kind };
    for (const listener of this.attentionListeners) listener(event);
  }

  // A prompt answered in the terminal first no longer waits here.
  private dropSettled(session: Session) {
    for (const [id, approval] of this.approvals) {
      if (approval.runId !== session.summary.id) continue;
      const index = session.transcript.locate(approval.toolUseId);
      const part = index === undefined ? undefined : session.transcript.messages[index].parts.find(
        (p) => p.type === "dynamic-tool" && p.toolCallId === approval.toolUseId,
      );
      if (part?.type === "dynamic-tool" && part.state.startsWith("output-"))
        approvalHub.respond(id, false, "Answered in the terminal.");
    }
  }

  private save() {
    writeJson(
      INDEX,
      [...this.sessions.values()].map(
        (s): Stored => ({
          ...s.summary,
          transcriptPath: s.transcriptPath,
          ...(s.start && { start: s.start }),
        }),
      ),
    );
  }
}

const fileList = (files: RetryPreflight["files"]) =>
  [
    ...files.slice(0, LISTED_FILES).map((f) => (f.created ? `${f.path} (created)` : f.path)),
    ...(files.length > LISTED_FILES ? [`and ${files.length - LISTED_FILES} more`] : []),
  ].join(", ");

// What the model reads with a regenerated message, so it can judge what the replaced attempt left behind.
function regenerateNote(options: {
  attempt: ReplacedAttempt;
  uuid: string;
  edited: boolean;
  restored: boolean;
  preflight: RetryPreflight;
  /** Sessions whose checkpoints hold the files' earlier versions, newest first. */
  checkpoints: string[];
}): string {
  const { attempt, uuid, edited, restored, preflight, checkpoints } = options;
  const { files, shellCommands, subagents, tenantChanges } = preflight;
  const backups = path.join(configDir(), "file-history");
  const lines = [
    `The user asked to regenerate this message${edited ? ", after editing it" : ""}. The conversation was rewound to just before it. A previous attempt already answered it: its transcript is ${attempt.transcriptPath}, from the user entry with uuid ${uuid} on.`,
    files.length === 0
      ? "That attempt changed no files with Write, Edit or NotebookEdit."
      : restored
        ? `The files it changed with Write, Edit or NotebookEdit were restored to how they were before it: ${fileList(files)}.`
        : preflight.checkpoint
          ? `The files it, or an earlier attempt at this message, changed with Write, Edit or NotebookEdit were NOT restored and may still hold those changes: ${fileList(files)}. Their earlier versions are in the checkpoints of session${checkpoints.length === 1 ? "" : "s"} ${checkpoints.join(", ")} (file-history-snapshot entries in each transcript, backups under ${backups}/<session>/); the ui_restore_files tool puts them all back.`
          : `The files it, or an earlier attempt at this message, changed with Write, Edit or NotebookEdit were NOT restored, and some have no checkpoint to restore them from: ${fileList(files)}.`,
  ];
  const other = [
    shellCommands.length > 0 && `ran ${shellCommands.length} shell command${shellCommands.length === 1 ? "" : "s"}`,
    subagents > 0 && `started ${subagents} subagent${subagents === 1 ? "" : "s"}`,
    tenantChanges.length > 0 &&
      `made these tenant changes: ${tenantChanges.map((c) => `${c.operation} on ${c.tenant}`).join(", ")}`,
  ].filter(Boolean);
  if (other.length > 0)
    lines.push(`It also ${other.join(", ")}. None of that was undone.`);
  lines.push(
    files.length > 0 && !restored
      ? "Inspect what it did, then decide whether its file changes should be reverted or kept and built on before you continue. Don't repeat tenant changes it already made unless the user asks."
      : "Inspect what it did before you continue. Don't repeat tenant changes it already made unless the user asks.",
  );
  return lines.join("\n");
}
