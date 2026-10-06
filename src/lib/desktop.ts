import type { ChatStatus, UIMessage } from "ai";
import type { Artifact, ArtifactRef } from "./artifacts";
import type { Tokens } from "./auth";
import type { ChannelInfo, ChannelInput, Delivery } from "./channels";
import type { Template } from "./templates";

// The API the Electron main process exposes to the window (electron/preload.ts).
// The main process holds the session tokens, the stored agents and runs, and
// drives every chat, so a run keeps going whether or not a window shows it.

export type PluginStatus = "ready" | "signed-out" | "expired" | "unsupported";

/** A plugin as the window sees it: never its tokens. */
export interface PluginInfo {
  id: string;
  kind: string;
  label: string;
  origin: string;
  orchestrator: boolean;
  status: PluginStatus;
  /** Why it isn't ready, when there's more to say than the status. */
  statusText?: string;
  /** Where its calls land unless the model names another scope, e.g. a workspace. */
  defaultScope?: string;
  defaultScopeLabel?: string;
}

export interface ScopeInfo {
  id: string;
  label: string;
}

export interface NewPlugin {
  kind: string;
  label: string;
  origin: string;
  tokens: Tokens;
}

/** A named set of plugins. `@all` is built in and always holds every plugin. */
export interface Group {
  id: string;
  members: string[];
}

export type RunStatus =
  | "queued"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "stopped";

export type RunTrigger = "manual" | "schedule" | "event";

export interface RunSummary {
  id: string;
  /** The orchestrator when the run started. */
  pluginId?: string;
  /** Where reads go before the run has called a tenant, e.g. where a detection fired. */
  focus?: string;
  /** A run from before plugins: listed under Earlier, and never continued. */
  readOnly?: boolean;
  /** The agent (template) it ran; none for an ad-hoc chat. */
  agentId?: string;
  trigger: RunTrigger;
  /** The run whose completion started this one. */
  parentRunId?: string;
  title: string;
  status: RunStatus;
  error?: string;
  /** Why the last turn stopped short, e.g. at the routed step cap. */
  notice?: string;
  /** A Claude Code session: the app shows it and answers its approvals, nothing more. */
  claudeCode?: {
    cwd: string;
    live: boolean;
    /** Whether its terminal takes messages from the app; unknown when it can't be told. */
    channels?: boolean;
    /** Auto mode: its approvals are given without asking. */
    autoApprove?: boolean;
    /** The Claude Code session it shows now; the run's id until a retry forks it. */
    sessionId?: string;
    /** What retries replaced, oldest first. */
    attempts?: ReplacedAttempt[];
    /** Set for a task: a session launched from an action on another session's artifact. */
    task?: TaskLink;
    /** What its tasks' digs suggested for its actions' prompts. */
    suggestions?: PromptSuggestion[];
    /** Branches the user bound to it, one per repo. */
    branches?: BoundBranch[];
    /** Its Claude Code has a Jira tool, so a split can file a ticket. */
    tickets?: boolean;
  };
  toolCalls: number;
  /** What the run published, in the order it was first published. */
  artifacts?: ArtifactRef[];
  createdAt: number;
  updatedAt: number;
}

/** A task's link back to the action it was launched from, and what it did. */
export interface TaskLink {
  /**
   * A dig: a read-only session that looks into an action and suggests prompt changes.
   * A spin-off: a prompt sent from the parent's message box to a session of its own.
   */
  kind?: "dig" | "spinoff";
  /** A dig replaced by a newer one, or whose suggestions were all settled: folded away. */
  archived?: boolean;
  /** The direct parent; not `parentRunId`, which chains triggered runs. */
  parentRunId: string;
  /** Its parent was removed and it was kept: it stays at the root. */
  parentRemoved?: boolean;
  /** Unset for a spin-off. */
  artifactId?: string;
  actionId?: string;
  /** The parent's depth + 1; a top-level session is 0. */
  depth: 1 | 2;
  launchedAt: number;
  /** The user changed the agent's prompt before launching. */
  promptEdited: boolean;
  /** Of the agent's prompt, to tell when a re-render changes it. */
  promptHash: string;
  worktree?: {
    /** The main repo's folder name. */
    repo: string;
    /** Its git common dir, for cleanup. */
    common: string;
    /** As the action gave it. */
    base: string;
    /** `base`, resolved at launch. */
    commit: string;
    /** The checkout the action named, whose local settings a new worktree gets. */
    source: string;
    /** Set when the task starts. */
    path?: string;
    branch?: string;
    /** This task made the branch. */
    created?: boolean;
    /** The task's cwd inside the worktree, relative to its root. */
    sub?: string;
  };
  /** Recomputed whenever it isn't mid-turn. */
  outcome?: TaskOutcome;
  /** A dig forked from its parent: the fork starts with the parent's conversation, up to `at`. */
  fork?: { sessionId: string; at?: string };
  /** A dig reads this folder too: the action's, when it isn't the session's. */
  reads?: string;
  /** What the agent reported about its branch with ui_report_branch. */
  report?: BranchReport;
  /** A spin-off's context from the parent's conversation, as the user sent it. */
  context?: string;
}

/** A branch a session owns in one repo; its tasks merge up into it. */
export interface BoundBranch {
  /** The repo's git common dir, which keys the binding. */
  common: string;
  /** The repo's folder name. */
  repo: string;
  name: string;
  /** Goes in front of each merged commit's subject, e.g. "DEV-22044". */
  prefix?: string;
  /** Bound from New branch…: the agent was asked to create it from `base`. */
  creating?: { base: string };
  boundAt: number;
  report?: BranchReport;
}

/** What an agent reported with ui_report_branch. */
export interface BranchReport {
  /** Pushed as this remote branch, when it isn't the local name. */
  remote?: string;
  pr?: { url: string; number?: number };
  at: number;
}

/** A branch as git has it now. */
export interface BranchState {
  exists: boolean;
  /** The worktree it's checked out in. */
  worktree?: string;
  dirty?: boolean;
  /** An operation left in progress in its worktree, e.g. "a cherry-pick". */
  inProgress?: string;
  tip?: string;
  /** On its remote, by upstream or by `origin/<name>`. */
  pushed: boolean;
  /** Commits not on its remote. */
  ahead?: number;
  /** Commits on the default base it doesn't have. */
  behind?: number;
}

/** A task branch under a session, as its Merge menu lists it. */
export interface BranchRow {
  runId: string;
  title: string;
  artifactId: string;
  actionId: string;
  depth: number;
  repo: string;
  common: string;
  branch: string;
  status: RunStatus;
  /** Its worktree has uncommitted changes. */
  dirty: boolean;
  commits: number;
  merged: boolean;
  /** Can be merged now. */
  ready: boolean;
  /** Why it can't, when it can't. */
  reason?: string;
  report?: BranchReport;
}

/** A session's branches: what its branch menus show. */
export interface BranchView {
  /** Its bound branches; a task's own worktree branch is listed, `implicit`. */
  bound: (BoundBranch & { state: BranchState; implicit?: boolean })[];
  /** A task's upstream: the nearest ancestor's bound branch in its repo. */
  upstream?: BoundBranch & { state: BranchState; owner: string };
  /** A task's own branch, against its upstream. */
  self?: BranchRow;
  /** Without a branch of its own, it acts on its nearest ancestor's, repo by repo. */
  inherited: (BoundBranch & { state: BranchState; implicit?: boolean; owner: string; ownerTitle: string })[];
  /** The task branches under it, any depth, in launch order. */
  rows: BranchRow[];
  /** Repos a binding can be in: its folder's and its tasks'. */
  repos: { common: string; repo: string; dir: string }[];
  /** `origin/HEAD`'s target, or the first of origin/main, origin/master, main, master; by repo. */
  defaultBases: Record<string, string>;
}

/** A local branch, for the Bind branch picker. */
export interface LocalBranch {
  name: string;
  worktree?: string;
}

/** What a branch menu item asks the agent to do. */
export type BranchAction =
  /** Into this session's branch in `common`, or into a task's upstream. */
  | { kind: "merge"; common: string; taskIds: string[] }
  | { kind: "split"; taskId: string; remote: string; ticket: boolean }
  /** On this session's branch in `common`, or a task's own when left out. */
  | {
      kind: "sync" | "test" | "push" | "open-pr" | "update-pr" | "comments";
      common?: string;
    }
  | { kind: "new-branch"; dir: string; name: string; base: string };

/** A change a dig suggested to an action's prompt; the user accepts or dismisses it. */
export interface PromptSuggestion {
  id: string;
  artifactId: string;
  actionId: string;
  /** The dig that suggested it. */
  digRunId: string;
  /** Of the agent's prompt it was made against: a re-render that changes it makes it stale. */
  agentHash: string;
  kind: "append" | "replace";
  /** A replace's exact text, found once in the prompt. */
  find?: string;
  text: string;
  why: string;
  status: "pending" | "accepted" | "dismissed" | "superseded";
  createdAt: number;
}

export interface TaskOutcome {
  /** The first line of the last answer. */
  answer: string;
  /** The transcript `at` indexes. */
  sessionId: string;
  at: number;
  commitsAhead?: number;
  filesChanged?: number;
  dirty?: boolean;
  /** What it changed, in path order, the first `MAX_LISTED_FILES` of `filesChanged`. */
  files?: ChangedFile[];
}

/** A file a task changed: in its worktree since `base`, or elsewhere with its own edits. */
export interface ChangedFile {
  /** Relative to the worktree's root, or to the task's cwd; absolute outside it. */
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  /** A rename's earlier path. */
  oldPath?: string;
  /** Unset when the file is binary or its earlier version isn't known. */
  additions?: number;
  deletions?: number;
  binary?: boolean;
}

/** Both versions of a changed file, as they are now. */
export interface FileDiff {
  file: ChangedFile;
  absolute: string;
  /** Unset for an added file, or when the earlier version isn't known. */
  before?: string;
  /** Unset for a deleted file. */
  after?: string;
  binary?: boolean;
  tooLarge?: boolean;
  /** Set when `before` isn't the version the task started from. */
  note?: string;
}

/** A row of the launch dialog, as launched. */
export interface LaunchRequest {
  artifactId: string;
  actionId: string;
  title: string;
  text: string;
  /** Starts the worktree here instead of at the action's base, e.g. the parent's bound branch. */
  base?: string;
}

/** A prompt from a session's message box, for a session of its own under it. */
export interface SpinoffRequest {
  title: string;
  prompt: string;
  /** From the parent's conversation, put before the prompt. */
  context?: string;
}

export interface LaunchResult {
  actionId: string;
  runId?: string;
  error?: string;
}

/** Where a launch would run, checked before the dialog shows it. */
export interface TaskPreview {
  actionId: string;
  cwd: string;
  repo?: string;
  /** The repo's git common dir. */
  common?: string;
  /** The branch the task would get now. */
  branch?: string;
  base?: string;
  commit?: string;
  /** Uncommitted changes in the checkout, which a new worktree doesn't get. */
  dirty?: number;
  /** The git top level, to warn when tasks share a checkout. */
  top?: string;
  /** Running tasks without a worktree in that checkout. */
  sharedRunning?: number;
  error?: string;
}

export interface WorktreeState {
  path: string;
  branch?: string;
  exists: boolean;
  dirty: boolean;
}

/** The part of a Claude Code session a retry replaced: its session from one user message on. */
export interface ReplacedAttempt {
  sessionId: string;
  transcriptPath: string;
  /** The index of the retried user message, the same in both sessions. */
  at: number;
  /** How many messages it held, the retried one included. */
  messages: number;
  tenantChanges: number;
  replacedAt: number;
}

/** What retrying a user message would replace, and what of that can be undone. */
export interface RetryPreflight {
  /** Messages after the retried one. */
  later: number;
  running: boolean;
  /** Files changed with Write, Edit or NotebookEdit, here or by an earlier attempt at this message. */
  files: { path: string; created: boolean; earlier?: boolean }[];
  /** Whether those can be restored from a checkpoint. */
  checkpoint: boolean;
  shellCommands: string[];
  subagents: number;
  tenantChanges: { tenant: string; operation: string }[];
}

/** A subagent a Claude Code session started, as the transcripts show it. */
export interface ClaudeCodeAgent {
  toolUseId: string;
  description: string;
  agentType?: string;
  background: boolean;
  status: "running" | "completed" | "failed" | "stopped";
  startedAt: number;
  finishedAt?: number;
  toolUses: number;
  tokens: number;
  /** Its latest call while it runs, e.g. `Bash: Run the tests`. */
  activity?: string;
  /** 0 for the session's own; 1 for one an agent started, and so on. */
  depth: number;
}

export interface RunSnapshot {
  messages: UIMessage[];
  status: ChatStatus;
  error?: string;
  /** The run is going, including while the app runs a client tool between requests. */
  running: boolean;
}

/** A run's change since the last patch: its new length and the messages that changed. */
export interface RunPatch extends Omit<RunSnapshot, "messages"> {
  runId: string;
  length: number;
  messages: [index: number, message: UIMessage][];
}

/** What a first message starts: the agent, if one is run. */
export interface RunContext {
  agentId?: string;
  /** The plugin a read with no `plugin` goes to before the run has called any. */
  focus?: string;
  trigger?: RunTrigger;
  parentRunId?: string;
}

export type OutgoingMessage = { text: string; metadata?: unknown };

export interface OpenRun {
  run: RunSummary;
  artifactId?: string;
}

export interface InstanceRequest {
  url: string;
  method: string;
  headers: [string, string][];
  body?: string;
}

export interface InstanceResponse {
  status: number;
  statusText: string;
  headers: [string, string][];
  body: string;
}

export interface McpApprovalRequest {
  id: string;
  /** A sign-in prompt: signing the tenant in approves it, nothing else does. */
  kind?: "sign-in";
  tenantId: string;
  action: string;
  description: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  payload?: Record<string, unknown>;
  toolUseId?: string;
  /** The Claude Code session that asked, which shows it in its chat. */
  runId?: string;
  createdAt: number;
}

/** How the app runs Claude Code; kept in Options. */
export interface ClaudeCodeSetup {
  /** Chats started in the app run in Claude Code rather than the plugin orchestrator. */
  orchestrator: boolean;
  /** The `claude` binary; found on its own when unset. */
  command?: string;
  /** Where sessions started in the app run. */
  cwd?: string;
}

export interface ClaudeCodeInfo extends ClaudeCodeSetup {
  /** The binary in use, once it was found and answered `--version`. */
  found?: {
    path: string;
    version: string;
    /** It takes the flags a retry needs. */
    retry: boolean;
    /** It takes `--permission-mode acceptEdits`. */
    acceptEdits?: boolean;
  };
  /** Where sessions start when `cwd` isn't set. */
  defaultCwd: string;
}

export type ReplyKind = "answer" | "next" | "redirect";

/** A reply the suggester expects the user to send next. */
export interface SuggestedReply {
  label: string;
  text: string;
  kind: ReplyKind;
  /** A part of `text` the user will likely change; selected when the composer fills. */
  blank?: string;
}

/** The suggestions for a run's latest turn, by the key of its last message. */
export interface ReplyState {
  runId: string;
  turnId: string;
  status: "pending" | "ready" | "none" | "failed" | "off";
  replies: SuggestedReply[];
}

/** Reply suggestions as kept in Options. */
export interface SuggesterSetup {
  enabled: boolean;
  model: string;
  /** What the suggester learned about how the user replies. */
  notes: string[];
}

export interface SuggesterInfo extends SuggesterSetup {
  state: "off" | "idle" | "ready" | "working" | "failed";
  error?: string;
  /** How long the last suggestions took to arrive. */
  lastMs?: number;
  transcriptPath?: string;
}

export interface McpState {
  /** Auto mode for approvals no session claims. */
  autoApprove: boolean;
  pendingApprovals: McpApprovalRequest[];
  port?: number;
}

type Unsubscribe = () => void;

export interface DesktopApi {
  platform: string;
  isFullScreen(): Promise<boolean>;
  onFullScreen(listener: (isFullScreen: boolean) => void): Unsubscribe;
  mcp: {
    getState(): Promise<McpState>;
    respondApproval(
      id: string,
      approved: boolean,
      reason?: string,
    ): Promise<boolean>;
    onApprovalRequested(
      listener: (req: McpApprovalRequest) => void,
    ): Unsubscribe;
    onApprovalResolved(
      listener: (res: {
        id: string;
        approved: boolean;
        reason?: string;
      }) => void,
    ): Unsubscribe;
    onPortChanged(listener: (port: number) => void): Unsubscribe;
    setAutoApprove(on: boolean): Promise<void>;
    /** Approves the request and turns on auto mode: a task's own, for a task's request. */
    approveAll(id: string, reason?: string): Promise<boolean>;
    onAutoApproveChanged(listener: (on: boolean) => void): Unsubscribe;
  };
  claudeCode: {
    get(): Promise<ClaudeCodeInfo>;
    save(setup: Partial<ClaudeCodeSetup>): Promise<ClaudeCodeInfo>;
    /** Auto mode for one session's approvals. */
    setAutoApprove(runId: string, on: boolean): Promise<void>;
    preflight(runId: string, index: number): Promise<RetryPreflight>;
    /** Sends the user message at `index` again, as `text`, in place of it and everything after. */
    retry(
      runId: string,
      index: number,
      text: string,
      restoreFiles: boolean,
    ): Promise<void>;
    /** The messages of a replaced attempt, from its retried message on. */
    replaced(runId: string, attempt: number): Promise<UIMessage[]>;
    /** The session's subagents while any runs; empty otherwise. */
    agents(runId: string): Promise<ClaudeCodeAgent[]>;
    onAgents(
      listener: (change: { runId: string; agents: ClaudeCodeAgent[] }) => void,
    ): Unsubscribe;
    onChange(listener: (info: ClaudeCodeInfo) => void): Unsubscribe;
    /** Where each action would run if launched now. */
    preview(
      parentRunId: string,
      actions: { artifactId: string; actionId: string }[],
    ): Promise<TaskPreview[]>;
    /** Creates a queued task per request, in order. */
    launch(parentRunId: string, requests: LaunchRequest[]): Promise<LaunchResult[]>;
    /**
     * What the session's conversation says that bears on `prompt`, for a spin-off; empty when
     * nothing does. A newer call for the same session cancels this one.
     */
    writeContext(parentRunId: string, prompt: string): Promise<string>;
    cancelContext(parentRunId: string): Promise<void>;
    /** Starts the prompt as a session under this one, past the task cap; resolves to its run. */
    spinoff(parentRunId: string, request: SpinoffRequest): Promise<string>;
    /** Starts a dig into an action; resolves to its run, or the one already digging into the same prompt. */
    dig(parentRunId: string, artifactId: string, actionId: string): Promise<string>;
    /** Accepts or dismisses a dig's suggestion, or takes that back with "pending". */
    decide(
      parentRunId: string,
      suggestionId: string,
      status: "accepted" | "dismissed" | "pending",
    ): Promise<void>;
    /** Starts a queued or held task now, past the cap. */
    startNow(runId: string): Promise<void>;
    /** Queues a task whose first message was never sent, again. */
    startAgain(runId: string): Promise<void>;
    /** Stops every running and queued task below the session. */
    stopTasks(runId: string): Promise<void>;
    /** Tasks queued when the app last closed, held until Resume. */
    queue(): Promise<{ held: number }>;
    onQueue(listener: (queue: { held: number }) => void): Unsubscribe;
    resumeQueue(): Promise<void>;
    /** The worktrees of these tasks, as they are now. */
    worktreeStates(runIds: string[]): Promise<Record<string, WorktreeState>>;
    /** A file the task changed, before and after; throws when it has no changes now. */
    fileDiff(runId: string, path: string): Promise<FileDiff>;
    reveal(path: string): Promise<void>;
    /** The session's branches, as git has them now. */
    branchView(runId: string): Promise<BranchView>;
    /** A repo's local branches, those in a worktree first. */
    localBranches(common: string): Promise<LocalBranch[]>;
    bindBranch(
      runId: string,
      binding: { dir: string; name: string; prefix?: string; creating?: { base: string } },
    ): Promise<void>;
    unbindBranch(runId: string, common: string): Promise<void>;
    /** The prompt a branch menu item fills the composer with. */
    branchPrompt(runId: string, action: BranchAction): Promise<string>;
  };
  plugins: {
    list(): Promise<PluginInfo[]>;
    add(plugin: NewPlugin): Promise<PluginInfo>;
    signIn(id: string, tokens: Tokens): Promise<void>;
    signOut(id: string): Promise<void>;
    rename(id: string, label: string): Promise<void>;
    remove(id: string): Promise<void>;
    setOrchestrator(id: string): Promise<void>;
    setDefaultScope(id: string, scope: string): Promise<void>;
    /** The scopes a plugin's calls can land in, e.g. its workspaces. */
    scopes(id: string): Promise<ScopeInfo[]>;
    /** Checks every plugin's status again. */
    refresh(): Promise<void>;
    /** An authenticated call to a plugin's own origin. */
    fetch(id: string, request: InstanceRequest): Promise<InstanceResponse>;
    onChange(listener: (plugins: PluginInfo[]) => void): Unsubscribe;
  };
  groups: {
    list(): Promise<Group[]>;
    save(group: Group): Promise<void>;
    delete(id: string): Promise<void>;
    onChange(listener: (groups: Group[]) => void): Unsubscribe;
  };
  agents: {
    list(): Promise<Template[]>;
    save(agent: Template): Promise<void>;
    delete(id: string): Promise<void>;
    onChange(listener: () => void): Unsubscribe;
  };
  artifacts: {
    list(runId: string): Promise<Artifact[]>;
  };
  channels: {
    list(): Promise<ChannelInfo[]>;
    add(channel: ChannelInput): Promise<ChannelInfo>;
    remove(id: string): Promise<void>;
    onChange(listener: () => void): Unsubscribe;
  };
  deliveries: {
    list(runId: string): Promise<Delivery[]>;
    /** Sends an artifact's current revision now. */
    send(
      runId: string,
      artifactId: string,
      channelIds: string[],
    ): Promise<Delivery[]>;
    onChange(listener: (runId: string) => void): Unsubscribe;
  };
  replies: {
    /** The suggestions for the run's turn `turnId`, asking for them when there are none yet. */
    request(runId: string, turnId: string): Promise<ReplyState | undefined>;
    /** What the user sent after suggestions were shown, and which one they picked. */
    outcome(runId: string, turnId: string, text: string, picked?: number): Promise<void>;
    onChange(listener: (state: ReplyState) => void): Unsubscribe;
  };
  suggester: {
    get(): Promise<SuggesterInfo>;
    save(setup: Partial<SuggesterSetup>): Promise<SuggesterInfo>;
    onChange(listener: (info: SuggesterInfo) => void): Unsubscribe;
  };
  /** The main process asks the window to show a run, e.g. from a notification. */
  onOpenRun(listener: (target: OpenRun) => void): Unsubscribe;
  runs: {
    list(): Promise<RunSummary[]>;
    /** Runs from before plugins, read-only. */
    earlier(): Promise<RunSummary[]>;
    get(runId: string): Promise<RunSnapshot>;
    /** The run's current state; its patches follow until `close`. */
    open(runId: string): Promise<RunSnapshot>;
    close(runId: string): Promise<void>;
    send(
      runId: string,
      message: OutgoingMessage,
      context: RunContext,
    ): Promise<void>;
    stop(runId: string): Promise<void>;
    respond(
      runId: string,
      approvalId: string,
      approved: boolean,
      /** A question's answers, by question text. */
      answers?: Record<string, string>,
    ): Promise<void>;
    /** For a Claude Code session: whether its tasks go too, and which worktrees to delete. */
    delete(
      runId: string,
      options?: { tasks: boolean; worktrees: string[] },
    ): Promise<void>;
    onPatch(listener: (patch: RunPatch) => void): Unsubscribe;
    onChange(listener: (run: RunSummary) => void): Unsubscribe;
    onDelete(listener: (runId: string) => void): Unsubscribe;
  };
}

declare global {
  interface Window {
    desktop: DesktopApi;
  }
}
