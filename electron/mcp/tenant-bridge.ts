import { getPlugin, listPlugins } from "../plugins/store";
import { bridged } from "../plugins/streamsec/bridged";
import {
  isHtml,
  type Operation,
  operations,
  request,
} from "../plugins/streamsec/openapi";
import {
  isExpired,
  onTokensChange,
  tenantFetch,
  tokensOf,
} from "../plugins/streamsec/tokens";
import type { Plugin } from "../plugins/types";
import { approvalHub } from "./approval-hub";

// The live spec says `detections-list`, the tool `detections_list`.
const tenantToolName = (pluginId: string, operation: string) =>
  `tenant__${pluginId}__${operation.replace(/[-_]+/g, "_")}`;

// Signing a plugin in answers its prompt.
onTokensChange((pluginId) => {
  const plugin = getPlugin(pluginId);
  if (!plugin || !tokensOf(plugin)) return;
  for (const req of approvalHub.listPending()) {
    if (req.kind === "sign-in" && req.tenantId === pluginId)
      approvalHub.respond(req.id, true);
  }
});

const signIns = new Map<string, Promise<boolean>>();

/** Asks the user to sign the plugin in; one prompt serves every call waiting on it. */
function awaitSignIn(plugin: Plugin): Promise<boolean> {
  const pending =
    signIns.get(plugin.id) ??
    approvalHub
      .requestApproval({
        kind: "sign-in",
        tenantId: plugin.id,
        action: "sign-in",
        description: `${plugin.label} is ${isExpired(plugin) ? "expired" : "signed out"}. Sign in to let Claude Code continue.`,
        riskLevel: "low",
      })
      .then((res) => res.approved)
      .finally(() => signIns.delete(plugin.id));
  signIns.set(plugin.id, pending);
  return pending;
}

export async function loadPluginOperations(
  plugin: Plugin,
): Promise<Map<string, Operation>> {
  const ops = await operations(plugin).catch((err: Error) => {
    console.warn(`[Tenant Bridge] No OpenAPI spec from ${plugin.label}:`, err.message);
    return [];
  });
  return new Map(
    ops
      .filter((op) => bridged(op.operationId))
      .map((op) => [tenantToolName(plugin.id, op.operationId), op]),
  );
}

export async function listTenantTools(): Promise<
  {
    name: string;
    description: string;
    inputSchema: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  }[]
> {
  const tools: {
    name: string;
    description: string;
    inputSchema: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  }[] = [];

  const plugins = listPlugins();

  for (const plugin of plugins) {
    const ops = await loadPluginOperations(plugin);
    for (const [toolName, op] of ops.entries()) {
      const properties: Record<string, unknown> = {
        workspace: {
          type: "string",
          description: `Optional workspace override for ${plugin.label}. Defaults to "${plugin.defaultScope || "default"}".`,
        },
      };
      const required: string[] = [];

      for (const param of op.parameters) {
        properties[param.name] = {
          type: param.schema?.type ?? "string",
          description: param.description ?? param.name,
          ...(param.schema ?? {}),
        };
        if (param.required) required.push(param.name);
      }

      if (op.bodySchema?.properties) {
        Object.assign(properties, op.bodySchema.properties);
        if (Array.isArray(op.bodySchema.required)) {
          required.push(...(op.bodySchema.required as string[]));
        }
      }

      const mutatingTag = op.write
        ? " [MUTATING OPERATION - REQUIRES ui_request_approval BEFORE CALLING]"
        : "";

      tools.push({
        name: toolName,
        description: `[${plugin.label}] ${op.summary}${mutatingTag}`,
        inputSchema: {
          type: "object",
          properties,
          ...(required.length > 0 && { required }),
        },
      });
    }
  }

  return tools;
}

export async function handleTenantToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const parts = name.split("__");
  if (parts.length < 3 || parts[0] !== "tenant") {
    return {
      isError: true,
      content: [{ type: "text", text: `Invalid tenant tool name: ${name}` }],
    };
  }

  const pluginId = parts[1];
  const plugin = getPlugin(pluginId);
  if (!plugin) {
    return {
      isError: true,
      content: [{ type: "text", text: `Tenant plugin not found: ${pluginId}` }],
    };
  }

  const ops = await loadPluginOperations(plugin);
  const op = ops.get(name);
  if (!op) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Operation metadata not found for tool: ${name}`,
        },
      ],
    };
  }

  const { workspace, ...restArgs } = args;
  const targetWorkspace =
    typeof workspace === "string" ? workspace : plugin.defaultScope;

  const { url, init } = request(plugin, op, restArgs);

  try {
    const send = () => tenantFetch(plugin, url, init, targetWorkspace);
    if (!tokensOf(plugin)) await awaitSignIn(plugin);
    let res = await send();
    // No tokens after a 401: the refresh failed and the plugin is now expired.
    if (res.status === 401 && !tokensOf(plugin) && (await awaitSignIn(plugin)))
      res = await send();

    const text = await res.text();
    if (!res.ok) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `[${plugin.label}] HTTP ${res.status}: ${text.slice(0, 1000)}`,
          },
        ],
      };
    }
    if (isHtml(res)) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `[${plugin.label}] ${op.method} ${new URL(url).pathname} returned an HTML page, not the API.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: text ? text : '{"success": true}',
        },
      ],
    };
  } catch (err) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `[${plugin.label}] ${(err as Error).message}`,
        },
      ],
    };
  }
}
