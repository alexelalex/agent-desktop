import type { DynamicToolUIPart } from 'ai'
import { useState, type ReactNode } from 'react'
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  LayoutDashboardIcon,
  MessageCircleQuestionIcon,
  ShieldAlertIcon,
  XCircleIcon,
} from 'lucide-react'
import { RiskBadge } from '@/components/McpApprovalDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  POST_ACTIVITY,
  RENDER_ARTIFACT,
  REQUEST_APPROVAL,
  SET_PLAN,
  UPDATE_STEP,
  type ActivityInput,
  type ApprovalInput,
} from '@/lib/claude-code'
import { cn } from '@/lib/utils'

const LEVEL = {
  info: { Icon: InfoIcon, className: 'text-sky-500' },
  success: { Icon: CheckCircle2Icon, className: 'text-emerald-500' },
  warning: { Icon: AlertTriangleIcon, className: 'text-amber-500' },
  error: { Icon: XCircleIcon, className: 'text-destructive' },
}

function Tenant(props: { id?: string }) {
  if (!props.id) return null
  return (
    <Badge variant="outline" className="h-4 px-1.5 py-0 font-mono text-[10px]">
      @{props.id}
    </Badge>
  )
}

function Line(props: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      {props.children}
    </p>
  )
}

function Approval(props: {
  part: DynamicToolUIPart
  onApprovalResponse: (id: string, approved: boolean) => void
  onApproveAll?: () => void
}) {
  const { part } = props
  const input = (part.input ?? {}) as ApprovalInput
  const answer =
    part.state === 'output-available'
      ? (part.output as { approved?: boolean; reason?: string } | undefined)
      : undefined
  const approval = part.state === 'approval-requested' ? part.approval : undefined
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <ShieldAlertIcon className="size-4 shrink-0 text-amber-500" />
        <span className="font-medium">Approval</span>
        <Badge variant="outline" className="font-mono text-[10px]">
          {input.action}
        </Badge>
        <Tenant id={input.tenantId} />
        {input.riskLevel && (
          <span className="ml-auto">
            <RiskBadge level={input.riskLevel} />
          </span>
        )}
      </div>
      <p>{input.description}</p>
      {input.payload && Object.keys(input.payload).length > 0 && (
        <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-all rounded-md border bg-muted/50 p-2 font-mono text-[11px]">
          {JSON.stringify(input.payload, null, 2)}
        </pre>
      )}
      {approval ? (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => props.onApprovalResponse(approval.id, false)}
          >
            Deny
          </Button>
          {props.onApproveAll && (
            <Button
              size="sm"
              variant="outline"
              title="Approve this and every later request in this session without asking"
              onClick={props.onApproveAll}
            >
              Approve all
            </Button>
          )}
          <Button size="sm" onClick={() => props.onApprovalResponse(approval.id, true)}>
            Approve
          </Button>
        </div>
      ) : answer ? (
        <p className="text-xs text-muted-foreground">
          {answer.approved
            ? (answer.reason ?? 'You approved this change.')
            : `Denied.${answer.reason ? ` ${answer.reason}` : ''}`}
        </p>
      ) : part.state === 'output-error' ? (
        <p className="text-xs text-destructive">{part.errorText}</p>
      ) : null}
    </div>
  )
}

interface Question {
  question: string
  header?: string
  options?: { label: string; description?: string }[]
  multiSelect?: boolean
}

/** Claude Code's AskUserQuestion: an option, several, or typed text per question. */
export function QuestionCard(props: {
  part: DynamicToolUIPart
  onApprovalResponse: (
    id: string,
    approved: boolean,
    answers?: Record<string, string>,
  ) => void
}) {
  const { part } = props
  const questions = (part.input as { questions?: Question[] } | undefined)?.questions ?? []
  const approval = part.state === 'approval-requested' ? part.approval : undefined
  const [picked, setPicked] = useState<Record<string, string[]>>({})
  const [typed, setTyped] = useState<Record<string, string>>({})

  // One choice: typing replaces the pick. Several: typed text joins them.
  const answerOf = (q: Question) => {
    const text = typed[q.question]?.trim() ?? ''
    const labels = picked[q.question] ?? []
    return q.multiSelect ? [...labels, text].filter(Boolean).join(', ') : text || labels[0] || ''
  }
  const pick = (q: Question, label: string) => {
    const labels = picked[q.question] ?? []
    setPicked({
      ...picked,
      [q.question]: !q.multiSelect
        ? [label]
        : labels.includes(label)
          ? labels.filter(l => l !== label)
          : [...labels, label],
    })
    if (!q.multiSelect) setTyped({ ...typed, [q.question]: '' })
  }
  const write = (q: Question, text: string) => {
    setTyped({ ...typed, [q.question]: text })
    if (!q.multiSelect && text) setPicked({ ...picked, [q.question]: [] })
  }
  const complete = questions.every(q => answerOf(q))
  const submit = () =>
    approval &&
    props.onApprovalResponse(
      approval.id,
      true,
      Object.fromEntries(questions.map(q => [q.question, answerOf(q)])),
    )

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-md border p-3 text-sm">
      <div className="flex items-center gap-2">
        <MessageCircleQuestionIcon className="size-4 shrink-0 text-sky-500" />
        <span className="font-medium">Claude Code asks</span>
      </div>
      {questions.map(q => (
        <div key={q.question} className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {q.header && (
              <Badge variant="outline" className="text-[10px]">
                {q.header}
              </Badge>
            )}
            <span>{q.question}</span>
            {q.multiSelect && approval && (
              <span className="text-xs text-muted-foreground">Pick any</span>
            )}
          </div>
          {approval && (
            <div className="flex flex-col gap-1.5">
              {(q.options ?? []).map(o => {
                const on = (picked[q.question] ?? []).includes(o.label)
                return (
                  <Button
                    key={o.label}
                    size="sm"
                    variant={on ? 'secondary' : 'outline'}
                    aria-pressed={on}
                    className="h-auto justify-start whitespace-normal py-1.5 text-left"
                    onClick={() => pick(q, o.label)}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{o.label}</span>
                      {o.description && (
                        <span className="text-xs font-normal text-muted-foreground">
                          {o.description}
                        </span>
                      )}
                    </span>
                  </Button>
                )
              })}
              <Input
                placeholder="Other"
                aria-label={`Other answer to: ${q.question}`}
                value={typed[q.question] ?? ''}
                onChange={e => write(q, e.target.value)}
                onKeyDown={e => e.key === 'Enter' && complete && submit()}
              />
            </div>
          )}
        </div>
      ))}
      {approval ? (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => props.onApprovalResponse(approval.id, false)}
          >
            Skip
          </Button>
          <Button size="sm" disabled={!complete} onClick={submit}>
            Answer
          </Button>
        </div>
      ) : part.state === 'output-available' ? (
        <p className="text-xs text-muted-foreground">{String(part.output ?? '')}</p>
      ) : part.state === 'output-error' ? (
        <p className="text-xs text-muted-foreground">{part.errorText}</p>
      ) : null}
    </div>
  )
}

/** A Claude Code session's call to one of the desktop MCP server's UI tools. */
export function ClaudeCodeUiCall(props: {
  part: DynamicToolUIPart
  onApprovalResponse: (id: string, approved: boolean) => void
  onApproveAll?: () => void
  onOpenArtifact?: (id: string) => void
}) {
  const { part } = props
  const input = (part.input ?? {}) as Record<string, unknown>
  switch (part.toolName) {
    case SET_PLAN:
      return (
        <Line>
          Set the plan: {String(input.goal ?? '')} ·{' '}
          {(input.steps as unknown[] | undefined)?.length ?? 0} steps
        </Line>
      )
    case UPDATE_STEP:
      return (
        <Line>
          {String(input.stepId)} → {String(input.status)}
          {input.note ? `: ${String(input.note)}` : ''}
        </Line>
      )
    case POST_ACTIVITY: {
      const { message, tenantId, level = 'info' } = input as ActivityInput
      const { Icon, className } = LEVEL[level] ?? LEVEL.info
      return (
        <Line>
          <Icon className={cn('size-3.5 shrink-0', className)} />
          <span className="text-foreground">{message}</span>
          <Tenant id={tenantId} />
        </Line>
      )
    }
    case RENDER_ARTIFACT: {
      const title = String(input.title ?? input.id)
      const actions = Array.isArray(input.actions) ? input.actions.length : 0
      const label = actions > 0 ? `${title} · ${actions} action${actions === 1 ? '' : 's'}` : title
      // A rejected render changed nothing, so there's nothing new to open.
      if (part.state === 'output-error')
        return (
          <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <XCircleIcon className="size-3.5 shrink-0 text-destructive" />
            <span className="truncate">
              {label} · <span className="text-destructive">Rejected</span>:{' '}
              {part.errorText?.split('\n')[0]}
            </span>
          </p>
        )
      return (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => props.onOpenArtifact?.(String(input.id))}
        >
          <LayoutDashboardIcon />
          {label}
        </Button>
      )
    }
    case REQUEST_APPROVAL:
      return (
        <Approval
          part={part}
          onApprovalResponse={props.onApprovalResponse}
          onApproveAll={props.onApproveAll}
        />
      )
    default:
      return null
  }
}
