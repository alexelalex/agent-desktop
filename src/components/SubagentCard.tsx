import type { DynamicToolUIPart } from 'ai'
import { useEffect, useState, type ReactNode } from 'react'
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
} from '@/components/ai-elements/tool'
import { Badge } from '@/components/ui/badge'
import { isUnfinished, type DelegateInput, type SubagentRun } from '@/lib/delegate'
import type { Step } from '@/lib/todo'

const TITLE_LENGTH = 80

const STATUS: Record<SubagentRun['status'], string> = {
  running: 'Running',
  done: 'Done',
  failed: 'Failed',
  skipped: 'Skipped',
}

/** One tenant's subagent in a fan-out: where it ran, its status, and its trace. */
function RunRow(props: { run: SubagentRun; live: boolean; children?: ReactNode }) {
  const { run } = props
  const status = run.status === 'running' && !props.live ? 'Stopped' : STATUS[run.status]
  const [open, setOpen] = useState(false)
  const where = run.scopeLabel ? `${run.label} · ${run.scopeLabel}` : run.label
  return (
    <div className="rounded-md border px-3 py-2 text-sm">
      <button
        className="flex w-full items-center gap-2 text-left"
        onClick={() => setOpen(!open)}
        disabled={!run.message}
      >
        <span className="min-w-0 flex-1 truncate">
          {where} · {status}
          {run.reason && `: ${run.reason}`}
        </span>
      </button>
      {open && run.message && <div className="mt-2 border-l pl-4">{props.children}</div>}
    </div>
  )
}

/** A `delegate` call; `children` renders the subagent's run as it streams, or `runs` one per tenant. */
export function SubagentCard(props: {
  part: DynamicToolUIPart
  /** The plan step this run works on, when it was delegated by `stepId`. */
  step?: Step
  /** False once the turn has ended, e.g. after Stop. */
  live: boolean
  children?: ReactNode
  /** A fan-out's runs, one per tenant, each with its own trace. */
  runs?: SubagentRun[]
  renderRun?: (message: NonNullable<SubagentRun['message']>, index: number) => ReactNode
}) {
  const { part, step, live, children, runs } = props
  const input = (part.input ?? {}) as DelegateInput
  const task = step?.title ?? input.task ?? input.stepId
  const groups = input.groups ?? step?.tools
  const truncated = task !== undefined && task.length > TITLE_LENGTH
  const unfinished = isUnfinished(part)
  const running = live && unfinished
  const stopped = !live && unfinished
  const errorText = stopped
    ? 'Stopped before the subagent finished.'
    : part.state === 'output-error'
      ? part.errorText
      : undefined

  // Open while the subagent works, closed once it has reported; a fan-out's rows stay in view.
  const fanOut = !!runs
  const [open, setOpen] = useState(running || fanOut)
  useEffect(() => {
    if (!fanOut) setOpen(running)
  }, [running, fanOut])

  return (
    <Tool open={open} onOpenChange={setOpen} data-step={input.stepId}>
      <ToolHeader
        type="dynamic-tool"
        state={
          stopped ? 'output-error' : running ? 'input-available' : part.state
        }
        toolName={part.toolName}
        title={
          task
            ? `Subagent: ${truncated ? `${task.slice(0, TITLE_LENGTH - 1)}…` : task}`
            : 'Subagent'
        }
        className="text-left"
      />
      <ToolContent>
        {truncated && <p className="text-sm text-muted-foreground">{task}</p>}
        {input.brief && (
          <p className="text-sm text-muted-foreground">{input.brief}</p>
        )}
        {groups && groups.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {groups.map(group => (
              <Badge key={group} variant="outline" className="font-mono">
                {group}
              </Badge>
            ))}
          </div>
        )}
        {runs ? (
          <div className="flex flex-col gap-2">
            {runs.map((run, index) => (
              <RunRow key={`${run.plugin}-${index}`} run={run} live={live}>
                {run.message && props.renderRun?.(run.message, index)}
              </RunRow>
            ))}
          </div>
        ) : (
          <div className="border-l pl-4">{children}</div>
        )}
        <ToolOutput output={undefined} errorText={errorText} />
      </ToolContent>
    </Tool>
  )
}
