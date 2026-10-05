import type { ClaudeCodeAgent } from "@/lib/desktop";
import {
  closeSync,
  fstatSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
} from "node:fs";
import path from "node:path";
import { toolOf } from "./transcript";

// The subagents a Claude Code session starts, read from its transcript and from
// each agent's own under <project>/<session>/subagents/agent-<id>.jsonl.

const AGENT_TOOLS = new Set(["Agent", "Task"]);
const ACTIVITY_LENGTH = 80;
const NOTIFIED: Record<string, ClaudeCodeAgent["status"]> = {
  completed: "completed",
  failed: "failed",
  killed: "stopped",
  stopped: "stopped",
};

type Block = {
  type: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  is_error?: boolean;
  text?: string;
};

interface Entry {
  type?: string;
  timestamp?: string;
  /** A queue-operation's message: a task notification is queued here first. */
  content?: string;
  attachment?: { prompt?: string | Block[] };
  toolUseResult?: { status?: string };
  message?: {
    content?: string | Block[];
    usage?: Record<string, unknown>;
  };
}

type Call = Omit<ClaudeCodeAgent, "toolUses" | "tokens" | "activity" | "depth">;

const tokensOf = (usage: Record<string, unknown>) =>
  ["input_tokens", "cache_creation_input_tokens", "cache_read_input_tokens", "output_tokens"]
    .map((key) => Number(usage[key]) || 0)
    .reduce((a, b) => a + b, 0);

function activityOf(block: Block): string {
  const { toolName } = toolOf(block.name ?? "");
  const input = block.input ?? {};
  const pick = ["description", "file_path", "notebook_path", "pattern", "url", "query", "command"]
    .map((key) => input[key])
    .find((value): value is string => typeof value === "string" && value.length > 0);
  const detail = pick && /^\//.test(pick) ? path.basename(pick) : pick;
  const line = detail ? `${toolName}: ${detail.split("\n")[0]}` : toolName;
  return line.length > ACTIVITY_LENGTH ? `${line.slice(0, ACTIVITY_LENGTH - 1)}…` : line;
}

/** One transcript's agent calls, and its own progress. */
class Ledger {
  calls = new Map<string, Call>();
  toolUses = 0;
  tokens = 0;
  activity?: string;

  feed(line: string) {
    let entry: Entry;
    try {
      entry = JSON.parse(line) as Entry;
    } catch {
      return;
    }
    const at = entry.timestamp ? Date.parse(entry.timestamp) : Date.now();
    const content = entry.message?.content;
    if (entry.type === "assistant" && Array.isArray(content)) {
      if (entry.message?.usage) this.tokens = tokensOf(entry.message.usage);
      for (const block of content) {
        if (block.type !== "tool_use" || !block.id) continue;
        this.toolUses++;
        this.activity = activityOf(block);
        if (!AGENT_TOOLS.has(block.name ?? "")) continue;
        const input = block.input ?? {};
        this.calls.set(block.id, {
          toolUseId: block.id,
          description: String(input.description ?? "Subagent"),
          agentType: typeof input.subagent_type === "string" ? input.subagent_type : undefined,
          background: input.run_in_background === true,
          status: "running",
          startedAt: at,
        });
      }
    }
    // Queued, taken mid-turn, or filed as a user message: the first one seen is when it finished.
    const note = [entry.content, entry.attachment?.prompt, entry.type === "user" ? content : undefined]
      .map((c) => (typeof c === "string" ? c : (c ?? []).map((b) => b.text ?? "").join("\n")))
      .find((text) => text.includes("<task-notification>"));
    if (note) {
      const id = note.match(/<tool-use-id>([^<]+)<\/tool-use-id>/)?.[1];
      const status = NOTIFIED[note.match(/<status>([^<]+)<\/status>/)?.[1] ?? ""];
      const call = id && this.calls.get(id);
      if (call && status && call.status === "running") Object.assign(call, { status, finishedAt: at });
      return;
    }
    if (entry.type !== "user" || !Array.isArray(content)) return;
    for (const block of content) {
      const call = block.type === "tool_result" && this.calls.get(block.tool_use_id ?? "");
      if (!call) continue;
      // A background agent's call returns at once; it finishes with a task notification.
      if (entry.toolUseResult?.status === "async_launched") call.background = true;
      else Object.assign(call, { status: block.is_error ? "failed" : "completed", finishedAt: at });
    }
  }
}

/** Reads a file's new whole lines on each call. */
class Tail {
  private offset = 0;
  private rest = Buffer.alloc(0);
  constructor(readonly file: string) {}

  lines(): string[] {
    let fd: number;
    try {
      fd = openSync(this.file, "r");
    } catch {
      return [];
    }
    try {
      const { size } = fstatSync(fd);
      if (size <= this.offset) return [];
      const chunk = Buffer.alloc(size - this.offset);
      readSync(fd, chunk, 0, chunk.length, this.offset);
      this.offset = size;
      const data = Buffer.concat([this.rest, chunk]);
      const end = data.lastIndexOf(0x0a);
      this.rest = end < 0 ? data : data.subarray(end + 1);
      return end < 0 ? [] : data.subarray(0, end).toString("utf8").split("\n").filter(Boolean);
    } finally {
      closeSync(fd);
    }
  }
}

/** A session's subagents: the main transcript is fed in; their own are tailed on `poll`. */
export class SessionAgents {
  private main = new Ledger();
  // toolUseId → the agent's own transcript, once its meta file names it.
  private agents = new Map<string, { tail: Tail; ledger: Ledger; drained: boolean }>();
  private metas = new Set<string>();

  reset() {
    this.main = new Ledger();
    this.agents.clear();
    this.metas.clear();
  }

  feed(line: string) {
    this.main.feed(line);
  }

  get running() {
    return this.all().some(([call]) => call.status === "running");
  }

  /** Reads what running agents of the session at `transcriptPath` wrote since the last poll. */
  poll(transcriptPath: string) {
    if (!transcriptPath || !this.running) return;
    const dir = path.join(transcriptPath.replace(/\.jsonl$/, ""), "subagents");
    let names: string[] = [];
    try {
      names = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      const id = name.match(/^agent-(.+)\.meta\.json$/)?.[1];
      if (!id || this.metas.has(name)) continue;
      try {
        const { toolUseId } = JSON.parse(readFileSync(path.join(dir, name), "utf8"));
        const tail = new Tail(path.join(dir, `agent-${id}.jsonl`));
        if (typeof toolUseId === "string")
          this.agents.set(toolUseId, { tail, ledger: new Ledger(), drained: false });
        this.metas.add(name);
      } catch {
        // Not written in full yet; the next poll reads it.
      }
    }
    // A finished agent is read once more, for its final counts.
    for (const [call] of this.batch()) {
      const agent = this.agents.get(call.toolUseId);
      if (!agent || agent.drained) continue;
      for (const line of agent.tail.lines()) agent.ledger.feed(line);
      agent.drained = call.status !== "running";
    }
  }

  /** What the composer shows: the running agents, and those finished since the earliest of them started. */
  list(): ClaudeCodeAgent[] {
    return this.batch().map(([call, depth]) => {
      const ledger = this.agents.get(call.toolUseId)?.ledger;
      return {
        ...call,
        depth,
        toolUses: ledger?.toolUses ?? 0,
        tokens: ledger?.tokens ?? 0,
        activity: call.status === "running" ? ledger?.activity : undefined,
      };
    });
  }

  private batch(): [Call, number][] {
    const all = this.all();
    const running = all.filter(([call]) => call.status === "running");
    if (running.length === 0) return [];
    const since = Math.min(...running.map(([call]) => call.startedAt));
    return all.filter(([call]) => call.status === "running" || (call.finishedAt ?? 0) >= since);
  }

  // Each call with its depth, a nested agent's right after the one that started it.
  private all(ledger = this.main, depth = 0): [Call, number][] {
    return [...ledger.calls.values()].flatMap((call): [Call, number][] => {
      const own = this.agents.get(call.toolUseId)?.ledger;
      return [[call, depth], ...(own ? this.all(own, depth + 1) : [])];
    });
  }
}
