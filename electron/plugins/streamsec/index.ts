import type { Tokens } from '@/lib/auth'
import type { Kind } from '../types'
import { newDetection } from './detections'
import { isHtml, operations, request } from './openapi'
import { isExpired, onTokensChange, setTokens, tenantFetch, tokensOf } from './tokens'

// The orchestrator's tool names: `detections-list` is `detections__list`.
const toolName = (operationId: string) => operationId.replace(/-/g, '__')

/** Stream Security tenants: password sign-in, a workspace per call, tools from the OpenAPI spec. */
export const streamsec: Kind = {
  id: 'streamsec',
  setCredentials: (plugin, tokens) => setTokens(plugin, tokens as Tokens | undefined),
  signedIn: plugin => tokensOf(plugin) !== undefined,
  watch: onTokensChange,
  async status(plugin) {
    if (!tokensOf(plugin)) return { status: isExpired(plugin) ? 'expired' : 'signed-out' }
    try {
      const response = await tenantFetch(plugin, `${plugin.origin}/openapi/workspaces`)
      if (response.ok && !isHtml(response)) return { status: 'ready' }
      if (response.status === 401) return { status: 'expired' }
      return { status: 'unsupported', text: "This tenant doesn't serve the OpenAPI yet." }
    } catch (error) {
      if (!tokensOf(plugin)) return { status: isExpired(plugin) ? 'expired' : 'signed-out' }
      return { status: 'unsupported', text: `Can't reach the tenant: ${(error as Error).message}` }
    }
  },
  async scopes(plugin) {
    const response = await tenantFetch(plugin, `${plugin.origin}/openapi/workspaces`)
    if (!response.ok) return []
    const list = (await response.json()) as { id: string; name?: string }[]
    return list.map(w => ({ id: w.id, label: w.name ?? w.id }))
  },
  fetch: tenantFetch,
  chat: (plugin, workspaceId) => ({
    api: `${plugin.origin}/chat`,
    // `x-version: 7` selects the AI SDK 7 chat path on /chat.
    headers: { 'x-version': '7' },
    fetch: (input, init) =>
      tenantFetch(plugin, input as string, init, workspaceId),
  }),
  triggerSources: { detection: newDetection },

  async catalog(plugin) {
    const ops = await operations(plugin, true)
    return new Map(ops.map(op => [toolName(op.operationId), op.write]))
  },
  callParams: {
    workspace: {
      type: 'string',
      description:
        "A workspace in the plugin, by name. Leave it out for the plugin's default workspace, or the one you used last there.",
    },
  },
  describe(plugin, status, scopes) {
    const workspaces = scopes
      .map(s => (s.id === plugin.defaultScope ? `${s.label} (default)` : s.label))
      .join(', ')
    return [status.replace('-', ' '), workspaces && `workspaces ${workspaces}`]
      .filter(Boolean)
      .join(', ')
  },
  resolveScope(plugin, params, last, scopes) {
    const named = typeof params.workspace === 'string' ? params.workspace.trim() : ''
    if (!named) return last ?? plugin.defaultScope
    const found = scopes.find(
      s => s.id === named || s.label.toLowerCase() === named.toLowerCase(),
    )
    if (!found) {
      throw new Error(
        `${plugin.label} has no workspace "${named}". Its workspaces: ${scopes.map(s => s.label).join(', ')}.`,
      )
    }
    return found.id
  },
  async execute(plugin, tool, input, workspaceId, signal) {
    const op = (await operations(plugin)).find(o => toolName(o.operationId) === tool)
    if (!op) throw new Error(`${plugin.label} doesn't have ${tool}.`)
    const { url, init } = request(plugin, op, (input ?? {}) as Record<string, unknown>)
    const response = await tenantFetch(plugin, url, { ...init, signal }, workspaceId)
    const text = await response.text()
    if (!response.ok) {
      throw new Error(`${plugin.label} answered HTTP ${response.status}: ${text.slice(0, 500)}`)
    }
    if (isHtml(response)) throw new Error(`${plugin.label} answered ${tool} with a web page, not the API.`)
    return text ? JSON.parse(text) : null
  },
}
