// runs are driven and stored by the main process.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { launch, OUT, ready, signIn, stubLogLength, stubToolCalls } from '../app.mjs'

const results = []
const stubMark = stubLogLength()
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`) }
const calls = () => readFileSync(`${OUT}/stub-calls.log`, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
const idle = page => page.getByRole('button', { name: 'Submit' }).waitFor({ timeout: 240_000 })
const send = async (page, text) => {
  await page.getByRole('textbox').fill(text)
  await page.getByRole('textbox').press('Enter')
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor({ timeout: 20_000 }).catch(() => { })
}
const index = profile => JSON.parse(readFileSync(`${profile}/runs.json`, 'utf8'))

let { app, page, profile } = await launch()
await signIn(page)

// 1. A chat runs in the main process and is stored there.
await send(page, 'What are my critical open detections from the last 24 hours, and why?')
await idle(page)
check('reasoning rendered', await page.getByText(/Thought for/).first().isVisible())
check('tool card rendered', await page.getByText('GET /detections', { exact: true }).first().isVisible())
let runs = index(profile)
check('run indexed', runs.length === 1 && runs[0].status === 'completed', JSON.stringify(runs.map(r => [r.status, r.title, r.toolCalls])))
check('messages stored', existsSync(`${profile}/runs/${runs[0].id}.json`))
const secrets = readdirSync(`${profile}/plugins`)
check('tokens sealed', secrets.some(f => f.endsWith('.bin')) && !secrets.some(f => f.endsWith('.json')), secrets.join(', '))
const first = runs[0]

// 2. A run keeps going when the view switches away.
await page.getByRole('button', { name: 'New session', exact: true }).click()
await send(page, 'List my open detections, then for each one explain in two sentences why it matters.')
await page.waitForTimeout(1500)
await page.getByRole('button', { name: first.title }).click()
await page.waitForTimeout(500)
const second = index(profile).find(r => r.id !== first.id)
check('second run started', !!second)
for (let i = 0; i < 240; i++) {
  const run = index(profile).find(r => r.id === second?.id)
  if (run && run.status !== 'running') break
  await page.waitForTimeout(1000)
}
const done = index(profile).find(r => r.id === second?.id)
check('run finished while not shown', done?.status === 'completed', done?.status)
await page.getByRole('button', { name: done?.title ?? 'x' }).click()
await page.getByText(/Thought for/).first().waitFor({ timeout: 10_000 })
check('finished run shows its answer', (await page.getByText('GET /detections', { exact: true }).count()) > 0)

// 3. Approval continues in the main process.
await page.getByRole('button', { name: 'New session', exact: true }).click()
await send(page, 'Resolve detection det-101 and add a comment saying it was a planned change.')
await page.getByRole('button', { name: 'Approve' }).first().waitFor({ timeout: 240_000 })
check('awaiting approval indexed', index(profile).some(r => r.status === 'awaiting_approval'))
const before = calls().length
await page.getByRole('button', { name: 'Approve' }).first().click()
await page.getByText('You approved this change.').first().waitFor({ timeout: 60_000 })
await idle(page)
const writes = calls().slice(before).filter(c => c.route === 'tool' && /detections__/.test(c.name))
check('approved write ran', writes.length > 0, writes.map(w => w.name).join(', '))

// 4. Stop mid-stream.
await page.getByRole('button', { name: 'New session', exact: true }).click()
await send(page, 'Investigate every open detection one by one with separate tool calls.')
await page.waitForTimeout(4000)
await page.getByRole('button', { name: 'Stop', exact: true }).click()
await idle(page)
await page.waitForTimeout(500)
check('stopped run indexed as stopped', index(profile).some(r => r.status === 'stopped'), JSON.stringify(index(profile).map(r => r.status)))

// 5. Restart: session and runs survive; a stored run continues.
const count = index(profile).length
await app.close()
  ; ({ app, page } = await launch(profile))
await ready(page)
check('session survives restart', true)
await page.getByRole('button', { name: first.title }).click()
await page.getByText(/Thought for/).first().waitFor({ timeout: 10_000 })
check('stored run reopens', true)
await send(page, 'Summarize your answer in one sentence.')
await idle(page)
const again = index(profile).find(r => r.id === first.id)
check('stored run continues after restart', again?.status === 'completed' && index(profile).length === count, again?.status)
check('no error shown', !(await page.getByText('The assistant hit an error').isVisible()))

await page.screenshot({ path: `${OUT}/runs.png` })
await app.close()
check('tool calls reached the stub', stubToolCalls(stubMark).length > 0)
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
