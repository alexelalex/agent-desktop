import type { DesktopApi } from "@/lib/desktop";
import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

function on<T>(channel: string, listener: (payload: T) => void) {
  const handler = (_: IpcRendererEvent, payload: T) => listener(payload);
  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.off(channel, handler);
  };
}

const desktop: DesktopApi = {
  platform: process.platform,
  isFullScreen: () => ipcRenderer.invoke("app:isFullScreen"),
  onFullScreen: (listener) => on("app:fullscreen", listener),
  mcp: {
    getState: () => ipcRenderer.invoke("mcp:getState"),
    respondApproval: (id: string, approved: boolean, reason?: string) =>
      ipcRenderer.invoke("mcp:respondApproval", id, approved, reason),
    onApprovalRequested: (listener) => on("mcp:approval-requested", listener),
    onApprovalResolved: (listener) => on("mcp:approval-resolved", listener),
    onPortChanged: (listener) => on("mcp:port-updated", listener),
    setAutoApprove: (on) => ipcRenderer.invoke("mcp:setAutoApprove", on),
    onAutoApproveChanged: (listener) => on("mcp:auto-approve", listener),
  },
  claudeCode: {
    get: () => ipcRenderer.invoke("claudeCode:get"),
    save: (setup) => ipcRenderer.invoke("claudeCode:save", setup),
    setAutoApprove: (runId, on) =>
      ipcRenderer.invoke("claudeCode:setAutoApprove", runId, on),
    preflight: (runId, index) =>
      ipcRenderer.invoke("claudeCode:preflight", runId, index),
    retry: (runId, index, text, restoreFiles) =>
      ipcRenderer.invoke("claudeCode:retry", runId, index, text, restoreFiles),
    replaced: (runId, attempt) =>
      ipcRenderer.invoke("claudeCode:replaced", runId, attempt),
    agents: (runId) => ipcRenderer.invoke("claudeCode:agents", runId),
    onAgents: (listener) => on("claudeCode:agents", listener),
    onChange: (listener) => on("claudeCode:changed", listener),
    preview: (parentRunId, actions) =>
      ipcRenderer.invoke("claudeCode:preview", parentRunId, actions),
    launch: (parentRunId, requests) =>
      ipcRenderer.invoke("claudeCode:launch", parentRunId, requests),
    dig: (parentRunId, artifactId, actionId) =>
      ipcRenderer.invoke("claudeCode:dig", parentRunId, artifactId, actionId),
    decide: (parentRunId, suggestionId, status) =>
      ipcRenderer.invoke("claudeCode:decide", parentRunId, suggestionId, status),
    startNow: (runId) => ipcRenderer.invoke("claudeCode:startNow", runId),
    startAgain: (runId) => ipcRenderer.invoke("claudeCode:startAgain", runId),
    stopTasks: (runId) => ipcRenderer.invoke("claudeCode:stopTasks", runId),
    queue: () => ipcRenderer.invoke("claudeCode:queue"),
    onQueue: (listener) => on("claudeCode:queue", listener),
    resumeQueue: () => ipcRenderer.invoke("claudeCode:resumeQueue"),
    worktreeStates: (runIds) =>
      ipcRenderer.invoke("claudeCode:worktreeStates", runIds),
    fileDiff: (runId, path) =>
      ipcRenderer.invoke("claudeCode:fileDiff", runId, path),
    reveal: (path) => ipcRenderer.invoke("claudeCode:reveal", path),
  },
  plugins: {
    list: () => ipcRenderer.invoke("plugins:list"),
    add: (plugin) => ipcRenderer.invoke("plugins:add", plugin),
    signIn: (id, tokens) => ipcRenderer.invoke("plugins:signIn", id, tokens),
    signOut: (id) => ipcRenderer.invoke("plugins:signOut", id),
    rename: (id, label) => ipcRenderer.invoke("plugins:rename", id, label),
    remove: (id) => ipcRenderer.invoke("plugins:remove", id),
    setOrchestrator: (id) => ipcRenderer.invoke("plugins:setOrchestrator", id),
    setDefaultScope: (id, scope) =>
      ipcRenderer.invoke("plugins:setDefaultScope", id, scope),
    scopes: (id) => ipcRenderer.invoke("plugins:scopes", id),
    refresh: () => ipcRenderer.invoke("plugins:refresh"),
    fetch: (id, request) => ipcRenderer.invoke("plugins:fetch", id, request),
    onChange: (listener) => on("plugins:changed", listener),
  },
  groups: {
    list: () => ipcRenderer.invoke("groups:list"),
    save: (group) => ipcRenderer.invoke("groups:save", group),
    delete: (id) => ipcRenderer.invoke("groups:delete", id),
    onChange: (listener) => on("groups:changed", listener),
  },
  agents: {
    list: () => ipcRenderer.invoke("agents:list"),
    save: (agent) => ipcRenderer.invoke("agents:save", agent),
    delete: (id) => ipcRenderer.invoke("agents:delete", id),
    onChange: (listener) => on("agents:changed", listener),
  },
  artifacts: {
    list: (runId) => ipcRenderer.invoke("artifacts:list", runId),
  },
  channels: {
    list: () => ipcRenderer.invoke("channels:list"),
    add: (channel) => ipcRenderer.invoke("channels:add", channel),
    remove: (id) => ipcRenderer.invoke("channels:remove", id),
    onChange: (listener) => on("channels:changed", listener),
  },
  deliveries: {
    list: (runId) => ipcRenderer.invoke("deliveries:list", runId),
    send: (runId, artifactId, channelIds) =>
      ipcRenderer.invoke("deliveries:send", runId, artifactId, channelIds),
    onChange: (listener) => on("deliveries:changed", listener),
  },
  replies: {
    request: (runId, turnId) => ipcRenderer.invoke("replies:request", runId, turnId),
    outcome: (runId, turnId, text, picked) =>
      ipcRenderer.invoke("replies:outcome", runId, turnId, text, picked),
    onChange: (listener) => on("replies:changed", listener),
  },
  suggester: {
    get: () => ipcRenderer.invoke("suggester:get"),
    save: (setup) => ipcRenderer.invoke("suggester:save", setup),
    onChange: (listener) => on("suggester:changed", listener),
  },
  onOpenRun: (listener) => on("app:open-run", listener),
  runs: {
    list: () => ipcRenderer.invoke("runs:list"),
    earlier: () => ipcRenderer.invoke("runs:earlier"),
    get: (runId) => ipcRenderer.invoke("runs:get", runId),
    open: (runId) => ipcRenderer.invoke("runs:open", runId),
    close: (runId) => ipcRenderer.invoke("runs:close", runId),
    send: (runId, message, context) =>
      ipcRenderer.invoke("runs:send", runId, message, context),
    stop: (runId) => ipcRenderer.invoke("runs:stop", runId),
    respond: (runId, approvalId, approved, answers) =>
      ipcRenderer.invoke("runs:respond", runId, approvalId, approved, answers),
    delete: (runId, options) => ipcRenderer.invoke("runs:delete", runId, options),
    onPatch: (listener) => on("runs:patch", listener),
    onChange: (listener) => on("runs:changed", listener),
    onDelete: (listener) => on("runs:deleted", listener),
  },
};

contextBridge.exposeInMainWorld("desktop", desktop);
