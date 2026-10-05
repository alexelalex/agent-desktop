// sidebar tree (agents → runs, then chats) and the agent dashboard.
import { readFileSync } from 'node:fs'
import { OUT, launch, signIn, stubLogLength, stubToolCalls } from '../app.mjs'

const results = []
const stubMark = stubLogLength()
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`) }
const idle = page => page.getByRole('button', { name: 'Submit' }).waitFor({ timeout: 240_000 })
const visible = locator => locator.first().waitFor({ timeout: 10_000 }).then(() => true, () => false)
const nav = page => page.getByRole('navigation', { name: 'Agents and runs' })

const { app, page, profile } = await launch()
await signIn(page)

check('no Sessions node', (await nav(page).getByRole('button', { name: 'Sessions', exact: true }).count()) === 0)
check('no Templates pane', (await page.getByText('Templates', { exact: true }).count()) === 0)

// An ad-hoc session lands directly at the root level.
await page.getByRole('textbox').fill('What are my critical open detections from the last 24 hours, and why?')
await page.getByRole('textbox').press('Enter')
await page.getByRole('button', { name: 'Stop', exact: true }).waitFor({ timeout: 20_000 })
await idle(page)
check('session listed at root', await visible(nav(page).getByRole('button', { name: /What are my critical/ })))

// Save it as a template: it becomes an agent at the root.
await page.getByRole('textbox').fill('/template')
await page.getByRole('textbox').press('Enter')
await page.getByRole('dialog').getByRole('textbox').first().fill('Critical triage')
await page.getByRole('button', { name: 'Save template' }).click()
check('agent at root', await visible(nav(page).getByRole('button', { name: 'Critical triage', exact: true })))

// Clicking the agent opens its dashboard.
await nav(page).getByRole('button', { name: 'Critical triage', exact: true }).click()
check('dashboard heading', await visible(page.getByRole('heading', { name: 'Critical triage' })))
check('configuration section', await visible(page.getByText('Configuration', { exact: true })))
check('no runs yet', await visible(page.getByText('No runs yet')))
await page.screenshot({ path: `${OUT}/agents-dashboard-empty.png` })

// New run from the dashboard: the template fills the input; the run lands under the agent.
await page.getByRole('button', { name: 'New run' }).first().click()
await page.getByRole('textbox').waitFor()
check('prompt template fills the input', (await page.getByRole('textbox').inputValue()).includes('critical open detections'))
await page.getByRole('textbox').press('Enter')
await page.getByRole('button', { name: 'Stop', exact: true }).waitFor({ timeout: 20_000 })
check('agent expanded with a running run', await visible(nav(page).getByRole('button', { name: 'Collapse Critical triage' })))
await idle(page)
const runs = JSON.parse(readFileSync(`${profile}/runs.json`, 'utf8'))
const agents = JSON.parse(readFileSync(`${profile}/agents.json`, 'utf8'))
const agentId = agents[0].id
const agentRun = runs.find(r => r.agentId === agentId)
check('run stored with its agent', !!agentRun, JSON.stringify(runs.map(r => r.agentId ?? null)))
await page.screenshot({ path: `${OUT}/agents-run.png` })

// The dashboard lists it; its row opens the run.
await nav(page).getByRole('button', { name: 'Critical triage', exact: true }).click()
const row = page.getByRole('row').filter({ hasText: 'Completed' })
check('dashboard row', await visible(row), await page.getByRole('table').innerText().catch(() => 'no table'))
check('trigger column', (await row.first().innerText()).includes('Manual'))
await page.screenshot({ path: `${OUT}/agents-dashboard.png` })
await row.first().click()
check('row opens the run', await visible(page.getByText(/Thought for/)))

// Collapse and expand.
await nav(page).getByRole('button', { name: 'Collapse Critical triage' }).click()
check('collapsed', await visible(nav(page).getByRole('button', { name: 'Expand Critical triage' })))
await nav(page).getByRole('button', { name: 'Expand Critical triage' }).click()

// Delete the agent's run from the tree.
const runRow = nav(page).locator('div.group').filter({ has: page.getByTitle(/Completed/) }).nth(0)
await runRow.hover()
await runRow.getByRole('button', { name: 'Delete run' }).click()
check('run deleted', await visible(nav(page).getByText('No runs yet.')))

await app.close()
check('tool calls reached the stub', stubToolCalls(stubMark).length > 0)
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
