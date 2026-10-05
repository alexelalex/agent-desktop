export interface ApprovalRequest {
  id: string;
  /** A sign-in prompt: signing the tenant in approves it, nothing else does. A question
   *  (AskUserQuestion) is given only with the user's answers; auto mode gives neither. */
  kind?: "sign-in" | "question";
  tenantId: string;
  action: string;
  description: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  payload?: Record<string, unknown>;
  /** The Claude Code tool call that asked, from the request's `_meta`. */
  toolUseId?: string;
  /** The session the caller is: only its transcript is searched for the call. */
  runId?: string;
  /** How long it waits; the hub's default otherwise. */
  timeoutMs?: number;
  createdAt: number;
}

export interface ApprovalResponse {
  approved: boolean;
  reason?: string;
  /** A question's answers, by question text. */
  answers?: Record<string, string>;
  /** Nobody answered in time. */
  timedOut?: boolean;
}
