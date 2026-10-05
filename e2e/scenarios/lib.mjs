// Shared steps for the done scenarios. They name the UI the program builds (docs/plugins-program.md),
// so a step that can't find its control fails with "Missing: …" and the phase that adds it.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { OUT, launch } from '../app.mjs'

export const TENANTS = {
  alpha: { origin: 2034, url: 'http://localhost:2034', workspace: 'Demo workspace', ids: ['det-101', 'det-102', 'det-103'] },
  beta: { origin: 2035, url: 'http://localhost:2035', workspace: 'Beta production', ids: ['det-201', 'det-202'] },
  gamma: { origin: 2036, url: 'http://localhost:2036', workspace: 'Gamma main', ids: ['det-301'] },
  delta: { origin: 2037, url: 'http://localhost:2037', workspace: 'Delta main', ids: ['det-401'] },
}
const LOG = `${OUT}/stub-calls.log`

export function checker(name) {
  const results = []
  return {
    check(label, ok, extra = '') {
      results.push(!!ok)
      console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${extra ? ` — ${extra}` : ''}`)
      return !!ok
    },
    /** Ends the scenario: a thrown step counts as a failure with its reason. */
    async finish(run) {
      try {
        await run()
      } catch (error) {
        results.push(false)
        console.log(`FAIL ${name} stopped — ${error.message.split('\n')[0]}`)
      }
      const passed = results.length > 0 && results.every(Boolean)
      console.log(`${passed ? 'SCENARIO PASS' : 'SCENARIO FAIL'} ${name}: ${results.filter(Boolean).length}/${results.length}`)
      process.exit(passed ? 0 : 1)
    },
  }
}

/** Waits for a control the program adds; fails with what is missing and which phase adds it. */
export async function need(locator, what, timeout = 10_000) {
  try {
    await locator.first().waitFor({ timeout })
    return locator.first()
  } catch {
    throw new Error(`Missing: ${what}`)
  }
}

export const visible = (locator, timeout = 10_000) =>
  locator.first().waitFor({ timeout }).then(() => true, () => false)

// The stub log: one JSON line per request, tagged with the origin that served it.
export const logLength = () => {
  try {
    return readFileSync(LOG, 'utf8').split('\n').filter(Boolean).length
  } catch {
    return 0
  }
}
export function logSince(start) {
  return readFileSync(LOG, 'utf8').split('\n').filter(Boolean).slice(start).map(line => JSON.parse(line))
}
/** Tool calls that reached a stub since `start`, optionally only on one tenant. */
export const toolCalls = (start, tenant) =>
  logSince(start).filter(c => c.route === 'tool' && (!tenant || c.origin === TENANTS[tenant].origin))

export async function resetStubs() {
  for (const { origin } of Object.values(TENANTS)) await fetch(`http://localhost:${origin}/__mode?mode=normal`)
}
export const setMode = (tenant, mode, tool) =>
  fetch(`http://localhost:${TENANTS[tenant].origin}/__mode?mode=${mode}${tool ? `&tool=${tool}` : ''}`)

export async function start(profile) {
  await resetStubs()
  return launch(profile)
}

/** A profile as phase -1 left it: one stored run, one agent and a session file. */
export function oldProfile() {
  const profile = `${OUT}/profile-old-${Date.now()}`
  mkdirSync(`${profile}/runs`, { recursive: true })
  const now = Date.now()
  const run = { id: 'old-run-1', scope: 'http://localhost:2034|ws-demo', baseUrl: 'http://localhost:2034', workspaceId: 'ws-demo', trigger: 'manual', title: 'Old question about detections', status: 'completed', toolCalls: 0, createdAt: now - 86_400_000, updatedAt: now - 86_400_000 }
  writeFileSync(`${profile}/runs.json`, JSON.stringify([run]))
  writeFileSync(`${profile}/runs/old-run-1.json`, JSON.stringify([
    { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Old question about detections' }] },
    { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'An old answer that stays readable.' }] },
  ]))
  writeFileSync(`${profile}/agents.json`, JSON.stringify({ 'http://localhost:2034': [{ id: 'old-agent', name: 'Old agent', kind: 'prompt', prompt: 'Summarize', createdAt: now }] }))
  return profile
}

// Options: the cog in the header, with Plugins and Groups tabs (phases 1 and 2).
export async function openOptions(page) {
  if (await page.getByRole('dialog', { name: 'Options' }).isVisible()) return
  await (await need(page.getByRole('button', { name: 'Options', exact: true }), 'the Options cog in the header (phase 1)')).click()
  await need(page.getByRole('dialog', { name: 'Options' }), 'the Options dialog (phase 1)')
}
export async function closeOptions(page) {
  await page.keyboard.press('Escape')
}
const pluginRow = (page, name) =>
  page.getByRole('dialog', { name: 'Options' }).getByRole('listitem').filter({ hasText: name })

export async function addPlugin(page, name) {
  await openOptions(page)
  await (await need(page.getByRole('tab', { name: 'Plugins' }), 'the Plugins tab (phase 1)')).click()
  await (await need(page.getByRole('button', { name: 'Add plugin' }), 'Add plugin (phase 2)')).click()
  await (await need(page.getByLabel('Name'), 'the plugin form (phase 2)')).fill(name)
  await page.getByLabel('Instance URL').fill(TENANTS[name].url)
  await page.getByLabel('E-mail').fill('dev@example.com')
  await page.getByLabel('Password').fill('pw')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await need(pluginRow(page, name).getByText('Ready'), `${name} shown as Ready (phase 2)`, 15_000)
}

export async function makeOrchestrator(page, name) {
  await openOptions(page)
  const row = pluginRow(page, name)
  if (await row.getByText('Orchestrator', { exact: true }).isVisible()) return
  await (await need(row.getByRole('button', { name: 'Make orchestrator' }), 'Make orchestrator (phase 2)')).click()
  await need(row.getByText('Orchestrator', { exact: true }), `${name} labeled orchestrator (phase 2)`)
}

export async function signOutPlugin(page, name) {
  await openOptions(page)
  const row = pluginRow(page, name)
  await (await need(row.getByRole('button', { name: 'Sign out' }), `Sign out on ${name} (phase 2)`)).click()
  await need(row.getByText('Signed out'), `${name} shown as Signed out (phase 2)`)
}

/** Adds the plugins, labels the orchestrator, signs out the ones listed, and closes Options. */
export async function setupTenants(page, { orchestrator = 'alpha', ready = ['alpha', 'beta', 'gamma'], signedOut = [] } = {}) {
  for (const name of [...ready, ...signedOut]) await addPlugin(page, name)
  await makeOrchestrator(page, orchestrator)
  for (const name of signedOut) await signOutPlugin(page, name)
  await closeOptions(page)
  await need(page.getByRole('textbox').and(page.locator(':enabled')), 'the composer enabled once the orchestrator is ready (phase 1)')
}

export const idle = page => page.getByRole('button', { name: 'Submit' }).waitFor({ timeout: 300_000 })
export async function send(page, text) {
  await page.getByRole('textbox').fill(text)
  await page.getByRole('textbox').press('Enter')
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor({ timeout: 20_000 }).catch(() => { })
}
export async function ask(page, text) {
  await send(page, text)
  await idle(page)
}
export async function newChat(page) {
  await page.getByRole('button', { name: 'New session' }).click()
}

/** What a run published, as text: its artifacts' contents. */
export function runArtifacts(profile, runId) {
  try {
    return readFileSync(`${profile}/artifacts/${runId}.json`, 'utf8')
  } catch {
    return ''
  }
}

// The stored runs, as the main process keeps them.
export const runIndex = profile => JSON.parse(readFileSync(`${profile}/runs.json`, 'utf8'))
export function runMessages(profile, runId) {
  try {
    return JSON.parse(readFileSync(`${profile}/runs/${runId}.json`, 'utf8'))
  } catch {
    return []
  }
}
export const latestRun = profile => runIndex(profile).sort((a, b) => b.updatedAt - a.updatedAt)[0]

/** The assistant's text in a run's last turn. */
export function lastAnswer(messages) {
  const last = messages.findLast(m => m.role === 'assistant')
  return (last?.parts ?? []).filter(p => p.type === 'text').map(p => p.text).join('\n')
}
export const detectionIds = text => [...new Set(text.match(/det-\d{3}/g) ?? [])]

// Tool outputs anywhere in a run, subagent runs included.
function toolOutputs(messages) {
  return messages.flatMap(m => (m.parts ?? []).flatMap(p => {
    if (p.type !== 'dynamic-tool' || p.state !== 'output-available') return []
    if (Array.isArray(p.output?.runs)) return toolOutputs(p.output.runs.flatMap(r => (r.message ? [r.message] : [])))
    return Array.isArray(p.output?.parts) ? toolOutputs([p.output]) : [p.output]
  }))
}

/** Every detection id the answer names came from a tool output in the run. */
export function grounded(answer, messages) {
  const seen = new Set(detectionIds(JSON.stringify(toolOutputs(messages))))
  const named = detectionIds(answer)
  return { ok: named.length > 0 && named.every(id => seen.has(id)), named, unseen: named.filter(id => !seen.has(id)) }
}

/** Every request that carried a token was served by the tenant that minted it. */
export function tokensStayHome(entries) {
  const strays = entries.filter(e => e.token && e.token !== 'stub-pending' && !e.token.startsWith(`stub-${e.origin}-`))
  return { ok: strays.length === 0, strays }
}

/** Captures the titles of OS notifications instead of showing them. */
export async function captureNotifications(app) {
  await app.evaluate(({ Notification }) => {
    globalThis.shown = []
    Notification.prototype.show = function () { globalThis.shown.push(`${this.title} ${this.body}`) }
  })
  return () => app.evaluate(() => globalThis.shown)
}
