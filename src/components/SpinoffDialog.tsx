import { ChevronDownIcon, RotateCwIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { MessageResponse } from '@/components/ai-elements/message'
import { ipcError } from '@/components/RetryParts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

// Whether the last spin-off went with context, so the next dialog starts the same way.
const REMEMBER = 'spinoff:context'
const remembered = () => {
  try {
    return localStorage.getItem(REMEMBER) === 'on'
  } catch {
    return false
  }
}
const remember = (on: boolean) => {
  try {
    localStorage.setItem(REMEMBER, on ? 'on' : 'off')
  } catch {
    // Not kept: the next dialog starts unchecked.
  }
}

const titleOf = (prompt: string) => {
  const line = prompt.trim().split('\n')[0].trim()
  return line.length > 60 ? `${line.slice(0, 57)}…` : line
}

/** The context as written for a prompt; empty `text` when nothing bears on it. */
type Written =
  | { status: 'none' }
  | { status: 'writing'; for: string }
  | { status: 'ready'; for: string; text: string; edited: boolean }
  | { status: 'failed'; for: string; error: string }

/** Sends the message box's prompt to a session of its own under this one, with context if asked. */
export function SpinoffDialog(props: {
  parentRunId: string
  parentTitle: string
  cwd?: string
  prompt: string
  /** `runId` is the session it started. */
  onClose: (runId?: string) => void
}) {
  const { parentRunId } = props
  const [prompt, setPrompt] = useState(props.prompt)
  // Follows the prompt's first line until the user edits it.
  const [title, setTitle] = useState<string>()
  const shownTitle = title ?? titleOf(prompt)
  const [withContext, setWithContext] = useState(remembered)
  const [written, setWritten] = useState<Written>({ status: 'none' })
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string>()
  // Only the latest request's answer counts.
  const request = useRef(0)

  const write = (text: string) => {
    const id = ++request.current
    setWritten({ status: 'writing', for: text })
    window.desktop.claudeCode.writeContext(parentRunId, text).then(
      result => id === request.current && setWritten({ status: 'ready', for: text, text: result, edited: false }),
      e => id === request.current && setWritten({ status: 'failed', for: text, error: ipcError(e) }),
    )
  }
  const cancel = () => {
    request.current++
    void window.desktop.claudeCode.cancelContext(parentRunId)
  }

  // Once, as the dialog opens; closing it stops the context still being written.
  useEffect(() => {
    if (withContext && props.prompt.trim()) write(props.prompt.trim())
    return cancel
  }, [])

  const toggle = (on: boolean) => {
    setWithContext(on)
    remember(on)
    if (!on && written.status === 'writing') {
      cancel()
      setWritten({ status: 'none' })
    }
    if (on && (written.status === 'none' || written.status === 'failed') && prompt.trim()) write(prompt.trim())
  }

  const writing = withContext && written.status === 'writing'
  const context = withContext && written.status === 'ready' ? written.text.trim() : ''
  const stale = withContext && written.status === 'ready' && !written.edited && written.for !== prompt.trim()
  const blocked = !shownTitle.trim() || !prompt.trim() || writing || starting

  const start = async () => {
    if (blocked) return
    setStarting(true)
    setError(undefined)
    try {
      const runId = await window.desktop.claudeCode.spinoff(parentRunId, {
        title: shownTitle,
        prompt,
        ...(context && { context }),
      })
      props.onClose(runId)
    } catch (e) {
      setError(ipcError(e))
      setStarting(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => !open && props.onClose()}>
      <DialogContent
        className="flex max-h-[85vh] flex-col sm:max-w-[720px]"
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            void start()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Send to a new session</DialogTitle>
          <DialogDescription>
            It runs as its own Claude Code session under “{props.parentTitle}”
            {props.cwd && (
              <>
                , in <code className="font-mono break-all">{props.cwd}</code>
              </>
            )}
            . It knows only what you send here.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4">
          <Input
            aria-label="Session title"
            value={shownTitle}
            maxLength={200}
            onChange={e => setTitle(e.target.value)}
          />
          <Textarea
            aria-label="Prompt"
            className="max-h-[calc(12lh+1rem)] min-h-20 text-sm"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
          <section aria-label="Context" className="flex flex-col gap-2 rounded-lg border p-3">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-primary"
                checked={withContext}
                onChange={e => toggle(e.target.checked)}
              />
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">Add context from this conversation</span>
                <span className="text-xs text-muted-foreground">
                  Claude reads the conversation so far and writes only what the new session needs
                  for this prompt. You can edit it before starting.
                </span>
              </span>
            </label>
            {withContext && written.status === 'writing' && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Spinner className="size-3" />
                Reading the conversation…
              </p>
            )}
            {withContext && written.status === 'failed' && (
              <p className="flex flex-wrap items-center gap-2 text-xs text-destructive">
                {written.error}
                <Button variant="link" size="xs" className="h-auto p-0" onClick={() => write(prompt.trim())}>
                  Try again
                </Button>
              </p>
            )}
            {withContext && written.status === 'ready' && (
              <div className="flex flex-col gap-1">
                {written.text.trim() || written.edited ? (
                  <Textarea
                    aria-label="Context"
                    className="max-h-[calc(16lh+1rem)] min-h-24 font-mono text-xs"
                    value={written.text}
                    onChange={e => setWritten({ ...written, text: e.target.value, edited: true })}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Nothing in this conversation bears on the prompt, so it goes without context.
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className={stale ? 'text-amber-600 dark:text-amber-400' : undefined}>
                    {stale
                      ? 'The prompt changed since this was written.'
                      : written.text.trim()
                        ? `${written.text.length.toLocaleString()} characters`
                        : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    disabled={!prompt.trim()}
                    onClick={() => write(prompt.trim())}
                  >
                    <RotateCwIcon />
                    Rewrite
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onClose()}>
            Cancel
          </Button>
          <Button disabled={blocked} onClick={() => void start()}>
            {writing
              ? 'Writing context…'
              : withContext && written.status === 'failed'
                ? 'Start without context'
                : 'Start session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** In a spin-off's chat: the context it started with, folded. */
export function SpinoffContext(props: { context: string; parentTitle?: string }) {
  return (
    <Collapsible className="rounded-md border text-sm">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-3 py-2">
        <span className="min-w-0 truncate text-muted-foreground">
          Context from {props.parentTitle ? `“${props.parentTitle}”` : 'its session'}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="max-h-80 overflow-y-auto border-t px-3 py-2">
        <MessageResponse>{props.context}</MessageResponse>
      </CollapsibleContent>
    </Collapsible>
  )
}
