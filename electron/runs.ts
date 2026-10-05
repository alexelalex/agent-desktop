import { refOf } from "@/lib/artifacts";
import { withCommandPrompts } from "@/lib/commands";
import {
  DELEGATE,
  withReportsOnly,
  type DelegateInput,
  type SubagentRun,
} from "@/lib/delegate";
import {
  type OutgoingMessage,
  type RunContext,
  type RunPatch,
  type RunSnapshot,
  type RunSummary,
} from "@/lib/desktop";
import { withMentionPrompts, type Mentionable } from "@/lib/mentions";
import {
  lastStepCalls,
  routedStepAnswered,
  stampsOf,
  type Stamp,
} from "@/lib/routing";
import { chatTitle, countToolCalls, runStatus } from "@/lib/runs";
import { withTemplatePrompts } from "@/lib/templates";
import { latestPlan, TODO } from "@/lib/todo";
import {
  AbstractChat,
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type ChatState,
  type ChatStatus,
  type DynamicToolCall,
  type DynamicToolUIPart,
  type UIMessage,
} from "ai";
import type { WebContents } from "electron";
import { deleteArtifacts, onArtifactsChange } from "./artifacts";
import { approvalHub } from "./mcp/approval-hub";
import { getSetup } from "./mcp/claude-cli";
import { ClaudeCodeSessions } from "./mcp/sessions";
import {
  clientToolDescriptors,
  clientToolsAnswered,
  isClientTool,
  runClientTool,
} from "./client-tools";
import { listGroups } from "./plugins/groups";
import { kindOf } from "./plugins/kinds";
import { getPlugin, listPlugins, orchestrator } from "./plugins/store";
import { Router, routingMode } from "./router";
import { readJson, removeFile, writeJson } from "./store";
import { fanOut } from "./subagents";

const INDEX = "runs.json";
// Runs from before plugins, listed read-only.
const EARLIER = "earlier-runs.json";
const RUN_ID = /^[\w-]{1,64}$/;
// Streaming changes reach the windows at most this often.
const PATCH_INTERVAL_MS = 50;
// Each routed call ends a request, so the app caps a turn's steps itself.
// Tests lower it with AGENT_DESKTOP_ROUTED_STEP_CAP.
const ROUTED_STEP_CAP = Number(process.env.AGENT_DESKTOP_ROUTED_STEP_CAP) || 20;
const CAP_NOTICE = `Stopped after ${ROUTED_STEP_CAP} routed steps. Send a message to continue.`;
// A call held by the app for approval, because its tenant calls it a change.
const HELD = "held:";
// Tools the server runs even when calls are routed.
const SERVER_TOOLS = new Set([TODO, "loadToolGroup"]);

// Run ids come from the window and name files.
function assertRunId(runId: string) {
  if (!RUN_ID.test(runId)) throw new Error(`Invalid run id: ${runId}`);
}

function messagesFile(runId: string) {
  assertRunId(runId);
  return `runs/${runId}.json`;
}

// AbstractChat keeps its state here; every change schedules a patch.
class RunState implements ChatState<UIMessage> {
  #messages: UIMessage[];
  #status: ChatStatus = "ready";
  #error: Error | undefined;

  constructor(
    messages: UIMessage[],
    private readonly changed: (index?: number) => void,
  ) {
    this.#messages = messages;
  }

  get messages() {
    return this.#messages;
  }
  set messages(messages: UIMessage[]) {
    this.#messages = messages;
    messages.forEach((_, index) => this.changed(index));
    this.changed();
  }
  get status() {
    return this.#status;
  }
  set status(status: ChatStatus) {
    this.#status = status;
    this.changed();
  }
  get error() {
    return this.#error;
  }
  set error(error: Error | undefined) {
    this.#error = error;
    this.changed();
  }

  pushMessage = (message: UIMessage) => {
    this.#messages = [...this.#messages, message];
    this.changed(this.#messages.length - 1);
  };
  popMessage = () => {
    this.#messages = this.#messages.slice(0, -1);
    this.changed();
  };
  replaceMessage = (index: number, message: UIMessage) => {
    this.#messages = this.#messages.with(index, message);
    this.changed(index);
  };
  snapshot = <T>(thing: T): T => structuredClone(thing);
}

class Chat extends AbstractChat<UIMessage> {}

// Each request goes to whichever plugin orchestrates at that moment.
function orchestratorChat() {
  const plugin = orchestrator();
  if (!plugin)
    throw new Error("No plugin is labeled orchestrator. Pick one in Options.");
  return kindOf(plugin).chat(plugin);
}

// What `@` can name now, for the server's reading of mentions.
const mentionable = (): Mentionable[] => [
  ...listPlugins().map((p) => ({
    id: p.id,
    label: p.label,
    kind: "plugin" as const,
  })),
  ...listGroups().map((g) => ({
    id: g.id,
    label: g.id,
    kind: "group" as const,
  })),
];
const known = () => new Set(mentionable().map((m) => m.id));

// Steps since the user's last message: each one was a request to /chat.
function turnSteps(messages: UIMessage[]): number {
  const start = messages.findLastIndex((m) => m.role === "user");
  return messages
    .slice(start + 1)
    .flatMap((m) => m.parts)
    .filter((p) => p.type === "step-start").length;
}

function orchestratorTransport(extraFields: () => object) {
  return new DefaultChatTransport<UIMessage>({
    fetch: (_, init) => {
      const { api, headers, fetch } = orchestratorChat();
      const merged = new Headers(init?.headers);
      for (const [name, value] of Object.entries(headers))
        merged.set(name, value);
      return fetch(api, { ...init, headers: merged });
    },
    prepareSendMessagesRequest: ({
      id,
      messages,
      body,
      trigger,
      messageId,
    }) => ({
      body: {
        ...body,
        id,
        messages: withMentionPrompts(
          withCommandPrompts(
            withTemplatePrompts(withReportsOnly(messages), known()),
          ),
          mentionable(),
        ),
        trigger,
        messageId,
        clientTools: clientToolDescriptors,
        ...extraFields(),
      },
    }),
  });
}

class RunDriver {
  readonly chat: Chat;
  readonly router = new Router();
  /** Set by a stop, so the run ends as stopped rather than completed. */
  stopped = false;
  /** Why the turn stopped short, shown with the run. */
  notice: string | undefined;
  private state: RunState;
  private dirty = new Set<number>();
  private timer: NodeJS.Timeout | undefined;
  private toolCalls = new Set<AbortController>();
  // Routed calls in flight, by tool call id.
  private routing = new Set<string>();

  constructor(
    public summary: RunSummary,
    messages: UIMessage[],
    private readonly flushed: (
      driver: RunDriver,
      patch: Omit<RunPatch, "running">,
    ) => void,
    private readonly earlierRuns: () => RunSummary[],
  ) {
    this.state = new RunState(messages, (index) => this.changed(index));
    this.chat = new Chat({
      id: summary.id,
      state: this.state,
      transport: orchestratorTransport(() =>
        routingMode() ? this.router.requestFields() : {},
      ),
      onToolCall: ({ toolCall }) => this.runClientTool(toolCall),
      // Routed calls run once the stream ends, never in onToolCall, which fires
      // before a write's approval request arrives.
      onFinish: ({ isAbort, isError }) => {
        if (!isAbort && !isError && routingMode()) void this.routeCalls();
      },
      // Once every call is answered, send the answers back so the model continues.
      sendAutomaticallyWhen: ({ messages }) => {
        if (this.stopped) return false;
        if (!routingMode()) {
          return (
            lastAssistantMessageIsCompleteWithApprovalResponses({ messages }) ||
            clientToolsAnswered(messages)
          );
        }
        if (!routedStepAnswered(messages)) return false;
        if (turnSteps(messages) >= ROUTED_STEP_CAP) {
          this.notice = CAP_NOTICE;
          this.changed();
          return false;
        }
        return true;
      },
    });
  }

  /** Runs, stamps or holds the last step's calls that belong to a tenant. */
  async routeCalls() {
    for (const part of lastStepCalls(this.chat.messages)) {
      const name = part.toolName;
      if (
        SERVER_TOOLS.has(name) ||
        isClientTool(name) ||
        this.routing.has(part.toolCallId)
      ) {
        continue;
      }
      if (name === DELEGATE) {
        if (part.state === "input-available") void this.delegate(part);
        continue;
      }
      if (part.state === "approval-requested") {
        this.stampPending(part);
        continue;
      }
      const approved =
        part.state === "approval-responded" && part.approval.approved;
      if (part.state === "input-available" || approved)
        void this.routeOne(part, approved);
    }
  }

  // The app runs a delegated step's subagents: one per ready target, streaming
  // their progress into the part, then answers with one run per plugin.
  private async delegate(part: DynamicToolUIPart) {
    const abort = new AbortController();
    this.toolCalls.add(abort);
    this.routing.add(part.toolCallId);
    const input = (part.input ?? {}) as DelegateInput;
    const messages = this.chat.messages;
    const plan = latestPlan(messages) ?? [];
    const step = input.stepId
      ? plan.find((s) => s.id === input.stepId)
      : undefined;
    const ids = step?.targets?.length
      ? this.router.expand(step.targets)
      : undefined;
    // Plugins removed since the step was planned are recorded as skipped.
    const removed: SubagentRun[] = (ids ?? [])
      .filter((id) => !getPlugin(id))
      .map((id) => ({
        plugin: id,
        label: id,
        status: "skipped",
        reason: "This plugin was removed.",
      }));
    try {
      const runs = await fanOut({
        toolCallId: part.toolCallId,
        input,
        plan,
        targets: ids?.flatMap((id) => getPlugin(id) ?? []),
        history: messages.slice(0, -1),
        focus: this.summary.focus,
        router: this.router,
        signal: abort.signal,
        onProgress: (runs) =>
          this.patchPart(
            part.toolCallId,
            (p) =>
              ({
                ...p,
                state: "output-available",
                output: { runs: [...runs, ...removed] },
                preliminary: true,
              }) as DynamicToolUIPart,
          ),
      });
      // addToolOutput spreads the old part: clear the preliminary flag first.
      this.patchPart(
        part.toolCallId,
        (p) =>
          ({
            ...p,
            state: "input-available",
            output: undefined,
            preliminary: undefined,
          }) as unknown as DynamicToolUIPart,
      );
      await this.answer(part.toolCallId, DELEGATE, {
        state: "output-available",
        output: { runs: [...runs, ...removed] },
      });
    } catch (error) {
      await this.answer(part.toolCallId, DELEGATE, {
        state: "output-error",
        errorText: (error as Error).message,
      });
    } finally {
      this.toolCalls.delete(abort);
      this.routing.delete(part.toolCallId);
    }
  }

  // A write waiting for approval shows the tenant it will run on.
  private stampPending(part: DynamicToolUIPart) {
    if (stampsOf(this.messageOf(part.toolCallId)?.message)[part.toolCallId])
      return;
    try {
      this.stamp(
        part.toolCallId,
        this.router.resolve(part, this.chat.messages, this.summary.focus).stamp,
      );
    } catch (error) {
      // An unnamed write never runs: it is denied with the reason.
      if ("approval" in part && part.approval) {
        void this.chat.addToolApprovalResponse({
          id: part.approval.id,
          approved: false,
          reason: (error as Error).message,
        });
      }
    }
  }

  private async routeOne(part: DynamicToolUIPart, approved: boolean) {
    const abort = new AbortController();
    this.toolCalls.add(abort);
    this.routing.add(part.toolCallId);
    try {
      const target = this.router.resolve(
        part,
        this.chat.messages,
        this.summary.focus,
      );
      this.stamp(part.toolCallId, target.stamp);
      if (!approved && (await this.router.isWrite(target, part.toolName))) {
        return this.hold(part);
      }
      const output = await this.router.run(part, target, abort.signal);
      await this.answer(part.toolCallId, part.toolName, {
        state: "output-available",
        output,
      });
    } catch (error) {
      await this.answer(part.toolCallId, part.toolName, {
        state: "output-error",
        errorText: abort.signal.aborted
          ? "Stopped before it finished."
          : error instanceof Error
            ? error.message
            : String(error),
      });
    } finally {
      this.toolCalls.delete(abort);
      this.routing.delete(part.toolCallId);
    }
  }

  private answer(
    toolCallId: string,
    tool: string,
    result:
      | { state: "output-available"; output: unknown }
      | { state: "output-error"; errorText: string },
  ) {
    return this.chat.addToolOutput({ ...result, tool, toolCallId });
  }

  private messageOf(toolCallId: string) {
    const index = this.chat.messages.findLastIndex((m) =>
      m.parts.some(
        (p) => p.type === "dynamic-tool" && p.toolCallId === toolCallId,
      ),
    );
    return index < 0
      ? undefined
      : { index, message: this.chat.messages[index] };
  }

  private patchPart(
    toolCallId: string,
    patch: (part: DynamicToolUIPart) => DynamicToolUIPart,
  ) {
    const found = this.messageOf(toolCallId);
    if (!found) return;
    this.state.replaceMessage(found.index, {
      ...found.message,
      parts: found.message.parts.map((p) =>
        p.type === "dynamic-tool" && p.toolCallId === toolCallId ? patch(p) : p,
      ),
    });
  }

  private stamp(toolCallId: string, stamp: Stamp) {
    const found = this.messageOf(toolCallId);
    if (!found) return;
    const metadata = (found.message.metadata ?? {}) as {
      stamps?: Record<string, Stamp>;
    };
    this.state.replaceMessage(found.index, {
      ...found.message,
      metadata: {
        ...metadata,
        stamps: { ...metadata.stamps, [toolCallId]: stamp },
      },
    });
  }

  // The tenant calls this a change though the orchestrator didn't: the app asks.
  private hold(part: DynamicToolUIPart) {
    this.patchPart(
      part.toolCallId,
      (p) =>
        ({
          ...p,
          state: "approval-requested",
          approval: { id: `${HELD}${p.toolCallId}` },
        }) as DynamicToolUIPart,
    );
  }

  /** Answers a call the app held: run it, or deny it naming the tenant. */
  async answerHeld(approvalId: string, approved: boolean) {
    const toolCallId = approvalId.slice(HELD.length);
    const found = this.messageOf(toolCallId);
    const part = found?.message.parts.find(
      (p): p is DynamicToolUIPart =>
        p.type === "dynamic-tool" && p.toolCallId === toolCallId,
    );
    if (!part) return;
    const label = stampsOf(found!.message)[toolCallId]?.label ?? "the tenant";
    // Back to a plain client call, so the server never sees an approval it didn't ask for.
    this.patchPart(
      toolCallId,
      (p) =>
        ({
          ...p,
          state: "input-available",
          approval: undefined,
        }) as DynamicToolUIPart,
    );
    if (approved)
      return this.routeOne(
        { ...part, state: "input-available" } as DynamicToolUIPart,
        true,
      );
    await this.answer(toolCallId, part.toolName, {
      state: "output-error",
      errorText: `The user denied this change on ${label}.`,
    });
  }

  private runClientTool(
    call: Pick<DynamicToolCall, "toolName" | "toolCallId" | "input">,
  ) {
    if (!isClientTool(call.toolName)) return;
    const abort = new AbortController();
    this.toolCalls.add(abort);
    const context = {
      run: this.summary,
      signal: abort.signal,
      earlierRuns: this.earlierRuns,
    };
    // Not awaited: onToolCall must return before the output can be added.
    void runClientTool(call.toolName, call.input, context)
      .then(
        (output) => ({ state: "output-available" as const, output }),
        (error: unknown) => ({
          state: "output-error" as const,
          errorText: error instanceof Error ? error.message : String(error),
        }),
      )
      .then((result) => {
        this.toolCalls.delete(abort);
        // A stopped call still gets an answer, so the turn isn't left open;
        // `stopped` keeps it from being sent.
        const answer = abort.signal.aborted
          ? {
              state: "output-error" as const,
              errorText: "Stopped before it finished.",
            }
          : result;
        void this.chat.addToolOutput({
          ...answer,
          tool: call.toolName,
          toolCallId: call.toolCallId,
        });
      });
  }

  /** Stops the client tools still running. */
  abortToolCalls() {
    for (const abort of this.toolCalls) abort.abort();
    this.toolCalls.clear();
  }

  private changed(index?: number) {
    if (index !== undefined) this.dirty.add(index);
    this.timer ??= setTimeout(() => this.flush(), PATCH_INTERVAL_MS);
  }

  private flush() {
    this.timer = undefined;
    const { messages, status, error } = this.chat;
    const patch: Omit<RunPatch, "running"> = {
      runId: this.summary.id,
      length: messages.length,
      messages: [...this.dirty]
        .filter((index) => index < messages.length)
        .map((index) => [index, messages[index]]),
      status,
      error: error?.message,
    };
    this.dirty.clear();
    this.flushed(this, patch);
  }
}

const listed = (run: RunSummary) =>
  JSON.stringify([run.title, run.status, run.error, run.toolCalls, run.notice]);

/** Every run: the index of summaries, and a driver for each run touched since launch. */
export class RunManager {
  /** Claude Code sessions, listed with the runs and shown read-only. */
  readonly claudeCode: ClaudeCodeSessions;
  private index: Map<string, RunSummary>;
  private earlierRuns: Map<string, RunSummary>;
  private drivers = new Map<string, RunDriver>();
  private viewers = new Map<string, Set<WebContents>>();
  private known = new WeakSet<WebContents>();
  private settledListeners: ((
    run: RunSummary,
    messages: UIMessage[],
  ) => void)[] = [];

  constructor(
    private readonly broadcast: (channel: string, payload: unknown) => void,
  ) {
    this.claudeCode = new ClaudeCodeSessions(
      (patch) => this.sendPatch(patch),
      broadcast,
    );
    const runs = readJson<RunSummary[]>(INDEX, []);
    this.index = new Map(
      runs.map((run) => [
        run.id,
        run.status === "running"
          ? {
              ...run,
              status: "failed",
              error: "The app closed during this run.",
            }
          : run,
      ]),
    );
    this.earlierRuns = new Map(
      readJson<RunSummary[]>(EARLIER, []).map((run) => [
        run.id,
        {
          ...run,
          readOnly: true,
          status: run.status === "running" ? "failed" : run.status,
        },
      ]),
    );
    onArtifactsChange((runId, artifacts) => {
      const run = this.index.get(runId);
      if (!run) return;
      const next = { ...run, artifacts: artifacts.map(refOf) };
      this.index.set(runId, next);
      const driver = this.drivers.get(runId);
      if (driver) driver.summary = next;
      writeJson(INDEX, [...this.index.values()]);
      this.broadcast("runs:changed", next);
    });
  }

  /** Called when a run stops running: completed, stopped, failed or waiting for approval. */
  onSettled(listener: (run: RunSummary, messages: UIMessage[]) => void) {
    this.settledListeners.push(listener);
  }

  summary(runId: string): RunSummary | undefined {
    return this.index.get(runId);
  }

  /** How many runs up its chain of parent runs goes. */
  chainDepth(runId: string): number {
    let depth = 0;
    for (
      let run = this.index.get(runId);
      run?.parentRunId && depth < 100;
      run = this.index.get(run.parentRunId)
    ) {
      depth++;
    }
    return depth;
  }

  list(): RunSummary[] {
    return [...this.index.values(), ...this.claudeCode.list()].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
  }

  earlier(): RunSummary[] {
    return [...this.earlierRuns.values()].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
  }

  get(runId: string): RunSnapshot {
    if (this.claudeCode.has(runId)) return this.claudeCode.get(runId);
    const driver = this.drivers.get(runId);
    if (driver) {
      const { messages, status, error } = driver.chat;
      return {
        messages,
        status,
        error: error?.message,
        running: driver.summary.status === "running",
      };
    }
    const summary = this.index.get(runId) ?? this.earlierRuns.get(runId);
    if (!summary) return { messages: [], status: "ready", running: false };
    return {
      messages: readJson<UIMessage[]>(messagesFile(runId), []),
      status: summary.status === "failed" ? "error" : "ready",
      error: summary.error,
      running: false,
    };
  }

  open(viewer: WebContents, runId: string): RunSnapshot {
    if (!this.known.has(viewer)) {
      this.known.add(viewer);
      viewer.once("destroyed", () => {
        for (const viewers of this.viewers.values()) viewers.delete(viewer);
      });
    }
    const viewers = this.viewers.get(runId) ?? new Set();
    this.viewers.set(runId, viewers.add(viewer));
    return this.get(runId);
  }

  close(viewer: WebContents, runId: string) {
    this.viewers.get(runId)?.delete(viewer);
  }

  /** Whether `viewer` shows the run's chat. */
  viewing(runId: string, viewer: WebContents) {
    return this.viewers.get(runId)?.has(viewer) ?? false;
  }

  send(runId: string, message: OutgoingMessage, context: RunContext) {
    if (this.claudeCode.has(runId))
      return this.claudeCode.send(runId, message.text);
    // A chat started here runs in Claude Code when it orchestrates or no plugin does; agents stay on the plugin.
    const chat =
      !context.agentId && (context.trigger ?? "manual") === "manual";
    if (!this.index.has(runId) && chat && (getSetup().orchestrator || !orchestrator()))
      return this.claudeCode.start(runId, message.text);
    const driver = this.drivers.get(runId) ?? this.load(runId, context);
    driver.stopped = false;
    driver.notice = undefined;
    // Each turn starts from every tenant's current tools.
    const ready = routingMode() ? driver.router.refresh() : Promise.resolve();
    void ready.then(() => driver.chat.sendMessage(message));
  }

  async stop(runId: string) {
    if (this.claudeCode.has(runId)) return this.claudeCode.stop(runId);
    const driver = this.drivers.get(runId);
    if (!driver) return;
    driver.stopped = true;
    driver.abortToolCalls();
    await driver.chat.stop();
  }

  async respond(
    runId: string,
    approvalId: string,
    approved: boolean,
    answers?: Record<string, string>,
  ) {
    if (this.claudeCode.has(runId)) {
      approvalHub.respond(approvalId, approved, undefined, answers);
      return;
    }
    const driver = this.drivers.get(runId) ?? this.load(runId);
    driver.stopped = false;
    if (approvalId.startsWith(HELD))
      return driver.answerHeld(approvalId, approved);
    await driver.chat.addToolApprovalResponse({ id: approvalId, approved });
    // An approved write runs on its tenant, then the answers go back.
    if (approved && routingMode()) await driver.routeCalls();
  }

  async delete(runId: string, options?: { tasks: boolean; worktrees: string[] }) {
    if (this.claudeCode.has(runId)) {
      for (const id of await this.claudeCode.remove(runId, options))
        this.broadcast("runs:deleted", id);
      return;
    }
    await this.stop(runId);
    this.drivers.delete(runId);
    this.index.delete(runId);
    if (this.earlierRuns.delete(runId))
      writeJson(EARLIER, [...this.earlierRuns.values()]);
    removeFile(messagesFile(runId));
    removeFile(`deliveries/${runId}.json`);
    deleteArtifacts(runId);
    writeJson(INDEX, [...this.index.values()]);
    this.broadcast("runs:deleted", runId);
  }

  /** Stops every run for good: at sign-out, or when the app quits. Claude Code sessions don't need the orchestrator. */
  stopAll() {
    for (const driver of this.drivers.values()) {
      if (driver.summary.status !== "running") continue;
      driver.stopped = true;
      driver.abortToolCalls();
      void driver.chat.stop();
      driver.summary = { ...driver.summary, status: "stopped" };
      this.index.set(driver.summary.id, driver.summary);
      this.save(driver);
      this.broadcast("runs:changed", driver.summary);
    }
  }

  // A stored run gets a driver when it continues; a new one when it starts.
  private load(runId: string, context?: RunContext): RunDriver {
    if (this.earlierRuns.has(runId))
      throw new Error("This run is from before plugins and is read-only.");
    let summary = this.index.get(runId);
    const messages = summary
      ? readJson<UIMessage[]>(messagesFile(runId), [])
      : [];
    if (!summary) {
      if (!context) throw new Error(`No run ${runId}`);
      assertRunId(runId);
      const now = Date.now();
      summary = {
        id: runId,
        pluginId: orchestrator()?.id,
        focus: context.focus,
        agentId: context.agentId,
        trigger: context.trigger ?? "manual",
        parentRunId: context.parentRunId,
        title: "New session",
        status: "running",
        toolCalls: 0,
        createdAt: now,
        updatedAt: now,
      };
      this.index.set(runId, summary);
      writeJson(INDEX, [...this.index.values()]);
      this.broadcast("runs:changed", summary);
    }
    const { agentId, createdAt } = summary;
    const driver = new RunDriver(
      summary,
      messages,
      (d, patch) => this.flushed(d, patch),
      () =>
        [...this.index.values()]
          .filter((r) => r.agentId === agentId && r.createdAt < createdAt)
          .sort((a, b) => b.createdAt - a.createdAt),
    );
    this.drivers.set(runId, driver);
    return driver;
  }

  private flushed(driver: RunDriver, change: Omit<RunPatch, "running">) {
    const { messages, status, error } = driver.chat;
    const previous = driver.summary;
    driver.summary = {
      ...previous,
      title: chatTitle(messages),
      notice: driver.notice,
      status: runStatus(status, messages, driver.stopped),
      error: status === "error" ? error?.message : undefined,
      toolCalls: countToolCalls(messages),
      updatedAt: change.messages.length > 0 ? Date.now() : previous.updatedAt,
    };
    this.sendPatch({
      ...change,
      running: driver.summary.status === "running",
    });
    this.index.set(driver.summary.id, driver.summary);
    if (driver.summary.status !== "running") this.save(driver);
    if (listed(driver.summary) !== listed(previous)) {
      this.broadcast("runs:changed", driver.summary);
    }
    if (previous.status === "running" && driver.summary.status !== "running") {
      for (const listener of this.settledListeners) {
        listener(driver.summary, messages);
      }
    }
  }

  private sendPatch(patch: RunPatch) {
    for (const viewer of this.viewers.get(patch.runId) ?? []) {
      viewer.send("runs:patch", patch);
    }
  }

  private save(driver: RunDriver) {
    writeJson(messagesFile(driver.summary.id), driver.chat.messages);
    writeJson(INDEX, [...this.index.values()]);
  }
}
