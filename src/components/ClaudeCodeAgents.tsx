import {
  BotIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  CircleMinusIcon,
  CircleXIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Spinner } from '@/components/ui/spinner'
import type { ClaudeCodeAgent } from '@/lib/desktop'
import { cn } from '@/lib/utils'

/** A Claude Code session's subagents, from the main process, while any runs. */
export function useClaudeCodeAgents(runId: string, enabled: boolean) {
  const [agents, setAgents] = useState<ClaudeCodeAgent[]>([])
  useEffect(() => {
    setAgents([])
    if (!enabled) return
    let live = true
    const unsubscribe = window.desktop.claudeCode.onAgents(change => {
      if (change.runId === runId) setAgents(change.agents)
    })
    void window.desktop.claudeCode.agents(runId).then(list => live && setAgents(list))
    return () => {
      live = false
      unsubscribe()
    }
  }, [runId, enabled])
  return agents
}

const tokens = (n: number) => (n < 1000 ? `${n}` : `${(n / 1000).toFixed(1)}k`)

function elapsed(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}

function StatusIcon(props: { status: ClaudeCodeAgent['status'] }) {
  switch (props.status) {
    case 'running':
      return <Spinner className="size-3.5 text-muted-foreground" />
    case 'completed':
      return <CircleCheckIcon className="size-3.5 text-green-600" />
    case 'failed':
      return <CircleXIcon className="size-3.5 text-destructive" />
    default:
      return <CircleMinusIcon className="size-3.5 text-muted-foreground" />
  }
}

/** The session's running subagents, pinned above the prompt input as Claude Code shows them. */
export function ClaudeCodeAgents(props: { agents: ClaudeCodeAgent[] }) {
  const { agents } = props
  const running = agents.filter(a => a.status === 'running').length
  const [open, setOpen] = useState(true)
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (running === 0) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running])
  if (agents.length === 0) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-3 py-2 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          <BotIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="font-medium">
            {running} {running === 1 ? 'agent' : 'agents'} running
          </span>
          {agents.length > running && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {agents.length - running} done
            </span>
          )}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="max-h-56 overflow-y-auto border-t px-3 py-2">
        <ul className="flex flex-col gap-2">
          {agents.map(agent => (
            <li
              key={agent.toolUseId}
              className="flex gap-2"
              style={{ paddingLeft: `${agent.depth}rem` }}
            >
              <span className="mt-0.5 shrink-0">
                <StatusIcon status={agent.status} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-baseline gap-2 text-sm">
                  <span
                    className={cn('truncate', agent.status !== 'running' && 'text-muted-foreground')}
                  >
                    {agent.description}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {[agent.agentType, agent.background && 'background'].filter(Boolean).join(' · ')}
                  </span>
                </p>
                <p className="flex min-w-0 items-baseline justify-between gap-3 text-xs text-muted-foreground">
                  <span className="truncate font-mono">{agent.activity}</span>
                  <span className="shrink-0 tabular-nums">
                    {agent.toolUses} tool {agent.toolUses === 1 ? 'use' : 'uses'} ·{' '}
                    {tokens(agent.tokens)} tokens ·{' '}
                    {elapsed((agent.finishedAt ?? now) - agent.startedAt)}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
