import {
  CalendarClockIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ShieldAlertIcon,
  Trash2Icon,
  WorkflowIcon,
} from 'lucide-react'
import { Fragment, useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useShell } from '@/lib/plugins'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatStarted } from '@/lib/format'
import { variableNames, type Template } from '@/lib/templates'
import {
  describeTrigger,
  nextRun,
  SCHEDULE_PRESETS,
  SEVERITIES,
  type Severity,
  type Trigger,
} from '@/lib/triggers'

const ICONS = {
  schedule: CalendarClockIcon,
  detection: ShieldAlertIcon,
  agent: WorkflowIcon,
}

function nextRunLabel(cron: string): string | undefined {
  try {
    const next = nextRun(cron)
    return next ? `next ${formatStarted(next.getTime())}` : undefined
  } catch {
    return undefined
  }
}

/** An agent's triggers, which start its runs on a schedule or an event. */
export function Triggers(props: {
  agent: Template
  agents: Template[]
  onSave: (agent: Template) => void
}) {
  const { agent, agents, onSave } = props
  const { blocked, plugins } = useShell()
  const [adding, setAdding] = useState(false)
  const triggers = agent.triggers ?? []
  const save = (next: Trigger[]) => onSave({ ...agent, triggers: next })

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Triggers</h3>
        {!adding && (
          <Button
            variant="outline"
            size="sm"
            disabled={!!blocked}
            title={blocked}
            onClick={() => setAdding(true)}
          >
            <PlusIcon /> Add trigger
          </Button>
        )}
      </div>
      {triggers.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">
          Runs start only when you start them. Add a trigger to start them on a
          schedule or when something happens.
        </p>
      )}
      {triggers.length > 0 && (
        <ul className="divide-y rounded-md border">
          {triggers.map(trigger => {
            const Icon = ICONS[trigger.kind]
            const details = [
              !trigger.enabled && 'paused',
              trigger.enabled &&
                trigger.kind === 'schedule' &&
                nextRunLabel(trigger.cron),
              trigger.pluginId &&
                `on ${plugins.find(p => p.id === trigger.pluginId)?.label ?? `${trigger.pluginId} (removed)`}`,
            ].filter(Boolean)
            return (
              <li key={trigger.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  {describeTrigger(trigger, agents)}
                  {details.length > 0 && (
                    <span className="text-muted-foreground"> · {details.join(' · ')}</span>
                  )}
                </span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={trigger.enabled ? 'Pause trigger' : 'Resume trigger'}
                  disabled={!!blocked}
                  title={trigger.enabled ? 'Pause' : 'Resume'}
                  onClick={() =>
                    save(
                      triggers.map(t =>
                        t.id === trigger.id ? { ...t, enabled: !t.enabled } : t,
                      ),
                    )
                  }
                >
                  {trigger.enabled ? <PauseIcon /> : <PlayIcon />}
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete trigger"
                  disabled={!!blocked}
                  title="Delete"
                  onClick={() => save(triggers.filter(t => t.id !== trigger.id))}
                >
                  <Trash2Icon />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
      {adding && (
        <TriggerForm
          agent={agent}
          agents={agents}
          onCancel={() => setAdding(false)}
          onAdd={trigger => {
            save([...triggers, trigger])
            setAdding(false)
          }}
        />
      )}
    </section>
  )
}

const label = 'text-xs font-medium text-muted-foreground'

function TriggerForm(props: {
  agent: Template
  agents: Template[]
  onCancel: () => void
  onAdd: (trigger: Trigger) => void
}) {
  const { agent } = props
  const id = useId()
  const others = props.agents.filter(a => a.id !== agent.id)
  const names = variableNames(agent)
  const [kind, setKind] = useState<Trigger['kind']>('schedule')
  const [cron, setCron] = useState(SCHEDULE_PRESETS[1].cron)
  const [minSeverity, setMinSeverity] = useState<Severity>(3)
  const [source, setSource] = useState(others[0]?.id ?? '')
  const { plugins } = useShell()
  // Empty means the orchestrator for a detection, and the steps' own targets otherwise.
  const [pluginId, setPluginId] = useState('')
  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...agent.examples,
  }))

  let next: string | undefined
  let cronError: string | undefined
  try {
    const at = nextRun(cron)
    next = at ? formatStarted(at.getTime()) : undefined
  } catch {
    cronError = 'Not a valid cron pattern.'
  }
  const missing = names.filter(name => !values[name]?.trim())
  const problem =
    (kind === 'schedule' && cronError) ||
    (kind === 'agent' && !source && 'There is no other agent to follow.') ||
    (missing.length > 0 && `Fill in ${missing.join(', ')}.`) ||
    undefined

  const add = () => {
    const base = {
      id: crypto.randomUUID(),
      ...(pluginId && { pluginId }),
      enabled: true,
      values: Object.fromEntries(names.map(name => [name, values[name].trim()])),
    }
    if (kind === 'schedule') props.onAdd({ ...base, kind, cron: cron.trim() })
    if (kind === 'detection') props.onAdd({ ...base, kind, minSeverity })
    if (kind === 'agent') props.onAdd({ ...base, kind, agentId: source })
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border p-4 text-sm">
      <div className="flex flex-col gap-1.5">
        <span className={label}>Start a run</span>
        <Select value={kind} onValueChange={v => setKind(v as Trigger['kind'])}>
          <SelectTrigger className="w-64" aria-label="Trigger kind">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="schedule">On a schedule</SelectItem>
            <SelectItem value="detection">On a new detection</SelectItem>
            <SelectItem value="agent">After another agent completes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {plugins.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <span className={label}>
            {kind === 'detection' ? 'Tenant to watch' : 'Tenant it starts on'}
          </span>
          <Select value={pluginId || 'any'} onValueChange={v => setPluginId(v === 'any' ? '' : v)}>
            <SelectTrigger className="w-64" aria-label="Tenant">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">
                {kind === 'detection' ? 'The orchestrator' : 'Whichever the steps name'}
              </SelectItem>
              {plugins.map(plugin => (
                <SelectItem key={plugin.id} value={plugin.id}>
                  {plugin.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {kind === 'schedule' && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-cron`} className={label}>
            Schedule (cron, local time)
          </label>
          <div className="flex flex-wrap gap-2">
            {SCHEDULE_PRESETS.map(preset => (
              <Button
                key={preset.cron}
                size="sm"
                variant={preset.cron === cron ? 'secondary' : 'outline'}
                onClick={() => setCron(preset.cron)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Input
            id={`${id}-cron`}
            className="w-64 font-mono"
            value={cron}
            onChange={e => setCron(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {cronError ?? (next && `Next run: ${next}`)}
          </p>
        </div>
      )}

      {kind === 'detection' && (
        <div className="flex flex-col gap-1.5">
          <span className={label}>Lowest severity</span>
          <Select
            value={String(minSeverity)}
            onValueChange={v => setMinSeverity(Number(v) as Severity)}
          >
            <SelectTrigger className="w-64" aria-label="Lowest severity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SEVERITIES).map(([value, name]) => (
                <SelectItem key={value} value={value}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            The app checks for new detections every minute while it runs. Each
            one starts a run with the detection in its prompt.
          </p>
        </div>
      )}

      {kind === 'agent' && (
        <div className="flex flex-col gap-1.5">
          <span className={label}>Agent</span>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-64" aria-label="Agent to follow">
              <SelectValue placeholder="No other agents" />
            </SelectTrigger>
            <SelectContent>
              {others.map(other => (
                <SelectItem key={other.id} value={other.id}>
                  {other.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Each completed run of that agent starts one here, with its final
            answer in the prompt.
          </p>
        </div>
      )}

      {names.length > 0 && (
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
          {names.map(name => (
            <Fragment key={name}>
              <label
                htmlFor={`${id}-${name}`}
                className="font-mono text-xs text-muted-foreground"
              >
                {name}
              </label>
              <Input
                id={`${id}-${name}`}
                value={values[name] ?? ''}
                onChange={e => setValues({ ...values, [name]: e.target.value })}
              />
            </Fragment>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 text-xs text-muted-foreground">
          {problem ?? 'Runs start while the app is running.'}
        </span>
        <Button size="sm" variant="ghost" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!!problem} onClick={add}>
          Add trigger
        </Button>
      </div>
    </div>
  )
}
