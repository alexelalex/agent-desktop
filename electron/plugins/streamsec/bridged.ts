// Curated namespaces to keep tool context clean and fast
const NAMESPACES = new Set([
  'detections',
  'inventory',
  'attackPaths',
  'configChanges',
  'auditLogs',
  'network',
  'integrations',
])

// Read-only StreamForce and rule ops; the rest of these namespaces stays hidden.
const OPERATIONS = new Set([
  'streamforce__agents__list',
  'streamforce__agents__get',
  'streamforce__runs__list',
  'streamforce__runs__get',
  'streamforce__findings__list',
  'streamforce__findings__get',
  'streamforce__logs__list',
  'streamforce__actionLogs__list',
  'detectionRules__list',
  'detectionRules__details',
])

/** Whether the MCP bridge exposes a tenant operation to Claude Code. */
export function bridged(operationId: string): boolean {
  if (OPERATIONS.has(operationId.replace(/[-_]+/g, '__'))) return true
  return NAMESPACES.has(operationId.split(/[-_]/)[0])
}
