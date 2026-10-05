import { useEffect, useState } from 'react'
import { RunStatusIcon, runStatusLabel } from '@/components/RunStatus'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { RunSummary, WorktreeState } from '@/lib/desktop'
import { plural, taskOf } from '@/lib/tasks'

/** Removing a session that has tasks, or a task: its tasks go too unless unchecked, and each worktree is offered. */
export function RemoveSessionDialog(props: {
  run: RunSummary
  /** Every task below it, at any depth. */
  below: RunSummary[]
  onCancel: () => void
  onRemove: (options: { tasks: boolean; worktrees: string[] }) => void
}) {
  const { run, below } = props
  const [tasks, setTasks] = useState(true)
  const [states, setStates] = useState<Record<string, WorktreeState>>()
  const [chosen, setChosen] = useState<Set<string>>(new Set())
  const withWorktrees = [run, ...below].filter(r => taskOf(r)?.worktree?.path)

  useEffect(() => {
    let live = true
    const ids = withWorktrees.map(r => r.id)
    void window.desktop.claudeCode.worktreeStates(ids).then(found => {
      if (!live) return
      setStates(found)
      // Checked unless it has uncommitted changes.
      setChosen(new Set(ids.filter(id => found[id]?.exists && !found[id]?.dirty)))
    })
    return () => {
      live = false
    }
    // Asked once, when the dialog opens.
  }, [])

  const going = tasks ? [run, ...below] : [run]
  const offered = withWorktrees.filter(r => going.includes(r) && states?.[r.id]?.exists)
  const plain = below.length === 0 && withWorktrees.length === 0
  const toggle = (id: string, on: boolean) =>
    setChosen(current => {
      const next = new Set(current)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <Dialog open onOpenChange={open => !open && props.onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Remove "{run.title}"?</DialogTitle>
          <DialogDescription>
            {taskOf(run) ? 'The task' : 'The session'} leaves the list; its transcript stays where
            Claude Code keeps it. Running work stops first, and waiting approvals are denied.
          </DialogDescription>
        </DialogHeader>
        {!plain && (
          <div className="flex min-w-0 flex-col gap-3 text-sm">
            {below.length > 0 && (
              <section className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={tasks}
                    onChange={e => setTasks(e.target.checked)}
                  />
                  Also remove {plural(below.length, 'task')}
                </label>
                <ul className="ml-6 max-h-40 overflow-y-auto text-xs text-muted-foreground">
                  {below.map(task => (
                    <li key={task.id} className="flex items-center gap-1.5" title={runStatusLabel(task.status)}>
                      <RunStatusIcon status={task.status} />
                      <span className="truncate">
                        {taskOf(task)?.depth === 2 && '↳ '}
                        {task.title}
                      </span>
                    </li>
                  ))}
                </ul>
                {!tasks && (
                  <p className="ml-6 text-xs text-muted-foreground">
                    They stay at the top of the list, marked "Parent removed".
                  </p>
                )}
              </section>
            )}
            {offered.length > 0 && (
              <section className="flex flex-col gap-1.5">
                <h4 className="font-medium">Worktrees</h4>
                {offered.map(r => {
                  const state = states![r.id]
                  return (
                    <label key={r.id} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 accent-primary"
                        aria-label={`Delete worktree of ${r.title}`}
                        checked={chosen.has(r.id)}
                        onChange={e => toggle(r.id, e.target.checked)}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span>Delete worktree of {r.title}</span>
                        <span className="truncate font-mono text-xs text-muted-foreground" title={state.path}>
                          {state.path}
                        </span>
                        {state.dirty && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            It has uncommitted changes, which deleting loses.
                          </span>
                        )}
                      </span>
                    </label>
                  )
                })}
                <p className="text-xs text-muted-foreground">Branches are always kept.</p>
              </section>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={props.onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!plain && states === undefined}
            onClick={() =>
              props.onRemove({
                tasks,
                worktrees: offered.filter(r => chosen.has(r.id)).map(r => r.id),
              })
            }
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
