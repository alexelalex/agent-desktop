// client tools declared on /chat; webFetch runs in the main process.
import { readFileSync } from 'node:fs';
import { OUT, launch, signIn } from '../app.mjs';

const results = []
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`) }
const idle = page => page.getByRole('button', { name: 'Submit' }).waitFor({ timeout: 240_000 })
const json = (profile, file) => JSON.parse(readFileSync(`${profile}/${file}`, 'utf8'))
const toolParts = (profile, runId, name) =>
  json(profile, `runs/${runId}.json`).flatMap(m => m.parts).filter(p => p.type === 'dynamic-tool' && p.toolName === name)
const send = async (page, text) => {
  await page.getByRole('button', { name: 'New session' }).click()
  await page.getByRole('textbox').fill(text)
  await page.getByRole('textbox').press('Enter')
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor({ timeout: 20_000 }).catch(() => { })
  await idle(page)
  await page.waitForTimeout(500)
  return json(profile, 'runs.json').sort((a, b) => b.createdAt - a.createdAt)[0]
}

const { app, page, profile } = await launch()
await signIn(page)

const run = await send(page, 'Use webFetch to read https://example.com and tell me the page title in one sentence.')
const fetched = toolParts(profile, run.id, 'webFetch')
check('webFetch called', fetched.length > 0)
check('webFetch output from the main process', fetched.some(p => p.state === 'output-available' && p.output?.title === 'Example Domain'), JSON.stringify(fetched.map(p => [p.state, p.output?.title ?? p.errorText])))
check('run completed after the client tool', run.status === 'completed', run.status)
const answer = json(profile, `runs/${run.id}.json`).at(-1).parts.filter(p => p.type === 'text').map(p => p.text).join(' ')
check('answer uses the fetched page', /Example Domain/i.test(answer), answer.slice(0, 120))
await page.screenshot({ path: `${OUT}/client-tools.png` })

const blocked = await send(page, 'Use webFetch on http://127.0.0.1:2034/docs/json and tell me exactly what the tool returned.')
const refused = toolParts(profile, blocked.id, 'webFetch')
check('private address refused', refused.some(p => p.state === 'output-error' && /private address/.test(p.errorText)), JSON.stringify(refused.map(p => [p.state, p.errorText])))
check('run still completes', blocked.status === 'completed', blocked.status)

await app.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
