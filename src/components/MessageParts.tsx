import type { UIMessage } from 'ai'
import type { ReactNode } from 'react'
import { MessageResponse } from '@/components/ai-elements/message'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import { ClaudeCodeUiCall, QuestionCard } from '@/components/ClaudeCodeParts'
import { SubagentCard } from '@/components/SubagentCard'
import { TodoList } from '@/components/TodoPanel'
import { ToolCallCard } from '@/components/ToolCallCard'
import { ToolGroup } from '@/components/ToolGroup'
import {
  ASK_USER_QUESTION,
  RENDER_ARTIFACT,
  REQUEST_APPROVAL,
  UI_TOOLS,
} from '@/lib/claude-code'
import { DELEGATE, subagentRun, subagentRuns, type DelegateInput } from '@/lib/delegate'
import { operationFor, type SpecOperation } from '@/lib/spec'
import type { Stamps } from '@/lib/routing'
import { latestPlan, planLine, TODO, type Step } from '@/lib/todo'

type Part = UIMessage['parts'][number]

const UNGROUPED = new Set([ASK_USER_QUESTION, REQUEST_APPROVAL, RENDER_ARTIFACT, DELEGATE])

/** Parts a tool group never hides: text, and whatever asks for the user or opens something. */
const standsAlone = (part: Part) =>
  part.type === 'text' ||
  (part.type === 'dynamic-tool' &&
    (part.state === 'approval-requested' || UNGROUPED.has(part.toolName)))

/** A message's parts; renders itself again for a subagent's run. */
export function MessageParts(props: {
  parts: UIMessage['parts']
  keyPrefix: string
  operations?: Map<string, SpecOperation>
  /** The chat's current plan, for titling runs delegated by step. */
  plan?: Step[]
  onApprovalResponse: (
    id: string,
    approved: boolean,
    answers?: Record<string, string>,
  ) => void
  /** False once the turn has ended, e.g. after Stop. */
  live: boolean
  /** Where each routed call ran, by tool call id. */
  stamps?: Stamps
  /** Opens an artifact a Claude Code session rendered. */
  onOpenArtifact?: (id: string) => void
  /** Turns on auto mode, which gives this and every later approval. */
  onApproveAll?: () => void
}) {
  const { parts, keyPrefix, operations, plan, onApprovalResponse, live, stamps } =
    props
  const render = (part: Part, i: number) => {
    const key = `${keyPrefix}-${i}`
    switch (part.type) {
      case 'text':
        return <MessageResponse key={key}>{part.text}</MessageResponse>
      case 'reasoning':
        return (
          <Reasoning key={key} isStreaming={part.state === 'streaming'}>
            <ReasoningTrigger />
            <ReasoningContent>{part.text}</ReasoningContent>
          </Reasoning>
        )
      case 'dynamic-tool': {
        if (UI_TOOLS.has(part.toolName)) {
          return (
            <ClaudeCodeUiCall
              key={key}
              part={part}
              onApprovalResponse={onApprovalResponse}
              onApproveAll={props.onApproveAll}
              onOpenArtifact={props.onOpenArtifact}
            />
          )
        }
        if (part.toolName === ASK_USER_QUESTION) {
          return (
            <QuestionCard
              key={key}
              part={part}
              onApprovalResponse={onApprovalResponse}
            />
          )
        }
        if (part.toolName === 'loadToolGroup') {
          return (
            <p key={key} className="text-xs text-muted-foreground">
              Loaded tool group{' '}
              <code>{(part.input as { group?: string })?.group}</code>
            </p>
          )
        }
        if (part.toolName === TODO) {
          return (
            <p key={key} className="text-xs text-muted-foreground">
              {planLine(part)}
            </p>
          )
        }
        if (part.toolName === DELEGATE) {
          const runs = subagentRuns(part)
          if (runs) {
            const runsLive = live && part.state === 'output-available' && part.preliminary === true
            return (
              <SubagentCard
                key={key}
                part={part}
                step={plan?.find(step => step.id === (part.input as DelegateInput | undefined)?.stepId)}
                live={live}
                runs={runs}
                renderRun={(message, index) => (
                  <MessageParts
                    parts={message.parts}
                    keyPrefix={`${key}-${index}`}
                    operations={operations}
                    onApprovalResponse={onApprovalResponse}
                    live={runsLive}
                  />
                )}
              />
            )
          }
          const run = subagentRun(part)
          const { stepId } = (part.input ?? {}) as DelegateInput
          const runLive =
            live && part.state === 'output-available' && part.preliminary === true
          // A subagent's own plan is display-only; the parent sees its report.
          const runPlan = run && latestPlan([run])
          return (
            <SubagentCard
              key={key}
              part={part}
              step={plan?.find(step => step.id === stepId)}
              live={live}
            >
              {runPlan && (
                <div className="mb-4">
                  <TodoList steps={runPlan} operations={operations} live={runLive} />
                </div>
              )}
              {run && (
                <MessageParts
                  parts={run.parts}
                  keyPrefix={key}
                  operations={operations}
                  onApprovalResponse={onApprovalResponse}
                  live={runLive}
                />
              )}
            </SubagentCard>
          )
        }
        return (
          <ToolCallCard
            key={key}
            part={part}
            stamp={stamps?.[part.toolCallId]}
            operation={operationFor(operations, part.toolName)}
            onApprovalResponse={onApprovalResponse}
            onApproveAll={props.onApproveAll}
            live={live}
          />
        )
      }
      default:
        return null
    }
  }

  // Two or more tool calls in a row collapse to one summary line.
  const out: ReactNode[] = []
  let run: number[] = []
  const flush = () => {
    const grouped = run.map(i => parts[i])
    if (grouped.filter(part => part.type === 'dynamic-tool').length >= 2)
      out.push(
        <ToolGroup key={`${keyPrefix}-g${run[0]}`} parts={grouped} live={live}>
          {run.map(i => render(parts[i], i))}
        </ToolGroup>,
      )
    else out.push(...run.map(i => render(parts[i], i)))
    run = []
  }
  parts.forEach((part, i) => {
    if (!standsAlone(part)) return void run.push(i)
    flush()
    out.push(render(part, i))
  })
  flush()
  return out
}
