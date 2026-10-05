// Digs: read-only sessions into an action's prompt, their suggestions, and actions as sidebar bookmarks.
import { fake, fakeDig } from '../fake-scripts.mjs'
import { fakeLog, launchWithClaudeCode, makeRepo, session, sessions, startSession, tasksOf, transcript, until } from '../claude-code.mjs'
import { OUT } from '../app.mjs'

const results = []
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`) }
const visible = (locator, timeout = 10_000) => locator.first().waitFor({ timeout }).then(() => true, () => false)
const nav = page => page.getByRole('navigation', { name: 'Agents and runs' })
const panelOf = page => page.getByRole('complementary', { name: 'Claude Code Artifact' })
const said = (home, id) => transcript(home, id).filter(e => e.type === 'assistant' && e.message.content[0]?.type === 'text').map(e => e.message.content[0].text)
const toolResults = (home, id) => transcript(home, id).flatMap(e => (e.type === 'user' && Array.isArray(e.message.content) ? e.message.content.filter(c => c.type === 'tool_result') : []))
const resultText = r => (Array.isArray(r.content) ? r.content.map(c => c.text).join('') : String(r.content))
const runsGet = (page, id) => page.evaluate(id => window.desktop.runs.get(id), id)
const digsOf = (profile, parent) => tasksOf(profile, parent).filter(s => s.claudeCode.task.kind === 'dig')
const fixesOf = (profile, parent) => tasksOf(profile, parent).filter(s => s.claudeCode.task.kind !== 'dig')
// A dig's marker sits in the prompt it reads: a replace's text is escaped there, so the prompt holds it once.
const once = (marker, text) => marker.replaceAll(text, text.replace(/t\./, '\\u0074.'))

const FIND = 'Ship it.'
const digSteps = repo => [
  ['wait', 1500],
  ['bash', `git -C ${repo} log --oneline -1`],
  ['bash', 'echo hi'],
  ['edit', 'dug.txt', 'no'],
  ['render', { id: 'dig', title: 'Should you launch A?', format: 'markdown', content: '# Should you launch A?\n\n> Yes, with 2 changes.\n\n```mermaid\nflowchart LR\n  A["List"] --> B["Work"]\n```' }],
  ['call', 'ui_suggest_prompt_changes', { changes: [
    { kind: 'append', text: 'Also add a test for X.', why: 'X has no test.' },
    { kind: 'replace', find: FIND, text: 'Ship it carefully.', why: 'Care matters.' },
  ] }],
  ['say', 'Yes, with 2 changes.'],
]
const promptOf = repo => `Do the A thing. ${FIND} ${fake('steps', [['say', 'Did A.']])} ${once(fakeDig('steps', digSteps(repo)), FIND)}`
const queue = a => ({
  id: 'queue',
  title: 'Queue',
  format: 'markdown',
  content: ['# Queue', '', '### A · First thing', '', '````text', a, '````', '', ...Array.from({ length: 40 }, (_, i) => `Filler line ${i}.`), '', '### B · Second thing', '', '````text', 'Do B.', '````'].join('\n'),
})
const actions = repo => [
  { id: 'a', label: 'Fix', title: 'A · First thing', anchor: { heading: 'A · First thing' }, cwd: repo },
  { id: 'b', label: 'Fix', title: 'B · Second thing', anchor: { heading: 'B · Second thing' } },
]

const { app, page, profile, home } = await launchWithClaudeCode()
const repo = makeRepo(home)
const promptA = promptOf(repo.dir)
const parent = await startSession(page, profile, `Queue. ${fake('steps', [['title', 'Dig parent'], ['say', 'Parent says hello.'], ['render', { ...queue(promptA), actions: actions(repo.dir) }], ['say', 'Rendered.']])}`)
await until(() => said(home, parent).includes('Rendered.'), 20_000)

// Bookmarks: every action under its artifact, before anything runs.
await nav(page).getByRole('button', { name: 'Expand Dig parent', exact: true }).click()
await nav(page).getByRole('button', { name: 'Expand Queue', exact: true }).click()
check('bookmarks: both actions listed under the artifact', await visible(nav(page).getByRole('button', { name: 'A · First thing', exact: true })) && await visible(nav(page).getByRole('button', { name: 'B · Second thing', exact: true })))
await nav(page).getByRole('button', { name: 'B · Second thing', exact: true }).click()
const actionB = panelOf(page).locator('[data-action="queue/b"]')
check('bookmarks: a pick opens the artifact and flashes the action', await until(() => actionB.evaluate(el => el.hasAttribute('data-flash')).catch(() => false), 5000))
const inView = await actionB.evaluate(el => {
  const r = el.getBoundingClientRect()
  const p = el.closest('.overflow-y-auto').getBoundingClientRect()
  return r.top >= p.top && r.bottom <= p.bottom
})
check('bookmarks: the action is scrolled into view', inView)

// Dig from the action's menu: a forked, read-only session.
const panel = panelOf(page)
await panel.getByRole('button', { name: 'More for Fix: A · First thing' }).click()
await page.getByRole('menuitem', { name: 'Dig', exact: true }).click()
const dig = await until(() => digsOf(profile, parent)[0], 10_000)
check('dig: a dig session is made', !!dig)
check('dig: the action shows it digging', await visible(panel.getByRole('button', { name: 'Digging into Fix: A · First thing' }), 5000))
const done = await until(() => session(profile, dig.id)?.status === 'completed', 30_000)
check('dig: it completes without asking anything', done, session(profile, dig.id)?.status)
const spawn = fakeLog().find(e => e.event === 'spawn' && e.run === dig.id)
const argv = spawn?.argv ?? []
check('dig: forked from the parent', argv.includes('--fork-session') && argv[argv.indexOf('--resume') + 1] === parent, argv.join(' '))
check('dig: edit tools are off', argv.slice(argv.indexOf('--disallowedTools') + 1, argv.indexOf('--disallowedTools') + 4).join(',') === 'Edit,Write,NotebookEdit')
check("dig: it reads the action's folder", argv[argv.indexOf('--add-dir') + 1] === repo.dir)
check("dig: it runs in the parent's folder", spawn?.cwd === session(profile, parent).claudeCode.cwd)
const digResults = toolResults(home, dig.id).slice(-5)
check('dig: read-only git runs', digResults[0] && !digResults[0].is_error && /second/.test(resultText(digResults[0])), resultText(digResults[0] ?? {}))
check('dig: other shell commands are refused', digResults[1]?.is_error && /read-only/.test(resultText(digResults[1])), resultText(digResults[1] ?? {}))
check('dig: edits are refused', digResults[2]?.is_error && /read-only/.test(resultText(digResults[2])), resultText(digResults[2] ?? {}))
check('dig: a valid diagram renders', digResults[3] && !digResults[3].is_error, resultText(digResults[3] ?? {}))
const digView = await runsGet(page, dig.id)
const texts = digView.messages.map(m => m.parts.filter(p => p.type === 'text').map(p => p.text).join(''))
await nav(page).getByRole('button', { name: 'Expand A · First thing', exact: true }).click()
await nav(page).locator('[data-row="session"]').getByRole('button', { name: 'Dig · A · First thing', exact: true }).click()
await page.getByRole('region', { name: 'Suggested changes' }).waitFor({ timeout: 5000 }).catch(() => {})
await page.screenshot({ path: `${OUT}/dig-chat.png` })
await nav(page).getByRole('button', { name: 'Dig parent', exact: true }).click()
await page.getByRole('button', { name: 'Queue · 2 actions', exact: true }).last().click()
check("dig: its chat starts at its own message, not the parent's", digView.messages[0]?.role === 'user' && texts[0].startsWith('Dig into "A · First thing"') && !texts.some(t => t.includes('Parent says hello.')), texts[0]?.slice(0, 60))
const firstInput = fakeLog().find(e => e.event === 'input' && e.sessionId === dig.id)?.content ?? ''
check('dig: its note carries the instructions and launch facts', /<task_origin kind="dig"/.test(firstInput) && firstInput.includes('ui_suggest_prompt_changes') && firstInput.includes('in place, without a worktree'))

// Suggestions: a chip on the action, accepted in its dialog.
const chip = panel.getByRole('button', { name: '2 suggested changes for Fix: A · First thing' })
check('suggestions: the action shows 2 waiting', await visible(chip, 5000))
check('suggestions: the sidebar row counts them', await visible(nav(page).getByRole('button', { name: /^A · First thing.*✎ 2/ })))
await page.screenshot({ path: `${OUT}/dig-chip.png` })
await chip.click()
const review = page.getByRole('dialog', { name: 'Suggested changes' })
await review.waitFor()
await page.screenshot({ path: `${OUT}/dig-review.png` })
await review.getByRole('button', { name: 'Accept' }).first().click()
await until(() => session(profile, parent).claudeCode.suggestions?.filter(s => s.status === 'accepted').length === 1, 5000)
await review.getByRole('button', { name: 'Accept' }).first().click()
const accepted = await until(() => session(profile, parent).claudeCode.suggestions?.every(s => s.status === 'accepted'), 5000)
check('suggestions: both accepted', accepted)
check('suggestions: a settled dig is archived', await until(() => session(profile, dig.id)?.claudeCode.task.archived === true, 5000))
await page.keyboard.press('Escape')

// The brief in the artifact shows what was accepted, and the agent's text on request.
const brief = panel.getByRole('figure', { name: 'Amended prompt' })
check('brief: it says it was amended', await visible(brief.getByText('Amended by 2 accepted suggestions')))
const added = await brief.locator('[data-change="add"]').allTextContents()
const removed = await brief.locator('[data-change="del"]').allTextContents()
check('brief: added and removed lines are marked', added.some(t => t.includes('Ship it carefully.')) && added.includes('Also add a test for X.') && removed.some(t => t.includes(`${FIND} [fake`)), JSON.stringify({ added: added.map(t => t.slice(0, 30)), removed: removed.map(t => t.slice(0, 30)) }))
await brief.getByRole('button', { name: 'Show original' }).click()
check('brief: Show original shows the agent\'s text alone', (await brief.locator('[data-change]').count()) === 0 && await visible(brief.getByText("The agent's prompt, as it wrote it")))
await brief.getByRole('button', { name: 'Show amended' }).click()
await page.screenshot({ path: `${OUT}/dig-brief.png` })

// The launch takes the prompt with the accepted changes.
await panel.getByRole('button', { name: 'Fix: A · First thing', exact: true }).click()
const dialog = page.getByRole('dialog')
await dialog.waitFor()
check('launch: the row says what it includes', await visible(dialog.getByText('The prompt includes 2 accepted suggestions.')))
await page.screenshot({ path: `${OUT}/dig-launch.png` })
const text = await dialog.getByRole('textbox', { name: /^Prompt for/ }).inputValue()
check('launch: the prompt has both changes', text.includes('Ship it carefully.') && text.endsWith('Also add a test for X.'), text.slice(-60))
await dialog.getByRole('button', { name: /^Launch \d+$/ }).click()
const fix = await until(() => fixesOf(profile, parent)[0], 10_000)
const fixInput = await until(() => fakeLog().find(e => e.event === 'input' && e.sessionId === fix?.id)?.content, 15_000)
check('launch: the task got the changed prompt, unedited', !!fixInput?.includes('Also add a test for X.') && session(profile, fix.id).claudeCode.task.promptEdited === false)
await until(() => session(profile, fix.id)?.status === 'completed', 20_000)
const expandA = nav(page).getByRole('button', { name: 'Expand A · First thing', exact: true })
if (await expandA.isVisible()) await expandA.click()
const fixRow = nav(page).locator('[data-row="session"]').getByRole('button', { name: 'A · First thing', exact: true })
check('sidebar: the action lists its task by its label, the archived dig folded', await visible(fixRow) && (await fixRow.textContent()).startsWith('Fix') && await visible(nav(page).getByRole('button', { name: '1 earlier session', exact: true })))
check('sidebar: no "Prompt changed" after launching the changed prompt', !(await panel.getByRole('button', { name: 'More for Fix: A · First thing' }).click().then(() => page.getByText('Prompt changed since launch').isVisible())))
await page.keyboard.press('Escape')

// A re-render that drops the replaced text leaves that change out, and says so.
const box = page.locator('textarea:enabled').first()
await box.fill(`Again. ${fake('steps', [['render', { ...queue(promptA.replace(FIND, 'Ship now.')) }], ['say', 'Again.']])}`)
await box.press('Enter')
await until(() => said(home, parent).includes('Again.'), 20_000)
await panel.getByRole('button', { name: 'More for Fix: A · First thing' }).click()
await page.getByRole('menuitem', { name: 'Launch again' }).click()
await dialog.waitFor()
check('stale: a change that no longer fits is left out', await visible(dialog.getByText('1 accepted suggestion no longer fits the prompt', { exact: false })))
await page.keyboard.press('Escape')
check('stale: the brief says so too', await visible(panel.getByRole('figure', { name: 'Amended prompt' }).getByText('1 accepted suggestion no longer fits', { exact: false })))

// A diagram that doesn't parse rejects the render.
await box.fill(`Bad diagram. ${fake('steps', [['render', { id: 'bad', title: 'Bad', format: 'markdown', content: '```mermaid\nflowchart LR\n  A[[[x\n```' }], ['say', 'Tried.']])}`)
await box.press('Enter')
await until(() => said(home, parent).includes('Tried.'), 20_000)
const bad = toolResults(home, parent).at(-1)
check("diagrams: one that doesn't parse is rejected", bad?.is_error && /doesn't parse/.test(resultText(bad)), resultText(bad ?? {}).slice(0, 120))

// The session counts its tasks, not its digs.
await nav(page).getByRole('button', { name: 'Collapse Dig parent', exact: true }).click()
const row = await nav(page).getByRole('button', { name: /^Dig parent/ }).first().textContent()
check('sidebar: a collapsed session counts tasks only', row.includes('1 task') && !row.includes('2 tasks'), row)

await page.screenshot({ path: `${OUT}/dig.png` })
await app.close()
const failed = results.filter(ok => !ok).length
console.log(`${results.length - failed}/${results.length} passed`)
process.exitCode = failed ? 1 : 0
