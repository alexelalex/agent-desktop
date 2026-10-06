#!/usr/bin/env node
// A stand-in for `claude -p` with stream-json in and out, as the app drives it: it writes
// Claude Code's transcript shapes, posts its hooks, and calls the app's MCP server. What a
// turn does comes from a `[fake:<name> <json>]` marker in the prompt (e2e/fake-scripts.mjs).
import { execSync, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { jsonAt, scriptOf } from './fake-scripts.mjs'

const ZERO = '00000000-0000-0000-0000-000000000000'
const LOG = process.env.FAKE_CLAUDE_LOG ?? new URL('./.out/fake-claude.log', import.meta.url).pathname
const argv = process.argv.slice(2)
const flag = name => {
  const i = argv.indexOf(name)
  return i < 0 ? undefined : argv[i + 1]
}
const log = entry => {
  try {
    mkdirSync(path.dirname(LOG), { recursive: true })
    appendFileSync(LOG, `${JSON.stringify({ pid: process.pid, at: Date.now(), ...entry })}\n`)
  } catch {}
}

async function connect(url, headers) {
  const client = new Client({ name: 'fake-claude', version: '9.9.9' })
  const transport = new SSEClientTransport(new URL(url), {
    fetch: (input, init) =>
      fetch(input, { ...init, headers: { ...Object.fromEntries(new Headers(init?.headers)), ...headers } }),
  })
  await client.connect(transport)
  return client
}
const textOf = result => (result.content ?? []).filter(c => c.type === 'text').map(c => c.text).join('\n')
async function mcpCall(client, tool, args, toolUseId) {
  const result = await client.callTool(
    { name: tool, arguments: args, _meta: { 'claudecode/toolUseId': toolUseId } },
    undefined,
    { timeout: 2 ** 31 - 1, resetTimeoutOnProgress: true },
  )
  return { text: textOf(result), isError: !!result.isError }
}
// The plugin's connection as its headersHelper makes it: this process's pid, and AGENT_DESKTOP_RUN.
const pluginHeaders = () => ({
  'x-claude-pid': String(process.pid),
  ...(process.env.AGENT_DESKTOP_RUN && { 'x-agent-desktop-run': process.env.AGENT_DESKTOP_RUN }),
})

// A `claude` started inside a task makes one call from its own process.
if (argv[0] === '--nested-call') {
  const [, url, tool, args] = argv
  const client = await connect(url, pluginHeaders())
  const result = await mcpCall(client, tool, JSON.parse(args), `toolu_nested_${process.pid}`)
  console.log(result.text)
  process.exit(result.isError ? 1 : 0)
}

if (argv.includes('--version')) {
  console.log('9.9.9 (Claude Code)')
  process.exit(0)
}
// The app's probes look a session up that doesn't exist.
if (flag('--resume') === ZERO) {
  if (flag('--permission-mode') === 'acceptEdits' && process.env.FAKE_NO_ACCEPT_EDITS === '1') {
    console.error("error: option '--permission-mode <mode>' argument 'acceptEdits' is invalid.")
    process.exit(1)
  }
  console.error(`No conversation found with session ID: ${ZERO}`)
  process.exit(1)
}
// A retry's file restore: nothing to put back here.
if (argv.includes('--rewind-files')) process.exit(0)

const configDir = process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), '.claude')
const cwd = process.cwd()
const projectDir = path.join(configDir, 'projects', cwd.replace(/[^a-zA-Z0-9]/g, '-'))
const findTranscript = id => {
  const root = path.join(configDir, 'projects')
  for (const dir of existsSync(root) ? readdirSync(root) : []) {
    const file = path.join(root, dir, `${id}.jsonl`)
    if (existsSync(file)) return file
  }
}

const resume = flag('--resume')
const fork = argv.includes('--fork-session')
const sessionId = fork || !resume ? flag('--session-id') : resume
const mode = flag('--permission-mode') ?? 'default'
log({ event: 'spawn', argv, cwd, mode, sessionId, run: process.env.AGENT_DESKTOP_RUN })
const fail = message => {
  console.error(message)
  log({ event: 'exit', code: 1, message })
  process.exit(1)
}

let file = path.join(projectDir, `${sessionId}.jsonl`)
let last
if (resume && !fork) {
  file = findTranscript(resume) ?? fail(`No conversation found with session ID: ${resume}`)
} else {
  if (findTranscript(sessionId)) fail(`Error: Session ID ${sessionId} is already in use.`)
  mkdirSync(projectDir, { recursive: true })
  if (fork) {
    const source = findTranscript(resume) ?? fail(`No conversation found with session ID: ${resume}`)
    const at = flag('--resume-session-at')
    const lines = []
    for (const line of readFileSync(source, 'utf8').split('\n').filter(Boolean)) {
      lines.push(line)
      if (at && JSON.parse(line).uuid === at) break
    }
    writeFileSync(file, lines.map(l => `${l}\n`).join(''))
  }
}
if (existsSync(file)) {
  const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean)
  for (const line of lines.reverse()) {
    const uuid = JSON.parse(line).uuid
    if (uuid) {
      last = uuid
      break
    }
  }
}

function write(entry) {
  const uuid = randomUUID()
  const full = { ...entry, uuid, parentUuid: last ?? null, sessionId, cwd, isSidechain: false, timestamp: new Date().toISOString() }
  appendFileSync(file, `${JSON.stringify(full)}\n`)
  last = uuid
  return uuid
}
const out = event => process.stdout.write(`${JSON.stringify(event)}\n`)

// Hooks and the MCP server, as --settings and --mcp-config name them.
const settings = JSON.parse(flag('--settings') ?? '{}')
async function hook(event) {
  const target = settings.hooks?.[event]?.[0]?.hooks?.[0]
  if (!target?.url) return
  await fetch(target.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...target.headers },
    body: JSON.stringify({ session_id: sessionId, transcript_path: file, cwd, hook_event_name: event }),
  }).catch(() => undefined)
}

const server = JSON.parse(flag('--mcp-config') ?? '{}').mcpServers?.desktop
const mcp = server ? connect(server.url, server.headers ?? {}) : undefined
mcp?.catch(error => log({ event: 'mcp-error', message: String(error) }))
let plugin
const pluginClient = () => (plugin ??= connect(server.url, pluginHeaders()))


let messageCount = 0
const said = []
const usage = () => ({ input_tokens: 3, cache_read_input_tokens: 1200 * messageCount, output_tokens: 40 })
function toolUse(name, input) {
  const id = `toolu_${randomUUID().replace(/-/g, '').slice(0, 24)}`
  write({ type: 'assistant', message: { id: `msg_${++messageCount}`, role: 'assistant', content: [{ type: 'tool_use', id, name, input }], usage: usage() } })
  return id
}
function toolResult(id, text, isError = false) {
  write({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: [{ type: 'text', text }], is_error: isError }] } })
}
// Claude Code asks the app before a tool it may not use unasked.
async function permitted(name, input, id) {
  const client = await mcp
  const answer = await mcpCall(client, 'ui_permission', { tool_name: name, input, tool_use_id: id }, id)
  const verdict = JSON.parse(answer.text)
  if (verdict.behavior === 'allow') return { allowed: true, input: verdict.updatedInput ?? input }
  toolResult(id, verdict.message ?? 'Denied.', true)
  return { allowed: false }
}
// `ui_x` or `tenant__p__op` as the transcript names this server's tools, and back.
const tenantName = tool => (tool.startsWith('mcp__') ? tool : `mcp__desktop__${tool}`)
const mcpTool = tool => tool.replace(/^mcp__desktop__/, '')
const own = tool => /^(mcp__desktop__|ui_|tenant__)/.test(tool)

const steps = {
  async say(text) {
    said.push(text)
    write({ type: 'assistant', message: { id: `msg_${++messageCount}`, role: 'assistant', content: [{ type: 'text', text }], usage: usage() } })
  },
  async render(args) {
    return steps.call('ui_render_artifact', args)
  },
  async call(tool, args = {}) {
    const id = toolUse(tenantName(tool), args)
    const result = await mcpCall(await mcp, mcpTool(tool), args, id)
    toolResult(id, result.text, result.isError)
  },
  async permission(tool, input = {}) {
    const name = own(tool) ? tenantName(tool) : tool
    const id = toolUse(name, input)
    const verdict = await permitted(name, input, id)
    if (!verdict.allowed) return
    if (!own(tool)) return toolResult(id, JSON.stringify(verdict.input))
    const result = await mcpCall(await mcp, mcpTool(tool), verdict.input, id)
    toolResult(id, result.text, result.isError)
  },
  async ask(questions) {
    const id = toolUse('AskUserQuestion', { questions })
    const verdict = await permitted('AskUserQuestion', { questions }, id)
    if (verdict.allowed) toolResult(id, `Answers: ${JSON.stringify(verdict.input.answers ?? {})}`)
  },
  async edit(target, text) {
    const input = { file_path: path.resolve(cwd, target), content: text }
    const id = toolUse('Write', input)
    if (mode !== 'acceptEdits' && !(await permitted('Write', input, id)).allowed) return
    const created = !existsSync(input.file_path)
    mkdirSync(path.dirname(input.file_path), { recursive: true })
    writeFileSync(input.file_path, text)
    toolResult(id, created ? `File created successfully at: ${input.file_path}` : `The file ${input.file_path} has been updated successfully.`)
  },
  // The Edit tool: replaces the one occurrence of `from`.
  async replace(target, from, to) {
    const input = { file_path: path.resolve(cwd, target), old_string: from, new_string: to }
    const id = toolUse('Edit', input)
    if (mode !== 'acceptEdits' && !(await permitted('Edit', input, id)).allowed) return
    writeFileSync(input.file_path, readFileSync(input.file_path, 'utf8').replace(from, to))
    toolResult(id, `The file ${input.file_path} has been updated successfully.`)
  },
  async bash(command) {
    const id = toolUse('Bash', { command })
    if (!(await permitted('Bash', { command }, id)).allowed) return
    try {
      toolResult(id, execSync(command, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
    } catch (error) {
      toolResult(id, String(error.stderr || error.message), true)
    }
  },
  async 'plugin-call'(tool, args = {}) {
    const id = toolUse(tenantName(tool), args)
    const result = await mcpCall(await pluginClient(), mcpTool(tool), args, id)
    toolResult(id, result.text, result.isError)
  },
  // A `claude` started inside this one: its own pid, the same environment.
  async 'nested-plugin-call'(tool, args = {}) {
    const id = toolUse(tenantName(tool), args)
    const child = spawn(process.execPath, [new URL('./fake-claude.mjs', import.meta.url).pathname, '--nested-call', server.url, mcpTool(tool), JSON.stringify(args)], { cwd, env: process.env, stdio: ['ignore', 'pipe', 'inherit'] })
    let text = ''
    child.stdout.on('data', chunk => (text += chunk))
    const code = await new Promise(resolve => child.on('close', resolve))
    toolResult(id, text.trim(), code !== 0)
  },
  async commit(message) {
    const id = toolUse('Bash', { command: `git add -A && git commit -m ${JSON.stringify(message)}` })
    try {
      toolResult(id, execSync(`git add -A && git commit -q -m ${JSON.stringify(message)}`, { cwd, encoding: 'utf8' }))
    } catch (error) {
      toolResult(id, String(error.stderr || error.message), true)
    }
  },
  async title(text) {
    appendFileSync(file, `${JSON.stringify({ type: 'ai-title', aiTitle: text, sessionId })}\n`)
  },
  async 'custom-title'(text) {
    appendFileSync(file, `${JSON.stringify({ type: 'custom-title', customTitle: text, sessionId })}\n`)
  },
  async wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms))
  },
  async fail(text) {
    throw Object.assign(new Error(text), { scripted: true })
  },
}


// The app's reply suggester: the agent's last message may hold `[fake-suggest:<json>]`, a list of
// [step, args] with steps suggest, read, notes and wait.
const suggester = argv.includes('mcp__desktop__ui_suggest_replies')
const SUGGESTER_TOOLS = { suggest: 'ui_suggest_replies', read: 'ui_read_conversation', notes: 'ui_set_reply_notes' }
async function suggest(content) {
  if (first) {
    first = false
    out({ type: 'system', subtype: 'init', session_id: sessionId, cwd, permissionMode: mode })
    log({ event: 'suggester-tools', names: (await (await mcp).listTools()).tools.map(t => t.name) })
  }
  write({ type: 'user', message: { role: 'user', content } })
  let error
  if (content !== '/clear') {
    try {
      const request = JSON.parse(content)
      log({ event: 'suggester-request', request })
      const said = request.type === 'start'
        ? ''
        : request.conversation.slice(request.conversation.lastIndexOf('\n\nAssistant: '))
      const at = said.lastIndexOf('[fake-suggest:')
      const plan = at < 0
        ? [['suggest', { replies: [{ label: 'Go on', text: 'go on', kind: 'next' }] }]]
        : jsonAt(said, at + '[fake-suggest:'.length).value
      for (const [step, args] of plan) {
        if (step === 'wait') {
          await new Promise(resolve => setTimeout(resolve, args))
          continue
        }
        const tool = SUGGESTER_TOOLS[step]
        const input = step === 'suggest' ? { request_id: request.request_id, ...args } : step === 'read' ? { run_id: request.run_id, ...args } : { notes: args }
        const result = await mcpCall(await mcp, tool, input, `toolu_suggest_${randomUUID().slice(0, 8)}`)
        log({ event: 'suggester-call', tool, input, result })
      }
    } catch (e) {
      error = e
      log({ event: 'step-error', message: String(e?.stack ?? e) })
    }
  }
  out(error
    ? { type: 'result', subtype: 'error_during_execution', is_error: true, result: error.message, session_id: sessionId }
    : { type: 'result', subtype: 'success', is_error: false, result: 'ok', session_id: sessionId })
}

// A spin-off's context writer: the prompt in its request may hold `[fake-context:<json>]` with
// text, wait (ms) and fail; without one it finds nothing that bears on the prompt.
const contextWriter = (flag('--system-prompt') ?? '').startsWith('You write context briefs')
async function writeContext(content) {
  log({ event: 'context-request', argv, content })
  const prompt = content.slice(content.lastIndexOf('<prompt>'))
  const at = prompt.indexOf('[fake-context:')
  const plan = at < 0 ? {} : jsonAt(prompt, at + '[fake-context:'.length).value
  if (plan.wait) await new Promise(resolve => setTimeout(resolve, plan.wait))
  out(plan.fail
    ? { type: 'result', subtype: 'error_during_execution', is_error: true, result: plan.fail, session_id: sessionId }
    : { type: 'result', subtype: 'success', is_error: false, result: plan.text ?? 'NONE', session_id: sessionId })
}

let first = true
async function turn(content) {
  log({ event: 'input', sessionId, content })
  if (suggester) return suggest(content)
  if (contextWriter) return writeContext(content)
  // Lets a test see the window before the transcript has the prompt.
  if (first && process.env.FAKE_PROMPT_DELAY_MS) await new Promise(r => setTimeout(r, Number(process.env.FAKE_PROMPT_DELAY_MS)))
  const prompt = write({ type: 'user', message: { role: 'user', content } })
  appendFileSync(file, `${JSON.stringify({ type: 'file-history-snapshot', messageId: prompt, snapshot: {}, isSnapshotUpdate: false })}\n`)
  // FAKE_TOOLS: extra tool names the init event lists, e.g. a Jira tool.
  const tools = (process.env.FAKE_TOOLS ?? '').split(',').filter(Boolean)
  if (first) out({ type: 'system', subtype: 'init', session_id: sessionId, cwd, permissionMode: mode, tools: ['Bash', 'Edit', ...tools] })
  first = false
  await hook('UserPromptSubmit')
  said.length = 0
  let error
  try {
    for (const [name, ...args] of scriptOf(typeof content === 'string' ? content : JSON.stringify(content))) {
      if (!steps[name]) throw new Error(`Unknown fake step: ${name}`)
      await steps[name](...args)
    }
  } catch (e) {
    error = e
    if (!e.scripted) log({ event: 'step-error', message: String(e?.stack ?? e) })
  }
  out(
    error
      ? { type: 'result', subtype: 'error_during_execution', is_error: true, result: error.message, session_id: sessionId }
      : { type: 'result', subtype: 'success', is_error: false, result: said.at(-1) ?? '', session_id: sessionId },
  )
  log({ event: 'result', sessionId, error: error?.message })
  await hook('Stop')
}

// Messages take turns in order; when input closes, the current turn finishes and the process exits.
let chain = Promise.resolve()
const input = createInterface({ input: process.stdin })
input.on('line', line => {
  let message
  try {
    message = JSON.parse(line)
  } catch {
    return
  }
  if (message.type !== 'user') return
  chain = chain.then(() => turn(message.message?.content ?? ''))
})
input.on('close', () =>
  void chain.then(() => {
    log({ event: 'exit', code: 0 })
    process.exit(0)
  }),
)
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    log({ event: 'exit', code: 130, signal })
    process.exit(130)
  })
