---
description: Check the status of connected tenants, active plans, and the Agent Desktop MCP server.
---

# /agent-desktop:status

Query and display the current status of the Agent Desktop integration:

1. Read resource `desktop://tenants` to list all registered tenant plugins, their connection health, and active workspaces.
2. Read resource `desktop://active-plan` to inspect any plan currently driving the Desktop UI.
3. Post an activity beacon (`ui_post_activity`) confirming connectivity check.
4. Report a clear summary of connected environments and MCP server port to the operator.
