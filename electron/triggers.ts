import { randomUUID } from 'node:crypto'
import type { UIMessage } from 'ai'
import { Cron } from 'croner'
import type { RunSummary } from '@/lib/desktop'
import { templateMessage, variableNames, type Template } from '@/lib/templates'
import type { Trigger } from '@/lib/triggers'
import { listAgents } from './agents'
import { coveredPlugins } from '@/lib/routing'
import { kindOf } from './plugins/kinds'
import { getPlugin, orchestrator } from './plugins/store'
import type { TriggerState } from './plugins/types'
import type { RunManager } from './runs'
import { readJson, writeJson } from './store'
import { notify } from './notifier'

const FILE = 'triggers.json'
// Each agent's tenants covered so far, so a new one is named once.
const COVERAGE = 'coverage.json'
const POLL_MS = 60_000
const MAX_CHAIN_DEPTH = 5
const MAX_CONTEXT_CHARS = 8_000

// Triggers belong to the orchestrator's agents, and run while it is signed in.
function signedInOrchestrator() {
  const plugin = orchestrator()
  return plugin && kindOf(plugin).signedIn(plugin) ? plugin : undefined
}

// The tenant a trigger watches and starts its runs on: its own, else the orchestrator.
function pluginOf(trigger: Trigger) {
  const plugin = trigger.pluginId ? getPlugin(trigger.pluginId) : orchestrator()
  return plugin && kindOf(plugin).signedIn(plugin) ? plugin : undefined
}

// A schedule or a chain is the app's own; any other trigger comes from a kind's source.
const sourceOf = (trigger: Trigger) => {
  const plugin = pluginOf(trigger)
  return plugin && kindOf(plugin).triggerSources[trigger.kind]
}

function finalAnswer(messages: UIMessage[]): string {
  const last = messages.findLast(m => m.role === 'assistant')
  const text = (last?.parts ?? [])
    .flatMap(p => (p.type === 'text' ? [p.text] : []))
    .join('\n\n')
  return text.length > MAX_CONTEXT_CHARS
    ? `${text.slice(0, MAX_CONTEXT_CHARS)}…`
    : text
}

/** Starts agents' runs from their triggers while the app runs. */
export class TriggerManager {
  private crons: Cron[] = []
  private poller: NodeJS.Timeout | undefined
  private state = readJson<Record<string, TriggerState>>(FILE, {})
  private coverage = readJson<Record<string, string[]>>(COVERAGE, {})

  constructor(
    private readonly runs: RunManager,
    private readonly openRun: (run: RunSummary) => void,
  ) {
    runs.onSettled((run, messages) => this.settled(run, messages))
  }

  /** Re-reads every trigger: at launch, and when the agents or the session change. */
  sync() {
    for (const cron of this.crons) cron.stop()
    this.crons = []
    clearInterval(this.poller)
    this.poller = undefined
    const active = this.active()
    for (const { agent, trigger } of active) {
      if (trigger.kind === 'schedule') this.schedule(agent, trigger.id, trigger.cron)
    }
    if (active.some(({ trigger }) => sourceOf(trigger))) {
      this.poller = setInterval(() => void this.poll(), POLL_MS)
      void this.poll()
    }
  }

  stop() {
    for (const cron of this.crons) cron.stop()
    clearInterval(this.poller)
  }

  private active(): { agent: Template; trigger: Trigger }[] {
    const plugin = signedInOrchestrator()
    if (!plugin) return []
    return listAgents().flatMap(agent =>
      (agent.triggers ?? [])
        .filter(trigger => trigger.enabled)
        .map(trigger => ({ agent, trigger })),
    )
  }

  private update(triggerId: string, change: TriggerState) {
    this.state[triggerId] = { ...this.state[triggerId], ...change }
    writeJson(FILE, this.state)
  }

  private schedule(agent: Template, triggerId: string, pattern: string) {
    let cron: Cron
    try {
      cron = new Cron(pattern, () => this.fire(agent.id, triggerId))
    } catch {
      return
    }
    this.crons.push(cron)
    const last = this.state[triggerId]?.lastRunAt
    if (last === undefined) return this.update(triggerId, { lastRunAt: Date.now() })
    // A schedule missed while the app was closed runs once, now.
    const due = cron.nextRun(new Date(last))
    if (due && due.getTime() <= Date.now()) this.fire(agent.id, triggerId)
  }

  private fire(
    agentId: string,
    triggerId: string,
    context?: string,
    parentRunId?: string,
  ) {
    const found = this.active().find(
      ({ agent, trigger }) => agent.id === agentId && trigger.id === triggerId,
    )
    if (!found) return
    const { agent, trigger } = found
    const previous = this.state[trigger.id]?.runId
    this.update(trigger.id, { lastRunAt: Date.now() })
    // A schedule doesn't pile up runs behind a slow one.
    if (
      trigger.kind === 'schedule' &&
      previous &&
      this.runs.summary(previous)?.status === 'running'
    ) {
      return
    }
    const missing = variableNames(agent).filter(
      name => !trigger.values[name]?.trim(),
    )
    if (missing.length > 0) {
      this.notify(
        `${agent.name} didn't start`,
        `Its trigger needs a value for ${missing.join(', ')}.`,
      )
      return
    }
    const runId = randomUUID()
    this.runs.send(runId, templateMessage(agent, trigger.values, true, context), {
      agentId: agent.id,
      focus: trigger.pluginId ?? (trigger.kind === 'detection' ? orchestrator()?.id : undefined),
      trigger: trigger.kind === 'schedule' ? 'schedule' : 'event',
      parentRunId,
    })
    this.update(trigger.id, { runId })
  }

  private async poll() {
    for (const { agent, trigger } of this.active()) {
      const plugin = pluginOf(trigger)
      const source = sourceOf(trigger)
      if (!plugin || !source) continue
      let polled: { contexts: string[]; state: TriggerState }
      try {
        polled = await source.poll(plugin, trigger, this.state[trigger.id] ?? {})
      } catch {
        continue
      }
      this.update(trigger.id, polled.state)
      for (const context of polled.contexts) this.fire(agent.id, trigger.id, context)
    }
  }

  // A scheduled or triggered run that reaches a tenant for the first time says so.
  private cover(run: RunSummary, name: string, messages: UIMessage[]) {
    const known = new Set(this.coverage[run.agentId!] ?? [])
    const fresh = coveredPlugins(messages).filter(id => !known.has(id))
    if (fresh.length === 0) return
    this.coverage[run.agentId!] = [...known, ...fresh]
    writeJson(COVERAGE, this.coverage)
    if (run.trigger === 'manual') return
    const labels = fresh.map(id => getPlugin(id)?.label ?? id)
    const list =
      labels.length > 1 ? `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}` : labels[0]
    this.notify(`${name} covered ${list} for the first time`, 'Open the run to see what it found.', run)
  }

  private notify(title: string, body: string, run?: RunSummary) {
    notify(title, body, run && (() => this.openRun(run)))
  }

  private settled(run: RunSummary, messages: UIMessage[]) {
    const name =
      listAgents().find(a => a.id === run.agentId)?.name ?? run.title
    if (run.trigger !== 'manual' && run.status === 'awaiting_approval') {
      this.notify(`${name} needs your approval`, 'Open the run to answer.', run)
    }
    if (run.trigger !== 'manual' && run.status === 'failed') {
      this.notify(`${name} failed`, run.error ?? '', run)
    }
    if (run.agentId && run.status === 'completed') this.cover(run, name, messages)

    if (run.status !== 'completed' || !run.agentId) return
    if (this.runs.chainDepth(run.id) >= MAX_CHAIN_DEPTH) return
    const context = `This run was started when the agent "${name}" completed a run. Its final answer:\n\n${finalAnswer(messages)}`
    for (const { agent, trigger } of this.active()) {
      if (trigger.kind === 'agent' && trigger.agentId === run.agentId) {
        this.fire(agent.id, trigger.id, context, run.id)
      }
    }
  }
}
