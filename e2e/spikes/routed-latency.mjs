// L2.2: what does "every routed call ends the turn" cost? The same sequential tool task runs
// server-side (catalog tools run by ms_ai) and routed (the client runs them and resends), against
// the stub's ms_ai (:13008) calling back to the stub (:2034). Run with the rig up.
import { readFileSync } from 'node:fs'
import { AbstractChat, DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'

const AI = 'http://127.0.0.1:13008/api/chat-v7'
const STUB = 'http://127.0.0.1:2034'
const CALLS = Number(process.env.CALLS ?? 6)
const catalog = JSON.parse(readFileSync(new URL('../fixtures/v7-catalog.json', import.meta.url), 'utf8'))
const listTool = catalog.find(t => t.name === 'detections__list')

const login = await fetch(`${STUB}/trpc/auth.login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'dev@example.com', password: 'pw' }) })
const token = (await login.json()).result.data.access_token
const headers = { authorization: `Bearer ${token}`, customer: 'ws-demo' }
const prompt = `Call detections__list exactly ${CALLS} times, strictly one call per step and never two in the same step: first with limit 1, then limit 2, and so on up to limit ${CALLS}. After the last call, reply with just "done".`

class State {
  messages = []; status = 'ready'; error = undefined
  pushMessage = m => { this.messages = [...this.messages, m] }
  popMessage = () => { this.messages = this.messages.slice(0, -1) }
  replaceMessage = (i, m) => { this.messages = this.messages.with(i, m) }
  snapshot = x => structuredClone(x)
}
class Chat extends AbstractChat {}

async function trial(mode) {
  let requests = 0
  const firstByte = []
  const transport = new DefaultChatTransport({
    api: AI,
    headers,
    fetch: async (url, init) => {
      requests++
      const t = Date.now()
      const response = await fetch(url, init)
      firstByte.push(Date.now() - t)
      return response
    },
    prepareSendMessagesRequest: ({ id, messages }) => ({
      body: mode === 'server'
        ? { id, messages, catalog, clientTools: [] }
        : { id, messages, catalog: [], clientTools: [{ name: listTool.name, description: listTool.description, inputSchema: listTool.inputSchema }] },
    }),
  })
  const chat = new Chat({
    id: `latency-${mode}-${Date.now()}`,
    state: new State(),
    transport,
    onToolCall: ({ toolCall }) => {
      if (mode !== 'routed' || toolCall.toolName !== listTool.name) return
      void fetch(`${STUB}/chat/v7/tools/${toolCall.toolName}`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify(toolCall.input ?? {}) })
        .then(r => r.json())
        .then(output => chat.addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output }))
    },
    sendAutomaticallyWhen: ({ messages }) => mode === 'routed' && lastAssistantMessageIsCompleteWithToolCalls({ messages }),
  })
  const t0 = Date.now()
  await chat.sendMessage({ text: prompt })
  for (let idle = 0; idle < 20; ) {
    await new Promise(r => setTimeout(r, 100))
    idle = chat.status === 'ready' ? idle + 1 : 0
  }
  const last = chat.messages.at(-1)
  const tools = last.parts.filter(p => p.type === 'dynamic-tool' && p.toolName === listTool.name)
  return {
    mode, seconds: (Date.now() - t0 - 2000) / 1000, requests,
    steps: last.parts.filter(p => p.type === 'step-start').length,
    listCalls: tools.length, errors: tools.filter(p => p.state === 'output-error').length,
    firstByteMs: firstByte,
  }
}

const results = []
for (const mode of ['server', 'routed', 'server', 'routed']) {
  const r = await trial(mode)
  results.push(r)
  console.log(JSON.stringify(r))
}
for (const mode of ['server', 'routed']) {
  const rs = results.filter(r => r.mode === mode)
  const perStep = rs.map(r => r.seconds / r.steps)
  console.log(`${mode}: ${rs.map(r => `${r.seconds.toFixed(1)}s/${r.steps} steps/${r.requests} req`).join(', ')}; ${(perStep.reduce((a, b) => a + b) / perStep.length).toFixed(2)}s per step`)
}
