import type { Tokens } from "@/lib/auth";
import type { ChannelInput } from "@/lib/channels";
import type {
  ClaudeCodeSetup,
  Group,
  InstanceRequest,
  LaunchRequest,
  NewPlugin,
  OpenRun,
  OutgoingMessage,
  RunContext,
} from "@/lib/desktop";
import type { Template } from "@/lib/templates";
import { app, BrowserWindow, ipcMain, shell, type Tray } from "electron";
import path from "node:path";
import {
  deleteAgent,
  listAgents,
  removeChannelFromAgents,
  saveAgent,
} from "./agents";
import { listArtifacts } from "./artifacts";
import { addChannel, listChannels, removeChannel } from "./channels";
import { DeliveryManager } from "./delivery";
import { freshStart } from "./fresh-start";
import {
  addPlugin,
  onPluginInfosChange,
  pluginFetch,
  pluginInfos,
  refreshStatuses,
  removePlugin,
  renamePlugin,
  scopesOf,
  setDefaultScope,
  setOrchestrator,
  signInPlugin,
  signOutPlugin,
  watchPlugins,
} from "./plugins";
import { deleteGroup, listGroups, saveGroup } from "./plugins/groups";
import { kindOf } from "./plugins/kinds";
import { orchestrator } from "./plugins/store";
import { migrateSession } from "./plugins/streamsec/migrate";
import { RunManager } from "./runs";
import { TaskAlerts } from "./notifier";
import { createTray } from "./tray";
import { TriggerManager } from "./triggers";
import { approvalHub, AUTO_APPROVED } from "./mcp/approval-hub";
import { claudeCodeInfo, saveSetup } from "./mcp/claude-cli";
import { mcpServer } from "./mcp/server";

// Set by scripts/electron.mjs in development; the built app loads dist/.
const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const DIAGRAM_CHECK_MS = 5000;

function openExternal(url: string) {
  if (/^https?:/.test(url)) void shell.openExternal(url);
}

function broadcast(channel: string, payload: unknown) {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channel, payload);
  }
}

function createWindow(): BrowserWindow {
  const isMac = process.platform === "darwin";
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 480,
    minHeight: 480,
    title: "Agent Desktop",
    ...(isMac
      ? {
          titleBarStyle: "hidden",
          trafficLightPosition: { x: 16, y: 14 },
        }
      : {}),
    webPreferences: {
      preload: path.join(import.meta.dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
    },
  });
  // Links in answers open in the browser, never inside the app window.
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    event.preventDefault();
    openExternal(url);
  });
  window.on("enter-full-screen", () => {
    window.webContents.send("app:fullscreen", true);
  });
  window.on("leave-full-screen", () => {
    window.webContents.send("app:fullscreen", false);
  });
  window.webContents.on("console-message", (_, level, message) => {
    if (level >= 2) {
      console.error("[Renderer Error]", message);
    } else if (level === 1) {
      console.warn("[Renderer Warn]", message);
    }
  });
  if (devServerUrl) void window.loadURL(devServerUrl);
  else
    void window.loadFile(path.join(import.meta.dirname, "../dist/index.html"));
  return window;
}

function showWindow(): BrowserWindow {
  const window = BrowserWindow.getAllWindows()[0];
  if (!window) return createWindow();
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
  return window;
}

function openRun(target: OpenRun) {
  const window = showWindow();
  const send = () => window.webContents.send("app:open-run", target);
  if (window.webContents.isLoading())
    window.webContents.once("did-finish-load", send);
  else send();
}

function registerIpc(
  runs: RunManager,
  triggers: TriggerManager,
  deliveries: DeliveryManager,
) {
  ipcMain.handle("app:isFullScreen", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win?.isFullScreen() ?? false;
  });
  ipcMain.handle("plugins:list", () => pluginInfos());
  ipcMain.handle("plugins:add", (_, plugin: NewPlugin) => addPlugin(plugin));
  ipcMain.handle("plugins:signIn", (_, id: string, tokens: Tokens) =>
    signInPlugin(id, tokens),
  );
  ipcMain.handle("plugins:signOut", (_, id: string) => signOutPlugin(id));
  ipcMain.handle("plugins:rename", (_, id: string, label: string) =>
    renamePlugin(id, label),
  );
  ipcMain.handle("plugins:remove", (_, id: string) => removePlugin(id));
  ipcMain.handle("plugins:setOrchestrator", (_, id: string) =>
    setOrchestrator(id),
  );
  ipcMain.handle("plugins:setDefaultScope", (_, id: string, scope: string) =>
    setDefaultScope(id, scope),
  );
  ipcMain.handle("plugins:scopes", (_, id: string) => scopesOf(id));
  ipcMain.handle("plugins:refresh", () => refreshStatuses());
  ipcMain.handle("plugins:fetch", (_, id: string, request: InstanceRequest) =>
    pluginFetch(id, request),
  );

  ipcMain.handle("groups:list", () => listGroups());
  ipcMain.handle("groups:save", (_, group: Group) => {
    saveGroup(group);
    broadcast("groups:changed", listGroups());
  });
  ipcMain.handle("groups:delete", (_, id: string) => {
    deleteGroup(id);
    broadcast("groups:changed", listGroups());
  });

  ipcMain.handle("agents:list", () => listAgents());
  ipcMain.handle("agents:save", (_, agent: Template) => {
    saveAgent(agent);
    triggers.sync();
    broadcast("agents:changed", null);
  });
  ipcMain.handle("agents:delete", (_, id: string) => {
    deleteAgent(id);
    triggers.sync();
    broadcast("agents:changed", null);
  });

  ipcMain.handle("artifacts:list", (_, runId: string) => listArtifacts(runId));
  ipcMain.handle("channels:list", () => listChannels());
  ipcMain.handle("channels:add", (_, channel: ChannelInput) => {
    const info = addChannel(channel);
    broadcast("channels:changed", null);
    return info;
  });
  ipcMain.handle("channels:remove", (_, id: string) => {
    removeChannel(id);
    if (removeChannelFromAgents(id)) broadcast("agents:changed", null);
    broadcast("channels:changed", null);
  });
  ipcMain.handle("deliveries:list", (_, runId: string) =>
    deliveries.list(runId),
  );
  ipcMain.handle(
    "deliveries:send",
    (_, runId: string, artifactId: string, channelIds: string[]) =>
      deliveries.send(runId, artifactId, channelIds, true),
  );
  ipcMain.handle("runs:list", () => runs.list());
  ipcMain.handle("runs:earlier", () => runs.earlier());
  ipcMain.handle("runs:get", (_, runId: string) => runs.get(runId));
  ipcMain.handle("runs:open", (event, runId: string) =>
    runs.open(event.sender, runId),
  );
  ipcMain.handle("runs:close", (event, runId: string) =>
    runs.close(event.sender, runId),
  );
  ipcMain.handle(
    "runs:send",
    (_, runId: string, message: OutgoingMessage, context: RunContext) =>
      runs.send(runId, message, context),
  );
  ipcMain.handle("runs:stop", (_, runId: string) => runs.stop(runId));
  ipcMain.handle(
    "runs:respond",
    (
      _,
      runId: string,
      approvalId: string,
      approved: boolean,
      answers?: Record<string, string>,
    ) => runs.respond(runId, approvalId, approved, answers),
  );
  ipcMain.handle(
    "runs:delete",
    (_, runId: string, options?: { tasks: boolean; worktrees: string[] }) =>
      runs.delete(runId, options),
  );

  ipcMain.handle("claudeCode:get", () => claudeCodeInfo());
  ipcMain.handle(
    "claudeCode:save",
    async (_, setup: Partial<ClaudeCodeSetup>) => {
      saveSetup(setup);
      const info = await claudeCodeInfo();
      broadcast("claudeCode:changed", info);
      return info;
    },
  );

  // MCP integration handlers
  ipcMain.handle("mcp:getState", () => ({
    autoApprove,
    pendingApprovals: approvalHub.listPending().map((req) => ({
      ...req,
      runId: runs.claudeCode.runOfApproval(req.id),
    })),
    port:
      mcpServer.getPort() ?? Number(process.env.AGENT_DESKTOP_MCP_PORT) ?? 4040,
  }));
  ipcMain.handle("mcp:setAutoApprove", (_, on: boolean) => {
    autoApprove = on;
    if (on) {
      // A task's approvals are never given by the global auto mode.
      for (const req of approvalHub.listPending())
        if (
          !runs.claudeCode.runOfApproval(req.id) &&
          !req.kind &&
          !runs.claudeCode.isTask(req.runId)
        )
          approvalHub.respond(req.id, true, AUTO_APPROVED);
    }
    broadcast("mcp:auto-approve", on);
  });
  ipcMain.handle(
    "claudeCode:setAutoApprove",
    (_, runId: string, on: boolean) => runs.claudeCode.setAutoApprove(runId, on),
  );
  ipcMain.handle("claudeCode:preflight", (_, runId: string, index: number) =>
    runs.claudeCode.preflight(runId, index),
  );
  ipcMain.handle(
    "claudeCode:retry",
    (_, runId: string, index: number, text: string, restoreFiles: boolean) =>
      runs.claudeCode.retry(runId, index, text, restoreFiles),
  );
  ipcMain.handle("claudeCode:replaced", (_, runId: string, attempt: number) =>
    runs.claudeCode.replaced(runId, attempt),
  );
  ipcMain.handle("claudeCode:agents", (_, runId: string) =>
    runs.claudeCode.agents(runId),
  );
  ipcMain.handle(
    "claudeCode:preview",
    (_, parentRunId: string, actions: { artifactId: string; actionId: string }[]) =>
      runs.claudeCode.preview(parentRunId, actions),
  );
  ipcMain.handle(
    "claudeCode:launch",
    (_, parentRunId: string, requests: LaunchRequest[]) =>
      runs.claudeCode.launch(parentRunId, requests),
  );
  ipcMain.handle(
    "claudeCode:dig",
    (_, parentRunId: string, artifactId: string, actionId: string) =>
      runs.claudeCode.dig(parentRunId, artifactId, actionId),
  );
  ipcMain.handle(
    "claudeCode:decide",
    (_, parentRunId: string, suggestionId: string, status: "accepted" | "dismissed" | "pending") =>
      runs.claudeCode.decide(parentRunId, suggestionId, status),
  );
  ipcMain.handle("claudeCode:startNow", (_, runId: string) =>
    runs.claudeCode.startNow(runId),
  );
  ipcMain.handle("claudeCode:startAgain", (_, runId: string) =>
    runs.claudeCode.startAgain(runId),
  );
  ipcMain.handle("claudeCode:stopTasks", (_, runId: string) =>
    runs.claudeCode.stopTasks(runId),
  );
  ipcMain.handle("claudeCode:queue", () => runs.claudeCode.queue());
  ipcMain.handle("claudeCode:resumeQueue", () => runs.claudeCode.resumeQueue());
  ipcMain.handle("claudeCode:worktreeStates", (_, runIds: string[]) =>
    runs.claudeCode.worktreeStates(runIds),
  );
  ipcMain.handle("claudeCode:fileDiff", (_, runId: string, file: string) =>
    runs.claudeCode.fileDiff(runId, file),
  );
  ipcMain.handle("claudeCode:reveal", (_, file: string) =>
    shell.showItemInFolder(file),
  );
  ipcMain.handle(
    "mcp:respondApproval",
    (_, id: string, approved: boolean, reason?: string) =>
      approvalHub.respond(id, approved, reason),
  );
}

// One instance per data folder, so each trigger fires once.
if (!app.requestSingleInstanceLock()) app.quit();
app.on("second-instance", () => showWindow());

// Auto mode for approvals no session claims; off at each launch.
let autoApprove = false;

// Held here: a collected tray icon disappears.
let tray: Tray | undefined;

void app.whenReady().then(async () => {
  freshStart();
  migrateSession();
  const runs = new RunManager(broadcast);
  const triggers = new TriggerManager(runs, (run) => openRun({ run }));
  const deliveries = new DeliveryManager(runs, openRun, broadcast);
  registerIpc(runs, triggers, deliveries);

  // Claude Code sessions attach through the plugin's hooks and show as runs.
  mcpServer.onHook((input, fromApp, pid) =>
    runs.claudeCode.hook(input, fromApp, pid),
  );
  mcpServer.onPermissionRequest(
    (pid, req) => void runs.claudeCode.relayPermission(pid, req),
  );
  mcpServer.onAllDetached(() => runs.claudeCode.detachAll());
  mcpServer.onSessionLookup((caller) => runs.claudeCode.messagesOf(caller));
  mcpServer.onSessionInfo(
    (caller) => runs.claudeCode.infoOf(caller),
    (runId) => runs.claudeCode.isTask(runId),
    (runId) => runs.claudeCode.isDig(runId),
  );
  mcpServer.onTasks({
    parentOf: (caller, conversation) => runs.claudeCode.parentOf(caller, conversation),
    tasksOf: (caller, id) => runs.claudeCode.tasksOf(caller, id),
    suggest: (caller, changes) => runs.claudeCode.suggest(caller, changes),
  });
  const alerts = new TaskAlerts({
    title: (runId) => runs.list().find((r) => r.id === runId)?.title,
    status: (runId) => runs.list().find((r) => r.id === runId)?.status,
    viewing: (runIds) => {
      const focused = BrowserWindow.getFocusedWindow()?.webContents;
      return !!focused && runIds.every((id) => runs.viewing(id, focused));
    },
    open: (runId) => {
      const run = runs.list().find((r) => r.id === runId);
      if (run) openRun({ run });
    },
  });
  runs.claudeCode.onAttention((event) => alerts.add(event));
  mcpServer.onRestoreFiles((caller) => runs.claudeCode.restoreFiles(caller));
  // Mermaid ships in the renderer's bundle only; without a window, renders go unchecked.
  mcpServer.onDiagramCheck(async (sources) => {
    const window = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
    if (!window) return [];
    const check = window.webContents
      .executeJavaScript(`window.checkMermaid?.(${JSON.stringify(sources)})`)
      .catch(() => undefined);
    const late = new Promise<undefined>((resolve) =>
      setTimeout(() => resolve(undefined), DIAGRAM_CHECK_MS),
    );
    return ((await Promise.race([check, late])) as (string | null)[] | undefined) ?? [];
  });
  // An approval asked from a session shows in its chat; any other in a dialog,
  // unless auto mode already gave it.
  approvalHub.onRequested(
    (req) =>
      void runs.claudeCode.claim(req).then((runId) => {
        // Auto mode gives approvals, never a sign-in, a question's answers or a task's.
        if (!runId && autoApprove && !req.kind && !runs.claudeCode.isTask(req.runId))
          approvalHub.respond(req.id, true, AUTO_APPROVED);
        if (approvalHub.isPending(req.id))
          broadcast("mcp:approval-requested", { ...req, runId });
      }),
  );
  approvalHub.onResolved((id, res) =>
    broadcast("mcp:approval-resolved", { id, ...res }),
  );

  // Start embedded MCP server
  const mcpPort = Number(process.env.AGENT_DESKTOP_MCP_PORT) || 4040;
  try {
    await mcpServer.start(mcpPort);
    broadcast("mcp:port-updated", mcpServer.getPort() ?? mcpPort);
  } catch (err) {
    console.error("[MCP Server] Failed to start:", err);
  }

  onPluginInfosChange((plugins) => {
    // Runs stop for good when the orchestrator can no longer answer them.
    const current = orchestrator();
    if (!current || !kindOf(current).signedIn(current)) runs.stopAll();
    triggers.sync();
    broadcast("plugins:changed", plugins);
    // @all follows the plugins.
    broadcast("groups:changed", listGroups());
  });
  watchPlugins();
  triggers.sync();
  app.on("before-quit", () => {
    triggers.stop();
    runs.stopAll();
    runs.claudeCode.stopAll();
    mcpServer.stop();
    tray?.destroy();
  });

  tray = createTray({ open: showWindow, quit: () => app.quit() });
  createWindow();
  app.on("activate", () => showWindow());
});

// Closing the last window leaves the app in the tray, where triggers keep firing.
app.on("window-all-closed", () => {});
