import { useEffect, useMemo, useState } from 'react'
import { ChevronRightIcon, GitBranchIcon, PickaxeIcon, TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ipcError } from '@/components/RetryParts'
import { SuggestionList, useDecide } from '@/components/Suggestions'
import { Spinner } from '@/components/ui/spinner'
import { resolvePrompt, type ArtifactAction, type ClaudeCodeArtifact } from '@/lib/claude-code'
import type { RunSummary, TaskPreview } from '@/lib/desktop'
import { effectivePrompt, suggestionsOf, waiting } from '@/lib/dig'
import { useShell } from '@/lib/plugins'
import { actionDigs, isActive, plural } from '@/lib/tasks'
import { cn } from '@/lib/utils'

interface Row {
  action: ArtifactAction
  checked: boolean
  title: string
  /** The user's edit; until then the row follows the prompt as accepted suggestions change it. */
  prompt?: string
  open: boolean
  error?: string
}

const basename = (dir: string) => dir.replace(/\/+$/, '').split('/').at(-1) ?? dir

/** Review, edit and launch one action or several, each as a task. */
export function TaskLaunchDialog(props: {
  parentRunId: string
  /** The parent, which holds the digs' suggestions. */
  run?: RunSummary
  /** Its tasks and digs. */
  tasks: RunSummary[]
  onDig: (actionId: string) => void
  artifact: ClaudeCodeArtifact
  actions: ArtifactAction[]
  /** `launched` is the first action that became a task, for focus. */
  onClose: (launched?: string) => void
}) {
  const { parentRunId, artifact } = props
  const { claudeCode } = useShell()
  const acceptEdits = !!claudeCode?.found?.acceptEdits
  const [rows, setRows] = useState<Row[]>(() =>
    props.actions.map(action => ({
      action,
      checked: true,
      title: action.title,
      open: props.actions.length === 1,
    })),
  )
  const { error: decideError, decide } = useDecide(parentRunId)
  // The prompt a row launches without edits: the agent's, with accepted suggestions.
  const promptOf = (action: ArtifactAction) =>
    effectivePrompt(
      resolvePrompt(artifact, action) ?? '',
      suggestionsOf(props.run, artifact.id, action.id),
    )
  const textOf = (row: Row) => row.prompt ?? promptOf(row.action).text
  const [previews, setPreviews] = useState<Map<string, TaskPreview>>(new Map())
  const [launching, setLaunching] = useState(false)
  const [launchedCount, setLaunchedCount] = useState<{ done: number; of: number }>()
  const [error, setError] = useState<string>()
  const [firstLaunched, setFirstLaunched] = useState<string>()

  // The window re-renders as tasks run; the actions shown don't change.
  const actionIds = props.actions.map(a => a.id).join('\n')
  useEffect(() => {
    let live = true
    void window.desktop.claudeCode
      .preview(
        parentRunId,
        actionIds.split('\n').map(actionId => ({ artifactId: artifact.id, actionId })),
      )
      .then(list => live && setPreviews(new Map(list.map(p => [p.actionId, p]))))
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [parentRunId, artifact.id, actionIds])

  const checked = rows.filter(r => r.checked)
  const blocked = checked.length === 0 || checked.some(r => !r.title.trim() || !textOf(r).trim())

  // Rows without a worktree that edit the same checkout, here or in running tasks.
  const sharing = useMemo(() => {
    const byTop = new Map<string, number>()
    for (const row of checked) {
      const top = previews.get(row.action.id)?.top
      if (top) byTop.set(top, (byTop.get(top) ?? 0) + 1)
    }
    return byTop
  }, [checked, previews])

  const update = (index: number, change: Partial<Row>) =>
    setRows(list => list.map((r, i) => (i === index ? { ...r, ...change } : r)))

  const launch = async () => {
    if (blocked || launching) return
    setLaunching(true)
    setError(undefined)
    try {
      const results = await window.desktop.claudeCode.launch(
        parentRunId,
        checked.map(r => ({
          artifactId: artifact.id,
          actionId: r.action.id,
          title: r.title,
          text: textOf(r),
        })),
      )
      const first = results.find(r => r.runId)?.actionId
      const failed = new Map(results.filter(r => r.error).map(r => [r.actionId, r.error!]))
      if (failed.size === 0) return props.onClose(first ?? firstLaunched)
      setFirstLaunched(f => f ?? first)
      setLaunchedCount({ done: results.length - failed.size, of: results.length })
      setRows(list =>
        list
          .filter(r => r.checked && failed.has(r.action.id))
          .map(r => ({ ...r, error: failed.get(r.action.id) })),
      )
    } catch (e) {
      setError(ipcError(e))
    } finally {
      setLaunching(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => !open && props.onClose(firstLaunched)}>
      <DialogContent
        className="flex max-h-[85vh] flex-col sm:max-w-[720px]"
        onCloseAutoFocus={e => e.preventDefault()}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            void launch()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {props.actions.length === 1 ? 'Launch a task' : `Launch ${plural(props.actions.length, 'task')}`}
          </DialogTitle>
          <DialogDescription>
            Each runs as its own Claude Code session under this one. Edits to a prompt apply to this
            launch only.
          </DialogDescription>
        </DialogHeader>
        <ul className="-mx-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4">
          {rows.map((row, index) => {
            const preview = previews.get(row.action.id)
            const effective = promptOf(row.action)
            const text = row.prompt ?? effective.text
            const edited = row.prompt !== undefined && row.prompt !== effective.text
            const pending = waiting(suggestionsOf(props.run, artifact.id, row.action.id), props.run)
            const dig = actionDigs(props.tasks, artifact.id, row.action.id).at(-1)
            const digging = !!dig && isActive(dig)
            const shared = preview?.top
              ? (sharing.get(preview.top) ?? 0) + (preview.sharedRunning ?? 0)
              : 0
            return (
              <li key={row.action.id} className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  {rows.length > 1 && (
                    <input
                      type="checkbox"
                      className="size-4 shrink-0 accent-primary"
                      aria-label={`Launch ${row.title || row.action.label}`}
                      checked={row.checked}
                      onChange={e => update(index, { checked: e.target.checked })}
                    />
                  )}
                  <Input
                    aria-label="Task title"
                    value={row.title}
                    maxLength={200}
                    onChange={e => update(index, { title: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {preview?.error ? (
                    <p className="text-destructive">{preview.error}</p>
                  ) : preview?.repo ? (
                    <>
                      <p className="flex flex-wrap items-center gap-1">
                        <GitBranchIcon className="size-3.5" />
                        New worktree of <code className="font-mono">{preview.repo}</code> from{' '}
                        <code className="font-mono">{preview.base}</code> @{' '}
                        <code className="font-mono">{preview.commit?.slice(0, 7)}</code>, branch{' '}
                        <code className="font-mono">{preview.branch}</code>
                      </p>
                      <p>
                        Ignored files, such as dependencies and .env, aren't in a new worktree,
                        and neither are the checkout's uncommitted changes
                        {preview.dirty ? ` (${plural(preview.dirty, 'file')} here)` : ''}.
                      </p>
                      {!acceptEdits && (
                        <p className="text-amber-600 dark:text-amber-400">
                          Edits will ask: this Claude Code lacks acceptEdits.
                        </p>
                      )}
                    </>
                  ) : (
                    <p>
                      Runs in <code className="font-mono break-all">{preview?.cwd ?? row.action.cwd ?? '…'}</code>
                    </p>
                  )}
                  {row.checked && shared > 1 && preview?.top && (
                    <p className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <TriangleAlertIcon className="size-3.5" />
                      {shared} tasks will edit <code className="font-mono">{basename(preview.top)}</code>{' '}
                      at the same time
                    </p>
                  )}
                  {effective.applied.length > 0 && (
                    <p>The prompt includes {plural(effective.applied.length, 'accepted suggestion')}.</p>
                  )}
                  {effective.unapplied.length > 0 && (
                    <p className="text-amber-600 dark:text-amber-400">
                      {plural(effective.unapplied.length, 'accepted suggestion')} no longer{' '}
                      {effective.unapplied.length === 1 ? 'fits' : 'fit'} the prompt, so{' '}
                      {effective.unapplied.length === 1 ? "it's" : "they're"} left out.
                    </p>
                  )}
                  {row.error && <p className="text-destructive">{row.error}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    aria-expanded={row.open}
                    onClick={() => update(index, { open: !row.open })}
                  >
                    <ChevronRightIcon className={cn('transition-transform', row.open && 'rotate-90')} />
                    Prompt
                    {edited && <span className="text-amber-600 dark:text-amber-400">· Edited</span>}
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="ml-auto"
                    disabled={digging}
                    title="A read-only session looks into this prompt and suggests changes"
                    onClick={() => props.onDig(row.action.id)}
                  >
                    {digging ? <Spinner className="size-3" /> : <PickaxeIcon />}
                    {digging ? 'Digging' : dig ? 'Dig again' : 'Dig'}
                  </Button>
                </div>
                {pending.length > 0 && (
                  <SuggestionList suggestions={pending} parent={props.run} onDecide={decide} />
                )}
                {row.open && (
                  <div className="flex flex-col gap-1">
                    <Textarea
                      aria-label={`Prompt for ${row.title || row.action.label}`}
                      className="max-h-[calc(16lh+1rem)] min-h-24 font-mono text-xs"
                      value={text}
                      onChange={e => update(index, { prompt: e.target.value })}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{text.length.toLocaleString()} characters</span>
                      {edited && (
                        <Button
                          variant="link"
                          size="xs"
                          className="h-auto p-0"
                          onClick={() => update(index, { prompt: undefined })}
                        >
                          {effective.applied.length > 0 ? 'Reset' : "Reset to agent's prompt"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        {(error ?? decideError) && (
          <Alert variant="destructive">
            <AlertDescription>{error ?? decideError}</AlertDescription>
          </Alert>
        )}
        <DialogFooter className="items-center">
          {launchedCount && (
            <p className="mr-auto text-sm text-muted-foreground">
              Launched {launchedCount.done} of {launchedCount.of}
            </p>
          )}
          <Button variant="outline" onClick={() => props.onClose(firstLaunched)}>
            Cancel
          </Button>
          <Button disabled={blocked || launching} onClick={() => void launch()}>
            Launch {checked.length}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
