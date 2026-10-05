import { randomUUID } from "node:crypto";
import type { ApprovalRequest, ApprovalResponse } from "./types";

interface PendingApproval {
  request: ApprovalRequest;
  resolve: (res: ApprovalResponse) => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
}

const duration = (ms: number) =>
  ms >= 60_000
    ? `${Math.round(ms / 60_000)} minute${Math.round(ms / 60_000) === 1 ? "" : "s"}`
    : `${Math.round(ms / 1000)} seconds`;

/** The reason an approval given in auto mode carries back to Claude Code. */
export const AUTO_APPROVED = "Approved automatically (auto mode).";

export class ApprovalHub {
  private pending = new Map<string, PendingApproval>();
  private onRequestedListeners: ((req: ApprovalRequest) => void)[] = [];
  private onResolvedListeners: ((
    id: string,
    response: ApprovalResponse,
  ) => void)[] = [];

  constructor(private readonly timeoutMs: number = 300_000) {} // 5 minutes default

  onRequested(cb: (req: ApprovalRequest) => void) {
    this.onRequestedListeners.push(cb);
  }

  onResolved(cb: (id: string, response: ApprovalResponse) => void) {
    this.onResolvedListeners.push(cb);
  }

  requestApproval(
    data: Omit<ApprovalRequest, "id" | "createdAt">,
  ): Promise<ApprovalResponse> {
    const id = randomUUID();
    const request: ApprovalRequest = {
      ...data,
      id,
      createdAt: Date.now(),
    };

    const wait = data.timeoutMs ?? this.timeoutMs;
    return new Promise<ApprovalResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        const timeoutRes: ApprovalResponse = {
          approved: false,
          reason: `Approval timed out after ${duration(wait)} without operator response.`,
          timedOut: true,
        };
        resolve(timeoutRes);
        for (const cb of this.onResolvedListeners) cb(id, timeoutRes);
      }, wait);

      this.pending.set(id, { request, resolve, reject, timer });

      for (const cb of this.onRequestedListeners) {
        cb(request);
      }
    });
  }

  respond(
    id: string,
    approved: boolean,
    reason?: string,
    answers?: Record<string, string>,
  ): boolean {
    const entry = this.pending.get(id);
    if (!entry) return false;

    clearTimeout(entry.timer);
    this.pending.delete(id);

    const response: ApprovalResponse = { approved, reason, answers };
    entry.resolve(response);

    for (const cb of this.onResolvedListeners) {
      cb(id, response);
    }
    return true;
  }

  isPending(id: string): boolean {
    return this.pending.has(id);
  }

  listPending(): ApprovalRequest[] {
    return Array.from(this.pending.values()).map((p) => p.request);
  }
}

export const approvalHub = new ApprovalHub();
