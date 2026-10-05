import type { UIMessage } from 'ai'
import { parseCommand } from './commands'
import type { Subscription } from './channels'
import type { OutgoingMessage } from './desktop'
import { latestPlan, TODO, type Step } from './todo'
import type { Trigger } from './triggers'

export interface Template {
  id: string
  name: string
  kind: 'prompt' | 'plan'
  /** As typed, commands included; a plan template sends it as its goal. */
  prompt: string
  steps?: Step[]
  /** Variable → the value it replaced in the source chat. */
  examples: Record<string, string>
  createdAt: number
  /** What starts the agent's runs on its own. */
  triggers?: Trigger[]
  /** Where each run's artifacts are sent, by artifact id. */
  notifications?: Subscription[]
}

/** Metadata of a user message that loads a plan template. */
export interface TemplatePlan {
  id: string
  name: string
  steps: Step[]
  /** Run the plan right away instead of waiting for /go. */
  run: boolean
}

const PLACEHOLDER = /\{\{\s*([\w-]+)\s*\}\}/g

export const VARIABLE_NAME = /^[\w-]+$/

// Filled per tenant in a fan-out, so it is never a template variable.
const RESERVED = new Set(['plugin'])

/** The variables a template uses, in order of first appearance. */
export function variableNames(t: Pick<Template, 'prompt' | 'steps'>): string[] {
  const texts = [t.prompt, ...(t.steps ?? []).map(s => s.title)]
  return [
    ...new Set(
      texts.flatMap(text =>
        [...text.matchAll(PLACEHOLDER)].map(m => m[1]).filter(n => !RESERVED.has(n)),
      ),
    ),
  ]
}

/** Fills the placeholders that have a value; the rest stay as typed. */
export function fill(text: string, values: Record<string, string>): string {
  return text.replace(PLACEHOLDER, (match, name: string) =>
    RESERVED.has(name) ? match : values[name]?.trim() || match,
  )
}

export function fillSteps(
  steps: Step[],
  values: Record<string, string>,
): Step[] {
  return steps.map(step => ({ ...step, title: fill(step.title, values) }))
}

/** Swaps every occurrence of `value` for `{{name}}`, in the prompt and the step titles. */
export function makeVariable<T extends Pick<Template, 'prompt' | 'steps'>>(
  t: T,
  value: string,
  name: string,
): T {
  const swap = (text: string) => text.split(value).join(`{{${name}}}`)
  return {
    ...t,
    prompt: swap(t.prompt),
    steps: t.steps?.map(step => ({ ...step, title: swap(step.title) })),
  }
}

// Values that usually change from run to run.
const CANDIDATES = [
  /\barn:[\w\-.:/*]+/g,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  /\b[a-z]{1,4}-[0-9a-f]{8,17}\b/g,
  /\b[A-Z]{2,}-\d+\b/g,
  /\b(?:last|past) (?:\d+ )?(?:minutes?|hours?|days?|weeks?|months?)\b/gi,
  /(?<=")[^"\n]{2,60}(?=")|(?<=`)[^`\n]{2,60}(?=`)/g,
]

export function suggestVariables(
  t: Pick<Template, 'prompt' | 'steps'>,
): string[] {
  const texts = [t.prompt, ...(t.steps ?? []).map(s => s.title)]
  return [
    ...new Set(
      texts.flatMap(text => CANDIDATES.flatMap(re => text.match(re) ?? [])),
    ),
  ].filter(value => !value.includes('{{'))
}

/** `/plan <goal>` reads as its goal; other commands as a sentence, e.g. "Investigate DET-1". */
export function goalOf(text: string): string {
  const parsed = parseCommand(text)
  if (!parsed?.command.prompt) return text
  const { command, args } = parsed
  if (command.name === 'plan') return args
  return `${command.name[0].toUpperCase()}${command.name.slice(1)} ${args}`.trim()
}

/** A draft from a chat's first prompt and, if it has one, its latest plan. */
export function templateFromChat(
  messages: UIMessage[],
  name: string,
): Template {
  const first = messages
    .find(m => m.role === 'user')
    ?.parts.find(p => p.type === 'text')
  const typed = first?.type === 'text' ? first.text.trim() : ''
  const plan = latestPlan(messages)
  const steps = plan?.map(({ note: _, ...step }) => ({
    ...step,
    status: 'pending' as const,
  }))
  return {
    id: crypto.randomUUID(),
    name,
    kind: steps?.length ? 'plan' : 'prompt',
    prompt: typed,
    steps,
    examples: {},
    createdAt: Date.now(),
  }
}

export function templatePlanOf(message: UIMessage): TemplatePlan | undefined {
  if (message.role !== 'user') return undefined
  return (message.metadata as { template?: TemplatePlan } | undefined)?.template
}

// History keeps the goal and the plan as metadata; the server gets the prompt
// they stand for, and no metadata. Targets no longer known are left out, so the
// server's check doesn't reject the plan.
export function withTemplatePrompts(
  messages: UIMessage[],
  knownTargets?: Set<string>,
): UIMessage[] {
  return messages.map(message => {
    const template = templatePlanOf(message)
    if (!template) return message
    const then = template.run
      ? 'run it'
      : 'stop and wait for me to say go before you run any step'
    return {
      ...message,
      metadata: undefined,
      parts: message.parts.map(part =>
        part.type === 'text'
          ? {
              ...part,
              text: `${part.text}\n\nDon't write a new plan. Record this one with the todo tool exactly as given, with the same ids, titles, tools, assignees, dependencies and targets, then ${then}:\n\n${JSON.stringify(
                knownTargets
                  ? template.steps.map(step =>
                      step.targets
                        ? { ...step, targets: step.targets.filter(t => knownTargets.has(t)) }
                        : step,
                    )
                  : template.steps,
              )}`,
            }
          : part,
      ),
    }
  })
}

/** The first plan the server accepted in the turn that answers message `index`. */
export function recordedPlan(
  messages: UIMessage[],
  index: number,
): Step[] | undefined {
  for (const message of messages.slice(index + 1)) {
    if (message.role === 'user') return undefined
    for (const part of message.parts) {
      if (
        part.type === 'dynamic-tool' &&
        part.toolName === TODO &&
        part.state === 'output-available'
      ) {
        return (part.input as { steps?: Step[] }).steps
      }
    }
  }
  return undefined
}

const listKey = (list?: string[]) => [...(list ?? [])].sort().join('\n')

/** How the recorded plan differs from the template's, step by step. */
export function planDrift(expected: Step[], recorded: Step[]): string[] {
  const byId = new Map(recorded.map(step => [step.id, step]))
  const same = (a: Step, b: Step) =>
    a.title.trim() === b.title.trim() &&
    a.assignee === b.assignee &&
    listKey(a.tools) === listKey(b.tools) &&
    listKey(a.dependsOn) === listKey(b.dependsOn) &&
    listKey(a.targets) === listKey(b.targets)
  return [
    ...expected.flatMap(step => {
      const got = byId.get(step.id)
      if (!got) return [`Dropped: ${step.title}`]
      return same(step, got) ? [] : [`Changed: ${step.title}`]
    }),
    ...recorded
      .filter(step => !expected.some(e => e.id === step.id))
      .map(step => `Added: ${step.title}`),
  ]
}

/** A run's first message from a template, with its variables and any context filled in. */
export function templateMessage(
  template: Template,
  values: Record<string, string>,
  run: boolean,
  context?: string,
): OutgoingMessage {
  const withContext = (text: string) => (context ? `${text}\n\n${context}` : text)
  const prompt = fill(template.prompt, values)
  if (template.kind !== 'plan' || !template.steps?.length) {
    return { text: withContext(prompt) }
  }
  const plan: TemplatePlan = {
    id: template.id,
    name: template.name,
    steps: fillSteps(template.steps, values),
    run,
  }
  return { text: withContext(goalOf(prompt)), metadata: { template: plan } }
}
