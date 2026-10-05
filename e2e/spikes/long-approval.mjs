// Phase 3 check: does a real `claude -p` keep a permission prompt open for 6 minutes and still
// apply the answer? The task approval wait (60 min) rests on it. Usage: node e2e/spikes/long-approval.mjs [minutes]
import { spawn } from 'node:child_process'
import { mkdtempSync, realpathSync } from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

const HOLD_MS = Number(process.argv[2] ?? 6) * 60_000
const WAIT = String(HOLD_MS + 5 * 60_000)
const started = Date.now()
const since = () => `${Math.round((Date.now() - started) / 1000)}s`
let progressToken
let answered

const transports = new Map()
const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname === '/sse') {
    const transport = new SSEServerTransport('/messages', res)
    transports.set(transport.sessionId, transport)
    const server = new Server({ name: 'spike', version: '0.0.0' }, { capabilities: { tools: {} } })
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [{ name: 'permission', description: 'Permission prompt.', inputSchema: { type: 'object', properties: { tool_name: { type: 'string' }, input: { type: 'object' } } } }],
    }))
    server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      const { tool_name, input } = request.params.arguments ?? {}
      progressToken = request.params._meta?.progressToken
      console.log(`[${since()}] permission asked for ${tool_name}; progressToken ${progressToken === undefined ? 'absent' : 'present'}`)
      // The app's heartbeat, when Claude Code sends a token.
      let n = 0
      const beat = progressToken !== undefined
        ? setInterval(() => void extra.sendNotification({ method: 'notifications/progress', params: { progressToken, progress: ++n } }).catch(() => {}), 30_000)
        : undefined
      await new Promise(resolve => setTimeout(resolve, HOLD_MS))
      clearInterval(beat)
      answered = Date.now()
      console.log(`[${since()}] answering allow`)
      return { content: [{ type: 'text', text: JSON.stringify({ behavior: 'allow', updatedInput: input }) }] }
    })
    await server.connect(transport)
    return
  }
  if (url.pathname === '/messages') return transports.get(url.searchParams.get('sessionId'))?.handlePostMessage(req, res)
  res.writeHead(404).end()
})
await new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve))
const port = httpServer.address().port

const cwd = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'long-approval-')))
const env = { ...process.env, MCP_TOOL_TIMEOUT: WAIT, CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT: WAIT }
for (const name of ['CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'CLAUDE_CODE_SESSION_ID', 'CLAUDE_PID']) delete env[name]
const claude = spawn('claude', [
  '-p', 'Run the shell command `echo spike-ok-7` with the Bash tool, then reply with its output only.',
  '--output-format', 'stream-json', '--verbose', '--max-turns', '4',
  '--mcp-config', JSON.stringify({ mcpServers: { spike: { type: 'sse', url: `http://127.0.0.1:${port}/sse` } } }),
  '--permission-prompt-tool', 'mcp__spike__permission',
  // The user's own allow rules or mode would skip the prompt this check is about.
  '--permission-mode', 'default',
  '--settings', JSON.stringify({ permissions: { ask: ['Bash'] } }),
], { cwd, env, stdio: ['ignore', 'pipe', 'inherit'] })

let ran = false
let result
createInterface({ input: claude.stdout }).on('line', line => {
  let event
  try { event = JSON.parse(line) } catch { return }
  for (const block of event.message?.content ?? [])
    if (block.type === 'tool_result' && JSON.stringify(block.content).includes('spike-ok-7')) ran = true
  if (event.type === 'result') result = event
})
const code = await new Promise(resolve => claude.on('close', resolve))
console.log(`[${since()}] claude exited ${code}`)
console.log(JSON.stringify({
  heldMinutes: HOLD_MS / 60_000,
  progressToken: progressToken !== undefined,
  answeredAfterHold: !!answered,
  commandRan: ran,
  result: result?.result?.slice(0, 200),
  verdict: answered && ran ? 'PASS: the answer applied after the hold' : 'FAIL: the answer did not apply',
}, null, 2))
httpServer.close()
process.exit(answered && ran ? 0 : 1)
