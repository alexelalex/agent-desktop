import { Cron } from 'croner'
import type { Template } from './templates'

// A trigger starts an agent's runs on its own, with its variable values.
interface TriggerBase {
  id: string
  /** The tenant its runs start on; none when the steps name their own targets. */
  pluginId?: string
  values: Record<string, string>
  enabled: boolean
}

export interface ScheduleTrigger extends TriggerBase {
  kind: 'schedule'
  cron: string
}

/** A new detection at or above a severity, found by polling the orchestrator's tenant. */
export interface DetectionTrigger extends TriggerBase {
  kind: 'detection'
  minSeverity: Severity
}

/** Another agent's run completing. */
export interface AgentTrigger extends TriggerBase {
  kind: 'agent'
  agentId: string
}

export type Trigger = ScheduleTrigger | DetectionTrigger | AgentTrigger

/** `anomaly_severity` on a detection. */
export type Severity = 1 | 2 | 3 | 4
export const SEVERITIES: Record<Severity, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical',
}

export const SCHEDULE_PRESETS = [
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every day at 09:00', cron: '0 9 * * *' },
  { label: 'Weekdays at 09:00', cron: '0 9 * * 1-5' },
  { label: 'Mondays at 09:00', cron: '0 9 * * 1' },
]

/** The next time a cron pattern fires; throws if the pattern is invalid. */
export function nextRun(cron: string, after?: Date): Date | null {
  return new Cron(cron, { paused: true }).nextRun(after)
}

export function describeTrigger(trigger: Trigger, agents: Template[]): string {
  switch (trigger.kind) {
    case 'schedule':
      return (
        SCHEDULE_PRESETS.find(p => p.cron === trigger.cron)?.label ??
        `Cron ${trigger.cron}`
      )
    case 'detection':
      return `New detection, ${SEVERITIES[trigger.minSeverity]}${trigger.minSeverity < 4 ? ' or higher' : ''}`
    case 'agent': {
      const name = agents.find(a => a.id === trigger.agentId)?.name
      return name ? `After ${name} completes` : 'After a deleted agent'
    }
  }
}
