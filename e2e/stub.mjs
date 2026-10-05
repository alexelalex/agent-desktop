// Stand-in tenants: ms_api + ms_customers on :2034 to :2037 (or the ports given as
// arguments), each with its own tokens, workspaces and detections. /chat proxies like ms_api's
// v7 branch to a real ms_ai (MS_AI, default :13008) with a recorded catalog; tools return canned data.
import http from 'node:http'
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'

const fixture = name => new URL(`./fixtures/${name}`, import.meta.url)
const catalog = JSON.parse(readFileSync(fixture('v7-catalog.json'), 'utf8'))
const spec = JSON.parse(readFileSync(fixture('openapi.json'), 'utf8'))
mkdirSync(new URL('./.out/', import.meta.url), { recursive: true })
const LOG = new URL('./.out/stub-calls.log', import.meta.url)

// Where /chat goes: ms_ai, or the replay stand-in (/__upstream switches it for every tenant).
let upstreamAi = process.env.MS_AI ?? 'http://127.0.0.1:13008'

// The spec's operations, named as the orchestrator's catalog names them.
const operationsOf = doc =>
  Object.entries(doc.paths).flatMap(([path, methods]) =>
    Object.entries(methods).map(([method, op]) => ({
      method: method.toUpperCase(),
      name: op.operationId.replace(/-/g, '__'),
      params: [...path.matchAll(/\{([^}]+)\}/g)].map(m => m[1]),
      pattern: new RegExp(`^/openapi${path.replace(/\{[^}]+\}/g, '([^/]+)')}$`),
    })),
  )
const allOperations = operationsOf(spec)
// The operation a request reaches; literal paths win over templated ones.
const matchOperation = (ops, method, pathname) =>
  ops
    .filter(o => o.method === method && o.pattern.test(pathname))
    .sort((a, b) => a.params.length - b.params.length)[0]

const hoursAgo = h => new Date(Date.now() - h * 3600e3).toISOString()
// Each tenant's data; ids and names never repeat across tenants.
const TENANTS = {
  2034: {
    workspaces: [{ id: 'ws-demo', name: 'Demo workspace' }, { id: 'ws-second', name: 'Second workspace' }],
    detections: [
      { id: 'det-101', name: 'Root account console login without MFA', severity: 'critical', status: 'open', created_at: hoursAgo(3), resource: 'aws-account/123456789012', description: 'The root user signed in to the AWS console from 203.0.113.7 without MFA.' },
      { id: 'det-102', name: 'S3 bucket made public', severity: 'critical', status: 'open', created_at: hoursAgo(9), resource: 's3://acme-finance-exports', description: 'A bucket policy granting s3:GetObject to "*" was attached by role ci-deployer.' },
      { id: 'det-103', name: 'Unusual IAM key creation', severity: 'high', status: 'open', created_at: hoursAgo(20), resource: 'iam-user/svc-backup', description: 'Access key created for a dormant service user.' },
    ],
  },
  2035: {
    workspaces: [{ id: 'ws-beta-prod', name: 'Beta production' }, { id: 'ws-beta-sandbox', name: 'Beta sandbox' }],
    detections: [
      { id: 'det-201', name: 'Security group opened to the internet', severity: 'critical', status: 'open', created_at: hoursAgo(2), resource: 'sg-0a1b2c3d', description: 'Port 22 was opened to 0.0.0.0/0 on a production security group.' },
      { id: 'det-202', name: 'CloudTrail logging stopped', severity: 'high', status: 'open', created_at: hoursAgo(14), resource: 'trail/org-main', description: 'StopLogging was called on the organization trail.' },
    ],
  },
  2036: {
    workspaces: [{ id: 'ws-gamma-main', name: 'Gamma main' }],
    detections: [
      { id: 'det-301', name: 'Kubernetes secret read by an unknown pod', severity: 'high', status: 'open', created_at: hoursAgo(5), resource: 'k8s/prod/payments', description: 'A pod outside the payments namespace read the db-credentials secret.' },
    ],
  },
  2037: {
    workspaces: [{ id: 'ws-delta-main', name: 'Delta main' }],
    detections: [
      { id: 'det-401', name: 'Login from a new country', severity: 'medium', status: 'open', created_at: hoursAgo(7), resource: 'okta/user/jlee', description: 'First sign-in from this country for the user.' },
    ],
  },
}

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type, workspace, customer, x-version',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json', ...cors, ...headers })
  res.end(typeof body === 'string' ? body : JSON.stringify(body))
}

async function readBody(req) {
  let s = ''
  for await (const chunk of req) s += chunk
  return s ? JSON.parse(s) : undefined
}

function tenant(port) {
  const data = TENANTS[port] ?? TENANTS[2034]
  const liveDetections = []
  const validTokens = new Set()
  let tokenSeq = 0
  // Tokens name their tenant, so one presented to another origin is visible in the log.
  const mint = () => {
    const t = `stub-${port}-access-${++tokenSeq}`
    validTokens.add(t)
    return t
  }
  const bearer = req => (req.headers.authorization ?? '').replace('Bearer ', '')
  const authed = req => validTokens.has(bearer(req))
  // `normal`, `unsupported` (no OpenAPI), `missing-tool` (a tool it lacks) or `write-flag` (a read it calls a write).
  let mode = { mode: 'normal' }
  const log = (req, entry) =>
    appendFileSync(LOG, JSON.stringify({ t: Date.now(), origin: port, token: bearer(req) || undefined, workspace: req.headers.workspace, ...entry }) + '\n')

  // The spec as this tenant serves it: `write-flag` moves the read to POST.
  function served() {
    if (mode.mode !== 'missing-tool' && mode.mode !== 'write-flag') return spec
    const doc = structuredClone(spec)
    for (const methods of Object.values(doc.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        if (op.operationId.replace(/-/g, '__') !== mode.tool) continue
        delete methods[method]
        if (mode.mode === 'write-flag') methods.post = op
      }
    }
    return doc
  }

  function cannedResult(name, input, write) {
    const ids = new Set(data.detections.map(d => d.id))
    if (name === 'detections__list') return { items: data.detections, total: data.detections.length }
    if (name === 'detections__summary') {
      return { open: data.detections.length, critical: data.detections.filter(d => d.severity === 'critical').length }
    }
    if (name.startsWith('detections__') && write) {
      const target = input?.detections_ids?.[0] ?? input?.detection_id ?? input?.id
      if (target && !ids.has(target)) return { error: `No detection ${target} in this tenant.` }
      return { success: true, id: target ?? data.detections[0].id }
    }
    return { items: [], note: `stub: no data for ${name}` }
  }

  return async (req, res) => {
    const url = new URL(req.url, 'http://x')
    if (req.method === 'OPTIONS') return send(res, 204, '')

    if (url.pathname === '/trpc/auth.login') {
      const { email } = await readBody(req)
      log(req, { route: 'auth.login', email })
      if (email.includes('+2fa')) {
        return send(res, 200, { result: { data: { access_token: 'stub-pending', two_factor_state: ['SECURED_TOTP'], user: {} } } })
      }
      return send(res, 200, { result: { data: { access_token: mint(), refresh_token: `stub-${port}-refresh`, two_factor_state: null, user: {} } } })
    }
    if (url.pathname === '/trpc/twoFactor.authenticate') {
      const body = await readBody(req)
      log(req, { route: 'twoFactor.authenticate', body })
      if (req.headers.authorization !== 'Bearer stub-pending' || body.user_code !== '123456') {
        return send(res, 401, { error: { message: 'Invalid code' } })
      }
      return send(res, 200, { result: { data: { access_token: mint(), refresh_token: `stub-${port}-refresh` } } })
    }
    if (url.pathname === '/trpc/auth.refreshToken') {
      const body = await readBody(req)
      log(req, { route: 'auth.refreshToken' })
      if (body?.refresh_token !== `stub-${port}-refresh`) return send(res, 401, { error: { message: 'Invalid refresh token' } })
      return send(res, 200, { result: { data: { access_token: mint() } } })
    }
    // Webhook receivers for notification tests; /__hook/fail always fails.
    const hook = url.pathname.match(/^\/__hook\/(.+)$/)
    if (hook && req.method === 'POST') {
      const body = await readBody(req)
      log(req, { route: 'hook', name: hook[1], body })
      return hook[1] === 'fail' ? send(res, 500, { error: 'boom' }) : send(res, 200, { ok: true })
    }
    // Inject a detection that GET /openapi/detections then returns.
    if (url.pathname === '/__detect') {
      const severity = Number(url.searchParams.get('severity') ?? 4)
      const detection = { _id: `det-live-${port}-${Date.now()}`, timestamp: new Date().toISOString(), anomaly_severity: severity, status: 'open', activity_type: 'suspicious_identity_activity', resource_name: 'iam-user/svc-deploy', resource_type: 'aws_iam_user' }
      liveDetections.push(detection)
      return send(res, 200, detection)
    }
    // Expire every token on demand to exercise the client's refresh path.
    if (url.pathname === '/__expire') {
      validTokens.clear()
      return send(res, 200, { ok: true })
    }
    if (url.pathname === '/__upstream') {
      upstreamAi = url.searchParams.get('url') ?? process.env.MS_AI ?? 'http://127.0.0.1:13008'
      return send(res, 200, { upstream: upstreamAi })
    }
    // Test control: /__mode?mode=write-flag&tool=detections__summary
    if (url.pathname === '/__mode') {
      mode = { mode: url.searchParams.get('mode') ?? 'normal', tool: url.searchParams.get('tool') ?? undefined }
      log(req, { route: 'mode', ...mode })
      return send(res, 200, mode)
    }

    if (mode.mode === 'unsupported' && (url.pathname === '/docs/json' || url.pathname.startsWith('/openapi/'))) {
      log(req, { route: url.pathname, mode: mode.mode })
      return send(res, 404, { error: 'not found' })
    }

    if (!authed(req)) {
      log(req, { route: url.pathname, status: 401 })
      return send(res, 401, { error: 'Unauthorized' })
    }

    if (url.pathname === '/openapi/workspaces') {
      return send(res, 200, data.workspaces.map(w => ({ ...w, role: 'ADMIN' })))
    }
    if (url.pathname === '/docs/json') return send(res, 200, served())
    // A trigger's poll; detections-list without `from_timestamp` falls through to the tools.
    if (url.pathname === '/openapi/detections' && req.method === 'GET' && url.searchParams.has('from_timestamp')) {
      const from = Date.parse(url.searchParams.get('from_timestamp') ?? '') || 0
      const results = liveDetections.filter(d => Date.parse(d.timestamp) >= from)
      log(req, { route: 'detections', from: url.searchParams.get('from_timestamp'), results: results.length })
      return send(res, 200, { total_count: results.length, results })
    }

    if (url.pathname === '/chat' && req.method === 'POST') {
      const body = await readBody(req)
      const workspace = req.headers.workspace
      log(req, { route: 'chat', version: req.headers['x-version'], messages: body.messages.length, plugins: body.plugins?.map(p => p.id), subagent: !!body.subagent })
      const upstream = new AbortController()
      res.on('close', () => {
        if (!res.writableFinished) {
          log(req, { route: 'chat', event: 'client-closed' })
          upstream.abort()
        }
      })
      try {
        const { id, messages, clientTools, plugins, groups, callParams, subagent } = body
        const r = await fetch(`${upstreamAi}/api/chat-v7`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: req.headers.authorization, customer: workspace, 'x-user-id': 'stub-user' },
          body: JSON.stringify({ id, messages, catalog, clientTools, plugins, groups, callParams, subagent }),
          signal: upstream.signal,
        })
        const headers = { ...cors }
        for (const h of ['content-type', 'cache-control', 'x-accel-buffering', 'x-vercel-ai-ui-message-stream']) {
          const v = r.headers.get(h)
          if (v) headers[h] = v
        }
        res.writeHead(r.status, headers)
        if (!r.body) return res.end()
        for await (const chunk of r.body) res.write(chunk)
        res.end()
      } catch (e) {
        log(req, { route: 'chat', error: String(e) })
        if (!res.headersSent) send(res, 502, { error: String(e) })
        else res.end()
      }
      return
    }

    if (url.pathname.startsWith('/openapi/')) {
      const op = matchOperation(operationsOf(served()), req.method, url.pathname)
      const known = op ?? matchOperation(allOperations, req.method, url.pathname)
      const query = Object.fromEntries(
        [...new Set(url.searchParams.keys())].map(k => {
          const values = url.searchParams.getAll(k)
          return [k, values.length > 1 ? values : values[0]]
        }),
      )
      const pathParams = known
        ? Object.fromEntries(known.params.map((p, i) => [p, decodeURIComponent(url.pathname.match(known.pattern)[i + 1])]))
        : {}
      const input = { ...query, ...pathParams, ...(await readBody(req)) }
      log(req, { route: 'tool', name: known?.name, input, customer: req.headers.customer })
      if (!op) return send(res, 404, { error: `No operation for ${req.method} ${url.pathname}` })
      await new Promise(r => setTimeout(r, 400))
      return send(res, 200, cannedResult(op.name, input, op.method !== 'GET'))
    }

    send(res, 404, { error: 'not found' })
  }
}

const ports = process.argv.slice(2).map(Number)
for (const port of ports.length ? ports : [2034, 2035, 2036, 2037]) {
  http.createServer(tenant(port)).listen(port, () => console.log(`stub tenant on :${port}`))
}
