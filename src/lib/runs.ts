import { isToolUIPart, type ChatStatus, type UIMessage } from "ai";
import type { RunStatus } from "./desktop";

export function chatTitle(messages: UIMessage[]): string {
  const first = messages
    .find((m) => m.role === "user")
    ?.parts.find((p) => p.type === "text");
  const text = first?.type === "text" ? first.text.trim() : "";
  return text.length > 60 ? `${text.slice(0, 57)}…` : text || "New session";
}

export function pendingApprovals(messages: UIMessage[]): string[] {
  const last = messages.at(-1);
  if (last?.role !== "assistant") return [];
  return last.parts.flatMap((p) =>
    isToolUIPart(p) && p.state === "approval-requested" ? [p.approval.id] : [],
  );
}

export function runStatus(
  status: ChatStatus,
  messages: UIMessage[],
  stopped: boolean,
): RunStatus {
  if (status === "submitted" || status === "streaming") return "running";
  if (status === "error") return "failed";
  if (pendingApprovals(messages).length > 0) return "awaiting_approval";
  if (stopped) return "stopped";
  // A client tool is running between two requests.
  const last = messages.at(-1);
  const calling =
    last?.role === "assistant" &&
    last.parts.some(
      (p) =>
        isToolUIPart(p) &&
        (p.state === "input-streaming" ||
          p.state === "input-available" ||
          (p.state === "output-available" && p.preliminary === true)),
    );
  return calling ? "running" : "completed";
}

export function countToolCalls(messages: UIMessage[]): number {
  return messages.reduce(
    (count, m) => count + m.parts.filter(isToolUIPart).length,
    0,
  );
}
