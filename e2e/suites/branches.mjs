// Branches: a session binds a branch, its tasks merge up into it or split out, each item a prompt.
import path from 'node:path'
import { OUT } from '../app.mjs'
import { fakeLog, launchWithClaudeCode, makeRepo, session, startSession, tasksOf, transcript, until } from '../claude-code.mjs'
import { fake } from '../fake-scripts.mjs'

const results = []
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`) }
const visible = (locator, timeout = 10_000) => locator.first().waitFor({ timeout }).then(() => true, () => false)
const said = (home, id) => transcript(home, id).filter(e => e.type === 'assistant' && e.message.content[0]?.type === 'text').map(e => e.message.content[0].text)
const panelOf = page => page.getByRole('complementary', { name: 'Claude Code Artifact' })
const header = page => page.getByRole('main').locator('header').first()
const composer = page => page.locator('textarea:enabled').first()
const launchApi = (page, parent, artifactId, prompts) =>
  page.evaluate(
    ([parent, artifactId, prompts]) =>
      window.desktop.claudeCode.launch(parent, Object.entries(prompts).map(([actionId, text]) => ({ artifactId, actionId, title: `Task ${actionId}`, text }))),
    [parent, artifactId, prompts],
  )
const view = (page, id) => page.evaluate(id => window.desktop.claudeCode.branchView(id), id)
const menuItem = (page, name) => page.getByRole('menuitem', { name })
async function openBranchMenu(page) {
  await header(page).getByRole('button', { name: 'Branch menu' }).click()
  await page.getByRole('menu').first().waitFor()
}
// Sends what the composer holds, with the fake's steps after it, and waits for the answer.
async function sendWith(page, home, id, steps, say) {
  const box = composer(page)
  const text = await box.inputValue()
  await box.fill(`${text}\n\n${fake('steps', [...steps, ['say', say]])}`)
  await box.press('Enter')
  return until(() => said(home, id).includes(say), 20_000)
}

{
  const { app, page, profile, home } = await launchWithClaudeCode({
    env: { FAKE_TOOLS: 'mcp__claude_ai_Atlassian__createJiraIssue' },
  })
  const repo = makeRepo(home)
  const batchDir = path.join(home, 'batch-wt')
  repo.git(`worktree add -q -b batch ${JSON.stringify(batchDir)} main`)
  const fix = (name, file) =>
    `Fix ${name}.\n\nDone when:\n- ${file} says ${name}.\n\n${fake('steps', [
      ['edit', file, `${name}\n`],
      ['edit', `test/${name}.test.js`, 'ok\n'],
      ['commit', `Fix ${name}`],
      ['say', `Fixed ${name}.`],
    ])}`
  const prompts = { 'fix-a': fix('A', 'a.txt'), 'fix-b': fix('B', 'b.txt'), 'fix-c': fix('C', 'c.txt'), 'fix-d': fix('D', 'd.txt') }
  const action = id => ({ id, label: 'Fix', title: `Fix ${id.slice(4).toUpperCase()}`, prompt: prompts[id], cwd: repo.dir, worktree: true })
  const parent = await startSession(page, profile, `Plan. ${fake('render', {
    id: 'plan',
    title: 'Plan',
    format: 'markdown',
    content: 'Four fixes.',
    actions: Object.keys(prompts).map(action),
  })}`)
  await until(() => said(home, parent).length > 0, 20_000)
  const byAction = id => tasksOf(profile, parent).find(t => t.claudeCode.task.actionId === id)
  const done = id => byAction(id)?.claudeCode.task.outcome?.commitsAhead === 1 && byAction(id)
  const { 'fix-d': _, ...first } = prompts
  await launchApi(page, parent, 'plan', first)
  const [a, b, c] = await Promise.all(['fix-a', 'fix-b', 'fix-c'].map(id => until(() => done(id), 40_000)))
  check('three tasks commit on their own branches', !!(a && b && c))
  check('the session saw a Jira tool at start', session(profile, parent)?.claudeCode?.tickets === true)

  // Bind: the picker lists the repo's branches, worktrees first; the prefix is kept.
  await openBranchMenu(page)
  await menuItem(page, 'Bind branch…').click()
  const bind = page.getByRole('dialog', { name: 'Bind a branch' })
  await bind.waitFor()
  const escaped = batchDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  check('bind: the picker lists the batch branch with its worktree', await visible(bind.getByRole('option', { name: new RegExp(`^batch\\s*${escaped}$`) })))
  await bind.getByRole('option', { name: /^batch/ }).click()
  await bind.getByLabel('Commit prefix').fill('DEV-1')
  await bind.getByRole('button', { name: /^Bind/ }).click()
  await bind.waitFor({ state: 'hidden', timeout: 10_000 })
  const bound = await until(() => session(profile, parent)?.claudeCode?.branches?.[0], 5000)
  check('bind: the session record holds the branch and its prefix', bound?.name === 'batch' && bound.prefix === 'DEV-1', JSON.stringify(bound))
  check('bind: the header shows it, none merged yet', await visible(header(page).getByText(/0\/3 merged · unpushed/)))

  // Merge ▸ All ready: the prompt holds the facts; the fake does the picks and reports.
  await openBranchMenu(page)
  await menuItem(page, /^Merge/).click()
  const all = menuItem(page, 'All ready (3)')
  check('merge: All ready counts the three tasks', await visible(all))
  await all.click()
  const prompt = await until(async () => (await composer(page).inputValue()).includes('cherry-pick -x') && composer(page).inputValue(), 5000)
  const branchOf = t => t.claudeCode.task.worktree.branch
  check(
    'merge: the prompt names the target worktree, each branch, its checks and tests, and the prefix',
    !!prompt && prompt.includes(batchDir) && [a, b, c].every(t => prompt.includes(branchOf(t))) &&
      prompt.includes('Done when:\n   - a.txt says A.') && prompt.includes('test/A.test.js') && prompt.includes('`DEV-1: `'),
    prompt || '',
  )
  await page.evaluate(id => window.desktop.claudeCode.setAutoApprove(id, true), parent)
  const pick = t => `git -C ${JSON.stringify(batchDir)} cherry-pick -x ${t.claudeCode.task.worktree.commit}..${branchOf(t)}`
  const spawnsBefore = fakeLog().filter(e => e.event === 'spawn' && e.run === parent).length
  await composer(page).fill('')
  // Two of three: c stays out to be split.
  await openBranchMenu(page)
  await menuItem(page, /^Merge/).click()
  await menuItem(page, 'Choose…').click()
  const choose = page.getByRole('dialog', { name: 'Merge into batch' })
  await choose.getByRole('checkbox').nth(2).uncheck()
  await choose.getByRole('button', { name: 'Write the prompt for 2 branches' }).click()
  await until(async () => (await composer(page).inputValue()).includes(branchOf(b)), 5000)
  check('choose: the prompt holds only the picked branches', !(await composer(page).inputValue()).includes(branchOf(c)))
  const merged = await sendWith(page, home, parent, [
    ['bash', `${pick(a)} && ${pick(b)}`],
    ['call', 'ui_report_branch', { branch: 'batch', merged: [branchOf(a), branchOf(b)] }],
  ], 'Merged.')
  check('merge: the agent merged and reported', !!merged)
  const spawn = fakeLog().filter(e => e.event === 'spawn' && e.run === parent).at(-1)
  check(
    'merge: the turn after binding runs in a new process that adds the batch worktree',
    fakeLog().filter(e => e.event === 'spawn' && e.run === parent).length > spawnsBefore && spawn?.argv.join(' ').includes(`--add-dir ${batchDir}`),
    spawn?.argv.slice(-3).join(' '),
  )
  const rows = await until(async () => {
    const v = await view(page, parent)
    return v.rows.filter(r => r.merged).length === 2 && v.rows
  }, 10_000)
  check('merge: a and b read merged, c is still ready', !!rows && rows.find(r => r.runId === c.id)?.ready === true)
  check('merge: the header counts them', await visible(header(page).getByText(/2\/3 merged/)))

  // On the artifact: the pill says merged; the menu offers Split and Launch on the branch.
  await page.getByRole('button', { name: '1 artifact' }).click()
  const panel = panelOf(page)
  check('artifact: a merged task reads merged ⎇ batch', await visible(panel.getByRole('button', { name: /^Fix: Fix A · Completed · merged ⎇ batch/ })))
  await panel.getByRole('button', { name: 'More for Fix: Fix A' }).click()
  check('artifact: a merged task can no longer merge or split', await menuItem(page, 'Merge into ⎇ batch').isDisabled() && await menuItem(page, 'Split out into its own PR…').isDisabled())
  await page.keyboard.press('Escape')

  // Split C out from its action's menu: a remote branch of its own and a reported PR.
  await panel.getByRole('button', { name: 'More for Fix: Fix C' }).click()
  await menuItem(page, 'Split out into its own PR…').click()
  const split = page.getByRole('dialog', { name: 'Split out into its own PR' })
  check('split: the remote name starts with the prefix; a ticket can be filed', (await split.getByLabel('Remote branch').inputValue()) === 'DEV-1-fix-c' && await visible(split.getByRole('checkbox', { name: /File a Jira ticket/ })))
  await split.getByRole('button', { name: 'Write the prompt' }).click()
  check('split: the prompt pushes under the remote name', await until(async () => (await composer(page).inputValue()).includes('HEAD:refs/heads/DEV-1-fix-c'), 5000))
  await sendWith(page, home, parent, [
    ['call', 'ui_report_branch', { branch: branchOf(c), remote: 'DEV-1-fix-c', pr: { url: 'https://example.com/pr/7', number: 7 } }],
  ], 'Split.')
  check('split: the pill shows its own PR', await visible(panel.getByRole('button', { name: /^Fix: Fix C · Completed · own PR #7/ })))
  check('split: the task records the remote and the PR', session(profile, c.id)?.claudeCode.task.report?.remote === 'DEV-1-fix-c')
  check('split: a split-out task leaves the merged count', await visible(header(page).getByText(/2\/2 merged/)))

  // Typed text isn't replaced without asking.
  await composer(page).fill('my note')
  await openBranchMenu(page)
  await menuItem(page, 'Push').click()
  const askBar = page.getByText('Replace what you typed with the push prompt?')
  check('composer: a menu prompt asks before replacing typed text', await visible(askBar))
  await page.getByRole('button', { name: 'Keep mine' }).click()
  check('composer: Keep mine keeps it', (await composer(page).inputValue()) === 'my note')
  await openBranchMenu(page)
  await menuItem(page, 'Push').click()
  await page.getByRole('button', { name: 'Replace', exact: true }).click()
  check('composer: Replace puts the push prompt in', (await composer(page).inputValue()).includes('push -u origin batch'))
  await composer(page).fill('')

  // PRs: Open PR… doesn't wait for a push; a split-out task's PR is a link.
  await openBranchMenu(page)
  await menuItem(page, /^Split out/).click()
  const ownPr = menuItem(page, /PR #7/)
  check("pr: Split out ▸ links the split-out task's PR", await visible(ownPr) && (await ownPr.getAttribute('href')) === 'https://example.com/pr/7')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await openBranchMenu(page)
  await menuItem(page, 'Open PR…').click()
  const prPrompt = await until(async () => { const t = await composer(page).inputValue(); return t.includes('gh pr create') && t }, 5000)
  const titleOf = t => session(profile, t.id).title
  check(
    'pr: an unpushed branch gets a prompt that pushes, then opens it on the default base with the merged fixes',
    !!prPrompt && prPrompt.includes('push -u origin batch') && prPrompt.includes('--head batch --base main') &&
      prPrompt.includes(titleOf(a)) && prPrompt.includes(titleOf(b)) && !prPrompt.includes(titleOf(c)),
    prPrompt || '',
  )
  await composer(page).fill('')

  // A spin-off has no branch of its own: its menu works on the parent's, and its report lands there.
  const spinoff = await page.evaluate(([id, prompt]) => window.desktop.claudeCode.spinoff(id, { title: 'Ship batch', prompt }), [parent, `Ship it. ${fake('steps', [['say', 'Ready.']])}`])
  await until(() => session(profile, spinoff)?.status === 'completed', 20_000)
  const sidebar = page.getByRole('navigation', { name: 'Agents and runs' })
  await sidebar.locator('[data-row="session"]').filter({ hasText: /^Ship batch/ }).first().click()
  await header(page).getByText('Ship batch').first().waitFor()
  const spinSpawn = fakeLog().filter(e => e.event === 'spawn' && e.run === spinoff).at(-1)
  check("spin-off: its turns add the parent's bound worktree", spinSpawn?.argv.join(' ').includes(`--add-dir ${batchDir}`), spinSpawn?.argv.slice(-3).join(' '))
  await openBranchMenu(page)
  check("spin-off: its menu shows the parent's branch", await visible(page.getByRole('menu').getByText(/^Bound to Plan\./)))
  await menuItem(page, 'Open PR…').click()
  const spinPrompt = await until(async () => { const t = await composer(page).inputValue(); return t.includes('gh pr create') && t }, 5000)
  check("spin-off: the PR prompt holds the parent's merged fixes", !!spinPrompt && spinPrompt.includes(titleOf(a)) && spinPrompt.includes('push -u origin batch'), spinPrompt || '')
  await sendWith(page, home, spinoff, [
    ['call', 'ui_report_branch', { branch: 'batch', pr: { url: 'https://example.com/pr/12', number: 12 } }],
  ], 'Opened.')
  check("spin-off: its report lands on the parent's binding", !!(await until(() => session(profile, parent)?.claudeCode?.branches?.[0]?.report?.pr?.number === 12, 10_000)))
  await openBranchMenu(page)
  const viewPr = menuItem(page, 'View PR #12')
  check('spin-off: the menu links the PR in place of Open PR…', await visible(viewPr) && (await viewPr.getAttribute('href')) === 'https://example.com/pr/12' && (await menuItem(page, 'Open PR…').count()) === 0)
  await page.screenshot({ path: `${OUT}/branches-spinoff.png` })
  await page.keyboard.press('Escape')
  await sidebar.locator('[data-row="session"]').filter({ hasText: /^Plan\. / }).first().click()
  await header(page).getByText('batch', { exact: true }).waitFor()
  if (!(await panel.isVisible())) await page.getByRole('button', { name: '1 artifact' }).click()

  // Launch on the bound branch: the launch dialog starts D from it.
  const tip = repo.git('rev-parse batch').trim()
  await panel.getByRole('button', { name: 'Fix: Fix D', exact: true }).click()
  const launch = page.getByRole('dialog')
  await launch.getByRole('combobox', { name: 'Start from' }).waitFor()
  check('launch: the row starts from the bound branch', (await launch.getByRole('combobox', { name: 'Start from' }).inputValue()) === 'bound')
  await launch.getByRole('button', { name: 'Launch 1' }).click()
  const d = await until(() => done('fix-d'), 40_000)
  check('launch: its worktree is cut from the batch tip', d?.claudeCode.task.worktree.base === 'batch' && d.claudeCode.task.worktree.commit === tip, JSON.stringify(d?.claudeCode.task.worktree))

  // The task's own menu: merge up, from the task session, opened from its action's pill.
  await page.evaluate(id => window.desktop.claudeCode.setAutoApprove(id, true), d.id)
  await panel.getByRole('button', { name: /^Fix: Fix D · Completed/ }).click()
  await header(page).getByText(d.claudeCode.task.worktree.branch).waitFor()
  await openBranchMenu(page)
  const up = menuItem(page, 'Merge into ⎇ batch')
  check('task: its menu merges into the parent branch', await visible(up) && !(await up.isDisabled()))
  await up.click()
  await until(async () => (await composer(page).inputValue()).includes(`cherry-pick -x`), 5000)
  await sendWith(page, home, d.id, [['bash', pick(d)], ['call', 'ui_report_branch', { branch: 'batch', merged: [branchOf(d)] }]], 'Merged D.')
  check('task: the header says merged into batch', await visible(header(page).getByText('· merged into batch'), 15_000))
  await page.screenshot({ path: `${OUT}/branches-task.png` })

  // The sidebar's ⎇: always shown on a bound session, its menu opens in place, prompts open the session.
  const nav = page.getByRole('navigation', { name: 'Agents and runs' })
  const parentRow = nav.locator('[data-row="session"]').filter({ hasText: /^Plan\. / }).first()
  const taskRow = nav.locator('[data-row="session"]').filter({ hasText: /^Fix$/ }).first()
  await page.mouse.move(0, 0)
  const opacity = locator => locator.evaluate(el => getComputedStyle(el).opacity)
  check(
    'sidebar: a bound session shows its ⎇ without hover; an unbound one hides it',
    (await opacity(parentRow.getByRole('button', { name: 'Branch menu' }))) === '1' &&
      (await opacity(taskRow.getByRole('button', { name: 'Branch menu' }))) === '0',
  )
  const navBox = await nav.boundingBox()
  await parentRow.getByRole('button', { name: 'Branch menu' }).click()
  const menuBox = await page.getByRole('menu').first().boundingBox()
  check('sidebar: its menu opens at the row, not in the header', !!menuBox && menuBox.x < navBox.x + navBox.width)
  // The open menu hides the page from roles: the header is found by tag.
  check('sidebar: opening it leaves the open session as it was', await visible(page.locator('main header').first().getByText(d.claudeCode.task.worktree.branch)))
  await menuItem(page, 'New branch…').click()
  const created = page.getByRole('dialog', { name: 'New branch' })
  await created.getByLabel('Branch name').fill('DEV-9-next')
  check('new branch: the base defaults to the repo\'s default branch, the prefix to the key', (await created.getByLabel('Base').inputValue()) === 'main' && (await created.getByLabel('Commit prefix').inputValue()) === 'DEV-9')
  await created.getByRole('button', { name: 'Write the prompt' }).click()
  check('sidebar: a prompt opens its session with the prompt in the composer', !!(await until(async () => (await composer(page).inputValue()).includes('worktree add -b DEV-9-next'), 5000)) && await visible(header(page).getByText('batch', { exact: true })))
  const nextDir = path.join(repo.dir, '.claude', 'worktrees', 'DEV-9-next')
  await sendWith(page, home, parent, [
    ['bash', `git -C ${JSON.stringify(repo.dir)} worktree add -b DEV-9-next ${JSON.stringify(nextDir)} main`],
    ['call', 'ui_report_branch', { branch: 'DEV-9-next', created: true }],
  ], 'Created.')
  const next = await until(() => {
    const b = session(profile, parent)?.claudeCode?.branches?.[0]
    return b?.name === 'DEV-9-next' && !b.creating && b
  }, 10_000)
  check('new branch: sending binds it in place of batch, and the report settles it', !!next && next.prefix === 'DEV-9', JSON.stringify(session(profile, parent)?.claudeCode?.branches))
  check('new branch: the header follows the binding', await visible(header(page).getByText('DEV-9-next', { exact: true })))
  await page.screenshot({ path: `${OUT}/branches-parent.png` })
  await app.close()
}

console.log(`${results.filter(Boolean).length}/${results.length} passed`)
if (results.some(r => !r)) process.exitCode = 1
