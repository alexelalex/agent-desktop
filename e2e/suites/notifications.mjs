// channels, notifications on an agent's artifacts, Send now, delivery on completion.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { OUT, launch, signIn, stubLogLength, stubToolCalls } from '../app.mjs'

const results = []
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`) }
const nav = page => page.getByRole('navigation', { name: 'Agents and runs' })
const visible = (locator, timeout = 10_000) => locator.first().waitFor({ timeout }).then(() => true, () => false)
const json = (profile, file) => JSON.parse(readFileSync(`${profile}/${file}`, 'utf8'))
const lines = file => existsSync(file) ? readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : []
const hooks = () => lines(`${OUT}/stub-calls.log`).filter(c => c.route === 'hook')
const mails = () => lines(`${OUT}/smtp.log`)
const latestRun = profile => json(profile, 'runs.json').sort((a, b) => b.createdAt - a.createdAt)[0]
const until = async (fn, ms, step = 1000) => { for (let t = 0; t < ms; t += step) { const v = fn(); if (v) return v; await new Promise(r => setTimeout(r, step)) } }
const settle = async (page, profile) => {
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor({ timeout: 20_000 }).catch(() => {})
  await page.waitForTimeout(1000)
  return until(() => { const r = latestRun(profile); return r.status !== 'running' && r }, 300_000)
}
async function startRun(page, profile) {
  await nav(page).getByRole('button', { name: 'Digest agent', exact: true }).click()
  await page.getByRole('button', { name: 'New run' }).first().click()
  const run = page.getByRole('button', { name: 'Run', exact: true })
  if (await run.isVisible()) await run.click()
  else await page.getByRole('textbox').press('Enter')
  return settle(page, profile)
}
const box = (dialog, name) => dialog.getByRole('checkbox', { name: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
async function addChannel(dialog, kind, fields) {
  await dialog.getByRole('button', { name: 'Add channel' }).click()
  await dialog.getByRole('combobox', { name: 'Channel kind' }).click()
  await dialog.page().getByRole('option', { name: kind }).click()
  for (const [label, value] of Object.entries(fields)) await dialog.getByLabel(label, { exact: true }).fill(value)
  await dialog.getByRole('button', { name: 'Add channel' }).last().click()
}

writeFileSync(`${OUT}/stub-calls.log`, '')
writeFileSync(`${OUT}/smtp.log`, '')
const stubMark = stubLogLength()
const { app, page, profile } = await launch()
await app.evaluate(({ Notification }) => {
  globalThis.shown = []
  Notification.prototype.show = function () { globalThis.shown.push(this.title) }
})
await signIn(page)

// An agent that publishes a message and a view.
await page.getByRole('textbox').fill('List my open detections. Publish a message artifact with id "digest" summarizing them in three bullet points, and a view artifact with id "summary" titled "Summary" with a table of them. Do not plan, just do it.')
await page.getByRole('textbox').press('Enter')
await settle(page, profile)
await page.getByRole('textbox').fill('/template')
await page.getByRole('textbox').press('Enter')
await page.getByRole('dialog').getByRole('textbox').first().fill('Digest agent')
await page.getByRole('button', { name: 'Save template' }).click()
const first = await startRun(page, profile)
check('first agent run published', (first.artifacts ?? []).length === 2, JSON.stringify(first.artifacts?.map(a => a.id)))

// Subscribe digest to Slack, e-mail and the desktop from its Notify dialog.
await page.getByRole('button', { name: /^\d+ artifacts?$/ }).click()
const panel = page.getByRole('complementary', { name: 'Artifacts' })
const digestTitle = first.artifacts.find(a => a.id === 'digest').title
await panel.getByRole('button', { name: digestTitle, exact: true }).click()
await panel.getByRole('button', { name: /^Notify/ }).click()
const dialog = page.getByRole('dialog')
check('dialog explains the agent subscription', await visible(dialog.getByText('Each completed run of Digest agent')))
await addChannel(dialog, 'Slack webhook', { Name: '#secops', 'Webhook URL': 'http://localhost:2034/__hook/slack' })
await addChannel(dialog, 'E-mail (SMTP)', { Name: 'Security team', To: 'team@example.com', From: 'sf@example.com', 'SMTP server': '127.0.0.1', Port: '2525' })
await box(dialog, 'Desktop notification').check()
await page.waitForTimeout(500)
const sub = () => json(profile, 'agents.json')[0].notifications ?? []
check('subscription saved on the agent', sub().length === 1 && sub()[0].channelIds.length === 3, JSON.stringify(sub()))
const channelsFile = readFileSync(`${profile}/channels.json`, 'utf8')
check('webhook URL not stored in plain text', !channelsFile.includes('__hook/slack') && channelsFile.includes('#secops'))

// Send now.
await dialog.getByRole('button', { name: /^Send revision \d+ now$/ }).click()
check('send now reports three sends', await visible(dialog.getByText(/^Sent to/).nth(2), 20_000))
const slack = hooks().find(h => h.name === 'slack')
check('slack got blocks', slack?.body?.blocks?.[0]?.type === 'header' && slack.body.blocks.some(b => b.type === 'section'), JSON.stringify(slack?.body).slice(0, 200))
const mail = mails()[0]
check('e-mail delivered over SMTP', !!mail && mail.to.some(t => t.includes('team@example.com')) && /Content-Type: text\/html/i.test(mail.data), mail ? mail.from : 'none')
check('desktop notification shown', (await app.evaluate(() => globalThis.shown)).some(t => t.startsWith('Digest agent:')))

// A failing channel shows its error.
await addChannel(dialog, 'Microsoft Teams webhook', { Name: 'Broken Teams', 'Webhook URL': 'http://localhost:2034/__hook/fail' })
await box(dialog, '#secops').uncheck()
await box(dialog, 'Security team').uncheck()
await box(dialog, 'Desktop notification').uncheck()
await dialog.getByRole('button', { name: /^Send revision \d+ now$/ }).click()
check('failure shown with its error', await visible(dialog.getByText(/HTTP 500/), 20_000))
await dialog.getByRole('button', { name: 'Delete Broken Teams' }).click()
await box(dialog, '#secops').check()
await box(dialog, 'Security team').check()
await box(dialog, 'Desktop notification').check()
await page.waitForTimeout(500)
check('deleted channel left the subscription', sub()[0]?.channelIds.length === 3, JSON.stringify(sub()))
await page.screenshot({ path: `${OUT}/notifications-dialog.png` })
await page.keyboard.press('Escape')

// The next completed run sends on its own.
const before = { hooks: hooks().filter(h => h.name === 'slack').length, mails: mails().length }
const second = await startRun(page, profile)
const auto = await until(() => {
  try { const log = json(profile, `deliveries/${second.id}.json`); return log.length >= 3 && log } catch { return undefined }
}, 30_000)
check('completed run delivered to every subscribed channel', auto?.filter(d => d.status === 'sent' && !d.manual).length === 3, JSON.stringify(auto?.map(d => [d.channelName, d.status, d.error])))
check('slack and e-mail received the second run', hooks().filter(h => h.name === 'slack').length === before.hooks + 1 && mails().length === before.mails + 1)
await page.getByRole('button', { name: /^\d+ artifacts?$/ }).click()
await panel.getByRole('button', { name: new RegExp('^' + second.artifacts.find(a => a.id === 'digest').title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).click().catch(() => {})
check('panel shows the deliveries', await visible(panel.getByText(/^Sent to/)))
await page.screenshot({ path: `${OUT}/notifications-panel.png` })

// The dashboard lists the subscription.
await nav(page).getByRole('button', { name: 'Digest agent', exact: true }).click()
check('dashboard lists notifications', await visible(page.getByText(/→ .*#secops/)))
await page.screenshot({ path: `${OUT}/notifications-dashboard.png` })
await app.close()
check('tool calls reached the stub', stubToolCalls(stubMark).length > 0)
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
