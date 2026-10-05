// A stand-in for ms_ai's /api/chat-v7 that records the real one's answers, or replays them.
// Each answer is keyed by what asked for it, so runs replay without the model:
//   node e2e/replay.mjs record <cassette>   proxies to MS_AI (default :13008) and saves
//   node e2e/replay.mjs replay <cassette>   answers from the cassette; unknown asks 404
import http from 'node:http'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'

const [mode, cassette, port = '13099'] = process.argv.slice(2)
const UPSTREAM = `${process.env.MS_AI ?? 'http://127.0.0.1:13008'}/api/chat-v7`

// A parent request is known by its conversation's shape; a child by its tenant and its own shape.
function keyOf(body) {
  const messages = body.messages ?? []
  const shape = `${messages.length}:${messages.at(-1)?.parts?.length ?? 0}`
  const user = messages.findLast?.(m => m.role === 'user')?.parts?.find(p => p.type === 'text')?.text ?? ''
  return body.subagent
    ? `child:${body.subagent.target ?? '-'}:${body.subagent.input?.stepId ?? ''}:${shape}`
    : `parent:${user.slice(0, 80)}:${shape}`
}

const recorded = new Map()
if (mode === 'replay') {
  for (const line of readFileSync(cassette, 'utf8').split('\n').filter(Boolean)) {
    const { key, status, headers, body } = JSON.parse(line)
    recorded.set(key, [...(recorded.get(key) ?? []), { status, headers, body }])
  }
} else if (mode === 'record' && !existsSync(cassette)) {
  writeFileSync(cassette, '')
}

async function readBody(req) {
  let s = ''
  for await (const chunk of req) s += chunk
  return s
}

http
  .createServer(async (req, res) => {
    const raw = await readBody(req)
    const key = keyOf(JSON.parse(raw || '{}'))
    if (mode === 'replay') {
      const answers = recorded.get(key)
      const answer = answers?.shift()
      if (!answer) {
        res.writeHead(404, { 'content-type': 'application/json' })
        return res.end(JSON.stringify({ error: `Nothing recorded for ${key}` }))
      }
      res.writeHead(answer.status, answer.headers)
      return res.end(answer.body)
    }
    const forward = Object.fromEntries(
      ['content-type', 'authorization', 'customer', 'x-user-id'].flatMap(h => (req.headers[h] ? [[h, req.headers[h]]] : [])),
    )
    const upstream = await fetch(UPSTREAM, { method: 'POST', headers: forward, body: raw })
    const headers = Object.fromEntries(
      ['content-type', 'x-vercel-ai-ui-message-stream'].flatMap(h => {
        const v = upstream.headers.get(h)
        return v ? [[h, v]] : []
      }),
    )
    const body = await upstream.text()
    appendFileSync(cassette, JSON.stringify({ key, status: upstream.status, headers, body }) + '\n')
    res.writeHead(upstream.status, headers)
    res.end(body)
  })
  .listen(Number(port), () => console.log(`${mode} on :${port} (${cassette})`))
