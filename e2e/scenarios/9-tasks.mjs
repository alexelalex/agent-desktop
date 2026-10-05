// Scenario 9: with the real Claude Code, a session publishes a fix queue with two actions; one launches
// as a task in a worktree and commits its fix; ui_list_tasks in the parent reports the branch and commits.
import { execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { launch } from '../app.mjs'
import { session, sessions, tasksOf, until } from '../claude-code.mjs'
import { checker, need } from './lib.mjs'

const { check, finish } = checker('9 tasks')
await finish(async () => {
  const home = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'sf-live-tasks-')))
  const repo = path.join(home, 'calc')
  mkdirSync(repo)
  const git = command => execSync(`git ${command}`, { cwd: repo, encoding: 'utf8' })
  git('init -q -b main')
  git('config user.name e2e')
  git('config user.email e2e@example.com')
  writeFileSync(path.join(repo, 'math.js'), 'export const add = (a, b) => a - b\nexport const mul = (a, b) => a + b\n')
  writeFileSync(path.join(repo, 'test.js'), "import { add, mul } from './math.js'\nif (add(2, 3) !== 5) throw new Error('add')\nif (mul(2, 3) !== 6) throw new Error('mul')\nconsole.log('ok')\n")
  writeFileSync(path.join(repo, 'package.json'), '{ "type": "module" }\n')
  git('add -A')
  git('commit -q -m seed')

  const profile = mkdtempSync(path.join(os.tmpdir(), 'sf-live-profile-'))
  writeFileSync(`${profile}/claude-code.json`, JSON.stringify({ orchestrator: true, cwd: repo }))
  const { app, page } = await launch(profile, { AGENT_DESKTOP_WORKTREES: path.join(home, 'worktrees') })
  await page.locator('textarea:enabled').first().waitFor({ timeout: 20_000 })
  const box = page.locator('textarea:enabled').first()
  await box.fill(
    'Read math.js and test.js in this folder; math.js has two bugs. Do not fix them. Publish a markdown ' +
      'artifact with ui_render_artifact, id "fix-queue", titled "Fix queue": one "### F<n> · <title>" heading ' +
      'per bug, each followed by a self-contained brief for a coding agent in a fenced block opened with four ' +
      'backticks. Offer each bug as an action anchored to its heading, with prompt left out, cwd this folder ' +
      `(${repo}), worktree true. Then stop.`,
  )
  await box.press('Enter')
  const parent = await until(() => sessions(profile)[0]?.id, 20_000)
  await page.evaluate(id => window.desktop.claudeCode.setAutoApprove(id, true), parent)
  const queued = await until(() => (session(profile, parent)?.artifacts ?? []).find(a => a.id === 'fix-queue' && a.actions?.length === 2), 300_000)
  check('the session publishes a fix queue with two actions', !!queued, JSON.stringify(session(profile, parent)?.artifacts))
  await until(() => session(profile, parent)?.status === 'completed', 120_000)

  await page.getByRole('button', { name: /^Fix queue · 2 actions/ }).last().click()
  const panel = page.getByRole('complementary', { name: 'Claude Code Artifact' })
  await (await need(panel.locator('[data-action] button'), 'the action buttons')).click()
  const dialog = page.getByRole('dialog')
  await (await need(dialog.getByRole('button', { name: 'Launch 1' }), 'the launch dialog')).click()
  const task = await until(() => tasksOf(profile, parent)[0], 10_000)
  // The task's own Approve all: its commit asks through Bash.
  await page.evaluate(id => window.desktop.claudeCode.setAutoApprove(id, true), task.id)
  const done = await until(() => ['completed', 'failed'].includes(session(profile, task.id)?.status) && session(profile, task.id), 600_000)
  const worktree = done?.claudeCode.task.worktree
  check('the task ran in a worktree and finished', done?.status === 'completed' && !!worktree?.branch, `${done?.status} ${done?.notice ?? ''}`)
  const ahead = worktree?.path ? Number(execSync(`git rev-list --count ${worktree.commit}..HEAD`, { cwd: worktree.path, encoding: 'utf8' }).trim()) : 0
  check('its task committed a fix on its branch', ahead >= 1, `${ahead} commits`)

  await page.evaluate(id => window.desktop.runs.send(id, { text: 'Which fixes landed? Call ui_list_tasks and answer with each branch and its commit count.' }, {}), parent)
  const listed = await until(async () => {
    const { messages } = await page.evaluate(id => window.desktop.runs.get(id), parent)
    const part = messages.flatMap(m => m.parts).findLast(p => p.type === 'dynamic-tool' && p.toolName === 'ui_list_tasks' && p.state === 'output-available')
    return part?.output
  }, 300_000)
  const reported = Array.isArray(listed) ? listed.find(t => t.id === task.id) : undefined
  check('ui_list_tasks reports the branch and its commits', !!worktree?.branch && reported?.branch === worktree.branch && reported?.commitsAhead >= 1, JSON.stringify(reported ?? listed)?.slice(0, 200))
  await app.close()
})
