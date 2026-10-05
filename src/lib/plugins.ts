import { createContext, useContext, useEffect, useState } from 'react'
import type { ClaudeCodeInfo, Group, PluginInfo } from './desktop'
import type { Mentionable } from './mentions'

/** Every plugin with its status, kept current; undefined until the first list arrives. */
export function usePlugins(): PluginInfo[] | undefined {
  const [plugins, setPlugins] = useState<PluginInfo[]>()
  useEffect(() => {
    let live = true
    const off = window.desktop.plugins.onChange(setPlugins)
    void window.desktop.plugins.list().then(list => live && setPlugins(list))
    return () => {
      live = false
      off()
    }
  }, [])
  return plugins
}

/** How the app runs Claude Code, kept current; undefined until it is known. */
export function useClaudeCode(): ClaudeCodeInfo | undefined {
  const [info, setInfo] = useState<ClaudeCodeInfo>()
  useEffect(() => {
    let live = true
    const off = window.desktop.claudeCode.onChange(setInfo)
    void window.desktop.claudeCode.get().then(next => live && setInfo(next))
    return () => {
      live = false
      off()
    }
  }, [])
  return info
}

/** `@all` and the user's groups. */
export function useGroups(): Group[] {
  const [groups, setGroups] = useState<Group[]>([])
  useEffect(() => {
    let live = true
    const off = window.desktop.groups.onChange(setGroups)
    void window.desktop.groups.list().then(list => live && setGroups(list))
    return () => {
      live = false
      off()
    }
  }, [])
  return groups
}

export const orchestratorOf = (plugins: PluginInfo[]) =>
  plugins.find(p => p.orchestrator)

/** Claude Code answers new chats when picked in Options, or when no plugin orchestrates. */
export const claudeCodeOrchestrates = (plugins: PluginInfo[], claudeCode?: ClaudeCodeInfo) =>
  !!claudeCode?.orchestrator || !orchestratorOf(plugins)

/** Why nothing can be sent now, or undefined when the orchestrator is ready. */
export function blockedReason(
  plugins: PluginInfo[],
  claudeCode?: ClaudeCodeInfo,
): string | undefined {
  if (claudeCodeOrchestrates(plugins, claudeCode)) {
    if (claudeCode?.found) return undefined
    return plugins.length === 0
      ? 'Set up Claude Code or add a plugin in Options to chat.'
      : "Claude Code isn't found. Set it up in Options."
  }
  if (orchestratorOf(plugins)?.status !== 'ready') {
    return 'Connect the orchestrator in Options to chat.'
  }
  return undefined
}

export const STATUS_LABELS: Record<PluginInfo['status'], string> = {
  ready: 'Ready',
  'signed-out': 'Signed out',
  expired: 'Expired',
  unsupported: 'Unsupported',
}

/** What the shell shares with the views: why sending is blocked, and a way to Options. */
export const ShellContext = createContext<{
  blocked?: string
  openOptions: () => void
  /** What `@` lists in the composer: plugins, then groups. */
  mentionables: Mentionable[]
  plugins: PluginInfo[]
  groups: Group[]
  claudeCode?: ClaudeCodeInfo
}>({ openOptions: () => {}, mentionables: [], plugins: [], groups: [] })

/** The plugins a list of targets stands for, groups expanded, in order. */
export function expandTargets(targets: string[], plugins: PluginInfo[], groups: Group[]): PluginInfo[] {
  const ids = targets.flatMap(t =>
    t.startsWith('@') ? (groups.find(g => g.id === t)?.members ?? []) : [t],
  )
  return [...new Set(ids)].flatMap(id => plugins.find(p => p.id === id) ?? [])
}
export const useShell = () => useContext(ShellContext)
