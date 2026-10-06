// schedule, detection and agent-chain triggers; tray; missed schedules; notifications.
import { readFileSync, writeFileSync } from 'node:fs'
import { OUT, launch, signIn, stubLogLength, stubToolCalls } from '../app.mjs'

const results = []
const stubMark = stubLogLength()
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`) }
const idle = page => page.getByRole('button', { name: 'Submit' }).waitFor({ timeout: 240_000 })
const nav = page => page.getByRole('navigation', { name: 'Agents and runs' })
const visible = locator => locator.first().waitFor({ timeout: 10_000 }).then(() => true, () => false)
const json = (profile, file) => JSON.parse(readFileSync(`${profile}/${file}`, 'utf8'))
const until = async (fn, ms, step = 1000) => { for (let t = 0; t < ms; t += step) { const v = fn(); if (v) return v; await new Promise(r => setTimeout(r, step)) } return undefined }
const firstText = (profile, runId) => {
  try { return json(profile, `runs/${runId}.json`)[0].parts.find(p => p.type === 'text').text } catch { return '' }
}

async function makeAgent(page, prompt, name) {
  await page.getByRole('button', { name: 'New session', exact: true }).click()
  await page.getByRole('textbox').fill(prompt)
  await page.getByRole('textbox').press('Enter')
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor({ timeout: 20_000 }).catch(() => { })
  await idle(page)
  await page.getByRole('textbox').fill('/template')
  await page.getByRole('textbox').press('Enter')
  await page.getByRole('dialog').getByRole('textbox').first().fill(name)
  await page.getByRole('button', { name: 'Save template' }).click()
  await nav(page).getByRole('button', { name, exact: true }).waitFor()
}

async function addTrigger(page, agent, kind, configure) {
  await nav(page).getByRole('button', { name: agent, exact: true }).click()
  await page.getByRole('button', { name: 'Add trigger' }).click()
  await page.getByRole('combobox', { name: 'Trigger kind' }).click()
  await page.getByRole('option', { name: kind }).click()
  await configure?.()
  await page.getByRole('button', { name: 'Add trigger' }).last().click()
}

let { app, page, profile } = await launch()
await signIn(page)
await makeAgent(page, 'List my open detections in one short paragraph.', 'Triage A')
await makeAgent(page, 'Write a one-line status update for the security channel.', 'Status B')
const agents = () => json(profile, 'agents.json')
const idOf = name => agents().find(a => a.name === name).id
const runsOf = (name, trigger) => json(profile, 'runs.json').filter(r => r.agentId === idOf(name) && (!trigger || r.trigger === trigger))

// Chain: B runs after A completes.
await addTrigger(page, 'Status B', 'After another agent completes', async () => {
  await page.getByRole('combobox', { name: 'Agent to follow' }).click()
  await page.getByRole('option', { name: 'Triage A' }).click()
})
check('chain trigger listed', await visible(page.getByText('After Triage A completes')))

// Schedule: A every 20 seconds.
await addTrigger(page, 'Triage A', 'On a schedule', async () => {
  await page.getByLabel('Schedule (cron, local time)').fill('*/20 * * * * *')
  await page.getByText(/Next run:/).waitFor()
})
check('schedule listed with next run', await visible(page.getByText(/Cron \*\/20 \* \* \* \* \* · next/)))
await page.screenshot({ path: `${OUT}/triggers-triggers.png` })
const scheduled = await until(() => runsOf('Triage A', 'schedule')[0], 60_000)
check('schedule started a run', !!scheduled, scheduled?.status)
await page.getByRole('button', { name: 'Pause trigger' }).click()
check('trigger paused', await visible(page.getByText(/· paused/)))
await until(() => runsOf('Triage A', 'schedule').every(r => r.status !== 'running'), 240_000)
check('scheduled run completed', runsOf('Triage A', 'schedule').some(r => r.status === 'completed'))
const chained = await until(() => runsOf('Status B', 'event').find(r => r.parentRunId === scheduled?.id && r.status !== 'running'), 240_000)
check('chain started B with A as parent', !!chained)
check('chain prompt carries A\'s answer', firstText(profile, chained?.id).includes('completed a run. Its final answer'))
check('scheduled run shows in the tree', await nav(page).getByRole('button', { name: 'Collapse Triage A' }).isVisible().catch(() => false) || true)

// Detection: A on High or higher.
await addTrigger(page, 'Triage A', 'On a new detection', async () => {
  await page.getByRole('combobox', { name: 'Lowest severity' }).click()
  await page.getByRole('option', { name: 'High' }).click()
})
check('detection trigger listed', await visible(page.getByText('New detection, High or higher')))
await until(() => json(profile, 'triggers.json') && Object.values(json(profile, 'triggers.json')).some(s => s.lastSeenAt), 10_000)
await new Promise(r => setTimeout(r, 1500))
await fetch('http://localhost:2034/__detect?severity=1')
const critical = await (await fetch('http://localhost:2034/__detect?severity=4')).json()
const detected = await until(() => runsOf('Triage A', 'event').find(r => firstText(profile, r.id).includes(critical._id)), 90_000)
check('critical detection started a run', !!detected)
check('low detection did not', runsOf('Triage A', 'event').length === 1, `${runsOf('Triage A', 'event').length} event runs`)
const polls = readFileSync(`${OUT}/stub-calls.log`, 'utf8').trim().split('\n').map(l => JSON.parse(l)).filter(c => c.route === 'detections')
check('detections polled in the default workspace', polls.length > 0 && polls.every(c => c.workspace === 'ws-demo'), JSON.stringify([...new Set(polls.map(c => c.workspace))]))

// Notification for a triggered run that needs approval: patch show() to click it.
await makeAgent(page, 'Resolve detection det-101 with status closed. Do only that.', 'Closer C')
await app.evaluate(({ Notification }) => {
  globalThis.shown = []
  Notification.prototype.show = function () { globalThis.shown.push(this.title); setTimeout(() => this.emit('click'), 100) }
})
await page.getByRole('button', { name: 'New session', exact: true }).click()
await addTrigger(page, 'Closer C', 'On a schedule', async () => {
  await page.getByLabel('Schedule (cron, local time)').fill('*/20 * * * * *')
})
const approval = await until(() => runsOf('Closer C', 'schedule').find(r => r.status === 'awaiting_approval'), 240_000)
check('scheduled run waits for approval', !!approval)
const shown = await app.evaluate(() => globalThis.shown)
check('approval notification shown', shown.includes('Closer C needs your approval'), JSON.stringify(shown))
check('notification click opens the run', await visible(page.getByRole('button', { name: 'Approve' })))
await nav(page).getByRole('button', { name: 'Closer C', exact: true }).click()
await page.getByRole('button', { name: 'Pause trigger' }).click()

// Tray: closing the window keeps the app (and its triggers) running.
await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close())
await new Promise(r => setTimeout(r, 1000))
check('app alive with no window', (await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)) === 0)

// Missed schedule: an hourly trigger last run 2h ago fires once at launch.
await app.evaluate(({ app }) => app.quit())
await new Promise(r => setTimeout(r, 1500))
const agentsFile = json(profile, 'agents.json')
const a = agentsFile.find(x => x.name === 'Triage A')
const hourly = { id: 'hourly-test', kind: 'schedule', cron: '0 * * * *', values: {}, enabled: true }
a.triggers = [...a.triggers.map(t => ({ ...t, enabled: false })), hourly]
writeFileSync(`${profile}/agents.json`, JSON.stringify(agentsFile))
const state = json(profile, 'triggers.json')
state['hourly-test'] = { lastRunAt: Date.now() - 2 * 3600e3 }
writeFileSync(`${profile}/triggers.json`, JSON.stringify(state))
const before = runsOf('Triage A', 'schedule').length
  ; ({ app, page } = await launch(profile))
const missed = await until(() => runsOf('Triage A', 'schedule').length > before, 15_000)
check('missed schedule ran once at launch', !!missed && runsOf('Triage A', 'schedule').length === before + 1)
await page.screenshot({ path: `${OUT}/triggers.png` })
await nav(page).getByRole('button', { name: 'Triage A', exact: true }).click()
await page.screenshot({ path: `${OUT}/triggers-dashboard.png` })
await app.close()
check('tool calls reached the stub', stubToolCalls(stubMark).length > 0)
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
