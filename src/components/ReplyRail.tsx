import { ArrowRightIcon, ReplyIcon, SplitIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ReplyKind, ReplyState, SuggestedReply } from '@/lib/desktop'

const ICONS: Record<ReplyKind, typeof ReplyIcon> = {
  answer: ReplyIcon,
  next: ArrowRightIcon,
  redirect: SplitIcon,
}

/** The suggestions for a run's turn while `turnId` names it; asks for them once per turn. */
export function useReplies(runId: string, turnId: string | undefined) {
  const [state, setState] = useState<ReplyState>()
  useEffect(
    () =>
      window.desktop.replies.onChange(next => {
        if (next.runId === runId) setState(next)
      }),
    [runId],
  )
  useEffect(() => {
    if (!turnId) return
    let live = true
    window.desktop.replies.request(runId, turnId).then(
      next => {
        // A broadcast that already settled this turn outranks the request's "pending".
        if (live && next)
          setState(prev =>
            prev?.turnId === next.turnId && next.status === 'pending' ? prev : next,
          )
      },
      () => undefined,
    )
    return () => {
      live = false
    }
  }, [runId, turnId])
  return state?.runId === runId && state.turnId === turnId ? state : undefined
}

/** Replies the user is likely to send next, above the composer; a pick fills it. */
export function ReplyRail(props: {
  replies: SuggestedReply[]
  onPick: (index: number) => void
  onDismiss: () => void
}) {
  return (
    <div
      role="group"
      aria-label="Suggested replies"
      className="flex flex-wrap items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200"
    >
      <span className="pr-0.5 text-xs text-muted-foreground">Suggested</span>
      {props.replies.map((reply, i) => {
        const Icon = ICONS[reply.kind] ?? ArrowRightIcon
        return (
          <button
            key={`${i}:${reply.label}`}
            type="button"
            title={reply.text}
            data-kind={reply.kind}
            onClick={() => props.onPick(i)}
            className="inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-left text-xs font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Icon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 truncate">{reply.label}</span>
            {i === 0 && (
              <kbd aria-hidden className="rounded border px-1 font-mono text-[10px] leading-4 text-muted-foreground">
                Tab
              </kbd>
            )}
          </button>
        )
      })}
      <Button
        variant="ghost"
        size="icon-xs"
        className="ml-auto text-muted-foreground"
        aria-label="Hide suggestions for this turn"
        title="Hide for this turn"
        onClick={props.onDismiss}
      >
        <XIcon />
      </Button>
    </div>
  )
}
