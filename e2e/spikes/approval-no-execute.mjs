// L2.1: can a tool with needsApproval and no execute be approved and then run by the client?
// A real AbstractChat talks to an in-process streamText "server" driven by a mock model.
import {
  AbstractChat,
  dynamicTool,
  jsonSchema,
  streamText,
  convertToModelMessages,
} from 'ai'
import { convertArrayToReadableStream, MockLanguageModelV4 } from 'ai/test'

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
}
const finish = unified => ({ type: 'finish', finishReason: { unified, raw: undefined }, usage })
const toolCall = (toolName, input, id) => ({
  stream: convertArrayToReadableStream([
    { type: 'stream-start', warnings: [] },
    { type: 'tool-call', toolCallId: id, toolName, input: JSON.stringify(input) },
    finish('tool-calls'),
  ]),
})
const text = t => ({
  stream: convertArrayToReadableStream([
    { type: 'stream-start', warnings: [] },
    { type: 'text-start', id: 't' },
    { type: 'text-delta', id: 't', delta: t },
    { type: 'text-end', id: 't' },
    finish('stop'),
  ]),
})

const tools = {
  // Routed catalog tools: declared without execute, as the routing contract would.
  write: dynamicTool({
    description: 'change data',
    inputSchema: jsonSchema({ type: 'object', properties: { id: { type: 'string' } } }),
    needsApproval: true,
  }),
  read: dynamicTool({
    description: 'read data',
    inputSchema: jsonSchema({ type: 'object', properties: {} }),
  }),
}

const model = new MockLanguageModelV4({
  doStream: [toolCall('write', { id: 'd1' }, 'c-write'), text('done after write'), toolCall('read', {}, 'c-read'), text('done after read'), toolCall('write', { id: 'd2' }, 'c-write-2'), text('done after denial')],
})

const log = (...a) => console.log(...a)
let request = 0
const transport = {
  async sendMessages({ messages }) {
    request++
    const prompt = await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true })
    log(`\n--- request ${request}: prompt tail`, JSON.stringify(prompt.slice(-2).map(m => ({ role: m.role, content: Array.isArray(m.content) ? m.content.map(c => c.type + (c.output ? `:${c.output.type}` : '') + (c.approved !== undefined ? `:${c.approved}` : '')) : 'text' }))))
    const calls = model.doStreamCalls.length
    const result = streamText({ model, messages: prompt, tools })
    const stream = result.toUIMessageStream({ originalMessages: messages, onError: e => `server error: ${e.message ?? e}` })
    const chunks = []
    return stream.pipeThrough(new TransformStream({
      transform(chunk, c) { chunks.push(chunk.type); c.enqueue(chunk) },
      flush() { log(`request ${request}: chunks`, chunks.join(','), `| model calls this request: ${model.doStreamCalls.length - calls}`) },
    }))
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
class Chat extends AbstractChat {}

// Like electron/client-tools.ts clientToolsAnswered (last step only), plus denied approvals.
const answered = messages => {
  const last = messages.at(-1)
  if (last?.role !== 'assistant') return false
  const parts = last.parts.slice(last.parts.findLastIndex(p => p.type === 'step-start') + 1).filter(p => p.type === 'dynamic-tool')
  const settled = p => ['output-available', 'output-error', 'output-denied'].includes(p.state) ||
    (p.state === 'approval-responded' && p.approval?.approved === false)
  return parts.length > 0 && parts.every(settled)
}
const chat = new Chat({
  id: 'spike',
  state: new State(),
  transport,
  onToolCall: ({ toolCall }) => log(`onToolCall ${toolCall.toolName} (fires on input-available, before any approval)`),
  // The harness runs a routed call only once it's approved (or needs none), then answers it.
  sendAutomaticallyWhen: ({ messages }) => answered(messages),
})

const partOf = name => chat.messages.at(-1).parts.find(p => p.type === 'dynamic-tool' && p.toolName === name)
const settle = () => new Promise(r => setTimeout(r, 50))

await chat.sendMessage({ text: 'resolve d1' })
await settle()
let part = partOf('write')
log(`after request 1: write part state=${part.state} approvalId=${part.approval?.id}`)

// Scenario A: approve, then the harness executes and adds the output itself.
await chat.addToolApprovalResponse({ id: part.approval.id, approved: true })
await settle()
part = partOf('write')
log(`after approval: state=${part.state} requests so far=${request} (auto-send must NOT have fired)`)
await chat.addToolOutput({ tool: 'write', toolCallId: part.toolCallId, output: { ok: true } })
for (let i = 0; i < 40 && chat.status !== 'ready'; i++) await settle()
await settle()
log(`after client output: requests=${request}, last text=${JSON.stringify(chat.messages.at(-1).parts.filter(p => p.type === 'text').map(p => p.text))}`)

// Scenario B: a read with no approval: the harness answers it on input-available.
await chat.sendMessage({ text: 'read' })
await settle()
part = partOf('read')
log(`read part state=${part.state}`)
await chat.addToolOutput({ tool: 'read', toolCallId: part.toolCallId, output: { rows: 1 } })
for (let i = 0; i < 40 && chat.status !== 'ready'; i++) await settle()
await settle()
log(`after read output: requests=${request}, last text=${JSON.stringify(chat.messages.at(-1).parts.filter(p => p.type === 'text').map(p => p.text))}`)

// Scenario C: deny; the part is answered as denied, and the model hears execution-denied.
await chat.sendMessage({ text: 'resolve d2' })
await settle()
part = partOf('write')
await chat.addToolApprovalResponse({ id: part.approval.id, approved: false })
for (let i = 0; i < 40 && chat.status !== 'ready'; i++) await settle()
await settle()
log(`after denial: part state=${partOf('write').state}, requests=${request}, last text=${JSON.stringify(chat.messages.at(-1).parts.filter(p => p.type === 'text').map(p => p.text))}`)
