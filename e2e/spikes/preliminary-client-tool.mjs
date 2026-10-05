// L2.3: can the harness stream a client-run delegate's progress into its part as preliminary
// outputs, then answer it once, with auto-send firing exactly once and after the final output?
import { AbstractChat, convertToModelMessages, dynamicTool, jsonSchema, streamText } from 'ai'
import { convertArrayToReadableStream, MockLanguageModelV4 } from 'ai/test'

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
}
const finish = unified => ({ type: 'finish', finishReason: { unified, raw: undefined }, usage })
const step = parts => ({ stream: convertArrayToReadableStream([{ type: 'stream-start', warnings: [] }, ...parts]) })
const model = new MockLanguageModelV4({
  doStream: [
    step([{ type: 'tool-call', toolCallId: 'c-del', toolName: 'delegate', input: '{"stepId":"audit"}' }, finish('tool-calls')]),
    step([{ type: 'text-start', id: 't' }, { type: 'text-delta', id: 't', delta: 'got the reports' }, { type: 'text-end', id: 't' }, finish('stop')]),
  ],
})
const tools = { delegate: dynamicTool({ description: 'fan out', inputSchema: jsonSchema({ type: 'object' }), outputSchema: jsonSchema({}) }) }

const requests = []
const transport = {
  async sendMessages({ messages }) {
    const prompt = await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true })
    const result = prompt.flatMap(m => (Array.isArray(m.content) ? m.content : [])).find(c => c.type === 'tool-result')
    requests.push(result ? JSON.stringify(result.output) : 'no tool-result')
    return streamText({ model, messages: prompt, tools }).toUIMessageStream({ originalMessages: messages })
  },
  reconnectToStream: async () => null,
}

class State {
  messages = []; status = 'ready'; error = undefined
  pushMessage = m => { this.messages = [...this.messages, m] }
  popMessage = () => { this.messages = this.messages.slice(0, -1) }
  replaceMessage = (i, m) => { this.messages = this.messages.with(i, m) }
  snapshot = x => structuredClone(x)
}
const state = new State()
const answered = messages => {
  const last = messages.at(-1)
  if (last?.role !== 'assistant') return false
  const calls = last.parts.slice(last.parts.findLastIndex(p => p.type === 'step-start') + 1).filter(p => p.type === 'dynamic-tool')
  return calls.length > 0 && calls.every(p => p.state === 'output-available' && !p.preliminary)
}
class Chat extends AbstractChat {}
const chat = new Chat({ id: 'spike', state, transport, sendAutomaticallyWhen: ({ messages }) => answered(messages) })

// Writes straight into the part through our ChatState, as electron/runs.ts RunState allows.
function patchPart(toolCallId, change) {
  const i = state.messages.length - 1
  const message = state.messages[i]
  state.replaceMessage(i, { ...message, parts: message.parts.map(p => (p.toolCallId === toolCallId ? { ...p, ...change } : p)) })
}
const settle = (ms = 50) => new Promise(r => setTimeout(r, ms))
const part = () => state.messages.at(-1).parts.find(p => p.toolName === 'delegate')

await chat.sendMessage({ text: 'audit all' })
await settle()
console.log(`delegate part: ${part().state}, requests=${requests.length}`)

for (const n of [1, 2, 3]) {
  const runs = [{ plugin: 'staging', status: n < 3 ? 'running' : 'done', message: { id: 'child', role: 'assistant', parts: [{ type: 'text', text: `step ${n}` }] } }]
  patchPart('c-del', { state: 'output-available', preliminary: true, output: { runs } })
  await settle()
}
console.log(`after 3 preliminary writes: state=${part().state} preliminary=${part().preliminary} requests=${requests.length} (expect 1)`)

// Final: drop the preliminary flag first, since addToolOutput spreads the old part over the new.
const final = { runs: [{ plugin: 'staging', status: 'done', message: { id: 'child', role: 'assistant', parts: [{ type: 'text', text: 'report' }] } }] }
patchPart('c-del', { state: 'input-available', preliminary: undefined, output: undefined })
await chat.addToolOutput({ tool: 'delegate', toolCallId: 'c-del', output: final })
for (let i = 0; i < 40 && (chat.status !== 'ready' || requests.length < 2); i++) await settle()
await settle(100)
const done = state.messages.at(-1).parts.find(p => p.toolName === 'delegate')
console.log(`after final: state=${done.state} preliminary=${done.preliminary} requests=${requests.length} (expect 2)`)
console.log(`request 2 tool-result: ${requests[1]}`)
console.log(`answer: ${JSON.stringify(state.messages.at(-1).parts.filter(p => p.type === 'text').map(p => p.text))}`)
