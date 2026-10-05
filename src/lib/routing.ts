import { isToolUIPart, type DynamicToolUIPart, type UIMessage } from 'ai'
import { DELEGATE, subagentRuns } from './delegate'

// When calls are routed across tenants, the app stamps each one with where it
// ran, in its message's metadata: the run's focus and the cards read them back.

/** Where a routed call ran, or will run once approved. */
export interface Stamp {
  plugin: string
  label: string
  scope?: string
  scopeLabel?: string
}

export type Stamps = Record<string, Stamp>

export const stampsOf = (message: UIMessage | undefined): Stamps =>
  ((message?.metadata as { stamps?: Stamps } | undefined)?.stamps ?? {})

export const stampText = (stamp: Stamp) =>
  stamp.scopeLabel ? `${stamp.label} · ${stamp.scopeLabel}` : stamp.label

/** Every stamp in the run, in the order the calls were made. */
export function allStamps(messages: UIMessage[]): Stamp[] {
  return messages.flatMap(message => {
    const stamps = stampsOf(message)
    return message.parts.flatMap(part =>
      isToolUIPart(part) && stamps[part.toolCallId] ? [stamps[part.toolCallId]] : [],
    )
  })
}

/** The plugins a run touched, by label, in first-use order. */
export const touchedPlugins = (messages: UIMessage[]) => [
  ...new Set(allStamps(messages).map(stamp => stamp.label)),
]

/** Plugins a run reached: its routed calls, and its fan-outs' finished runs. */
export function coveredPlugins(messages: UIMessage[]): string[] {
  const fanned = messages.flatMap(m =>
    m.parts.flatMap(p =>
      p.type === 'dynamic-tool' && p.toolName === DELEGATE
        ? (subagentRuns(p) ?? []).filter(r => r.status === 'done').map(r => r.plugin)
        : [],
    ),
  )
  return [...new Set([...allStamps(messages).map(s => s.plugin), ...fanned])]
}

/** The last step's tool calls: what the auto-send check and the router look at. */
export function lastStepCalls(messages: UIMessage[]): DynamicToolUIPart[] {
  const last = messages.at(-1)
  if (last?.role !== 'assistant') return []
  let start = last.parts.length - 1
  while (start >= 0 && last.parts[start].type !== 'step-start') start--
  return last.parts
    .slice(start + 1)
    .filter((p): p is DynamicToolUIPart => p.type === 'dynamic-tool')
}

const settled = (part: DynamicToolUIPart) =>
  (part.state === 'output-available' && !part.preliminary) ||
  part.state === 'output-error' ||
  part.state === 'output-denied' ||
  (part.state === 'approval-responded' && part.approval.approved === false)

/** Routing mode sends only once every call of the last step has its answer. */
export function routedStepAnswered(messages: UIMessage[]): boolean {
  const calls = lastStepCalls(messages)
  return calls.length > 0 && calls.every(settled)
}

/** Pending approvals with the tenant each one runs on, when known. */
export function pendingApprovalsByTenant(
  messages: UIMessage[],
): { id: string; stamp?: Stamp }[] {
  const last = messages.at(-1)
  if (last?.role !== 'assistant') return []
  const stamps = stampsOf(last)
  return last.parts.flatMap(p =>
    isToolUIPart(p) && p.state === 'approval-requested'
      ? [{ id: p.approval.id, stamp: stamps[p.toolCallId] }]
      : [],
  )
}
