import {
  AbstractChat,
  DefaultChatTransport,
  type ChatState,
  type ChatStatus,
  type DynamicToolUIPart,
  type UIMessage,
} from 'ai'
import { withCommandPrompts } from '@/lib/commands'
import { withReportsOnly, type DelegateInput, type SubagentRun } from '@/lib/delegate'
import { lastStepCalls, routedStepAnswered } from '@/lib/routing'
import type { Step } from '@/lib/todo'
import { kindOf } from './plugins/kinds'
import { orchestrator } from './plugins/store'
import type { Plugin } from './plugins/types'
import type { Router } from './router'

// Children run at most this many at a time.
const CONCURRENCY = 4

class ChildState implements ChatState<UIMessage> {
  #messages: UIMessage[] = []
  status: ChatStatus = 'ready'
  error: Error | undefined
  constructor(private readonly changed: () => void) {}
  get messages() {
    return this.#messages
  }
  set messages(messages: UIMessage[]) {
    this.#messages = messages
    this.changed()
  }
  pushMessage = (message: UIMessage) => {
    this.#messages = [...this.#messages, message]
    this.changed()
  }
  popMessage = () => {
    this.#messages = this.#messages.slice(0, -1)
    this.changed()
  }
  replaceMessage = (index: number, message: UIMessage) => {
    this.#messages = this.#messages.with(index, message)
    this.changed()
  }
  snapshot = <T>(thing: T): T => structuredClone(thing)
}

class ChildChat extends AbstractChat<UIMessage> {}

/**
 * One subagent, run by the app: its model turns go to the orchestrator in
 * subagent mode, and its read calls to its own tenant, or wherever it names
 * when it isn't pinned. It ends when a turn ends without calls.
 */
function runChild(params: {
  id: string
  input: DelegateInput
  plan: Step[]
  target?: Plugin
  /** The parent's history, for a child that isn't pinned to a tenant. */
  history: UIMessage[]
  focus?: string
  router: Router
  signal: AbortSignal
  onProgress: (message: UIMessage | undefined) => void
}): Promise<UIMessage | undefined> {
  const { input, plan, target, router, signal } = params
  const history = target ? [] : withCommandPrompts(withReportsOnly(params.history))
  let chat: ChildChat
  const state = new ChildState(() => params.onProgress(state.messages.at(-1)))

  return new Promise((resolve, reject) => {
    const settle = () => {
      const calls = lastStepCalls(chat.messages)
      if (calls.length === 0) resolve(chat.messages.at(-1))
    }

    const route = async (part: DynamicToolUIPart) => {
      try {
        const where = target
          ? router.pinned(target)
          : router.resolve(part, [...params.history, ...chat.messages], params.focus)
        if (await router.isWrite(where, part.toolName)) {
          throw new Error(
            `${where.plugin.label} counts ${part.toolName} as a change, and subagents can't make changes. Report what should change instead.`,
          )
        }
        const output = await router.run(part, where, signal)
        await chat.addToolOutput({ tool: part.toolName, toolCallId: part.toolCallId, state: 'output-available', output })
      } catch (error) {
        await chat.addToolOutput({
          tool: part.toolName,
          toolCallId: part.toolCallId,
          state: 'output-error',
          errorText: signal.aborted ? 'Stopped before it finished.' : (error as Error).message,
        })
      }
    }

    chat = new ChildChat({
      id: params.id,
      state,
      transport: new DefaultChatTransport<UIMessage>({
        fetch: (_, init) => {
          const plugin = orchestrator()
          if (!plugin) throw new Error('No plugin is labeled orchestrator.')
          const { api, headers, fetch } = kindOf(plugin).chat(plugin)
          const merged = new Headers(init?.headers)
          for (const [name, value] of Object.entries(headers)) merged.set(name, value)
          return fetch(api, { ...init, headers: merged, signal })
        },
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            id,
            messages: [...history, ...messages],
            clientTools: [],
            subagent: { input, plan, target: target?.id, parentLength: history.length },
            ...router.requestFields(),
          },
        }),
      }),
      onFinish: ({ isAbort, isError }) => {
        if (isAbort) return reject(new Error('Stopped before it finished.'))
        if (isError) return reject(chat.error ?? new Error('The subagent failed.'))
        const calls = lastStepCalls(chat.messages).filter(p => p.state === 'input-available')
        if (calls.length === 0) return settle()
        for (const part of calls) void route(part)
      },
      sendAutomaticallyWhen: ({ messages }) => !signal.aborted && routedStepAnswered(messages),
    })
    signal.addEventListener('abort', () => {
      void chat.stop()
      reject(new Error('Stopped before it finished.'))
    })
    void chat.sendMessage()
  })
}

/**
 * A delegated step, run as one child per ready target, or one child that sees
 * the conversation when the step has no targets. Progress goes to `onProgress`;
 * the result is one run per plugin.
 */
export async function fanOut(params: {
  toolCallId: string
  input: DelegateInput
  plan: Step[]
  targets?: Plugin[]
  history: UIMessage[]
  focus?: string
  router: Router
  signal: AbortSignal
  onProgress: (runs: SubagentRun[]) => void
}): Promise<SubagentRun[]> {
  const { router, signal } = params
  const targets: (Plugin | undefined)[] = params.targets ?? [undefined]
  const runs: SubagentRun[] = targets.map(plugin => {
    const where = plugin && router.describeTarget(plugin)
    const ready = !plugin || kindOf(plugin).signedIn(plugin)
    return {
      plugin: plugin?.id ?? '',
      label: where?.label ?? 'Subagent',
      scopeLabel: where?.scopeLabel,
      status: ready ? 'running' : 'skipped',
      reason: ready ? undefined : `${plugin!.label} is signed out. Connect it in Options.`,
    }
  })
  const update = (index: number, change: Partial<SubagentRun>) => {
    runs[index] = { ...runs[index], ...change }
    params.onProgress(runs.map(run => ({ ...run })))
  }
  params.onProgress(runs.map(run => ({ ...run })))

  let next = 0
  const worker = async () => {
    for (let index = next++; index < targets.length; index = next++) {
      if (runs[index].status === 'skipped') continue
      if (signal.aborted) {
        update(index, { status: 'failed', reason: 'Stopped before it started.' })
        continue
      }
      try {
        const message = await runChild({
          id: `${params.toolCallId}-${index}`,
          input: params.input,
          plan: params.plan,
          target: targets[index],
          history: params.history,
          focus: params.focus,
          router,
          signal,
          onProgress: message => update(index, { message }),
        })
        update(index, { status: 'done', message })
      } catch (error) {
        update(index, { status: 'failed', reason: (error as Error).message })
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker))
  return runs
}
