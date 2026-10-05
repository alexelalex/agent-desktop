import { claudeCodeArtifacts, claudeCodePlan } from "@/lib/claude-code";
import type { UIMessage } from "ai";
import { listPlugins } from "../plugins/store";

export const MCP_RESOURCES = [
  {
    uri: "desktop://tenants",
    name: "Connected Tenants",
    description:
      "List of currently configured tenants, origins, and default workspaces.",
    mimeType: "application/json",
  },
  {
    uri: "desktop://active-plan",
    name: "Active Plan",
    description:
      "This session's multi-step execution plan, as the Desktop UI shows it.",
    mimeType: "application/json",
  },
  {
    uri: "desktop://artifacts",
    name: "Rendered Artifacts",
    description:
      "This session's artifacts, reports, and data visualizations in the Desktop UI.",
    mimeType: "application/json",
  },
];

/** `messages` is the reading session's transcript; empty when the caller is unknown. */
export function readResource(
  uri: string,
  messages: UIMessage[],
): {
  contents: { uri: string; mimeType: string; text: string }[];
} {
  switch (uri) {
    case "desktop://tenants": {
      const tenants = listPlugins().map((p) => ({
        id: p.id,
        label: p.label,
        origin: p.origin,
        kind: p.kind,
        defaultScope: p.defaultScope,
      }));
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(tenants, null, 2),
          },
        ],
      };
    }

    case "desktop://active-plan": {
      const plan = claudeCodePlan(messages);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              plan ?? { message: "No active plan" },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "desktop://artifacts": {
      const artifacts = claudeCodeArtifacts(messages);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(artifacts, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource URI: ${uri}`);
  }
}
