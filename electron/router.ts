import type { DynamicToolUIPart, UIMessage } from 'ai'
import type { PluginStatus, ScopeInfo } from '@/lib/desktop'
import { allStamps, type Stamp } from '@/lib/routing'
import { latestPlan } from '@/lib/todo'
import { pluginInfos } from './plugins'
import { listGroups } from './plugins/groups'
import { kindOf } from './plugins/kinds'
import { listPlugins, orchestrator } from './plugins/store'
import type { Plugin } from './plugins/types'

// Past this many characters, a tool's output is cut before the model reads it.
const OUTPUT_CAP = 60_000

const STATUS_TEXT: Record<PluginStatus, string> = {
  ready: 'ready',
  'signed-out': 'signed out',
  expired: 'expired',
  unsupported: 'unsupported',
}

/** Calls are routed across tenants once there are two or more plugins. */
export const routingMode = () => listPlugins().length >= 2

// Plugins of the orchestrator's kind: its catalog is the one the model sees.
function routable(): Plugin[] {
  const kind = orchestrator()?.kind
  return listPlugins().filter(p => p.kind === kind)
}

export interface Target {
  plugin: Plugin
  scope?: string
  stamp: Stamp
}

/** One run's view of the tenants: their tools and scopes, fetched at the start of each turn. */
export class Router {
  private catalogs = new Map<string, Map<string, boolean>>()
  private scopes = new Map<string, ScopeInfo[]>()
  private unavailable = new Map<string, string>()

  async refresh() {
    await Promise.all(
      routable().map(async plugin => {
        const kind = kindOf(plugin)
        if (!kind.signedIn(plugin)) return
        await this.catalogOf(plugin, true).catch(() => undefined)
        this.scopes.set(plugin.id, await kind.scopes(plugin).catch(() => []))
      }),
    )
  }

  private async catalogOf(plugin: Plugin, fresh = false) {
    const cached = this.catalogs.get(plugin.id)
    if (cached && !fresh) return cached
    try {
      const catalog = await kindOf(plugin).catalog(plugin)
      this.catalogs.set(plugin.id, catalog)
      this.unavailable.delete(plugin.id)
      return catalog
    } catch (error) {
      this.catalogs.delete(plugin.id)
      this.unavailable.set(plugin.id, (error as Error).message)
      throw error
    }
  }

  /** What each /chat request carries in routing mode. */
  requestFields() {
    const statuses = new Map(pluginInfos().map(p => [p.id, p.status]))
    const plugins = routable()
    return {
      plugins: plugins.map(p => ({
        id: p.id,
        label: p.label,
        notes: kindOf(p)
          .describe(p, statuses.get(p.id) ?? 'signed-out', this.scopes.get(p.id) ?? [])
          .slice(0, 500),
      })),
      groups: listGroups(),
      callParams: Object.assign(
        {},
        ...[...new Set(plugins.map(kindOf))].map(kind => kind.callParams),
      ) as Record<string, Record<string, unknown>>,
    }
  }

  /** Plugin ids a list of targets stands for, groups expanded. */
  expand(targets: string[]): string[] {
    const groups = listGroups()
    return [
      ...new Set(
        targets.flatMap(t =>
          t.startsWith('@') ? (groups.find(g => g.id === t)?.members ?? []) : [t],
        ),
      ),
    ]
  }

  /**
   * The tenant a call runs on: its own `plugin`, the in-progress step's single
   * target, the run's focus, or the only ready plugin. Throws with a message
   * the model can act on.
   */
  resolve(part: DynamicToolUIPart, messages: UIMessage[], focus?: string): Target {
    const input = (part.input ?? {}) as Record<string, unknown>
    const plugins = routable()
    const named = typeof input.plugin === 'string' ? input.plugin : undefined
    const step = latestPlan(messages)?.find(
      s => s.assignee === 'self' && s.status === 'in_progress',
    )
    const limit = step?.targets?.length ? this.expand(step.targets) : undefined
    const stamps = allStamps(messages)
    const ready = plugins.filter(p => kindOf(p).signedIn(p))

    let id = named
    if (!id && 'approval' in part && part.approval) {
      throw new Error('A change must name the plugin it runs on.')
    }
    id ??= limit?.length === 1 ? limit[0] : undefined
    id ??= stamps.at(-1)?.plugin ?? focus
    id ??= ready.length === 1 ? ready[0].id : undefined
    const plugin = plugins.find(p => p.id === id)
    if (!plugin) {
      const choices = plugins.map(p => p.id).join(', ')
      throw new Error(
        id ? `There is no plugin "${id}". Plugins: ${choices}.` : `Name a plugin: ${choices}.`,
      )
    }
    if (limit && !limit.includes(plugin.id)) {
      throw new Error(
        `Step "${step!.id}" is limited to ${step!.targets!.join(', ')}; ${plugin.id} is outside it.`,
      )
    }

    const last = stamps.findLast(s => s.plugin === plugin.id)?.scope
    const scopes = this.scopes.get(plugin.id) ?? []
    const scope = kindOf(plugin).resolveScope(plugin, input, last, scopes)
    return {
      plugin,
      scope,
      stamp: {
        plugin: plugin.id,
        label: plugin.label,
        scope,
        scopeLabel: scopes.find(s => s.id === scope)?.label,
      },
    }
  }

  /** Where a call on this plugin lands by default: its default scope. */
  describeTarget(plugin: Plugin): Stamp {
    const scopes = this.scopes.get(plugin.id) ?? []
    const scope = kindOf(plugin).resolveScope(plugin, {}, undefined, scopes)
    return {
      plugin: plugin.id,
      label: plugin.label,
      scope,
      scopeLabel: scopes.find(s => s.id === scope)?.label,
    }
  }

  /** A pinned subagent's calls run on its tenant's default scope, whatever they say. */
  pinned(plugin: Plugin): Target {
    const stamp = this.describeTarget(plugin)
    return { plugin, scope: stamp.scope, stamp }
  }

  /** Whether the target itself calls this tool a change, whatever the orchestrator said. */
  async isWrite(target: Target, tool: string): Promise<boolean> {
    return (await this.catalogOf(target.plugin).catch(() => undefined))?.get(tool) === true
  }

  /** Runs a call on its tenant, checked against that tenant's own catalog. */
  async run(
    part: DynamicToolUIPart,
    target: Target,
    signal: AbortSignal,
  ): Promise<unknown> {
    const { plugin, scope } = target
    const kind = kindOf(plugin)
    if (!kind.signedIn(plugin)) {
      const status = pluginInfos().find(p => p.id === plugin.id)?.status ?? 'signed-out'
      throw new Error(`${plugin.label} is ${STATUS_TEXT[status]}. Connect it in Options.`)
    }
    let catalog = await this.catalogOf(plugin).catch(() => undefined)
    if (!catalog) {
      throw new Error(
        `${plugin.label} can't be used: ${this.unavailable.get(plugin.id) ?? 'its tools are unavailable'}`,
      )
    }
    // After a deploy, the tool may be new: fetch the list once more.
    if (!catalog.has(part.toolName)) catalog = await this.catalogOf(plugin, true)
    if (!catalog.has(part.toolName)) {
      throw new Error(`${plugin.label} doesn't have ${part.toolName}.`)
    }
    const input = { ...((part.input ?? {}) as Record<string, unknown>) }
    delete input.plugin
    for (const param of Object.keys(kind.callParams)) delete input[param]
    const output = await kind.execute(plugin, part.toolName, input, scope, signal)
    const text = JSON.stringify(output) ?? ''
    return text.length > OUTPUT_CAP
      ? { truncated: `The output was ${text.length} characters; this is the first ${OUTPUT_CAP}.`, text: text.slice(0, OUTPUT_CAP) }
      : output
  }
}
