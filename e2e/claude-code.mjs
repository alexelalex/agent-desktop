// The app driven by the fake `claude` (e2e/fake-claude.mjs), with throwaway config, worktree and work folders.
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { OUT, launch } from './app.mjs'

export const FAKE = new URL('./fake-claude.mjs', import.meta.url).pathname
export const FAKE_LOG = `${OUT}/fake-claude.log`

/** Launches the app with Claude Code orchestrating through the fake; `profile` reopens an earlier one. */
export async function launchWithClaudeCode({ env = {}, profile, home } = {}) {
  // Outside this repo, so no folder of a test is a work tree of it.
  home ??= realpathSync(mkdtempSync(path.join(os.tmpdir(), 'sf-tasks-')))
  const cwd = path.join(home, 'work')
  mkdirSync(cwd, { recursive: true })
  profile ??= mkdtempSync(path.join(OUT, 'profile-'))
  if (!existsSync(`${profile}/claude-code.json`))
    writeFileSync(`${profile}/claude-code.json`, JSON.stringify({ orchestrator: true, command: FAKE, cwd }))
  const launched = await launch(profile, {
    CLAUDE_CONFIG_DIR: path.join(home, 'config'),
    AGENT_DESKTOP_WORKTREES: path.join(home, 'worktrees'),
    FAKE_CLAUDE_LOG: FAKE_LOG,
    ...env,
  })
  await launched.page.locator('textarea:enabled').first().waitFor({ timeout: 20_000 })
  // Task alerts would otherwise reach the real desktop.
  await notifications(launched.app)
  return { ...launched, home, cwd }
}

/** Sends the first message of a new session from the composer; resolves to its run id. */
export async function startSession(page, profile, prompt) {
  const before = new Set(sessions(profile).map(s => s.id))
  await page.getByRole('button', { name: 'New session', exact: true }).click()
  const box = page.locator('textarea:enabled').first()
  await box.fill(prompt)
  await box.press('Enter')
  const session = await until(() => sessions(profile).find(s => !before.has(s.id)), 15_000)
  if (!session) throw new Error('The session never showed up')
  return session.id
}

/** The app's Claude Code sessions, as last saved. */
export function sessions(profile) {
  try {
    return JSON.parse(readFileSync(`${profile}/claude-code-sessions.json`, 'utf8'))
  } catch {
    return []
  }
}
export const session = (profile, id) => sessions(profile).find(s => s.id === id)
export const tasksOf = (profile, parentId) =>
  sessions(profile).filter(s => s.claudeCode?.task?.parentRunId === parentId)

/** What the fake logged: spawns, inputs and exits. */
export function fakeLog(since = 0) {
  try {
    return readFileSync(FAKE_LOG, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).filter(e => e.at >= since)
  } catch {
    return []
  }
}

/** A transcript's entries, by session id. */
export function transcript(home, sessionId) {
  const root = path.join(home, 'config', 'projects')
  const dir = existsSync(root)
    ? execSync(`ls ${JSON.stringify(root)}`, { encoding: 'utf8' }).split('\n').find(d => d && existsSync(path.join(root, d, `${sessionId}.jsonl`)))
    : undefined
  if (!dir) return []
  return readFileSync(path.join(root, dir, `${sessionId}.jsonl`), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))
}

export async function until(fn, ms = 10_000, step = 100) {
  for (const end = Date.now() + ms; Date.now() < end; ) {
    const value = await fn()
    if (value) return value
    await new Promise(resolve => setTimeout(resolve, step))
  }
  return await fn()
}

/** A repo with two commits, an extra branch, ignored local settings that allow the app's tools, and node_modules. */
export function makeRepo(home, name = 'repo', { ignoreSettings = true } = {}) {
  const dir = path.join(home, name)
  mkdirSync(path.join(dir, '.claude'), { recursive: true })
  mkdirSync(path.join(dir, 'node_modules', 'dep'), { recursive: true })
  const git = command => execSync(`git ${command}`, { cwd: dir, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 'e2e', GIT_AUTHOR_EMAIL: 'e2e@example.com', GIT_COMMITTER_NAME: 'e2e', GIT_COMMITTER_EMAIL: 'e2e@example.com' } })
  git('init -q -b main')
  git('config user.name e2e')
  git('config user.email e2e@example.com')
  // A global gitignore often lists Claude Code's local settings; this repo decides alone.
  if (!ignoreSettings) git('config core.excludesFile /dev/null')
  writeFileSync(path.join(dir, '.gitignore'), `${ignoreSettings ? '.claude/settings.local.json\n' : ''}node_modules\n`)
  writeFileSync(path.join(dir, 'app.js'), 'export const add = (a, b) => a - b\n')
  git('add -A')
  git('commit -q -m first')
  writeFileSync(path.join(dir, 'README.md'), '# repo\n')
  git('add -A')
  git('commit -q -m second')
  git('branch extra HEAD~1')
  writeFileSync(path.join(dir, '.claude', 'settings.local.json'), JSON.stringify({ permissions: { allow: ['mcp__desktop__*'] } }, null, 2))
  writeFileSync(path.join(dir, 'node_modules', 'dep', 'index.js'), '')
  return { dir, git, head: git('rev-parse HEAD').trim(), first: git('rev-parse HEAD~1').trim() }
}

/** Records the titles of desktop notifications. */
export const notifications = app =>
  app.evaluate(({ Notification }) => {
    globalThis.shown = []
    Notification.prototype.show = function () {
      globalThis.shown.push(this.title)
    }
  })
export const shownNotifications = app => app.evaluate(() => globalThis.shown ?? [])

/** Makes the app see its window as focused, showing whatever it shows. */
export const focus = (app, on = true) =>
  app.evaluate(({ BrowserWindow }, on) => {
    const window = BrowserWindow.getAllWindows()[0]
    BrowserWindow.getFocusedWindow = () => (on ? window : null)
  }, on)
