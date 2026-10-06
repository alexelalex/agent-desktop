import { useState } from "react";
import {
  CheckIcon,
  KeyRoundIcon,
  LogInIcon,
  ShieldAlertIcon,
  XIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { McpApprovalRequest } from "@/lib/desktop";

export function RiskBadge({ level }: { level: McpApprovalRequest["riskLevel"] }) {
  switch (level) {
    case "critical":
      return (
        <Badge
          variant="destructive"
          className="font-semibold uppercase tracking-wider text-[10px]"
        >
          Critical Risk
        </Badge>
      );
    case "high":
      return (
        <Badge
          variant="destructive"
          className="font-semibold uppercase tracking-wider text-[10px]"
        >
          High Risk
        </Badge>
      );
    case "medium":
      return (
        <Badge
          variant="outline"
          className="border-amber-500 text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider text-[10px]"
        >
          Medium Risk
        </Badge>
      );
    case "low":
    default:
      return (
        <Badge
          variant="secondary"
          className="font-semibold uppercase tracking-wider text-[10px]"
        >
          Low Risk
        </Badge>
      );
  }
}

/** Waits for the tenant to be signed in; the button only opens Options there. */
function SignInPrompt({
  request,
  onRespond,
  onSignIn,
}: {
  request: McpApprovalRequest;
  onRespond: (id: string, approved: boolean, reason?: string) => void;
  onSignIn: (pluginId: string) => void;
}) {
  const cancel = () => onRespond(request.id, false);
  return (
    <Dialog open onOpenChange={(open) => !open && cancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <KeyRoundIcon className="size-5 text-amber-500" />
            <DialogTitle className="text-base">Sign-in Required</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {request.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" size="sm" onClick={cancel}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            autoFocus
            onClick={() => onSignIn(request.tenantId)}
          >
            <LogInIcon className="mr-1 size-3.5" />
            Sign in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function McpApprovalDialog({
  request,
  onRespond,
  onSignIn,
  onApproveAll,
}: {
  request?: McpApprovalRequest;
  onRespond: (id: string, approved: boolean, reason?: string) => void;
  onSignIn: (pluginId: string) => void;
  /** Approves this and every later request without asking; for a task's, that task's. */
  onApproveAll: (id: string, reason?: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!request) return null;
  if (request.kind === "sign-in") {
    return (
      <SignInPrompt
        request={request}
        onRespond={onRespond}
        onSignIn={onSignIn}
      />
    );
  }

  const handleAction = async (approved: boolean, all = false) => {
    setSubmitting(true);
    try {
      const why = reason.trim() || undefined;
      await (all ? onApproveAll(request.id, why) : onRespond(request.id, approved, why));
    } finally {
      setSubmitting(false);
      setReason("");
    }
  };

  return (
    <Dialog
      open={!!request}
      onOpenChange={(open) => !open && handleAction(false)}
    >
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 pr-6">
            <ShieldAlertIcon className="size-5 text-amber-500" />
            <DialogTitle className="text-base">Approval Required</DialogTitle>
            <div className="ml-auto">
              <RiskBadge level={request.riskLevel} />
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {request.tenantId ? (
              <>
                Claude Code CLI has requested permission to execute an action
                on tenant:{" "}
                <span className="font-mono font-medium text-foreground">
                  @{request.tenantId}
                </span>
              </>
            ) : (
              "Claude Code CLI has requested permission to execute an action."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-3 py-2 text-sm">
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Action
              </span>
              <Badge variant="outline" className="min-w-0 max-w-full font-mono text-[10px]">
                <span className="truncate">{request.action}</span>
              </Badge>
            </div>
            <p className="text-sm font-medium break-words">{request.description}</p>
          </div>

          {request.payload && Object.keys(request.payload).length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Payload Parameters
              </span>
              <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-muted/50 p-2 font-mono text-[11px] leading-tight border">
                {JSON.stringify(request.payload, null, 2)}
              </pre>
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="approval-reason"
              className="text-xs text-muted-foreground"
            >
              Optional feedback or denial reason:
            </label>
            <input
              id="approval-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Approved for staging only / denied due to maintenance window"
              className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => handleAction(false)}
            className="text-destructive hover:bg-destructive/10"
          >
            <XIcon className="mr-1 size-3.5" />
            Deny Action
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => handleAction(true, true)}
            title="Approve this and every later request without asking"
          >
            Approve all
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={submitting}
            onClick={() => handleAction(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckIcon className="mr-1 size-3.5" />
            Approve & Execute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
