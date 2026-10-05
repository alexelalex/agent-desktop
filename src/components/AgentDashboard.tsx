import { ArrowLeftIcon, BellIcon, PencilIcon, PlayIcon, Trash2Icon } from 'lucide-react'
import { Fragment } from 'react'
import { RunStatusIcon, runStatusLabel } from '@/components/RunStatus'
import { TemplateIcon } from '@/components/TemplateStage'
import { TodoList } from '@/components/TodoPanel'
import { Triggers } from '@/components/Triggers'
import { Button } from '@/components/ui/button'
import type { RunSummary, RunTrigger } from '@/lib/desktop'
import { formatDuration, formatStarted } from '@/lib/format'
import type { SpecOperation } from '@/lib/spec'
import { expandTargets, STATUS_LABELS, useShell } from '@/lib/plugins'
import { useChannels } from '@/lib/store'
import { goalOf, variableNames, type Template } from '@/lib/templates'

const TRIGGERS: Record<RunTrigger, string> = {
  manual: 'Manual',
  schedule: 'Schedule',
  event: 'Event',
}

const LATEST = 20

/** An agent's configuration, triggers and latest runs. */
export function AgentDashboard(props: {
  agent: Template
  /** Every agent, for triggers that follow another one. */
  agents: Template[]
  runs: RunSummary[]
  operations?: Map<string, SpecOperation>
  onSave: (agent: Template) => void
  onStartRun: () => void
  onEdit: () => void
  onDelete: () => void
  onOpenRun: (runId: string) => void
  /** Set on a small window, where the session list takes the dashboard's place. */
  onBack?: () => void
}) {
  const { agent, runs, operations } = props
  const { blocked, plugins, groups } = useShell()
  // Groups expand when a run starts, so this is what the next run reaches.
  const targets = [...new Set((agent.steps ?? []).flatMap(s => s.targets ?? []))]
  const covers = expandTargets(targets, plugins, groups).map(p =>
    p.status === 'ready'
      ? `${p.label}${p.defaultScopeLabel ? ` · ${p.defaultScopeLabel}` : ''}`
      : `${p.label} (${STATUS_LABELS[p.status].toLowerCase()}, skipped)`,
  )
  const names = variableNames(agent)
  const isPlan = agent.kind === 'plan' && !!agent.steps?.length
  const summary = [
    isPlan ? `Plan · ${agent.steps?.length} steps` : 'Prompt',
    names.length > 0 && `${names.length} ${names.length === 1 ? 'variable' : 'variables'}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
        {props.onBack && (
          <Button variant="ghost" size="sm" className="-mb-4 self-start" onClick={props.onBack}>
            <ArrowLeftIcon /> Sessions
          </Button>
        )}
        <header className="flex flex-wrap items-center gap-3">
          <TemplateIcon kind={agent.kind} className="size-5" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">{agent.name}</h2>
            <p className="text-xs text-muted-foreground">{summary}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={props.onEdit}>
              <PencilIcon /> Edit
            </Button>
            <Button size="sm" disabled={!!blocked} title={blocked} onClick={props.onStartRun}>
              <PlayIcon /> New run
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete agent"
              title="Delete agent"
              onClick={props.onDelete}
            >
              <Trash2Icon />
            </Button>
          </div>
        </header>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Configuration</h3>
          <div className="flex flex-col gap-4 rounded-md border p-4 text-sm">
            <p className="whitespace-pre-wrap">
              <span className="text-muted-foreground">
                {isPlan ? 'Goal: ' : 'Prompt: '}
              </span>
              {isPlan ? goalOf(agent.prompt) : agent.prompt}
            </p>
            {isPlan && agent.steps && (
              <TodoList steps={agent.steps} operations={operations} live={false} />
            )}
            {targets.length > 0 && (
              <p>
                <span className="text-muted-foreground">Next run covers: </span>
                {covers.join(', ') || 'no plugins yet'}
              </p>
            )}
            {names.length > 0 && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                {names.map(name => (
                  <Fragment key={name}>
                    <dt className="font-mono text-xs text-muted-foreground">
                      {name}
                    </dt>
                    <dd className="text-xs">
                      {agent.examples[name] ? (
                        <>
                          <span className="text-muted-foreground">e.g. </span>
                          {agent.examples[name]}
                        </>
                      ) : (
                        <span className="text-muted-foreground">No example</span>
                      )}
                    </dd>
                  </Fragment>
                ))}
              </dl>
            )}
          </div>
        </section>

        <Triggers
          agent={agent}
          agents={props.agents}
          onSave={props.onSave}
        />

        <Notifications agent={agent} onSave={props.onSave} />

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Latest runs</h3>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No runs yet. Start one with New run.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Trigger</th>
                    <th className="px-3 py-2 font-medium">Started</th>
                    <th className="px-3 py-2 font-medium">Duration</th>
                    <th className="px-3 py-2 text-right font-medium">Tool calls</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.slice(0, LATEST).map(run => (
                    <tr
                      key={run.id}
                      className="cursor-pointer border-b last:border-0 hover:bg-muted"
                      onClick={() => props.onOpenRun(run.id)}
                    >
                      <td className="px-3 py-2">
                        {/* The row handles the click; the button makes it reachable by keyboard. */}
                        <button className="flex items-center gap-2 whitespace-nowrap">
                          <RunStatusIcon status={run.status} />
                          {runStatusLabel(run.status)}
                        </button>
                      </td>
                      <td className="px-3 py-2">{TRIGGERS[run.trigger]}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatStarted(run.createdAt)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {run.status === 'running'
                          ? '…'
                          : formatDuration(run.updatedAt - run.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-right">{run.toolCalls}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

/** Where each completed run's artifacts go; set from a run's artifact panel. */
function Notifications(props: {
  agent: Template
  onSave: (agent: Template) => void
}) {
  const { agent, onSave } = props
  const channels = useChannels()
  const subscriptions = agent.notifications ?? []
  const nameOf = (id: string) =>
    channels.find(c => c.id === id)?.name ?? 'Deleted channel'
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">Notifications</h3>
      {subscriptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing is sent yet. Open an artifact of one of its runs and choose
          Notify to send it on every run.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {subscriptions.map(subscription => (
            <li
              key={subscription.artifactId}
              className="flex items-center gap-3 px-3 py-2 text-sm"
            >
              <BellIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="font-mono text-xs">{subscription.artifactId}</span>
                <span className="text-muted-foreground"> → </span>
                {subscription.channelIds.map(nameOf).join(', ')}
              </span>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Stop sending ${subscription.artifactId}`}
                title="Stop sending"
                onClick={() =>
                  onSave({
                    ...agent,
                    notifications: subscriptions.filter(
                      s => s.artifactId !== subscription.artifactId,
                    ),
                  })
                }
              >
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
