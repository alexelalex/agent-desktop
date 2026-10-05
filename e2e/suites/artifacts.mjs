// artifacts as client tools, the composer counter, the panel, the tree's third level, artifacts_previous.
import { readFileSync } from 'node:fs'
import { OUT, launch, signIn, stubLogLength, stubToolCalls } from '../app.mjs'

const results = []
const stubMark = stubLogLength()
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`) }
const idle = page => page.getByRole('button', { name: 'Submit' }).waitFor({ timeout: 300_000 })
const nav = page => page.getByRole('navigation', { name: 'Agents and runs' })
const visible = locator => locator.first().waitFor({ timeout: 10_000 }).then(() => true, () => false)
const json = (profile, file) => JSON.parse(readFileSync(`${profile}/${file}`, 'utf8'))
const latestRun = profile => json(profile, 'runs.json').sort((a, b) => b.createdAt - a.createdAt)[0]
const toolParts = (profile, runId, name) =>
  json(profile, `runs/${runId}.json`).flatMap(m => m.parts).filter(p => p.type === 'dynamic-tool' && p.toolName === name)
const waitSettled = async (page, profile) => {
  await page.getByRole('button', { name: 'Stop', exact: true }).waitFor({ timeout: 20_000 }).catch(() => {})
  for (let i = 0; i < 300; i++) { const r = latestRun(profile); if (r && r.status !== 'running') return r; await page.waitForTimeout(1000) }
}

const PROMPT = 'List my open detections. Then call artifacts_previous for id "digest". Publish a view artifact with id "open-detections" titled "Open detections": a row of metric tiles with the count per severity, then a table of the detections. Then publish a message artifact with id "digest" for the security channel summarizing them, and say in it what is new since the previous digest, if there was one.'

const { app, page, profile } = await launch()
await signIn(page)

await page.getByRole('textbox').fill(PROMPT)
await page.getByRole('textbox').press('Enter')
const chat = await waitSettled(page, profile)
await idle(page)
check('chat completed', chat?.status === 'completed', chat?.status)
const refs = latestRun(profile).artifacts ?? []
check('two artifacts published', refs.length === 2, JSON.stringify(refs.map(r => [r.id, r.kind, r.revision])))
check('artifact kinds', refs.some(r => r.id === 'open-detections' && r.kind === 'view') && refs.some(r => r.id === 'digest' && r.kind === 'message'))
const previous = toolParts(profile, chat.id, 'artifacts_previous')
check('previous in an ad-hoc chat says there are no earlier runs', previous.some(p => p.output?.note?.includes('no agent')), JSON.stringify(previous.map(p => p.output ?? p.errorText)))

// The counter opens the panel beside the chat.
const counter = page.getByRole('button', { name: '2 artifacts' })
check('composer counter', await visible(counter))
await counter.click()
const panel = page.getByRole('complementary', { name: 'Artifacts' })
const opened = await visible(panel)
if (!opened) await page.screenshot({ path: `${OUT}/artifacts-panel-fail.png` })
check('panel opens', opened)
check('chat stays visible on a wide window', await page.getByRole('textbox').isVisible())
await panel.getByRole('button', { name: 'Open detections', exact: true }).click()
check('view renders a table', await visible(panel.getByRole('table')))
await page.screenshot({ path: `${OUT}/artifacts-view.png` })
const digestTitle = refs.find(r => r.id === 'digest').title
await panel.getByRole('button', { name: digestTitle, exact: true }).click()
check('message renders its subject', await visible(panel.getByText('Subject')))
await page.screenshot({ path: `${OUT}/artifacts-message.png` })

// The tree's third level: opening an artifact already expanded its run.
check('artifact rows revealed', await visible(nav(page).getByRole('button', { name: 'Open detections', exact: true })))
await nav(page).getByRole('button', { name: /^Collapse List my open/ }).click()
check('run row collapses', await nav(page).getByRole('button', { name: 'Open detections', exact: true }).waitFor({ state: 'detached', timeout: 5000 }).then(() => true, () => false))
await nav(page).getByRole('button', { name: /^Expand List my open/ }).click()
check('run row expands', await visible(nav(page).getByRole('button', { name: 'Open detections', exact: true })))
await page.getByRole('complementary', { name: 'Artifacts' }).getByRole('button', { name: 'Close artifacts' }).click()
check('panel closes', !(await panel.isVisible()))
await nav(page).getByRole('button', { name: 'Open detections', exact: true }).click()
check('artifact row opens the panel on it', await visible(panel.getByRole('table')))

// Narrow window: the panel takes the chat's place.
await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(820, 800))
await page.waitForTimeout(500)
check('narrow: chat hidden', !(await page.getByRole('textbox').isVisible()))
await page.screenshot({ path: `${OUT}/artifacts-narrow.png` })
await panel.getByRole('button', { name: 'Chat' }).click()
check('narrow: back to chat', await visible(page.getByRole('textbox')))
await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1280, 820))

// As an agent: its second run reads the first run's digest.
await page.getByRole('textbox').fill('/template')
await page.getByRole('textbox').press('Enter')
await page.getByRole('dialog').getByRole('textbox').first().fill('Detections digest')
await page.getByRole('button', { name: 'Save template' }).click()
for (let i = 0; i < 2; i++) {
  await nav(page).getByRole('button', { name: 'Detections digest', exact: true }).click()
  await page.getByRole('button', { name: 'New run' }).first().click()
  // A plan template waits in the stage for Run; a prompt template fills the input.
  const run = page.getByRole('button', { name: 'Run', exact: true })
  if (await run.isVisible()) await run.click()
  else await page.getByRole('textbox').press('Enter')
  await page.waitForTimeout(1000)
  await waitSettled(page, profile)
  await idle(page)
}
const agentRuns = json(profile, 'runs.json').filter(r => r.agentId).sort((a, b) => b.createdAt - a.createdAt)
check('two agent runs', agentRuns.length === 2, JSON.stringify(agentRuns.map(r => r.status)))
const second = agentRuns[0]
const read = toolParts(profile, second.id, 'artifacts_previous')
check('second agent run read the first run\'s digest', read.some(p => p.output?.artifacts?.length === 1 && p.output.artifacts[0].content?.kind === 'message'), JSON.stringify(read.map(p => p.output ?? p.errorText)).slice(0, 300))
check('second agent run published its own', (second.artifacts ?? []).length === 2)

await app.close()
check('tool calls reached the stub', stubToolCalls(stubMark).length > 0)
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
