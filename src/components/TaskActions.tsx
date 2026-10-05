import { createContext, useContext, type ReactNode } from 'react'
import { EllipsisIcon, PencilLineIcon, PlayIcon } from 'lucide-react'
import { RunStatusIcon, runStatusLabel } from '@/components/RunStatus'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  promptHash,
  resolvePrompt,
  type ArtifactAction,
  type ClaudeCodeArtifact,
} from '@/lib/claude-code'
import type { RunSummary } from '@/lib/desktop'
import { effectivePrompt, suggestionsOf, waiting } from '@/lib/dig'
import { actionDigs, actionTasks, isActive, selectable, shownTask, taskOf } from '@/lib/tasks'
import { cn } from '@/lib/utils'

/** What an artifact's actions need from the session that shows them. */
export interface ActionsContextValue {
  artifact: ClaudeCodeArtifact
  /** The session the artifact is in, which holds its digs' suggestions. */
  run?: RunSummary
  /** The session's direct tasks and digs. */
  tasks: RunSummary[]
  /** Why no action can be launched now, if so. */
  disabled?: string
  selected: Set<string>
  /** Checkboxes show while two or more actions can be launched. */
  selecting: boolean
  onSelect: (actionId: string, on: boolean) => void
  onLaunch: (actionIds: string[]) => void
  onOpen: (runId: string) => void
  onStop: (runId: string) => void
  onDig: (actionId: string) => void
  /** Opens the action's suggestions. */
  onReview: (actionId: string) => void
  /** Why the last dig didn't start. */
  notice?: string
}

export const ActionsContext = createContext<ActionsContextValue | undefined>(undefined)

export const actionKey = (artifactId: string, actionId: string) => `${artifactId}/${actionId}`

function copy(text: string) {
  void navigator.clipboard?.writeText(text)
}

const firstLine = (text?: string) => text?.split('\n')[0]

/** One action: its button, or its newest task's status, with the ⋯ menu. */
export function ActionControl(props: { action: ArtifactAction }) {
  const context = useContext(ActionsContext)
  if (!context) return null
  const { action } = props
  const { artifact, disabled } = context
  const tasks = actionTasks(context.tasks, artifact.id, action.id)
  const shown = shownTask(tasks)
  const dig = actionDigs(context.tasks, artifact.id, action.id).at(-1)
  const digging = !!dig && isActive(dig)
  const suggestions = suggestionsOf(context.run, artifact.id, action.id)
  const pending = waiting(suggestions, context.run)
  const agentPrompt = resolvePrompt(artifact, action)
  // What a task gets: the agent's prompt with the accepted suggestions.
  const prompt = agentPrompt === undefined ? undefined : effectivePrompt(agentPrompt, suggestions).text
  const name = `${action.label}: ${action.title}`
  const canSelect = context.selecting && !disabled && selectable(tasks)
  const newest = tasks.at(-1)
  const changed =
    newest && prompt !== undefined && taskOf(newest)?.promptHash !== promptHash(prompt)
  const stoppable = shown && ['running', 'queued', 'awaiting_approval'].includes(shown.status)
  return (
    <span
      data-action={actionKey(artifact.id, action.id)}
      className="inline-flex max-w-full items-center gap-1 rounded-md align-middle ring-offset-2 ring-offset-background transition-shadow duration-500 data-flash:ring-2 data-flash:ring-ring"
    >
      {canSelect && (
        <input
          type="checkbox"
          className="size-3.5 shrink-0 accent-primary"
          aria-label={`Select ${name}`}
          checked={context.selected.has(action.id)}
          onChange={e => context.onSelect(action.id, e.target.checked)}
        />
      )}
      {shown ? (
        <Button
          variant="outline"
          size="xs"
          className="min-w-0"
          aria-label={`${name} · ${runStatusLabel(shown.status)}${tasks.length > 1 ? ` · ${tasks.length} tasks` : ''}`}
          title={firstLine(taskOf(shown)?.outcome?.answer) ?? runStatusLabel(shown.status)}
          onClick={() => context.onOpen(shown.id)}
        >
          <RunStatusIcon status={shown.status} className="size-3" />
          <span className="truncate">{runStatusLabel(shown.status)}</span>
          {tasks.length > 1 && <span className="text-muted-foreground">· {tasks.length}</span>}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="xs"
          className="min-w-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          aria-label={name}
          aria-disabled={disabled ? true : undefined}
          title={disabled ?? action.title}
          onClick={() => !disabled && context.onLaunch([action.id])}
        >
          <PlayIcon className="size-3" />
          <span className="truncate">{action.label}</span>
        </Button>
      )}
      {digging ? (
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground"
          aria-label={`Digging into ${name}`}
          title="Open the dig"
          onClick={() => context.onOpen(dig.id)}
        >
          <Spinner className="size-3" />
          Digging
        </Button>
      ) : (
        pending.length > 0 && (
          <Button
            variant="ghost"
            size="xs"
            aria-label={`${pending.length} suggested ${pending.length === 1 ? 'change' : 'changes'} for ${name}`}
            title="Review what the dig suggests"
            onClick={() => context.onReview(action.id)}
          >
            <PencilLineIcon className="size-3" />
            {pending.length}
          </Button>
        )
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label={`More for ${name}`} title="More">
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto max-w-80 min-w-48" align="start">
          {[...tasks].reverse().map(task => (
            <DropdownMenuItem key={task.id} onSelect={() => context.onOpen(task.id)}>
              <RunStatusIcon status={task.status} />
              <span className="truncate">Open {task.title}</span>
              <span className="ml-auto pl-2 text-xs text-muted-foreground">
                {runStatusLabel(task.status)}
              </span>
            </DropdownMenuItem>
          ))}
          {tasks.length > 0 && (
            <DropdownMenuItem
              disabled={!!disabled}
              title={disabled}
              onSelect={() => context.onLaunch([action.id])}
            >
              Launch again
            </DropdownMenuItem>
          )}
          {stoppable && (
            <DropdownMenuItem onSelect={() => context.onStop(shown.id)}>Stop</DropdownMenuItem>
          )}
          <DropdownMenuItem
            disabled={!!disabled || digging}
            title={disabled}
            onSelect={() => context.onDig(action.id)}
          >
            {dig ? 'Dig again' : 'Dig'}
          </DropdownMenuItem>
          {dig && (
            <DropdownMenuItem onSelect={() => context.onOpen(dig.id)}>
              <span className="truncate">Open dig</span>
              <span className="ml-auto pl-2 text-xs text-muted-foreground">
                {runStatusLabel(dig.status)}
              </span>
            </DropdownMenuItem>
          )}
          {suggestions.some(s => s.status !== 'superseded') && (
            <DropdownMenuItem onSelect={() => context.onReview(action.id)}>
              Review suggestions
            </DropdownMenuItem>
          )}
          <DropdownMenuItem disabled={prompt === undefined} onSelect={() => prompt && copy(prompt)}>
            Copy prompt
          </DropdownMenuItem>
          {changed && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Prompt changed since launch
              </DropdownMenuLabel>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  )
}

/** The actions on one item, in a row. */
export function ActionRow(props: { actions: ArtifactAction[]; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', props.className)}>
      {props.actions.map(action => (
        <ActionControl key={action.id} action={action} />
      ))}
    </div>
  )
}

/** Actions with no item to sit on, at the end of the artifact. */
export function ActionsTray(props: { actions: ArtifactAction[] }) {
  if (props.actions.length === 0) return null
  return (
    <section aria-label="Actions" className="flex flex-col gap-2 border-t pt-3">
      <h3 className="text-xs font-medium text-muted-foreground">Actions</h3>
      <ActionRow actions={props.actions} />
    </section>
  )
}

/** Above an artifact with two or more launchable actions: select, then launch them together. */
export function SelectionBar(props: { launchable: string[]; children?: ReactNode }) {
  const context = useContext(ActionsContext)
  if (!context || props.launchable.length < 2) return null
  const { selected } = context
  const count = props.launchable.filter(id => selected.has(id)).length
  return (
    <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-muted/40 px-4 text-xs">
      {count === 0 ? (
        <>
          <span className="text-muted-foreground">{props.launchable.length} actions</span>
          <Button
            variant="ghost"
            size="xs"
            className="ml-auto"
            disabled={!!context.disabled}
            title={context.disabled}
            onClick={() => props.launchable.forEach(id => context.onSelect(id, true))}
          >
            Select all
          </Button>
        </>
      ) : (
        <>
          <span className="font-medium tabular-nums">
            {count} of {props.launchable.length} selected
          </span>
          <Button
            variant="ghost"
            size="xs"
            className="ml-auto"
            onClick={() => props.launchable.forEach(id => context.onSelect(id, false))}
          >
            Clear
          </Button>
          <Button
            size="xs"
            disabled={!!context.disabled}
            onClick={() => context.onLaunch(props.launchable.filter(id => selected.has(id)))}
          >
            <PlayIcon />
            Launch {count}
          </Button>
        </>
      )}
      {props.children}
    </div>
  )
}
