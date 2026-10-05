// Task changes: the files a task changed list under it in the sidebar and open as a diff.
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { OUT } from '../app.mjs'
import { launchWithClaudeCode, makeRepo, session, startSession, tasksOf, transcript, until } from '../claude-code.mjs'
import { fake } from '../fake-scripts.mjs'

const results = []
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`) }
const visible = (locator, timeout = 10_000) => locator.first().waitFor({ timeout }).then(() => true, () => false)
const nav = page => page.getByRole('navigation', { name: 'Agents and runs' })
const panelOf = page => page.getByRole('complementary', { name: 'File change' })
const said = (home, id) => transcript(home, id).filter(e => e.type === 'assistant' && e.message.content[0]?.type === 'text').map(e => e.message.content[0].text)
const launchApi = (page, parent, artifactId, actionIds, text) =>
  page.evaluate(
    ([parent, artifactId, actionIds, text]) =>
      window.desktop.claudeCode.launch(parent, actionIds.map(actionId => ({ artifactId, actionId, title: actionId, text }))),
    [parent, artifactId, actionIds, text],
  )
const approve = (page, runId) =>
  page.evaluate(async runId => {
    const { pendingApprovals } = await window.desktop.mcp.getState()
    const approval = pendingApprovals.find(a => a.runId === runId)
    if (approval) await window.desktop.runs.respond(runId, approval.id, true)
    return !!approval
  }, runId)
const brief = files => (files ?? []).map(f => `${f.path}:${f.status}:+${f.additions}-${f.deletions}`).join(', ')
const fileRow = (page, name) => nav(page).getByRole('button', { name: new RegExp(`^${name.replace('.', '\\.')}`) }).first()

{
  const { app, page, profile, home } = await launchWithClaudeCode()
  const repo = makeRepo(home)
  const long = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`)
  writeFileSync(path.join(repo.dir, 'long.txt'), `${long.join('\n')}\n`)
  repo.git('add -A')
  repo.git('commit -q -m long')
  const inWorktree = `Change. ${fake('steps', [
    ['edit', 'app.js', 'export const add = (a, b) => a + b\n'],
    ['edit', 'lib/util.js', 'export const one = 1\nexport const two = 2\n'],
    ['commit', 'Fix add'],
    ['edit', 'long.txt', `${long.map(l => (l === 'line 15' ? 'line fifteen' : l)).join('\n')}\n`],
    ['edit', 'README.md', '# repo\n\nNotes.\n'],
    ['say', 'Changed.'],
  ])}`
  const inPlace = `Change. ${fake('steps', [
    ['replace', 'app.js', 'a - b', 'a * b'],
    ['edit', 'notes.txt', 'one\n'],
    ['say', 'Changed.'],
  ])}`
  const parent = await startSession(page, profile, `Plan. ${fake('render', { id: 'plan', title: 'Plan', format: 'markdown', content: 'Two.', actions: [
    { id: 'wt', label: 'Fix', title: 'In a worktree', prompt: inWorktree, cwd: repo.dir, worktree: true },
    { id: 'plain', label: 'Fix', title: 'In place', prompt: inPlace, cwd: repo.dir },
  ] })}`)
  await until(() => said(home, parent).length > 0, 20_000)
  const byAction = id => tasksOf(profile, parent).find(t => t.claudeCode.task.actionId === id)

  await launchApi(page, parent, 'plan', ['wt'], inWorktree)
  const wt = await until(() => byAction('wt')?.claudeCode.task.outcome?.files && byAction('wt'), 30_000)
  check(
    'worktree: committed, uncommitted and new files list with their counts',
    brief(wt?.claudeCode.task.outcome.files) === 'app.js:modified:+1-1, lib/util.js:added:+2-0, long.txt:modified:+1-1, README.md:modified:+2-0',
    brief(wt?.claudeCode.task.outcome.files),
  )

  // Edits outside a worktree ask, each one.
  await launchApi(page, parent, 'plan', ['plain'], inPlace)
  for (let i = 0; i < 2; i++) await until(() => byAction('plain') && approve(page, byAction('plain').id), 15_000)
  const plain = await until(() => byAction('plain')?.claudeCode.task.outcome?.files && byAction('plain'), 30_000)
  check(
    'in place: its own edits list, taken back to what it started from',
    brief(plain?.claudeCode.task.outcome.files) === 'app.js:modified:+1-1, notes.txt:added:+1-0',
    brief(plain?.claudeCode.task.outcome.files),
  )

  // A task sits under its action, under its artifact, under its parent: open them, and wt.
  for (let i = 0; i < 20; i++) {
    const toggle = nav(page).getByRole('button', { name: /^Expand (?!plain$)/ }).first()
    if (!(await toggle.isVisible().catch(() => false))) break
    await toggle.click()
  }
  check('the sidebar lists the files under the task', await visible(fileRow(page, 'util.js')) && (await fileRow(page, 'util.js').textContent()).includes('lib'))
  await fileRow(page, 'app.js').click()
  const panel = panelOf(page)
  check('a file opens in the panel', await visible(panel.getByRole('heading', { name: 'app.js' })))
  const sideBySide = panel.locator('tr', { hasText: 'a - b' }).filter({ hasText: 'a + b' })
  check('split view: before beside after', await visible(sideBySide))
  await page.screenshot({ path: `${OUT}/task-changes-split.png` })
  await panel.getByRole('button', { name: 'Inline view' }).click()
  check('inline view: before above after', (await sideBySide.count()) === 0 && (await visible(panel.locator('tr', { hasText: 'a - b' }))))

  await fileRow(page, 'long.txt').click()
  check('the layout chosen stays', (await panel.getByRole('button', { name: 'Inline view' }).getAttribute('aria-pressed')) === 'true')
  const fold = panel.getByRole('button', { name: '11 unchanged lines' })
  check('unchanged lines fold around a change', await visible(fold) && (await visible(panel.getByRole('button', { name: '12 unchanged lines' }))) && !(await panel.getByText('line 1', { exact: true }).isVisible()))
  await page.screenshot({ path: `${OUT}/task-changes-inline.png` })
  await fold.click()
  check('a fold opens', await visible(panel.getByText('line 1', { exact: true })))

  await nav(page).getByRole('button', { name: 'Collapse wt', exact: true }).click()
  await nav(page).getByRole('button', { name: 'Expand plain', exact: true }).click()
  await fileRow(page, 'app.js').click()
  check("in place: the diff is the task's own edit", await visible(panel.locator('tr', { hasText: 'a - b' })) && (await visible(panel.locator('tr', { hasText: 'a * b' }))) && !(await panel.getByText("couldn't be traced back").isVisible()))
  await panel.getByRole('button', { name: 'Close file' }).click()
  check('Close shuts the panel', await panel.waitFor({ state: 'hidden', timeout: 5000 }).then(() => true, () => false))
  await app.close()
}

console.log(`${results.filter(Boolean).length}/${results.length} passed`)
if (results.some(r => !r)) process.exitCode = 1
