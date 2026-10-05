import type { UIMessage } from 'ai'
import { HistoryIcon, PencilIcon, RotateCcwIcon, TriangleAlertIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from '@/components/ai-elements/message'
import { MessageParts } from '@/components/MessageParts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { attemptsOnLine } from '@/lib/claude-code'
import type { ReplacedAttempt, RetryPreflight } from '@/lib/desktop'
import { stampsOf } from '@/lib/routing'

// Retrying a Claude Code session's user message: its actions, the check before
// anything changes, and the attempts retries replaced.

export const messageText = (message: UIMessage) =>
  message.parts.map(p => (p.type === 'text' ? p.text : '')).join('\n').trim()

/** Whether what a retry replaces did anything that can't come back by itself. */
export const atStake = (p: RetryPreflight) =>
  p.running ||
  p.files.some(f => !f.earlier) ||
  p.shellCommands.length > 0 ||
  p.subagents > 0 ||
  p.tenantChanges.length > 0

/** The message an IPC rejection carries, without Electron's wrapping. */
export const ipcError = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).replace(
    /^Error invoking remote method '[^']+': (Error: )?/,
    '',
  )

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export function UserMessageActions(props: {
  /** Why the message can't be retried, shown in place of the action's name. */
  blocked?: string
  onRetry: () => void
  onEdit: () => void
}) {
  const { blocked } = props
  // A disabled button gets no tooltip, so a blocked one only looks disabled.
  const guard = (action: () => void) => (blocked ? undefined : action)
  return (
    <MessageActions className="justify-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <MessageAction
        tooltip={blocked ?? 'Retry from here'}
        aria-disabled={!!blocked}
        className={blocked && 'opacity-50'}
        onClick={guard(props.onRetry)}
      >
        <RotateCcwIcon />
      </MessageAction>
      <MessageAction
        tooltip={blocked ?? 'Edit'}
        aria-disabled={!!blocked}
        className={blocked && 'opacity-50'}
        onClick={guard(props.onEdit)}
      >
        <PencilIcon />
      </MessageAction>
    </MessageActions>
  )
}

export function MessageEditor(props: {
  initial: string
  onCancel: () => void
  onSubmit: (text: string) => void
}) {
  const [text, setText] = useState(props.initial)
  const submit = () => text.trim() && props.onSubmit(text.trim())
  return (
    <div className="ml-auto flex w-full flex-col gap-2">
      <Textarea
        autoFocus
        aria-label="Edit message"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') props.onCancel()
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            submit()
          }
        }}
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!text.trim()} onClick={submit}>
          Send
        </Button>
      </div>
    </div>
  )
}

export function RetryDialog(props: {
  preflight: RetryPreflight
  edited: boolean
  /** The session's directory: files in it are listed by their path from there. */
  cwd?: string
  onCancel: () => void
  onConfirm: (restoreFiles: boolean) => void
}) {
  const { preflight, edited } = props
  const { files, shellCommands, subagents, tenantChanges } = preflight
  const [restoreFiles, setRestoreFiles] = useState(false)
  const kept = shellCommands.length > 0 || subagents > 0 || tenantChanges.length > 0
  const shown = (file: string) =>
    props.cwd && file.startsWith(`${props.cwd}/`) ? file.slice(props.cwd.length + 1) : file
  return (
    <Dialog open onOpenChange={open => !open && props.onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{edited ? 'Send the edited message?' : 'Retry from this message?'}</DialogTitle>
          <DialogDescription>
            It replaces {plural(preflight.later, 'later message')}
            {preflight.running && ', and stops the current turn first'}. You can still view
            the replaced attempt above the new answer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-w-0 flex-col gap-3 text-sm">
          <section className="flex flex-col gap-1.5">
            <h4 className="font-medium">Restored</h4>
            <p className="text-muted-foreground">Conversation, plan and artifacts</p>
            {files.length > 0 && (
              <>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={restoreFiles}
                    disabled={!preflight.checkpoint}
                    onChange={e => setRestoreFiles(e.target.checked)}
                  />
                  Restore {plural(files.length, 'file')} changed with Write or Edit
                </label>
                <ul className="ml-6 max-h-28 overflow-y-auto font-mono text-xs text-muted-foreground">
                  {files.map(f => (
                    <li key={f.path} className="truncate" title={f.path}>
                      {shown(f.path)}
                      {f.created && ' (created; restoring deletes it)'}
                      {f.earlier && ' (by an earlier attempt)'}
                    </li>
                  ))}
                </ul>
                <p className="ml-6 text-xs text-muted-foreground">
                  {preflight.checkpoint
                    ? 'Left unchecked, Claude Code is told what changed and decides whether to revert it.'
                    : "This message has no checkpoint, so these can't be restored. Claude Code is told what changed."}
                </p>
              </>
            )}
          </section>
          {kept && (
            <section className="flex flex-col gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
              <h4 className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                <TriangleAlertIcon className="size-4" />
                Not restored, stays as it is now
              </h4>
              {tenantChanges.length > 0 && (
                <div>
                  <p>{plural(tenantChanges.length, 'tenant change')}</p>
                  <ul className="ml-4 list-disc text-xs text-muted-foreground">
                    {tenantChanges.map((c, i) => (
                      <li key={i}>
                        <span className="font-mono">{c.operation}</span> on {c.tenant}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {shellCommands.length > 0 && (
                <details>
                  <summary className="cursor-pointer">
                    {plural(shellCommands.length, 'shell command')} that may have changed files
                  </summary>
                  <ul className="mt-1 ml-4 max-h-28 list-disc overflow-y-auto font-mono text-xs text-muted-foreground">
                    {shellCommands.map((c, i) => (
                      <li key={i} className="truncate" title={c}>
                        {c}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {subagents > 0 && (
                <p>{plural(subagents, 'subagent')}, whose file edits aren't checkpointed</p>
              )}
            </section>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={props.onCancel}>
            Cancel
          </Button>
          <Button onClick={() => props.onConfirm(restoreFiles)}>
            {edited ? 'Send' : 'Retry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The attempts that hang off the history shown now, grouped by the message they were retried at. */
export function replacedAt(attempts?: ReplacedAttempt[]) {
  const groups = new Map<number, (ReplacedAttempt & { index: number })[]>()
  for (const attempt of attemptsOnLine(attempts))
    groups.set(attempt.at, [...(groups.get(attempt.at) ?? []), attempt])
  return groups
}

export function ReplacedAttempts(props: {
  runId: string
  attempts: (ReplacedAttempt & { index: number })[]
}) {
  const { runId, attempts } = props
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState<UIMessage[][]>()
  useEffect(() => {
    if (!open || loaded) return
    void Promise.all(
      attempts.map(a => window.desktop.claudeCode.replaced(runId, a.index)),
    ).then(setLoaded)
  }, [open, loaded, attempts, runId])
  const changes = attempts.reduce((n, a) => n + a.tenantChanges, 0)
  const label = [
    attempts.length === 1
      ? `Replaced attempt · ${plural(attempts[0].messages, 'message')}`
      : `${attempts.length} replaced attempts`,
    changes > 0 && plural(changes, 'tenant change'),
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        className="flex items-center gap-2 self-start text-xs text-muted-foreground hover:text-foreground"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <HistoryIcon className="size-3.5" />
        {label} · {open ? 'Hide' : 'Show'}
      </button>
      {open &&
        attempts.map((attempt, i) => (
          <div
            key={attempt.sessionId}
            className="flex flex-col gap-4 rounded-lg border border-dashed p-3 opacity-70"
          >
            <p className="text-xs text-muted-foreground">
              Replaced {new Date(attempt.replacedAt).toLocaleString()}
            </p>
            {!loaded ? null : loaded[i].length === 0 ? (
              <p className="text-xs text-muted-foreground">Its transcript is gone.</p>
            ) : (
              loaded[i].map(message => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    <MessageParts
                      parts={message.parts}
                      stamps={stampsOf(message)}
                      keyPrefix={`${attempt.sessionId}-${message.id}`}
                      onApprovalResponse={() => undefined}
                      live={false}
                    />
                  </MessageContent>
                </Message>
              ))
            )}
          </div>
        ))}
    </div>
  )
}
