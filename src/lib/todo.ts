import type { DynamicToolUIPart, UIMessage } from 'ai'
import { DELEGATE, isUnfinished, type DelegateInput } from './delegate'

export const TODO = 'todo'

export type StepStatus = 'pending' | 'in_progress' | 'done' | 'blocked' | 'skipped'

export interface Step {
  id: string
  title: string
  /** Tool groups, or single operations such as `detections__update`. */
  tools: string[]
  status: StepStatus
  assignee: 'self' | 'subagent'
  dependsOn?: string[]
  note?: string
  /** Plugins and groups the step runs on, when calls are routed across tenants. */
  targets?: string[]
}

// Each `todo` call sends the whole list, so the plan is the input of the last
// call the server accepted. A step re-sent without its targets keeps the earlier
// ones, as the server does.
export function latestPlan(messages: UIMessage[]): Step[] | undefined {
  let plan: Step[] | undefined
  for (const message of messages) {
    for (const part of message.parts) {
      if (
        part.type !== 'dynamic-tool' ||
        part.toolName !== TODO ||
        part.state !== 'output-available'
      ) {
        continue
      }
      const previous = new Map((plan ?? []).map(step => [step.id, step.targets]))
      plan = ((part.input as { steps?: Step[] }).steps ?? []).map(step =>
        step.targets?.length || !previous.get(step.id)?.length
          ? step
          : { ...step, targets: previous.get(step.id) },
      )
    }
  }
  return plan
}

/** Each step handed to a subagent → whether its latest run is still going. */
export function delegations(
  messages: UIMessage[],
  live: boolean,
): Map<string, boolean> {
  const runs = new Map<string, boolean>()
  messages.forEach((message, index) => {
    for (const part of message.parts) {
      if (part.type !== 'dynamic-tool' || part.toolName !== DELEGATE) continue
      const { stepId } = (part.input ?? {}) as DelegateInput
      if (!stepId) continue
      runs.set(
        stepId,
        live && index === messages.length - 1 && isUnfinished(part),
      )
    }
  })
  return runs
}

export function progress(steps: Partial<Step>[]) {
  const counted = steps.filter(s => s?.status !== 'skipped')
  return {
    done: counted.filter(s => s?.status === 'done').length,
    total: counted.length,
  }
}

export function planLine(part: DynamicToolUIPart): string {
  if (part.state === 'output-error') return `Plan rejected: ${part.errorText}`
  const steps = (part.input as { steps?: Partial<Step>[] } | undefined)?.steps
  const { done, total } = progress(steps ?? [])
  return `Updated the plan: ${done} of ${total} steps done`
}
