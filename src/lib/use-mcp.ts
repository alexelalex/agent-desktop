import { useEffect, useState } from "react";
import type { McpApprovalRequest } from "./desktop";

/** The MCP server's port, and the approvals no session's chat can show. */
export function useMcp() {
  const [pendingApprovals, setPendingApprovals] = useState<
    McpApprovalRequest[]
  >([]);
  const [mcpPort, setMcpPort] = useState<number | undefined>(4040);
  const [autoApprove, setAutoApprove] = useState(false);

  useEffect(() => {
    if (!window.desktop?.mcp) return;

    window.desktop.mcp.getState().then((state) => {
      setPendingApprovals(state.pendingApprovals);
      setAutoApprove(state.autoApprove);
      if (state.port) setMcpPort(state.port);
    });

    const unPort = window.desktop.mcp.onPortChanged?.((port) =>
      setMcpPort(port),
    );
    const unAppReq = window.desktop.mcp.onApprovalRequested((req) => {
      setPendingApprovals((prev) => [
        ...prev.filter((r) => r.id !== req.id),
        req,
      ]);
    });
    const unAppRes = window.desktop.mcp.onApprovalResolved(({ id }) => {
      setPendingApprovals((prev) => prev.filter((r) => r.id !== id));
    });
    const unAuto = window.desktop.mcp.onAutoApproveChanged(setAutoApprove);

    return () => {
      unAuto?.();
      unPort?.();
      unAppReq?.();
      unAppRes?.();
    };
  }, []);

  const respondApproval = async (
    id: string,
    approved: boolean,
    reason?: string,
  ) => {
    if (!window.desktop?.mcp) return false;
    const ok = await window.desktop.mcp.respondApproval(id, approved, reason);
    setPendingApprovals((prev) => prev.filter((r) => r.id !== id));
    return ok;
  };

  const approveAll = async (id: string, reason?: string) => {
    if (!window.desktop?.mcp) return false;
    const ok = await window.desktop.mcp.approveAll(id, reason);
    setPendingApprovals((prev) => prev.filter((r) => r.id !== id));
    return ok;
  };

  return {
    pendingApprovals: pendingApprovals.filter((r) => !r.runId),
    mcpPort,
    respondApproval,
    approveAll,
    autoApprove,
    setAutoApprove: (on: boolean) => window.desktop.mcp.setAutoApprove(on),
  };
}
