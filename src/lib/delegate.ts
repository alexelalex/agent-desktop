import type { DynamicToolUIPart, UIMessage } from 'ai'

export const DELEGATE = 'delegate'

export interface DelegateInput {
  task?: string
  groups?: string[]
  /** A plan step to work on; the server takes the task and groups from it. */
  stepId?: string
  brief?: string
}

/** Preliminary outputs are the run so far; the final one has no flag. */
export function isUnfinished(part: DynamicToolUIPart): boolean {
  return (
    part.state === 'input-streaming' ||
    part.state === 'input-available' ||
    (part.state === 'output-available' && part.preliminary === true)
  )
}

/** One subagent's run in a fan-out: the app reports these to the model and the card. */
export interface SubagentRun {
  plugin: string
  label: string
  scopeLabel?: string
  status: 'running' | 'done' | 'failed' | 'skipped'
  message?: UIMessage
  reason?: string
}

/** A fan-out's runs, one per plugin; none for a subagent the server ran. */
export function subagentRuns(part: DynamicToolUIPart): SubagentRun[] | undefined {
  const output = part.state === 'output-available' ? part.output : undefined
  const runs = (output as { runs?: SubagentRun[] } | undefined)?.runs
  return Array.isArray(runs) ? runs : undefined
}

const lastText = (message: UIMessage | undefined) =>
  message && { ...message, parts: message.parts.filter(p => p.type === 'text').slice(-1) }

/** A `delegate` call's output: the subagent's own message, streamed whole. */
export function subagentRun(part: DynamicToolUIPart): UIMessage | undefined {
  const output = part.state === 'output-available' ? part.output : undefined
  return Array.isArray((output as UIMessage | undefined)?.parts)
    ? (output as UIMessage)
    : undefined
}

// The server reads only a run's last text part, its report; the rest of the
// trace is for display, so it stays in local history and off the wire.
export function withReportsOnly(messages: UIMessage[]): UIMessage[] {
  return messages.map(message => ({
    ...message,
    parts: message.parts.map(part => {
      if (
        part.type !== 'dynamic-tool' ||
        part.toolName !== DELEGATE ||
        part.state !== 'output-available'
      ) {
        return part
      }
      const runs = subagentRuns(part)
      if (runs) {
        return {
          ...part,
          output: {
            runs: runs.map(run =>
              run.status === 'running'
                ? { ...run, status: 'failed', message: undefined, reason: 'Stopped by the user before it reported.' }
                : { ...run, message: lastText(run.message) },
            ),
          },
        }
      }
      const run = subagentRun(part)
      if (!run) return part
      const report = part.preliminary
        ? [{ type: 'text' as const, text: 'Stopped by the user before it reported.' }]
        : run.parts.filter(p => p.type === 'text').slice(-1)
      return { ...part, output: { ...run, parts: report } }
    }),
  }))
}
