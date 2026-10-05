import type { RunStatus } from "@/lib/desktop";
import { Notification } from "electron";
import type { Attention } from "./mcp/sessions";

// Held until closed: a collected notification loses its click handler.
const shown = new Set<Notification>();

/** A desktop notification; `onClick` runs when the user clicks it. */
export function notify(title: string, body: string, onClick?: () => void) {
  const notification = new Notification({ title, body });
  shown.add(notification);
  notification.on("close", () => shown.delete(notification));
  notification.on("click", () => {
    shown.delete(notification);
    onClick?.();
  });
  notification.show();
}

// Tests shorten the window; 0 combines only what arrives together.
const WINDOW_MS =
  process.env.AGENT_DESKTOP_NOTIFY_MS !== undefined
    ? Number(process.env.AGENT_DESKTOP_NOTIFY_MS)
    : 30_000;

const counted = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Tasks that need the user, at most one notification at a time per top-level session:
 * the first event at once, later ones combined at the end of the window.
 */
export class TaskAlerts {
  private windows = new Map<string, { events: (Attention & { at: number })[]; timer: NodeJS.Timeout }>();

  constructor(
    private readonly deps: {
      title: (runId: string) => string | undefined;
      status: (runId: string) => RunStatus | undefined;
      /** Every one of these runs is open in the focused window. */
      viewing: (runIds: string[]) => boolean;
      open: (runId: string) => void;
    },
  ) {}

  add(event: Attention) {
    const stamped = { ...event, at: Date.now() };
    const open = this.windows.get(event.rootId);
    if (open) {
      open.events.push(stamped);
      return;
    }
    this.show(event.rootId, [stamped]);
    this.start(event.rootId);
  }

  private start(rootId: string) {
    this.windows.set(rootId, {
      events: [],
      timer: setTimeout(() => this.flush(rootId), WINDOW_MS),
    });
  }

  private flush(rootId: string) {
    const window = this.windows.get(rootId);
    this.windows.delete(rootId);
    if (!window || window.events.length === 0) return;
    if (this.show(rootId, window.events)) this.start(rootId);
  }

  // Only what still holds: an answered approval or a retried failure isn't news.
  private show(rootId: string, events: (Attention & { at: number })[]): boolean {
    const current = events.filter((e) => {
      const status = this.deps.status(e.taskId);
      return e.kind === "failed" ? status === "failed" : status === "awaiting_approval";
    });
    const tasks = (kind: Attention["kind"]) => [
      ...new Set(current.filter((e) => e.kind === kind).map((e) => e.taskId)),
    ];
    const approvals = tasks("approval");
    const questions = tasks("question").filter((id) => !approvals.includes(id));
    const failed = tasks("failed");
    const named = [...approvals, ...questions, ...failed];
    if (named.length === 0 || this.deps.viewing(named)) return false;
    const counts = [
      approvals.length > 0 && `${counted(approvals.length, "task needs", "tasks need")} approval`,
      questions.length > 0 && `${counted(questions.length, "task has", "tasks have")} a question`,
      failed.length > 0 && counted(failed.length, "task failed", "tasks failed"),
    ].filter(Boolean);
    const waiting = current.filter((e) => e.kind !== "failed").sort((a, b) => a.at - b.at);
    const target = waiting[0]?.taskId ?? current.filter((e) => e.kind === "failed").at(-1)?.taskId;
    notify(
      `${this.deps.title(rootId) ?? "Claude Code"}: ${counts.join(" · ")}`,
      "Click to open it.",
      target ? () => this.deps.open(target) : undefined,
    );
    return true;
  }
}
