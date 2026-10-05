import { PencilLineIcon } from 'lucide-react'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ipcError } from '@/components/RetryParts'
import type { PromptSuggestion, RunSummary } from '@/lib/desktop'
import { ChangedText } from '@/components/FileDiffPanel'
import { counterparts, diffLines, linesOf } from '@/lib/diff'
import { isStale, type effectivePrompt } from '@/lib/dig'
import { plural } from '@/lib/tasks'
import { cn } from '@/lib/utils'

type Status = PromptSuggestion['status']

const STATUS: Record<Exclude<Status, 'pending'>, string> = {
  accepted: 'Accepted',
  dismissed: 'Dismissed',
  superseded: 'Replaced by a newer dig',
}

/** Accepts or dismisses one suggestion, and says why when that fails. */
export function useDecide(parentRunId: string) {
  const [error, setError] = useState<string>()
  const decide = (id: string, status: 'accepted' | 'dismissed' | 'pending') => {
    setError(undefined)
    window.desktop.claudeCode.decide(parentRunId, id, status).catch(e => setError(ipcError(e)))
  }
  return { error, decide }
}

/** A dig's suggested prompt changes, each with Accept and Dismiss, or what became of it. */
export function SuggestionList(props: {
  suggestions: PromptSuggestion[]
  /** The parent, whose bookmarks tell when a suggestion is stale. */
  parent?: RunSummary
  onDecide: (id: string, status: 'accepted' | 'dismissed' | 'pending') => void
  className?: string
}) {
  if (props.suggestions.length === 0) return null
  return (
    <ul className={cn('flex flex-col gap-2', props.className)}>
      {props.suggestions.map(s => {
        const stale = s.status === 'pending' && isStale(s, props.parent)
        return (
          <li
            key={s.id}
            data-suggestion={s.id}
            className={cn(
              'flex flex-col gap-1.5 rounded-md border p-2 text-xs',
              s.status !== 'pending' && 'opacity-70',
            )}
          >
            {s.kind === 'replace' && (
              <pre className="whitespace-pre-wrap break-words rounded bg-red-500/10 px-2 py-1 font-mono text-red-700 line-through decoration-red-500/40 dark:text-red-300">
                {s.find}
              </pre>
            )}
            <pre className="whitespace-pre-wrap break-words rounded bg-emerald-500/10 px-2 py-1 font-mono text-emerald-800 dark:text-emerald-300">
              {s.text}
            </pre>
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 flex-1 text-muted-foreground">{s.why}</p>
              {s.status === 'pending' && !stale ? (
                <>
                  <Button variant="ghost" size="xs" onClick={() => props.onDecide(s.id, 'dismissed')}>
                    Dismiss
                  </Button>
                  <Button variant="outline" size="xs" onClick={() => props.onDecide(s.id, 'accepted')}>
                    Accept
                  </Button>
                </>
              ) : stale ? (
                <span className="text-amber-600 dark:text-amber-400">
                  The agent changed the prompt since · Dig again
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  {STATUS[s.status as Exclude<Status, 'pending'>]}
                  {s.status !== 'superseded' && (
                    <Button
                      variant="link"
                      size="xs"
                      className="h-auto p-0"
                      onClick={() => props.onDecide(s.id, 'pending')}
                    >
                      Undo
                    </Button>
                  )}
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** An action's suggestions, from the ✎ chip or its ⋯ menu. */
export function SuggestionsDialog(props: {
  parent: RunSummary
  actionTitle: string
  suggestions: PromptSuggestion[]
  onOpenDig?: () => void
  onClose: () => void
}) {
  const { error, decide } = useDecide(props.parent.id)
  // Newest dig first; within one, in the order it sent them.
  const shown = [...props.suggestions]
    .filter(s => s.status !== 'superseded')
    .sort((a, b) => b.createdAt - a.createdAt)
  return (
    <Dialog open onOpenChange={open => !open && props.onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Suggested changes</DialogTitle>
          <DialogDescription>
            For the prompt of “{props.actionTitle}”. What you accept goes into the prompt its task
            gets; the agent's own text stays as it wrote it.
          </DialogDescription>
        </DialogHeader>
        <SuggestionList
          className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4"
          suggestions={shown}
          parent={props.parent}
          onDecide={decide}
        />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {props.onOpenDig && (
          <Button variant="link" size="xs" className="self-start p-0" onClick={props.onOpenDig}>
            Open the dig
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** A brief as its task gets it: the agent's text with what was accepted marked, or the original. */
export function AmendedBrief(props: {
  agent: string
  effective: ReturnType<typeof effectivePrompt>
  onReview: () => void
}) {
  const [original, setOriginal] = useState(false)
  const { applied, unapplied, text } = props.effective
  const lines = original ? linesOf(props.agent).map(t => ({ kind: 'same' as const, text: t })) : diffLines(props.agent, text)
  // A changed line marks only what changed against its counterpart; a line gone whole is struck.
  const pairs = counterparts(lines)
  return (
    <figure aria-label="Amended prompt" className="not-prose my-3 overflow-hidden rounded-lg border">
      <figcaption className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b bg-muted/40 px-3 py-1.5 text-xs">
        <PencilLineIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span>
          {original
            ? "The agent's prompt, as it wrote it"
            : applied.length > 0
              ? `Amended by ${plural(applied.length, 'accepted suggestion')}`
              : 'As the agent wrote it'}
        </span>
        {unapplied.length > 0 && (
          <span className="text-amber-600 dark:text-amber-400">
            · {plural(unapplied.length, 'accepted suggestion')} no longer{' '}
            {unapplied.length === 1 ? 'fits' : 'fit'}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <Button variant="link" size="xs" className="h-auto p-0" onClick={props.onReview}>
            Review
          </Button>
          {applied.length > 0 && (
            <Button
              variant="link"
              size="xs"
              className="h-auto p-0"
              aria-pressed={original}
              onClick={() => setOriginal(!original)}
            >
              {original ? 'Show amended' : 'Show original'}
            </Button>
          )}
        </span>
      </figcaption>
      <pre className="overflow-x-auto py-2 font-mono text-xs leading-relaxed">
        {lines.map((line, i) => (
          <div
            key={i}
            data-change={line.kind === 'same' ? undefined : line.kind}
            className={cn(
              'px-3 whitespace-pre-wrap break-words',
              line.kind === 'add' && 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
              line.kind === 'del' && 'bg-red-500/10 text-red-700 decoration-red-500/60 dark:text-red-300',
              line.kind === 'del' && !pairs.has(line) && 'line-through',
            )}
          >
            <ChangedText line={line} other={pairs.get(line)} strike />
          </div>
        ))}
      </pre>
    </figure>
  )
}
