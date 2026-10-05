import type { UIMessage } from 'ai'

export interface ChatState {
  awaitingApproval: boolean
  hasPlan: boolean
  hasMessages: boolean
}

export interface SlashCommand {
  name: string
  /** Argument hint; a command with one needs an argument. */
  args?: string
  description: string
  /** Why the command can't run now, if it can't. */
  blocked?: (chat: ChatState) => string | undefined
  /** What the model reads in place of the command. Without it, the command runs in the browser. */
  prompt?: (args: string) => string
}

const approvalFirst = (chat: ChatState) =>
  chat.awaitingApproval ? 'Approve or deny the pending change first.' : undefined

/** `@alpha @prod Audit …` → the leading mentions and the task after them. */
export function splitTargets(args: string): { targets: string[]; task: string } {
  const match = /^((?:@[\w-]+\s+)+)([\s\S]*)$/.exec(`${args.trim()} `)
  if (!match) return { targets: [], task: args.trim() }
  return { targets: match[1].trim().split(/\s+/), task: match[2].trim() }
}

export const COMMANDS: SlashCommand[] = [
  {
    name: 'plan',
    args: '<goal>',
    description: 'Write a plan, then wait for /go',
    blocked: approvalFirst,
    prompt: goal =>
      `Plan this with the todo tool, then stop and wait for me to say go before you run any step: ${goal}`,
  },
  {
    name: 'go',
    description: 'Run the current plan',
    blocked: chat =>
      approvalFirst(chat) ??
      (chat.hasPlan ? undefined : 'There is no plan to run. Start one with /plan.'),
    prompt: () => 'Go ahead and run the plan.',
  },
  {
    name: 'each',
    args: '<@target…> <task>',
    description: 'Fan a task out: one subagent per tenant, then one answer',
    blocked: approvalFirst,
    prompt: args => {
      const { targets, task } = splitTargets(args)
      return (
        `Plan this with the todo tool as a fan-out: one subagent step targeting ${targets.join(' ')}, ` +
        'with "{{plugin}}" in its title for the tenant, then a step of your own, after it, that ' +
        `combines the reports into one answer. Then run the plan. The task: ${task}`
      )
    },
  },
  {
    name: 'investigate',
    args: '<detection or resource>',
    description: 'Plan, then fan out to parallel subagents',
    blocked: approvalFirst,
    prompt: target =>
      `Investigate ${target}. Plan it with the todo tool, hand the independent read-only steps to subagents with delegate so they run in parallel, then combine their reports into one answer.`,
  },
  {
    name: 'approve',
    description: 'Approve the pending changes, or one tenant\'s: /approve @tenant',
    blocked: chat =>
      chat.awaitingApproval ? undefined : 'No change is waiting for approval.',
  },
  {
    name: 'deny',
    description: 'Deny the pending changes, or one tenant\'s: /deny @tenant',
    blocked: chat =>
      chat.awaitingApproval ? undefined : 'No change is waiting for approval.',
  },
  {
    name: 'ops',
    args: '<search>',
    description: 'Search the API operations the assistant can call',
  },
  {
    name: 'export',
    description: 'Download this chat as JSON',
    blocked: chat => (chat.hasMessages ? undefined : 'This chat is empty.'),
  },
  {
    name: 'template',
    description: 'Save this chat as a template',
    blocked: chat => (chat.hasMessages ? undefined : 'This chat is empty.'),
  },
]

export function parseCommand(
  text: string,
): { command: SlashCommand; args: string } | undefined {
  const match = /^\/(\S+)(?:\s+([\s\S]*))?$/.exec(text.trim())
  const command = match && COMMANDS.find(c => c.name === match[1])
  return command ? { command, args: match[2]?.trim() ?? '' } : undefined
}

// History keeps the command as typed; the server gets the prompt it stands for.
export function withCommandPrompts(messages: UIMessage[]): UIMessage[] {
  return messages.map(message =>
    message.role !== 'user'
      ? message
      : {
          ...message,
          parts: message.parts.map(part => {
            if (part.type !== 'text') return part
            const parsed = parseCommand(part.text)
            return parsed?.command.prompt
              ? { ...part, text: parsed.command.prompt(parsed.args) }
              : part
          }),
        },
  )
}
