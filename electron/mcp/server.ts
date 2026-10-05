import http from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  type CallToolRequest,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { UIMessage } from "ai";
import { getPlugin } from "../plugins/store";
import { approvalHub } from "./approval-hub";
import { DRIVER_HEADER, RUN_HEADER, TASK_APPROVAL_MS } from "./claude-cli";
import { MCP_RESOURCES, readResource } from "./resources";
import type { HookInput, SessionInfo } from "./sessions";
import { toolOf } from "./transcript";
import {
  handleTenantToolCall,
  listTenantTools,
  loadPluginOperations,
} from "./tenant-bridge";
import { DIG_READ_ONLY } from "./dig";
import { UI_TOOL_DEFINITIONS, handleUiToolCall } from "./ui-tools";

const INSTRUCTIONS = `Agent Desktop shows this session in its window. For multi-step work, set a plan with ui_set_plan and keep it current with ui_update_step; report progress with ui_post_activity and findings with ui_render_artifact. Call ui_request_approval before any tenant tool marked MUTATING. Offer work the user may want run on its own as \`actions\` on an artifact; the user launches each as a task, and ui_list_tasks reports on them. Never call ui_permission: Claude Code calls it. A <channel> message from this server is the user writing from Agent Desktop: answer it as you would a prompt typed here, since the app shows this transcript.`;
const TASK_INSTRUCTIONS = "In this task, the app asks the user before any tenant tool marked MUTATING; don't call ui_request_approval for it.";
const DENIED = "The user denied this tenant change in Agent Desktop.";
/** The Claude Code process behind a connection or hook, set by the plugin. */
export const PID_HEADER = "x-claude-pid";
export const CHANNEL = "notifications/claude/channel";
const PERMISSION = "notifications/claude/channel/permission";
const PERMISSION_REQUEST = "notifications/claude/channel/permission_request";
const HEARTBEAT_MS = 30_000;

/** A permission prompt a terminal session relays over its channel. */
export interface PermissionRequest {
  request_id: string;
  tool_name: string;
  description?: string;
  input_preview?: unknown;
}

const pidOf = (req: http.IncomingMessage) =>
  Number(req.headers[PID_HEADER]) || undefined;
const runOf = (req: http.IncomingMessage) => {
  const runId = req.headers[RUN_HEADER];
  return typeof runId === "string" && runId ? runId : undefined;
};

/** Who a connection is: a terminal's Claude Code process, or a turn the app runs. */
export interface Caller {
  pid?: number;
  runId?: string;
}

export class DesktopMcpServer {
  private httpServer?: http.Server;
  private connections = new Map<
    string,
    { transport: SSEServerTransport; server: Server; pid?: number }
  >();
  private activePort?: number;
  private hookListeners: ((
    input: HookInput,
    fromApp: boolean,
    pid?: number,
  ) => void)[] = [];
  private detachListeners: (() => void)[] = [];
  private permissionListeners: ((pid: number, req: PermissionRequest) => void)[] =
    [];
  private lookup?: (caller: Caller) => UIMessage[] | undefined;
  private info?: (caller: Caller) => SessionInfo | undefined;
  private isTask?: (runId: string) => boolean;
  private isDig?: (runId: string) => boolean;
  private tasks?: {
    parentOf: (caller: Caller, conversation: boolean) => string;
    tasksOf: (caller: Caller, id?: string) => string;
    suggest: (caller: Caller, changes: unknown) => string;
  };
  private restorer?: (caller: Caller) => Promise<string>;
  private diagrams?: (sources: string[]) => Promise<(string | null)[]>;

  /** Parses mermaid for ui_render_artifact; only a window can. */
  onDiagramCheck(cb: (sources: string[]) => Promise<(string | null)[]>) {
    this.diagrams = cb;
  }

  /** The transcript of the session behind a connection, for the tools and resources that read it. */
  onSessionLookup(cb: (caller: Caller) => UIMessage[] | undefined) {
    this.lookup = cb;
  }

  /** Where the session behind a connection runs, and whether it's a task. */
  onSessionInfo(
    cb: (caller: Caller) => SessionInfo | undefined,
    isTask: (runId: string) => boolean,
    isDig: (runId: string) => boolean,
  ) {
    this.info = cb;
    this.isTask = isTask;
    this.isDig = isDig;
  }

  /** The parent and tasks of the session behind a connection, for ui_read_parent and ui_list_tasks. */
  onTasks(reader: NonNullable<DesktopMcpServer["tasks"]>) {
    this.tasks = reader;
  }

  /** Rewinds files for the session behind a connection, after a retry. */
  onRestoreFiles(cb: (caller: Caller) => Promise<string>) {
    this.restorer = cb;
  }

  /** Claude Code's hooks, from the plugin or from a turn the app runs. */
  onHook(cb: (input: HookInput, fromApp: boolean, pid?: number) => void) {
    this.hookListeners.push(cb);
  }

  /** A terminal session asks the app to answer a permission prompt too. */
  onPermissionRequest(cb: (pid: number, req: PermissionRequest) => void) {
    this.permissionListeners.push(cb);
  }

  /** Whether the process has a connection a channel message can go down. */
  connected(pid: number) {
    return [...this.connections.values()].some((c) => c.pid === pid);
  }

  /** Sends a notification to every connection of one Claude Code process. */
  async notify(pid: number, method: string, params: Record<string, unknown>) {
    const targets = [...this.connections.values()].filter((c) => c.pid === pid);
    await Promise.all(targets.map((c) => c.server.notification({ method, params })));
    return targets.length > 0;
  }

  answerPermission(pid: number, requestId: string, allow: boolean) {
    return this.notify(pid, PERMISSION, {
      request_id: requestId,
      behavior: allow ? "allow" : "deny",
    });
  }

  /** The last connected client went away. */
  onAllDetached(cb: () => void) {
    this.detachListeners.push(cb);
  }

  // One per connection: a Server answers on the transport it last connected.
  private createServer(caller: Caller): Server {
    const server = new Server(
      {
        name: "agent-desktop",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          // Lets a session started with channels take messages and relay permission prompts.
          experimental: {
            "claude/channel": {},
            "claude/channel/permission": {},
          },
        },
        instructions: this.info?.(caller)?.task
          ? `${INSTRUCTIONS} ${TASK_INSTRUCTIONS}`
          : INSTRUCTIONS,
      },
    );
    this.registerHandlers(server, caller);
    server.fallbackNotificationHandler = async ({ method, params }) => {
      const { pid } = caller;
      if (method !== PERMISSION_REQUEST || !pid || !params) return;
      for (const cb of this.permissionListeners)
        cb(pid, params as unknown as PermissionRequest);
    };
    return server;
  }

  private async callTool({ params }: CallToolRequest, caller: Caller) {
    const { name, arguments: args, _meta } = params;
    const meta = _meta?.["claudecode/toolUseId"];
    const toolUseId = typeof meta === "string" ? meta : undefined;
    if (name.startsWith("ui_")) {
      const tasks = this.tasks;
      return await handleUiToolCall(name, args ?? {}, {
        toolUseId,
        messages: () => this.lookup?.(caller),
        info: () => this.info?.(caller),
        restoreFiles: this.restorer && (() => this.restorer!(caller)),
        checkDiagrams: this.diagrams,
        tasks: tasks && {
          parentOf: (conversation) => tasks.parentOf(caller, conversation),
          tasksOf: (id) => tasks.tasksOf(caller, id),
          suggest: (changes) => tasks.suggest(caller, changes),
        },
      });
    }
    if (name.startsWith("tenant__")) {
      const denied = await this.gate(name, args ?? {}, caller, toolUseId);
      if (denied) return denied;
      return await handleTenantToolCall(name, args ?? {});
    }
    return {
      isError: true,
      content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
    };
  }

  // In a task, the server itself asks before a MUTATING call: allow rules can skip ui_permission.
  private async gate(
    name: string,
    args: Record<string, unknown>,
    caller: Caller,
    toolUseId: string | undefined,
  ) {
    const info = this.info?.(caller);
    // A `claude` started inside a task isn't the task, but inherits its run header: it asks too.
    const task = info?.task
      ? info.runId
      : caller.runId && this.isTask?.(caller.runId)
        ? caller.runId
        : undefined;
    if (!task) return undefined;
    const { toolName, tenant } = toolOf(`mcp__desktop__${name}`);
    const plugin = tenant ? getPlugin(tenant) : undefined;
    const operations = plugin ? await loadPluginOperations(plugin).catch(() => undefined) : undefined;
    if (!operations?.get(name)?.write) return undefined;
    if (this.isDig?.(task))
      return { isError: true, content: [{ type: "text" as const, text: DIG_READ_ONLY }] };
    const answer = await approvalHub.requestApproval({
      tenantId: tenant ?? "",
      action: toolName,
      description: `Claude Code asks to change ${plugin?.label ?? tenant}: ${toolName}.`,
      riskLevel: "high",
      payload: args,
      toolUseId,
      runId: task,
      timeoutMs: TASK_APPROVAL_MS,
    });
    if (answer.approved) return undefined;
    return { isError: true, content: [{ type: "text" as const, text: DENIED }] };
  }

  private registerHandlers(server: Server, caller: Caller) {
    // 1. Tools: UI tools + dynamic tenant tools derived from OpenAPI
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tenantTools = await listTenantTools().catch((err) => {
        console.warn("[MCP Server] Error listing tenant tools:", err);
        return [];
      });
      return {
        tools: [...UI_TOOL_DEFINITIONS, ...tenantTools],
      };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      const progressToken = request.params._meta?.progressToken;
      if (progressToken === undefined) return this.callTool(request, caller);
      // Claude Code drops a call silent for 300s; a prompt may wait longer.
      let progress = 0;
      const beat = setInterval(
        () =>
          void extra
            .sendNotification({
              method: "notifications/progress",
              params: { progressToken, progress: ++progress },
            })
            .catch(() => undefined),
        HEARTBEAT_MS,
      );
      try {
        return await this.callTool(request, caller);
      } finally {
        clearInterval(beat);
      }
    });

    // 2. Resources: ambient context (tenants, active plan, artifacts)
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: MCP_RESOURCES,
      };
    });

    server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        return readResource(request.params.uri, this.lookup?.(caller) ?? []);
      },
    );
  }

  async start(port = 4040): Promise<number> {
    return new Promise((resolve, reject) => {
      const httpServer = http.createServer(async (req, res) => {
        // Enable CORS for local cross-origin connections
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader(
          "Access-Control-Allow-Headers",
          "content-type, authorization",
        );
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

        if (req.method === "OPTIONS") {
          res.writeHead(204).end();
          return;
        }

        const url = new URL(
          req.url ?? "/",
          `http://${req.headers.host ?? "localhost"}`,
        );

        // Health check
        if (url.pathname === "/health" || url.pathname === "/status") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "ready",
              name: "agent-desktop",
              version: "0.1.0",
              activeSessions: this.connections.size,
            }),
          );
          return;
        }

        // Hooks come from Claude Code itself, never from a page in a browser.
        if (url.pathname === "/hooks" && req.method === "POST") {
          if (req.headers.origin) {
            res.writeHead(403).end();
            return;
          }
          let body = "";
          for await (const chunk of req) body += chunk;
          try {
            const input = JSON.parse(body) as HookInput;
            const fromApp = req.headers[DRIVER_HEADER] === "app";
            for (const cb of this.hookListeners) cb(input, fromApp, pidOf(req));
          } catch (err) {
            console.warn("[MCP Server] Unreadable hook:", err);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end("{}");
          return;
        }

        // SSE endpoint
        if (url.pathname === "/sse" && req.method === "GET") {
          const transport = new SSEServerTransport("/messages", res);
          const sessionId = transport.sessionId;
          const pid = pidOf(req);
          const server = this.createServer({ pid, runId: runOf(req) });
          this.connections.set(sessionId, { transport, server, pid });

          transport.onclose = () => {
            this.connections.delete(sessionId);
            if (this.connections.size === 0)
              for (const cb of this.detachListeners) cb();
          };

          try {
            await server.connect(transport);
          } catch (err) {
            console.error("[MCP Server] Error connecting transport:", err);
            this.connections.delete(sessionId);
          }
          return;
        }

        // Incoming JSON-RPC messages from client
        if (url.pathname === "/messages" && req.method === "POST") {
          const sessionId = url.searchParams.get("sessionId");
          if (!sessionId) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ error: "Missing sessionId query parameter" }),
            );
            return;
          }

          const transport = this.connections.get(sessionId)?.transport;
          if (!transport) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ error: `Session not found: ${sessionId}` }),
            );
            return;
          }

          await transport.handlePostMessage(req, res);
          return;
        }

        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
      });

      httpServer.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          console.warn(
            `[MCP Server] Port ${port} is in use, trying ${port + 1}...`,
          );
          httpServer.close();
          this.start(port + 1).then(resolve, reject);
        } else {
          reject(err);
        }
      });

      httpServer.listen(port, "127.0.0.1", () => {
        this.httpServer = httpServer;
        this.activePort = port;
        console.log(
          `[MCP Server] Agent Desktop MCP Server listening on http://127.0.0.1:${port}/sse`,
        );
        resolve(port);
      });
    });
  }

  stop() {
    for (const { transport } of this.connections.values()) {
      void transport.close();
    }
    this.connections.clear();
    this.httpServer?.close();
  }

  getPort(): number | undefined {
    return this.activePort;
  }
}

export const mcpServer = new DesktopMcpServer();
