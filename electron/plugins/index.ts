import type { Tokens } from '@/lib/auth'
import type {
  InstanceRequest,
  InstanceResponse,
  NewPlugin,
  PluginInfo,
  PluginStatus,
  ScopeInfo,
} from '@/lib/desktop'
import { allKinds, kindOf } from './kinds'
import {
  getPlugin,
  listPlugins,
  newPluginId,
  onPluginsChange,
  removePlugin as removeStored,
  savePlugin,
} from './store'
import type { Plugin } from './types'

// What the window manages in Options: plugins, their sign-in and their status.
const statuses = new Map<string, { status: PluginStatus; text?: string }>()
const scopeLabels = new Map<string, string>()
const listeners = new Set<(plugins: PluginInfo[]) => void>()

function need(id: string): Plugin {
  const plugin = getPlugin(id)
  if (!plugin) throw new Error(`No plugin ${id}`)
  return plugin
}

// Before its first check, a plugin's status follows its sign-in.
const statusOf = (plugin: Plugin) =>
  statuses.get(plugin.id) ?? {
    status: kindOf(plugin).signedIn(plugin) ? ('ready' as const) : ('signed-out' as const),
  }

export const pluginInfos = (): PluginInfo[] =>
  listPlugins().map(plugin => ({
    id: plugin.id,
    kind: plugin.kind,
    label: plugin.label,
    origin: plugin.origin,
    orchestrator: !!plugin.orchestrator,
    defaultScope: plugin.defaultScope,
    defaultScopeLabel: scopeLabels.get(plugin.id),
    status: statusOf(plugin).status,
    statusText: statusOf(plugin).text,
  }))

const emit = () => {
  const infos = pluginInfos()
  listeners.forEach(listener => listener(infos))
}

export function onPluginInfosChange(listener: (plugins: PluginInfo[]) => void) {
  listeners.add(listener)
}

async function check(plugin: Plugin) {
  const result = await kindOf(plugin)
    .status(plugin)
    .catch((error: Error) => ({ status: 'unsupported' as const, text: error.message }))
  statuses.set(plugin.id, result)
  if (result.status === 'ready') {
    const scopes = await kindOf(plugin).scopes(plugin).catch(() => [])
    const label = scopes.find(s => s.id === getPlugin(plugin.id)?.defaultScope)?.label
    if (label) scopeLabels.set(plugin.id, label)
  }
  emit()
}

export async function refreshStatuses() {
  await Promise.all(listPlugins().map(check))
}

// A plugin signed in without a default scope gets its first one.
async function chooseDefaultScope(plugin: Plugin) {
  if (plugin.defaultScope) return
  const scopes = await kindOf(plugin).scopes(plugin).catch(() => [])
  if (scopes[0]) savePlugin({ ...plugin, defaultScope: scopes[0].id })
}

export async function addPlugin(input: NewPlugin): Promise<PluginInfo> {
  const origin = new URL(input.origin).origin
  if (listPlugins().some(p => p.origin === origin)) {
    throw new Error(`A plugin for ${new URL(origin).host} already exists.`)
  }
  const label = input.label.trim() || new URL(origin).host
  const plugin: Plugin = {
    id: newPluginId(label),
    kind: input.kind,
    label,
    origin,
    // The first plugin orchestrates until another is labeled.
    orchestrator: listPlugins().length === 0,
  }
  const kind = kindOf(plugin)
  savePlugin(plugin)
  kind.setCredentials(plugin, input.tokens)
  await chooseDefaultScope(plugin)
  await check(need(plugin.id))
  return pluginInfos().find(p => p.id === plugin.id)!
}

export async function signInPlugin(id: string, tokens: Tokens) {
  const plugin = need(id)
  kindOf(plugin).setCredentials(plugin, tokens)
  await chooseDefaultScope(plugin)
  await check(need(id))
}

export async function signOutPlugin(id: string) {
  const plugin = need(id)
  kindOf(plugin).setCredentials(plugin, undefined)
  await check(plugin)
}

export function renamePlugin(id: string, label: string) {
  if (label.trim()) savePlugin({ ...need(id), label: label.trim() })
}

export function removePlugin(id: string) {
  statuses.delete(id)
  removeStored(id)
}

export const setOrchestrator = (id: string) =>
  savePlugin({ ...need(id), orchestrator: true })

export async function setDefaultScope(id: string, scope: string) {
  savePlugin({ ...need(id), defaultScope: scope })
  await check(need(id))
}

export function scopesOf(id: string): Promise<ScopeInfo[]> {
  const plugin = need(id)
  return kindOf(plugin).scopes(plugin)
}

const NULL_BODY = new Set([101, 204, 205, 304])

/** A call from the window to a plugin's own origin; the window never holds tokens. */
export async function pluginFetch(
  id: string,
  request: InstanceRequest,
): Promise<InstanceResponse> {
  const plugin = need(id)
  const response = await kindOf(plugin).fetch(plugin, request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  })
  return {
    status: response.status,
    statusText: response.statusText,
    headers: [...response.headers],
    body: NULL_BODY.has(response.status) ? '' : await response.text(),
  }
}

/** Starts watching: store and credential changes reach the window. */
export function watchPlugins() {
  onPluginsChange(emit)
  for (const kind of allKinds()) {
    kind.watch(id => {
      const plugin = getPlugin(id)
      if (plugin) void check(plugin)
    })
  }
  void refreshStatuses()
}
