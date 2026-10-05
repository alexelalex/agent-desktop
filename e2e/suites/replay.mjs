// Routing, approval and fan-out replayed from recorded model answers: no model, no drift.
// RECORD=1 (or a missing cassette) records the answers first, from the live model.
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { OUT, launch, signIn } from '../app.mjs'

const CASSETTE = new URL('../cassettes/replay.jsonl', import.meta.url).pathname
const recording = !!process.env.RECORD || !existsSync(CASSETTE)
if (process.env.RECORD) rmSync(CASSETTE, { force: true })
const results = []
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`) }
const log = () => readFileSync(`${OUT}/stub-calls.log`, 'utf8').trim().split('\n').map(l => JSON.parse(l))
const tools = (mark, origin) => log().slice(mark).filter(e => e.route === 'tool' && (!origin || e.origin === origin))
const idle = page => page.getByRole('button', { name: 'Submit' }).waitFor({ timeout: 300_000 })
const ask = async (page, text) => {
  await page.getByRole('textbox').fill(text)
  await page.getByRole('textbox').press('Enter')
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor({ timeout: 20_000 }).catch(() => { })
  await idle(page)
}

const server = spawn(process.execPath, [new URL('../replay.mjs', import.meta.url).pathname, recording ? 'record' : 'replay', CASSETTE], { stdio: 'inherit' })
await new Promise(r => setTimeout(r, 800))
for (const port of [2034, 2035, 2036]) await fetch(`http://localhost:${port}/__mode?mode=normal`)
await fetch('http://localhost:2034/__upstream?url=http://127.0.0.1:13099')
console.log(recording ? 'recording from the live model' : 'replaying')
try {
  const { app, page } = await launch()
  await signIn(page, 'http://localhost:2034', 'alpha')
  await signIn(page, 'http://localhost:2035', 'beta')
  await signIn(page, 'http://localhost:2036', 'gamma')

  let mark = log().length
  await ask(page, 'List the open detections on beta.')
  check('a single-tenant read runs on beta only', tools(mark).length > 0 && tools(mark).every(e => e.origin === 2035), JSON.stringify(tools(mark).map(e => e.origin)))

  await page.getByRole('button', { name: 'New session' }).click()
  mark = log().length
  await page.getByRole('textbox').fill('Set detection det-201 on beta to closed.')
  await page.getByRole('textbox').press('Enter')
  await page.getByRole('button', { name: 'Approve' }).first().waitFor({ timeout: 300_000 })
  check('a named write waits for approval, with nothing run', tools(mark).filter(e => /setStatus/.test(e.name)).length === 0)
  await page.getByRole('button', { name: 'Approve' }).first().click()
  await idle(page)
  const writes = tools(mark).filter(e => /setStatus/.test(e.name))
  check('the approved write runs once, on beta', writes.length === 1 && writes[0].origin === 2035, JSON.stringify(writes.map(e => e.origin)))

  await page.getByRole('button', { name: 'New session' }).click()
  mark = log().length
  await ask(page, '/each @all Count the open detections.')
  const origins = new Set(tools(mark).map(e => e.origin))
  check('a fan-out reaches every tenant', [2034, 2035, 2036].every(o => origins.has(o)), JSON.stringify([...origins]))
  check('each child row shows its tenant', await page.getByText('gamma · Gamma main').first().isVisible())
  await app.close()
} finally {
  await fetch('http://localhost:2034/__upstream')
  server.kill()
}
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
