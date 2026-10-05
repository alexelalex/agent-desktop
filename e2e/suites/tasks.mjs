// Tasks: actions on Claude Code artifacts launch child sessions. Driven by the fake `claude`.
import { fake } from '../fake-scripts.mjs'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fakeLog, focus, launchWithClaudeCode, makeRepo, session, sessions, shownNotifications, startSession, tasksOf, transcript, until } from '../claude-code.mjs'
import { OUT, signIn, stubLogLength } from '../app.mjs'

const results = []
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`) }
const visible = (locator, timeout = 10_000) => locator.first().waitFor({ timeout }).then(() => true, () => false)
const nav = page => page.getByRole('navigation', { name: 'Agents and runs' })
const panelOf = page => page.getByRole('complementary', { name: 'Claude Code Artifact' })
const said = (home, id) => transcript(home, id).filter(e => e.type === 'assistant' && e.message.content[0]?.type === 'text').map(e => e.message.content[0].text)
const toolResults = (home, id) => transcript(home, id).flatMap(e => (e.type === 'user' && Array.isArray(e.message.content) ? e.message.content.filter(c => c.type === 'tool_result') : []))
// Sends a message to the open session and waits for its answer.
async function send(page, home, id, text, answer) {
  const box = page.locator('textarea:enabled').first()
  await box.fill(`${text} ${fake('steps', [...answer.steps, ['say', answer.say]])}`)
  await box.press('Enter')
  return until(() => said(home, id).includes(answer.say), 20_000)
}
// Opens the review dialog from an action and launches it, editing the prompt first if asked.
async function launchFrom(page, name, edit) {
  await panelOf(page).getByRole('button', { name, exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  if (edit !== undefined) await dialog.getByRole('textbox', { name: /^Prompt for/ }).fill(edit)
  await dialog.getByRole('button', { name: /^Launch \d+$/ }).click()
  await dialog.waitFor({ state: 'hidden', timeout: 10_000 })
}
const openArtifact = (page, name) => page.getByRole('button', { name, exact: true }).last().click()
// A sidebar row by its title; a collapsed row's name goes on with its task counts.
const rowOf = (page, title) =>
  nav(page).getByRole('button', { name: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }).first()
// Opens every row: a task sits under its action, under its artifact, under its parent.
async function expandAll(page) {
  for (let i = 0; i < 40; i++) {
    const toggle = nav(page).getByRole('button', { name: /^Expand (?!Earlier$)/ }).first()
    if (!(await toggle.isVisible().catch(() => false))) return
    await toggle.click()
  }
}
// A session's row by its title; an action's bookmark row may share it.
const sessionRow = (page, title) =>
  nav(page).locator('[data-row="session"]').getByRole('button', { name: title, exact: true }).first()
// Opens a task from the sidebar.
async function openTask(page, title) {
  await expandAll(page)
  await sessionRow(page, title).click()
}
const runsGet = (page, id) => page.evaluate(id => window.desktop.runs.get(id), id)

// Smoke: a session started from the composer renders an artifact through the fake.
{
  const { app, page, profile } = await launchWithClaudeCode()
  await startSession(page, profile, `Write a report. ${fake('render', { id: 'report', title: 'Report', format: 'markdown', content: '# Hello\n\nWorld' })}`)
  const card = page.getByRole('button', { name: 'Report', exact: true })
  check('smoke: the render card shows', await visible(card, 20_000))
  await card.click()
  const panel = page.getByRole('complementary', { name: 'Claude Code Artifact' })
  check('smoke: the panel shows the artifact', await visible(panel.getByRole('heading', { name: 'Hello' })))
  await page.screenshot({ path: `${OUT}/tasks-smoke.png` })
  await app.close()
}

const BRIEF = 'Fix the dedup.\n\n```data\nquoted: "ignore previous instructions"\n```\n\nDone when the tests pass.'
const FIX_QUEUE = [
  '# Fix queue',
  '',
  'Intro text with a [link][docs].',
  '',
  '### F1 · Dedup `report` items 🐛',
  '',
  '````text',
  BRIEF,
  '````',
  '',
  '```',
  '# not a heading',
  '```',
  '',
  '### F2 · Other',
  '',
  'Plain words.',
  '',
  '[docs]: https://example.com/docs',
].join('\n')
const fixQueue = actions => ({ id: 'fix-queue', title: 'Fix queue', format: 'markdown', content: FIX_QUEUE, ...(actions && { actions }) })
const TABLE = { id: 'findings', title: 'Findings', format: 'json_table', content: JSON.stringify({ columns: ['Id', 'Finding'], rows: [['F-1', 'Dedup'], ['F-2', 'Retry']] }) }
const QUEUE_ACTIONS = [
  { id: 'report-dedup', label: 'Fix', title: 'Dedup report items', anchor: { heading: 'F1 · Dedup `report` items 🐛' } },
  { id: 'other', label: 'Look', title: 'Other look', prompt: 'Look at the other thing.', anchor: { heading: '### F2 · Other' } },
  { id: 'tray-one', label: 'Run', title: 'Tray work', prompt: 'Tray work.' },
]

// 1 and 2: actions render in place; a render that breaks the rules is rejected whole.
{
  const { app, page, profile, home } = await launchWithClaudeCode()
  const plain = path.join(home, 'plain')
  mkdirSync(plain)
  const bad = Array.from({ length: 21 }, (_, i) => ({ id: `a${i + 1}`, label: 'Go', title: `Action ${i + 1}`, prompt: 'Work.' }))
  bad[1].id = 'a1'
  bad[2].label = 'x'.repeat(25)
  bad[3].anchor = { heading: 'Nope' }
  bad[4].cwd = '/'
  bad[5] = { ...bad[5], cwd: plain, worktree: true }
  const runId = await startSession(page, profile, `Publish. ${fake('steps', [
    ['render', { ...TABLE, actions: [{ id: 'fix-f2', label: 'Fix', title: 'Fix F-2', prompt: 'Fix F-2.', anchor: { key: 'F-2' } }] }],
    ['render', fixQueue(QUEUE_ACTIONS)],
    ['render', fixQueue(bad)],
    ['nested-plugin-call', 'ui_render_artifact', fixQueue(QUEUE_ACTIONS)],
    ['say', 'Published.'],
  ])}`)
  await until(() => transcript(home, runId).some(e => e.type === 'assistant' && e.message.content[0]?.text === 'Published.'), 20_000)
  const results = transcript(home, runId).flatMap(e => (e.type === 'user' && Array.isArray(e.message.content) ? e.message.content.filter(c => c.type === 'tool_result') : []))
  const rejected = results[2]
  const lines = rejected?.content?.[0]?.text?.split('\n') ?? []
  check('2: the bad render is an error with six lines', rejected?.is_error === true && lines.length === 6, lines.join(' | '))
  check('2: the heading line lists every heading', lines.some(l => l.includes('"Nope"') && l.includes('"Fix queue"') && l.includes('"F1 · Dedup `report` items 🐛"') && l.includes('"F2 · Other"')))
  check('2: an unknown caller is rejected', results[3]?.content?.[0]?.text === "Actions need a session Agent Desktop shows.", results[3]?.content?.[0]?.text)

  await page.getByRole('button', { name: 'Fix queue · 3 actions' }).waitFor({ timeout: 10_000 }).catch(() => {})
  check('1: the card names the action count', await visible(page.getByRole('button', { name: 'Fix queue · 3 actions' })))
  check('2: the rejected card reads Rejected', await visible(page.getByText(/Fix queue · 21 actions · Rejected: An artifact takes at most 20 actions/)))

  await page.getByRole('button', { name: 'Fix queue · 3 actions' }).click()
  const panel = page.getByRole('complementary', { name: 'Claude Code Artifact' })
  check('2: the panel keeps the previous render', await visible(panel.getByRole('button', { name: 'Fix: Dedup report items' })))
  const order = await panel.evaluate(root =>
    [...root.querySelectorAll('h1,h2,h3,h4,p,pre,ul,ol,table,[data-action],section[aria-label="Actions"]')].map(e =>
      e.matches('[data-action]') ? `action:${e.getAttribute('data-action')}` : e.matches('section') ? 'tray' : `${e.tagName}:${e.textContent.trim().slice(0, 20)}`,
    ),
  )
  const at = order.findIndex(e => e.startsWith('H3:F1'))
  check('1: the action row follows its heading', order[at + 1] === 'action:fix-queue/report-dedup', order.slice(at, at + 2).join(' → '))
  check('1: a heading in a code block is no anchor', !order.some(e => e === 'H1:# not a heading'))
  check('1: the tray comes last', order.at(-3) === 'tray' && order.at(-1) === 'action:fix-queue/tray-one', order.slice(-3).join(', '))
  await app.evaluate(({ clipboard }) => clipboard.writeText(''))
  await panel.getByRole('button', { name: 'More for Fix: Dedup report items' }).click()
  await page.getByRole('menuitem', { name: 'Copy prompt' }).click()
  const copied = await until(() => app.evaluate(({ clipboard }) => clipboard.readText()), 3000)
  check('1: Copy prompt copies exactly the brief', copied === BRIEF, JSON.stringify(copied))

  await page.getByRole('button', { name: 'Findings · 1 action' }).click()
  const row = page.getByRole('complementary', { name: 'Claude Code Artifact' }).getByRole('row').filter({ hasText: 'F-2' })
  check('1: the keyed row ends in its action', await row.locator('td').last().getByRole('button', { name: 'Fix: Fix F-2', exact: true }).isVisible())
  await page.screenshot({ path: `${OUT}/tasks-actions.png` })
  await app.close()
}

// 3: re-rendering keeps, moves, rejects and drops actions; tasks see their action change.
{
  const { app, page, profile, home } = await launchWithClaudeCode()
  const table = (rows, actions) => ({ id: 'table', title: 'Table', format: 'json_table', content: JSON.stringify({ columns: ['Key', 'What'], rows }), ...(actions && { actions }) })
  const keyed = prompt => [
    { id: 'k1', label: 'Fix', title: 'Fix A', prompt, anchor: { key: 'A' } },
    { id: 'k2', label: 'Fix', title: 'Fix B', prompt: 'B.', anchor: { key: 'B' } },
  ]
  const first = `Task one. ${fake('work', { ms: 300, say: 'Fixed A.' })}`
  const heading = { id: 'brief', title: 'Brief', format: 'markdown', content: '## H1\n\n```\nBrief one.\n```\n', actions: [{ id: 'h1', label: 'Go', title: 'Go H1', anchor: { heading: 'H1' } }] }
  const parent = await startSession(page, profile, `Start. ${fake('steps', [['render', table([['A', 'a'], ['B', 'b']], keyed(first))], ['render', heading], ['say', 'Ready.']])}`)
  await until(() => said(home, parent).includes('Ready.'), 20_000)
  await send(page, home, parent, 'Reorder.', { steps: [['render', table([['B', 'b'], ['A', 'a']])]], say: 'Reordered.' })
  await openArtifact(page, 'Table')
  const rowA = panelOf(page).getByRole('row').filter({ hasText: /^A/ })
  check('3: a render without actions keeps them', await visible(panelOf(page).getByRole('button', { name: 'Fix: Fix B', exact: true })))
  check('3: a reordered row keeps its button', await rowA.getByRole('button', { name: 'Fix: Fix A', exact: true }).isVisible())
  await send(page, home, parent, 'Drop the heading.', { steps: [['render', { ...heading, content: '## Other\n\nNo brief.', actions: undefined }]], say: 'Dropped.' })
  const dropped = toolResults(home, parent).at(-1)
  check('3: a kept heading action whose heading is gone is rejected', dropped?.is_error === true && /"h1"/.test(dropped.content[0].text), dropped?.content?.[0]?.text)
  await openArtifact(page, 'Table')
  await launchFrom(page, 'Fix: Fix A')
  const task = await until(() => tasksOf(profile, parent).find(t => t.status === 'completed'), 20_000)
  check('3: the task completes', !!task)
  await send(page, home, parent, 'Change the prompt.', { steps: [['render', table([['A', 'a'], ['B', 'b']], keyed('A changed brief.'))]], say: 'Changed.' })
  await openArtifact(page, 'Table · 2 actions')
  await panelOf(page).getByRole('button', { name: 'More for Fix: Fix A' }).click()
  check('3: a changed prompt shows in the menu', await visible(page.getByText('Prompt changed since launch')))
  await page.keyboard.press('Escape')
  await send(page, home, parent, 'Drop the actions.', { steps: [['render', table([['A', 'a']], [])]], say: 'Cleared.' })
  await nav(page).getByRole('button', { name: 'Fix A', exact: true }).click()
  check("3: the task's header says its action is gone", await visible(page.getByText('Its action is gone')))
  await app.close()
}

// 4 and 5: one launch with an edited prompt; a task's artifact launches a sub-task, whose actions are disabled.
{
  const { app, page, profile, home } = await launchWithClaudeCode({ env: { FAKE_PROMPT_DELAY_MS: '2500' } })
  const subTask = { id: 'deeper', title: 'Deeper', format: 'markdown', content: 'Nothing.', actions: [{ id: 'deepest', label: 'Dig', title: 'Dig deeper', prompt: 'No.' }] }
  const followUps = { id: 'follow-ups', title: 'Follow-ups', format: 'markdown', content: 'More.', actions: [{ id: 'sub', label: 'Sub', title: 'Sub work', prompt: `Sub. ${fake('steps', [['render', subTask], ['say', 'Sub done.']])}` }] }
  const parent = await startSession(page, profile, `Start. ${fake('render', { id: 'queue', title: 'Queue', format: 'markdown', content: 'Two fixes.', actions: [
    { id: 'fix-a', label: 'Fix', title: 'Fix A', prompt: 'Original brief.' },
    { id: 'deep', label: 'Look', title: 'Look deeper', prompt: `Deep. ${fake('steps', [['render', followUps], ['say', 'Deep done.']])}` },
  ] })}`)
  await until(() => said(home, parent).length > 0, 20_000)
  await openArtifact(page, 'Queue · 2 actions')
  const edited = `Edited brief. ${fake('steps', [['title', 'An AI title'], ['wait', 1500], ['say', 'Fixed.']])}`
  const mark = Date.now()
  await launchFrom(page, 'Fix: Fix A', edited)
  check('4: the action reads Running', await visible(panelOf(page).getByRole('button', { name: /^Fix: Fix A · Running/ }), 5000))
  const task = tasksOf(profile, parent).find(t => t.claudeCode.task.actionId === 'fix-a')
  await panelOf(page).getByRole('button', { name: /^Fix: Fix A · / }).click()
  const pendingShown = await visible(page.getByText('Edited brief.', { exact: false }), 2000)
  check('4: the prompt shows as pending before the transcript has it', pendingShown && !transcript(home, task.id).some(e => e.type === 'user'))
  await until(() => session(profile, task.id)?.status === 'completed', 20_000)
  const input = fakeLog(mark).find(e => e.event === 'input' && e.sessionId === task.id)
  check('4: its stdin starts with the origin note', input?.content.startsWith('<task_origin'), input?.content.slice(0, 40))
  const snapshot = await runsGet(page, task.id)
  check('4: the first message is the edited prompt, byte for byte', snapshot.messages[0]?.parts[0]?.text === edited, JSON.stringify(snapshot.messages[0]?.parts[0]?.text))
  check('4: it keeps the action title after an ai-title', session(profile, task.id).title === 'Fix A' && transcript(home, task.id).some(e => e.type === 'ai-title'))
  const parentRow = nav(page).getByRole('button', { name: /^Start\./ })
  const taskRow = sessionRow(page, 'Fix A')
  const indented = await taskRow.evaluate(b => b.parentElement.className.includes('ml-11'))
  const below = await parentRow.evaluate((p, t) => !!(p.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING), await taskRow.elementHandle())
  check('4: the task row sits under its action, under its artifact and parent', indented && below)
  check('4: it shows its action label', (await taskRow.textContent()).startsWith('Fix'))
  check("4: the task's header shows the breadcrumb", await visible(page.getByText('from Queue')))
  await parentRow.click()
  await openArtifact(page, 'Queue · 2 actions')
  check('4: the action reads Completed', await visible(panelOf(page).getByRole('button', { name: /^Fix: Fix A · Completed/ })))

  await launchFrom(page, 'Look: Look deeper')
  const deep = await until(() => tasksOf(profile, parent).find(t => t.claudeCode.task.actionId === 'deep' && t.status === 'completed'), 20_000)
  await openTask(page, 'Look deeper')
  await openArtifact(page, 'Follow-ups · 1 action')
  await launchFrom(page, 'Sub: Sub work')
  const sub = await until(() => tasksOf(profile, deep.id).find(t => t.status === 'completed'), 20_000)
  check('5: the sub-task is at depth 2', sub?.claudeCode.task.depth === 2)
  await openTask(page, 'Sub work')
  await openArtifact(page, 'Deeper · 1 action')
  const disabled = panelOf(page).getByRole('button', { name: 'Dig: Dig deeper', exact: true })
  check("5: a sub-task's action is disabled", (await disabled.getAttribute('aria-disabled')) === 'true' && (await disabled.getAttribute('title')) === "Sub-tasks can't launch tasks.")
  check('5: its render result says so', toolResults(home, sub.id).some(r => r.content[0].text.includes("Sub-tasks can't launch tasks.")))
  await page.screenshot({ path: `${OUT}/tasks-sub.png` })
  await app.close()
}

const launchApi = (page, parent, artifactId, actionIds, text) =>
  page.evaluate(
    ([parent, artifactId, actionIds, text]) =>
      window.desktop.claudeCode.launch(parent, actionIds.map(actionId => ({ artifactId, actionId, title: actionId, text: text ?? actionId }))),
    [parent, artifactId, actionIds, text],
  )
const spawnsOf = (since, ids) => fakeLog(since).filter(e => e.event === 'spawn' && ids.includes(e.sessionId))
const approve = (page, runId) =>
  page.evaluate(async runId => {
    const { pendingApprovals } = await window.desktop.mcp.getState()
    const approval = pendingApprovals.find(a => a.runId === runId)
    if (approval) await window.desktop.runs.respond(runId, approval.id, true)
    return !!approval
  }, runId)

// 6 and 7: bulk launch through the selection bar, the cap of 4, what frees a slot or skips the queue.
{
  const { app, page, profile, home } = await launchWithClaudeCode()
  const dirs = Array.from({ length: 6 }, (_, i) => { const d = path.join(home, `d${i + 1}`); mkdirSync(d); return d })
  const work = ms => `Work. ${fake('work', { ms, say: 'Worked.' })}`
  const ask = `Ask. ${fake('steps', [['bash', 'echo asked'], ['wait', 3000], ['say', 'Asked.']])}`
  const spawner = `Spawn. ${fake('render', { id: 'more', title: 'More', format: 'markdown', content: 'More.', actions: [{ id: 'subby', label: 'Sub', title: 'Subby', prompt: work(500) }] })}`
  const actions = [
    ...dirs.map((cwd, i) => ({ id: `w${i + 1}`, label: 'Work', title: `Work ${i + 1}`, prompt: work(4000), cwd })),
    { id: 'ask', label: 'Ask', title: 'Ask first', prompt: ask },
    { id: 'spawner', label: 'Spawn', title: 'Spawner', prompt: spawner },
  ]
  const parent = await startSession(page, profile, `Batch. ${fake('render', { id: 'batch', title: 'Batch', format: 'markdown', content: 'Batch.', actions })}`)
  await until(() => said(home, parent).length > 0, 20_000)
  await launchApi(page, parent, 'batch', ['spawner'], spawner)
  const spawnerTask = await until(() => tasksOf(profile, parent).find(t => t.claudeCode.task.actionId === 'spawner' && t.status === 'completed'), 20_000)

  // Bulk through the selection bar: 4 start, 2 queue, never a fifth.
  await openArtifact(page, 'Batch · 8 actions')
  const panel = panelOf(page)
  for (let i = 1; i <= 6; i++) await panel.getByRole('checkbox', { name: `Select Work: Work ${i}` }).check()
  await panel.getByRole('button', { name: 'Launch 6' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Launch 6' }).waitFor()
  rmSync(dirs[5], { recursive: true })
  const mark = Date.now()
  await dialog.getByRole('button', { name: 'Launch 6' }).click()
  check('7: the dialog reads Launched 5 of 6', await visible(dialog.getByText('Launched 5 of 6')))
  check('7: the failed row stays with its reason', await visible(dialog.getByText(`Folder not found: ${dirs[5]}`)) && (await dialog.getByRole('listitem').count()) === 1)
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  mkdirSync(dirs[5])
  await launchApi(page, parent, 'batch', ['w6'], work(4000))
  const bulk = () => tasksOf(profile, parent).filter(t => /^w\d$/.test(t.claudeCode.task.actionId))
  await page.waitForTimeout(1500)
  check('6: launching 6 runs 4 and queues 2', spawnsOf(mark, bulk().map(t => t.id)).length === 4 && bulk().filter(t => t.status === 'queued').length === 2, bulk().map(t => t.status).join(','))
  await until(() => bulk().length === 6 && bulk().every(t => t.status === 'completed'), 30_000)
  const log = fakeLog(mark)
  const ids = bulk().map(t => t.id)
  const spans = ids.map(id => ({ from: log.find(e => e.event === 'spawn' && e.sessionId === id)?.at, to: log.find(e => e.event === 'result' && e.sessionId === id)?.at }))
  const most = Math.max(...spans.map(s => spans.filter(o => o.from <= s.from && s.from < o.to).length))
  check('6: never more than 4 at once', most === 4, `most ${most}`)

  // Two launches at the same moment still start only 4.
  const together = Date.now()
  await page.evaluate(([parent, w]) => Promise.all([
    window.desktop.claudeCode.launch(parent, ['w1', 'w2', 'w3'].map(actionId => ({ artifactId: 'batch', actionId, title: actionId, text: w }))),
    window.desktop.claudeCode.launch(parent, ['w4', 'w5', 'w6'].map(actionId => ({ artifactId: 'batch', actionId, title: actionId, text: w }))),
  ]), [parent, work(3000)])
  await page.waitForTimeout(1500)
  check('6: launches made together start exactly 4', spawnsOf(together, tasksOf(profile, parent).map(t => t.id)).length === 4)
  await until(() => tasksOf(profile, parent).every(t => t.status === 'completed'), 30_000)

  // A task awaiting approval frees its slot; Start now and an approval skip the queue; sub-tasks count.
  const [asked] = await launchApi(page, parent, 'batch', ['ask'], ask)
  const three = await launchApi(page, parent, 'batch', ['w1', 'w2', 'w3'], work(8000))
  const [fourth] = await launchApi(page, parent, 'batch', ['w4'], work(8000))
  const waiting = await until(() => session(profile, asked.runId)?.status === 'awaiting_approval' && Date.now(), 10_000)
  const freed = await until(() => spawnsOf(0, [fourth.runId])[0]?.at, 5000)
  check('6: an approval wait frees its slot within 2 s', !!freed && freed - waiting < 2000, `${freed && freed - waiting} ms`)
  const [fifth] = await launchApi(page, parent, 'batch', ['w5'], work(8000))
  check('6: past the cap a task queues', session(profile, fifth.runId)?.status === 'queued')
  const now = Date.now()
  await page.evaluate(id => window.desktop.claudeCode.startNow(id), fifth.runId)
  const started = await until(() => spawnsOf(now, [fifth.runId])[0]?.at, 3000)
  check('6: Start now spawns within 1 s', !!started && started - now < 1000, `${started && started - now} ms`)
  const [sub] = await page.evaluate(([id, w]) => window.desktop.claudeCode.launch(id, [{ artifactId: 'more', actionId: 'subby', title: 'Subby', text: w }]), [spawnerTask.id, work(500)])
  await page.waitForTimeout(300)
  check('6: a sub-task launched while 4 run reads Queued', session(profile, sub.runId)?.status === 'queued', session(profile, sub.runId)?.status)
  const approvedAt = Date.now()
  await approve(page, asked.runId)
  const resumed = await until(() => toolResults(home, asked.runId).length > 0 && Date.now(), 3000)
  const running = tasksOf(profile, parent).filter(t => t.status === 'running' && t.id !== asked.runId).length
  check('6: an answered approval resumes at once, past the cap', !!resumed && resumed - approvedAt < 1500 && running >= 4, `${resumed && resumed - approvedAt} ms, ${running} others running`)
  await until(() => [...tasksOf(profile, parent), session(profile, sub.runId)].every(t => t.status === 'completed'), 40_000)
  check('6: everything finishes', [...tasksOf(profile, parent), session(profile, sub.runId)].every(t => t.status === 'completed'))
  await app.close()
}

const pending = (page, runId) =>
  page.evaluate(async runId => (await window.desktop.mcp.getState()).pendingApprovals.filter(a => a.runId === runId), runId)

// 8 and 9: worktrees from a base commit, their branches and settings; who asks for what.
{
  const { app, page, profile, home } = await launchWithClaudeCode()
  const repo = makeRepo(home)
  const unignored = makeRepo(home, 'open-repo', { ignoreSettings: false })
  const quick = `Quick. ${fake('work', { ms: 200, say: 'Done.' })}`
  const wt = (id, extra = {}) => ({ id, label: 'Fix', title: id, prompt: quick, cwd: repo.dir, worktree: true, base: repo.first, ...extra })
  const edits = `Edit. ${fake('steps', [['edit', 'notes.txt', 'x'], ['bash', 'echo hi'], ['say', 'Edited.']])}`
  const actions = [
    wt('wt1'), wt('wt2'), wt('wt3'), wt('wt4'),
    { id: 'open', label: 'Fix', title: 'open', prompt: quick, cwd: unignored.dir, worktree: true },
    wt('edit-wt', { prompt: edits }),
    { id: 'edit-plain', label: 'Fix', title: 'edit-plain', prompt: edits, cwd: repo.dir },
  ]
  const parent = await startSession(page, profile, `Repos. ${fake('render', { id: 'repos', title: 'Repos', format: 'markdown', content: 'Repos.', actions })}`)
  await until(() => said(home, parent).length > 0, 20_000)
  const prefix = `desktop/task/${parent.slice(0, 8)}`
  repo.git(`branch ${prefix}/wt3`)
  // A branch named like a folder of the namespace blocks every name under it.
  unignored.git('branch desktop')
  const byAction = id => tasksOf(profile, parent).find(t => t.claudeCode.task.actionId === id)
  await launchApi(page, parent, 'repos', ['wt1', 'wt2', 'wt3', 'open'], quick)
  await until(() => ['wt1', 'wt2', 'wt3', 'open'].every(id => byAction(id)?.status === 'completed'), 30_000)
  const branches = repo.git(`branch --list '${prefix}/*' --format='%(refname:short) %(objectname)'`).trim().split('\n')
  check('8: two branches at the base commit', ['wt1', 'wt2'].every(id => branches.includes(`${prefix}/${id} ${repo.first}`)), branches.join(', '))
  check('8: a taken name gets -2', byAction('wt3').claudeCode.task.worktree.branch === `${prefix}/wt3-2`, byAction('wt3').claudeCode.task.worktree.branch)
  const tree = byAction('wt1').claudeCode.task.worktree.path
  check('8: an ignored settings.local.json is copied byte for byte', readFileSync(path.join(tree, '.claude/settings.local.json'), 'utf8') === readFileSync(path.join(repo.dir, '.claude/settings.local.json'), 'utf8'))
  check('8: a branch named desktop moves tasks to desktop-task/', byAction('open').claudeCode.task.worktree.branch === `desktop-task/${parent.slice(0, 8)}/open`, byAction('open').claudeCode.task.worktree.branch)
  check('8: an unignored one is not', !existsSync(path.join(byAction('open').claudeCode.task.worktree.path, '.claude/settings.local.json')))
  check('8: no node_modules in the worktree', !existsSync(path.join(tree, 'node_modules')))
  check('8: the task runs in its worktree', byAction('wt1').claudeCode.cwd === tree)

  const marker = path.join(home, 'fail-once')
  writeFileSync(path.join(repo.dir, '.git/hooks/post-checkout'), `#!/bin/sh\nif [ -f "${marker}" ]; then rm "${marker}"; echo "post-checkout failed" >&2; exit 1; fi\n`, { mode: 0o755 })
  writeFileSync(marker, '')
  await launchApi(page, parent, 'repos', ['wt4'], quick)
  const failed = await until(() => byAction('wt4')?.status === 'failed' && byAction('wt4'), 15_000)
  check('8: a failed creation fails the task with git\'s message', !!failed && /post-checkout failed|HEAD is now/.test(failed.notice ?? ''), failed?.notice)
  await page.evaluate(id => window.desktop.claudeCode.startAgain(id), byAction('wt4').id)
  await until(() => byAction('wt4')?.status === 'completed', 15_000)
  const wt4 = repo.git(`branch --list '${prefix}/wt4*'`).trim().split('\n').filter(Boolean)
  check('8: Start again leaves exactly one branch', byAction('wt4')?.status === 'completed' && wt4.length === 1, wt4.join(', '))

  // Edits ask only outside a worktree; Bash asks in both; the global auto mode never answers a task.
  await page.evaluate(() => window.desktop.mcp.setAutoApprove(true))
  const mark = Date.now()
  await launchApi(page, parent, 'repos', ['edit-wt', 'edit-plain'], edits)
  const wtId = () => byAction('edit-wt')?.id
  const plainId = () => byAction('edit-plain')?.id
  await until(() => wtId() && plainId() && session(profile, wtId())?.status === 'awaiting_approval' && session(profile, plainId())?.status === 'awaiting_approval', 15_000)
  await page.waitForTimeout(2000)
  const [wtAsk] = await pending(page, wtId())
  const [plainAsk] = await pending(page, plainId())
  check("9: the global auto mode doesn't answer a task", session(profile, plainId())?.status === 'awaiting_approval' && !!plainAsk)
  check('9: an edit in a worktree task doesn\'t ask; Bash does', wtAsk?.action === 'Bash', wtAsk?.action)
  check('9: an edit in another task asks', plainAsk?.action === 'Write', plainAsk?.action)
  await page.evaluate(() => window.desktop.mcp.setAutoApprove(false))
  await approve(page, plainId())
  const bashAsk = await until(async () => (await pending(page, plainId()))[0]?.action === 'Bash', 10_000)
  check('9: Bash asks in the other task too', !!bashAsk)
  await approve(page, plainId())
  await approve(page, wtId())
  const spawns = fakeLog(mark).filter(e => e.event === 'spawn')
  check('9: only the worktree task gets acceptEdits', spawns.find(e => e.sessionId === wtId())?.mode === 'acceptEdits' && spawns.find(e => e.sessionId === plainId())?.mode === 'default')
  await until(() => byAction('edit-wt')?.status === 'completed' && byAction('edit-plain')?.status === 'completed', 15_000)

  await app.close()
}

// 10: tasks queued when the app closed wait for Resume; new launches don't.
{
  const first = await launchWithClaudeCode()
  const { profile, home } = first
  const long = `Long. ${fake('work', { ms: 30_000, say: 'Long.' })}`
  const actions = Array.from({ length: 6 }, (_, i) => ({ id: `r${i + 1}`, label: 'Run', title: `Run ${i + 1}`, prompt: long }))
  const parent = await startSession(first.page, profile, `Restart. ${fake('render', { id: 'restart', title: 'Restart', format: 'markdown', content: 'Six.', actions })}`)
  await until(() => said(home, parent).length > 0, 20_000)
  await launchApi(first.page, parent, 'restart', actions.map(a => a.id), long)
  await until(() => tasksOf(profile, parent).filter(t => t.status === 'queued').length === 2, 10_000)
  await first.app.close()
  const second = await launchWithClaudeCode({ profile, home })
  const { page } = second
  const mark = Date.now()
  const bar = page.getByText('2 tasks were queued when Agent Desktop closed')
  check('10: the bar counts the held tasks', await visible(bar))
  const held = tasksOf(profile, parent).filter(t => t.status === 'queued').map(t => t.id)
  await page.waitForTimeout(5000)
  check('10: nothing held starts for 5 s', spawnsOf(mark, held).length === 0 && held.length === 2)
  const [fresh] = await launchApi(page, parent, 'restart', ['r1'], `Quick. ${fake('work', { ms: 200 })}`)
  check('10: a task launched now starts', !!(await until(() => spawnsOf(mark, [fresh.runId]).length, 5000)))
  check('10: the bar still counts 2', await bar.isVisible())
  await page.getByRole('button', { name: 'Resume' }).click()
  check('10: Resume starts the held tasks', !!(await until(() => spawnsOf(mark, held).length === 2, 5000)))
  check('10: the bar goes away', await bar.waitFor({ state: 'hidden', timeout: 5000 }).then(() => true, () => false))
  await page.evaluate(id => window.desktop.claudeCode.stopTasks(id), parent)
  await second.app.close()
}

// 11: on a narrow window the artifact takes the chat's place, and launching works from the keyboard.
{
  const { app, page, profile, home } = await launchWithClaudeCode()
  const quick = `Quick. ${fake('work', { ms: 300 })}`
  const actions = ['k1', 'k2', 'k3'].map(id => ({ id, label: 'Do', title: `Do ${id}`, prompt: quick }))
  const parent = await startSession(page, profile, `Keys. ${fake('render', { id: 'keys', title: 'Keys', format: 'markdown', content: 'Keys.', actions })}`)
  await until(() => said(home, parent).length > 0, 20_000)
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(600, 800))
  await page.waitForTimeout(500)
  await openArtifact(page, 'Keys · 3 actions')
  const panel = panelOf(page)
  await panel.waitFor()
  check('11: the artifact hides the chat', !(await page.locator('textarea').first().isVisible()))
  const focused = () => page.evaluate(() => ({ role: document.activeElement?.getAttribute('type') ?? document.activeElement?.tagName, label: document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent }))
  await panel.getByRole('button', { name: 'Chat' }).focus()
  const tabTo = async (want, key = 'Tab') => {
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press(key)
      const f = await focused()
      if (want(f)) return f
    }
  }
  const box1 = await tabTo(f => f.role === 'checkbox')
  check('11: Tab reaches the first checkbox', box1?.label === 'Select Do: Do k1', box1?.label)
  await page.keyboard.press('Space')
  await tabTo(f => f.role === 'checkbox')
  await page.keyboard.press('Space')
  const launch2 = await tabTo(f => f.label?.trim() === 'Launch 2', 'Shift+Tab')
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog')
  const opened = await visible(dialog)
  await page.waitForTimeout(400)
  const box = opened && (await dialog.boundingBox())
  const viewport = await page.evaluate(() => document.documentElement.clientWidth)
  check('11: Enter on Launch 2 opens the dialog centered in the window', !!launch2 && opened && Math.abs(box.x + box.width / 2 - viewport / 2) <= 2 && box.x >= 0, box && `${box.x}+${box.width} in ${viewport}`)
  check('11: nothing overflows the window', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
  await page.keyboard.press('Meta+Enter')
  await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(300)
  const after = await page.evaluate(() => document.activeElement?.closest('[data-action]')?.getAttribute('data-action'))
  check('11: ⌘↵ launches, and focus lands on the first action', tasksOf(profile, parent).length === 2 && after === 'keys/k1', `${tasksOf(profile, parent).length} tasks, focus ${after}`)
  await panel.getByRole('button', { name: 'Do: Do k3', exact: true }).click()
  await dialog.waitFor()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  check('11: Esc creates nothing', tasksOf(profile, parent).length === 2 && !(await dialog.isVisible()))
  await page.screenshot({ path: `${OUT}/tasks-narrow.png` })
  await app.close()
}

// 12: a task reads its parent; the parent reads its tasks' results; connections are attributed by pid.
{
  const { app, page, profile, home } = await launchWithClaudeCode()
  const repo = makeRepo(home)
  const brief = `Fix it. ${fake('steps', [
    ['call', 'ui_read_parent', {}],
    ['plugin-call', 'ui_read_parent', {}],
    ['nested-plugin-call', 'ui_read_parent', {}],
    ['edit', 'app.js', 'export const add = (a, b) => a + b\n'],
    ['commit', 'Fix add'],
    ['say', 'Fixed add: it subtracted.'],
  ])}`
  const parent = await startSession(page, profile, `Audit. ${fake('steps', [
    ['render', { id: 'fixes', title: 'Fixes', format: 'markdown', content: 'One fix.', actions: [{ id: 'fix-add', label: 'Fix', title: 'Fix add', prompt: brief, cwd: repo.dir, worktree: true }] }],
    ['call', 'ui_read_parent', {}],
    ['say', 'Ready.'],
  ])}`)
  await until(() => said(home, parent).includes('Ready.'), 20_000)
  check("12: a top-level session isn't a task", toolResults(home, parent).at(-1)?.content[0].text === "This session isn't a task.")
  const [launched] = await launchApi(page, parent, 'fixes', ['fix-add'], brief)
  const done = await until(() => session(profile, launched.runId)?.claudeCode.task.outcome?.commitsAhead !== undefined && session(profile, launched.runId), 30_000)
  const reads = toolResults(home, launched.runId)
  const parentRead = (() => { try { return JSON.parse(reads[0]?.content[0].text) } catch { return undefined } })()
  check('12: ui_read_parent returns the source artifact', parentRead?.artifact?.id === 'fixes' && parentRead?.action?.id === 'fix-add', reads[0]?.content[0].text.slice(0, 80))
  check("12: the plugin's connection from the task is the task", reads[1]?.content[0].text === reads[0]?.content[0].text)
  check('12: a claude started inside the task is not', reads[2]?.is_error === true, reads[2]?.content[0].text)
  await send(page, home, parent, 'Which fixes landed?', { steps: [['call', 'ui_list_tasks', {}]], say: 'Listed.' })
  const listed = (() => { try { return JSON.parse(toolResults(home, parent).at(-1).content[0].text) } catch { return [] } })()
  const one = listed.find(t => t.id === launched.runId)
  check('12: ui_list_tasks returns the final answer and counts', one?.finalAnswer === 'Fixed add: it subtracted.' && one.commitsAhead === 1 && one.dirty === false && one.branch === done.claudeCode.task.worktree.branch, JSON.stringify(one)?.slice(0, 200))
  await app.close()
}

// 13: what waits shows on collapsed ancestors and in one notification, unless it's on screen; a timeout fails the task.
{
  const { app, page, profile, home } = await launchWithClaudeCode({ env: { AGENT_DESKTOP_NOTIFY_MS: '0' } })
  const asks = `Ask. ${fake('steps', [['bash', 'echo hi'], ['say', 'Asked.']])}`
  const parent = await startSession(page, profile, `Watch. ${fake('render', { id: 'watch', title: 'Watch', format: 'markdown', content: 'Two.', actions: [
    { id: 'seen', label: 'Ask', title: 'Seen task', prompt: asks },
    { id: 'unseen', label: 'Ask', title: 'Unseen task', prompt: asks },
  ] })}`)
  await until(() => said(home, parent).length > 0, 20_000)
  const parentTitle = session(profile, parent).title
  const [seen] = await launchApi(page, parent, 'watch', ['seen'], `Ask. ${fake('steps', [['wait', 1500], ['bash', 'echo hi'], ['say', 'Asked.']])}`)
  await openTask(page, 'seen')
  await focus(app, true)
  await until(() => session(profile, seen.runId)?.status === 'awaiting_approval', 10_000)
  await page.waitForTimeout(500)
  check('13: no notification for a task on screen', (await shownNotifications(app)).length === 0, JSON.stringify(await shownNotifications(app)))
  const [unseen] = await launchApi(page, parent, 'watch', ['unseen'], asks)
  await until(() => session(profile, unseen.runId)?.status === 'awaiting_approval', 10_000)
  const shown = await until(async () => (await shownNotifications(app)).length > 0 && (await shownNotifications(app)), 3000)
  check('13: one notification for a task elsewhere', shown?.length === 1 && shown[0] === `${parentTitle}: 1 task needs approval`, JSON.stringify(shown))
  await approve(page, seen.runId)
  await nav(page).getByRole('button', { name: `Collapse ${parentTitle}` }).click()
  check('13: collapsed ancestors show what waits', await visible(nav(page).getByText('2 tasks · 1 awaiting approval')))
  await approve(page, unseen.runId)
  await app.close()

  const timing = await launchWithClaudeCode({ env: { AGENT_DESKTOP_TASK_APPROVAL_MS: '500' } })
  const timed = await startSession(timing.page, timing.profile, `Time. ${fake('render', { id: 'time', title: 'Time', format: 'markdown', content: 'One.', actions: [{ id: 'slow', label: 'Ask', title: 'Slow', prompt: asks }] })}`)
  await until(() => said(timing.home, timed).length > 0, 20_000)
  const [slow] = await launchApi(timing.page, timed, 'time', ['slow'], asks)
  const failed = await until(() => session(timing.profile, slow.runId)?.status === 'failed' && session(timing.profile, slow.runId), 10_000)
  check('13: a timed-out approval fails the task', failed?.notice === 'An approval timed out', failed?.notice)
  await timing.app.close()
}

// 14: removing a parent removes its tasks and offers their worktrees; or keeps them at the root. Stop all.
{
  const { app, page, profile, home } = await launchWithClaudeCode()
  const repo = makeRepo(home)
  const quick = `Quick. ${fake('work', { ms: 200 })}`
  const spawn = `Spawn. ${fake('render', { id: 'more', title: 'More', format: 'markdown', content: 'More.', actions: [{ id: 'sub', label: 'Sub', title: 'Sub one', prompt: quick }] })}`
  const asks = `Ask. ${fake('steps', [['bash', 'echo hi'], ['say', 'Asked.']])}`
  const actions = [
    { id: 'clean', label: 'Fix', title: 'Clean tree', prompt: spawn, cwd: repo.dir, worktree: true },
    { id: 'dirty', label: 'Fix', title: 'Dirty tree', prompt: quick, cwd: repo.dir, worktree: true },
    { id: 'asks', label: 'Ask', title: 'Asking', prompt: asks },
  ]
  const parent = await startSession(page, profile, `Remove me. ${fake('render', { id: 'rm', title: 'Rm', format: 'markdown', content: 'Three.', actions })}`)
  await until(() => said(home, parent).length > 0, 20_000)
  const [clean] = await launchApi(page, parent, 'rm', ['clean'], spawn)
  const [dirty] = await launchApi(page, parent, 'rm', ['dirty'], quick)
  await until(() => [clean, dirty].every(t => session(profile, t.runId)?.status === 'completed'), 20_000)
  const [sub] = await page.evaluate(([id, w]) => window.desktop.claudeCode.launch(id, [{ artifactId: 'more', actionId: 'sub', title: 'Sub one', text: w }]), [clean.runId, quick])
  await until(() => session(profile, sub.runId)?.status === 'completed', 20_000)
  const dirtyPath = session(profile, dirty.runId).claudeCode.task.worktree.path
  const cleanPath = session(profile, clean.runId).claudeCode.task.worktree.path
  writeFileSync(path.join(dirtyPath, 'wip.txt'), 'uncommitted')
  const [asking] = await launchApi(page, parent, 'rm', ['asks'], asks)
  await until(() => session(profile, asking.runId)?.status === 'awaiting_approval', 10_000)
  const parentTitle = session(profile, parent).title
  await page.evaluate(() => {
    window.resolved = []
    window.desktop.mcp.onApprovalResolved(r => window.resolved.push(r))
  })
  await rowOf(page, parentTitle).hover()
  await nav(page).getByRole('button', { name: 'Remove from list' }).first().click()
  const dialog = page.getByRole('dialog')
  const all = tasksOf(profile, parent).length + 1
  check('14: the dialog offers to remove every task below', await visible(dialog.getByText(`Also remove ${all} tasks`)) && (await dialog.getByRole('checkbox', { name: /^Also remove/ }).isChecked()))
  check('14: it lists the sub-task too', await visible(dialog.getByText('Sub one')))
  const cleanBox = dialog.getByRole('checkbox', { name: 'Delete worktree of clean' }).first()
  const dirtyBox = dialog.getByRole('checkbox', { name: 'Delete worktree of dirty' })
  await cleanBox.waitFor()
  check('14: a clean worktree is checked, a dirty one not', (await cleanBox.isChecked()) && !(await dirtyBox.isChecked()))
  await dialog.getByRole('button', { name: 'Remove' }).click()
  await until(() => !existsSync(cleanPath), 10_000)
  const branches = repo.git("branch --list 'desktop/task/*'").trim().split('\n').filter(Boolean)
  check('14: clean worktrees go; the dirty one and every branch stay', !existsSync(cleanPath) && existsSync(dirtyPath) && branches.length === 2, branches.join(', '))
  check('14: every task below is removed', sessions(profile).every(s => s.id !== parent && s.claudeCode?.task?.parentRunId !== parent) && !session(profile, sub.runId))
  const denied = await until(() => page.evaluate(() => window.resolved.find(r => r.reason === 'Session removed.')), 5000)
  check("14: a removed task's approval is denied", denied?.approved === false, JSON.stringify(denied))

  const keeper = await startSession(page, profile, `Keep tasks. ${fake('render', { id: 'keep', title: 'Keep', format: 'markdown', content: 'One.', actions: [{ id: 'kept', label: 'Go', title: 'Kept task', prompt: quick }] })}`)
  await until(() => said(home, keeper).length > 0, 20_000)
  const [kept] = await launchApi(page, keeper, 'keep', ['kept'], quick)
  await until(() => session(profile, kept.runId)?.status === 'completed', 20_000)
  await rowOf(page, session(profile, keeper).title).hover()
  await nav(page).getByRole('button', { name: 'Remove from list' }).first().click()
  await dialog.getByRole('checkbox', { name: /^Also remove/ }).uncheck()
  await dialog.getByRole('button', { name: 'Remove' }).click()
  await until(() => session(profile, kept.runId)?.claudeCode.task.parentRemoved, 5000)
  const keptRow = nav(page).getByRole('button', { name: 'kept', exact: true })
  await keptRow.waitFor({ timeout: 5000 }).catch(() => {})
  check('14: kept tasks move to the root', (await keptRow.evaluate(b => b.parentElement.className)).includes('ml-') === false)
  await keptRow.click()
  check('14: their header says Parent removed', await visible(page.getByText('Parent removed')))

  const long = `Long. ${fake('work', { ms: 30_000 })}`
  const many = Array.from({ length: 6 }, (_, i) => ({ id: `l${i + 1}`, label: 'Run', title: `Long ${i + 1}`, prompt: long }))
  const stopper = await startSession(page, profile, `Stop all. ${fake('render', { id: 'stop', title: 'Stop', format: 'markdown', content: 'Six.', actions: many })}`)
  await until(() => said(home, stopper).length > 0, 20_000)
  await launchApi(page, stopper, 'stop', many.map(a => a.id), long)
  await until(() => tasksOf(profile, stopper).filter(t => t.status === 'queued').length === 2, 10_000)
  await rowOf(page, session(profile, stopper).title).hover()
  await nav(page).getByRole('button', { name: 'Stop all tasks (6)' }).click()
  await dialog.getByRole('button', { name: 'Stop all' }).click()
  const mark = Date.now()
  await until(() => tasksOf(profile, stopper).every(t => t.status === 'stopped'), 10_000)
  await page.waitForTimeout(5000)
  check('14: Stop all stops running and queued tasks', tasksOf(profile, stopper).every(t => t.status === 'stopped'), tasksOf(profile, stopper).map(t => t.status).join(','))
  check('14: nothing spawns after Stop all', spawnsOf(mark, tasksOf(profile, stopper).map(t => t.id)).length === 0)
  await app.close()
}

// 15: a parent retry that drops the artifact; a retried first message keeps the task's origin note.
{
  const { app, page, profile, home } = await launchWithClaudeCode()
  const repo = makeRepo(home)
  const quick = `Quick. ${fake('steps', [['edit', 'x.txt', 'x'], ['say', 'Done.']])}`
  const parent = await startSession(page, profile, `Retry. ${fake('render', { id: 'retry', title: 'Retry', format: 'markdown', content: 'One.', actions: [{ id: 'redo', label: 'Fix', title: 'Redo', prompt: quick, cwd: repo.dir, worktree: true }] })}`)
  await until(() => said(home, parent).length > 0, 20_000)
  const [task] = await launchApi(page, parent, 'retry', ['redo'], quick)
  await until(() => session(profile, task.runId)?.status === 'completed', 20_000)
  const mark = Date.now()
  await page.evaluate(([id, text]) => window.desktop.claudeCode.retry(id, 0, text, false), [task.runId, quick])
  const input = await until(() => fakeLog(mark).find(e => e.event === 'input'), 10_000)
  check('15: a retried first message keeps the origin note', input?.content.startsWith('<task_origin') && input.content.includes('worktree of an earlier attempt'), input?.content.slice(0, 80))
  await until(() => session(profile, task.runId)?.status === 'completed', 15_000)
  const snapshot = await runsGet(page, task.runId)
  check("15: the chat's first message is the prompt", snapshot.messages[0]?.parts[0]?.text === quick)
  await page.evaluate(([id]) => window.desktop.claudeCode.retry(id, 0, 'Never mind.', false), [parent])
  await until(() => !(session(profile, parent)?.artifacts ?? []).length && session(profile, parent)?.status === 'completed', 15_000)
  await openTask(page, 'redo')
  check('15: after a parent retry drops the artifact, the action is gone', await visible(page.getByText('Its action is gone')))
  await app.close()
}

// 9, tenant part: a MUTATING tenant call that an allow rule lets through still waits for the user.
// Needs the stub tenant from e2e/rig/.
{
  const { app, page, profile, home } = await launchWithClaudeCode()
  await signIn(page)
  const plugin = await page.evaluate(async () => (await window.desktop.plugins.list())[0]?.id)
  const tool = `tenant__${plugin}__detections_setStatus`
  const call = `Write. ${fake('steps', [['call', tool, { detectionId: 'det-1', status: 'resolved' }], ['say', 'Written.']])}`
  const parent = await startSession(page, profile, `Tenant. ${fake('render', { id: 'tenant', title: 'Tenant', format: 'markdown', content: 'Write.', actions: [{ id: 'tenant', label: 'Write', title: 'tenant', prompt: call }] })}`)
  await until(() => said(home, parent).length > 0, 20_000)
  const [written] = await launchApi(page, parent, 'tenant', ['tenant'], call)
  const stubMark = stubLogLength()
  const gated = await until(async () => (await pending(page, written.runId))[0], 15_000)
  await page.waitForTimeout(1000)
  check('9: a MUTATING call asks though an allow rule skips the prompt', gated?.action === 'detections_setStatus' && toolResults(home, written.runId).length === 0, gated?.action ?? session(profile, written.runId)?.notice)
  check('9: the tenant gets nothing before Approve', stubLogLength() === stubMark)
  await approve(page, written.runId)
  const answered = await until(() => toolResults(home, written.runId)[0], 15_000)
  check('9: Approve lets the call through', answered && !answered.is_error, answered?.content?.[0]?.text?.slice(0, 120))
  await app.close()
}

console.log(`${results.filter(Boolean).length}/${results.length} passed`)
if (results.some(r => !r)) process.exitCode = 1
