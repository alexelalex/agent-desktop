import {
  BookmarkPlusIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDotIcon,
  CircleIcon,
  CircleMinusIcon,
  ListTodoIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Spinner } from '@/components/ui/spinner'
import { operationFor, type SpecOperation } from '@/lib/spec'
import { progress, type Step } from '@/lib/todo'
import { cn } from '@/lib/utils'

function StatusIcon(props: { status: Step['status']; live: boolean }) {
  switch (props.status) {
    case 'in_progress':
      return props.live ? (
        <Spinner className="text-muted-foreground" />
      ) : (
        <CircleDotIcon className="size-4" />
      )
    case 'done':
      return <CircleCheckIcon className="size-4 text-green-600" />
    case 'blocked':
      return <CircleAlertIcon className="size-4 text-red-600" />
    case 'skipped':
      return <CircleMinusIcon className="size-4 text-muted-foreground" />
    default:
      return <CircleIcon className="size-4 text-muted-foreground" />
  }
}

// The latest SubagentCard for a step; a retried step has several.
function scrollToRun(stepId: string) {
  const cards = document.querySelectorAll(`[data-step="${CSS.escape(stepId)}"]`)
  cards[cards.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function TodoList(props: {
  steps: Step[]
  operations?: Map<string, SpecOperation>
  /** Step id → whether a subagent is working on it now. */
  runs?: Map<string, boolean>
  live: boolean
}) {
  const { steps, operations, runs, live } = props
  return (
    <ol className="flex flex-col gap-3">
      {steps.map(step => (
        <li key={step.id} className="flex gap-2">
          <span className="mt-0.5 shrink-0">
            <StatusIcon status={step.status} live={live} />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p
              className={cn(
                'text-sm',
                step.status === 'skipped' &&
                'text-muted-foreground line-through',
              )}
            >
              {step.title}
            </p>
            <div className="flex flex-wrap gap-1">
              {step.tools.map(name => {
                // Groups don't resolve to an operation; named operations do.
                const op = operationFor(operations, name)
                const writes = op !== undefined && op.method !== 'GET'
                return (
                  <Badge
                    key={name}
                    variant="outline"
                    className={cn('font-mono', writes && 'text-yellow-600')}
                    title={writes ? 'Asks for your approval' : undefined}
                  >
                    {op ? `${op.method} ${op.path}` : name}
                  </Badge>
                )
              })}
              {runs?.has(step.id) ? (
                <Badge variant="secondary" asChild>
                  <button type="button" onClick={() => scrollToRun(step.id)}>
                    {runs.get(step.id) && <Spinner />}
                    subagent
                  </button>
                </Badge>
              ) : (
                step.assignee === 'subagent' && (
                  <Badge variant="secondary">subagent</Badge>
                )
              )}
            </div>
            {step.note && (
              <p className="text-xs text-muted-foreground">{step.note}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** The chat's current plan, pinned above the prompt input. */
export function TodoPanel(props: {
  goal?: string
  steps: Step[]
  operations?: Map<string, SpecOperation>
  runs: Map<string, boolean>
  live: boolean
  onSaveTemplate?: () => void
}) {
  const { onSaveTemplate, goal, ...listProps } = props
  const { done, total } = progress(props.steps)
  const complete = done === total

  // Open while there is work left, closed once every step is settled.
  const [open, setOpen] = useState(!complete)
  useEffect(() => setOpen(!complete), [complete])

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-md border"
    >
      <div className="flex items-center pr-1">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center justify-between gap-4 px-3 py-2 text-sm">
          <span className="flex items-center gap-2 min-w-0">
            <ListTodoIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-medium truncate" title={goal}>{goal || 'Plan'}</span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {done} of {total} done
            </span>
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        {onSaveTemplate && (
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Save as template"
            title="Save as template"
            onClick={onSaveTemplate}
          >
            <BookmarkPlusIcon />
          </Button>
        )}
      </div>
      <CollapsibleContent className="max-h-64 overflow-y-auto border-t px-3 py-3">
        <TodoList {...listProps} />
      </CollapsibleContent>
    </Collapsible>
  )
}
