import { mkdtempSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { OUT, launch, ready, signIn } from '../app.mjs';
import { FAKE, launchWithClaudeCode, sessions, startSession } from '../claude-code.mjs';
const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) process.exitCode = 1 }

// No plugins and no Claude Code: nothing can answer.
const bare = mkdtempSync(path.join(OUT, 'profile-'))
writeFileSync(`${bare}/claude-code.json`, JSON.stringify({ orchestrator: false, command: '/nonexistent/claude' }))
const { app, page, profile } = await launch(bare)
check('window title', (await page.title()) === 'Agent Desktop')
await page.getByText('Set up Claude Code or add a plugin in Options to chat.').waitFor({ timeout: 10000 }); check('shell renders with no plugins', true)
check('composer disabled with no plugins or Claude Code', await page.locator('textarea').first().isDisabled())
const userData = await app.evaluate(({ app }) => app.getPath('userData'))
check(`userData is the test profile (${userData})`, userData === profile)
await page.getByRole('button', { name: 'Options', exact: true }).click()
await page.getByRole('button', { name: 'Add plugin' }).click()
check('default instance', (await page.getByLabel('Instance URL').inputValue()) === 'https://app.streamsec.io')
await page.keyboard.press('Escape')
await signIn(page)
await page.getByRole('button', { name: 'New session' }).waitFor({ timeout: 10000 })
check('signed in shell', true)
await page.screenshot({ path: `${OUT}/smoke.png` })
await app.close()

// A session saved before plugins opens signed in, as the orchestrator, on the same workspace.
const login = await fetch('http://localhost:2034/trpc/auth.login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'dev@example.com', password: 'pw' }) })
const { access_token, refresh_token } = (await login.json()).result.data
const old = mkdtempSync(path.join(OUT, 'profile-'))
writeFileSync(`${old}/session.json`, JSON.stringify({ baseUrl: 'http://localhost:2034', accessToken: access_token, refreshToken: refresh_token, workspaceId: 'ws-second' }))
const migrated = await launch(old)
check('old session migrates signed in', await ready(migrated.page).then(() => true, () => false))
await migrated.page.getByRole('button', { name: 'Options', exact: true }).click()
const row = migrated.page.getByRole('dialog', { name: 'Options' }).getByRole('listitem').filter({ hasText: 'localhost:2034' })
check('old session is the orchestrator', await row.getByText('Orchestrator', { exact: true }).isVisible())
check('old session keeps its workspace', await row.getByRole('combobox', { name: 'Default workspace' }).getByText('Second workspace').waitFor({ timeout: 10000 }).then(() => true, () => false))
await migrated.app.close()

// No plugins, Claude Code found but not picked: chats run in it.
const solo = mkdtempSync(path.join(OUT, 'profile-'))
writeFileSync(`${solo}/claude-code.json`, JSON.stringify({ orchestrator: false, command: FAKE }))
const alone = await launchWithClaudeCode({ profile: solo })
check('no plugins: composer enabled with Claude Code', true)
const soloRun = await startSession(alone.page, solo, 'Hello without plugins').catch(() => undefined)
check('no plugins: chat starts a Claude Code session', !!soloRun && sessions(solo).some(s => s.id === soloRun))
await alone.app.close()
