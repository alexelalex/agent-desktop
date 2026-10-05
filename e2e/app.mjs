// Launches the built app under Playwright with a throwaway profile.
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { _electron } from 'playwright'

export const ROOT = new URL('..', import.meta.url).pathname
export const OUT = new URL('./.out', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

// In Node, the electron package's export is the path to its binary.
const electron = createRequire(import.meta.url)('electron')

export async function launch(profile = mkdtempSync(path.join(OUT, 'profile-')), env = {}) {
  const app = await _electron.launch({
    executablePath: electron,
    args: [ROOT, `--user-data-dir=${profile}`],
    cwd: ROOT,
    env: { ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== 'ELECTRON_RUN_AS_NODE')), ...env },
  })
  const page = await app.firstWindow()
  page.on('console', m => m.type() === 'error' && console.log('[renderer]', m.text()))
  return { app, page, profile }
}

/** Adds a plugin in Options and waits for it to be ready; the first plugin orchestrates. */
export async function signIn(page, instance = 'http://localhost:2034', name = new URL(instance).host) {
  await page.getByRole('button', { name: 'Options', exact: true }).click()
  await page.getByRole('button', { name: 'Add plugin' }).click()
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Instance URL').fill(instance)
  await page.getByLabel('E-mail').fill('dev@example.com')
  await page.getByLabel('Password').fill('pw')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByRole('dialog', { name: 'Options' }).getByRole('listitem').filter({ hasText: name }).getByText('Ready').waitFor({ timeout: 15_000 })
  await page.keyboard.press('Escape')
  await ready(page)
}

/** Waits until the composer takes input: the orchestrator is ready. */
export const ready = page => page.locator('textarea:enabled').first().waitFor({ timeout: 20_000 })

// The stub's request log. A suite checks that its catalog tool calls reached a stub, since a
// call that 401s elsewhere fails no other check.
const stubLog = () => {
  try {
    return readFileSync(`${OUT}/stub-calls.log`, 'utf8').split('\n').filter(Boolean)
  } catch {
    return []
  }
}
export const stubLogLength = () => stubLog().length
export const stubToolCalls = mark => stubLog().slice(mark).map(line => JSON.parse(line)).filter(e => e.route === 'tool')
