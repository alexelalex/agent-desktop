// Options: plugins and their status, the orchestrator label, groups, and removing a plugin.
import { readFileSync } from 'node:fs'
import { OUT, launch, ready, signIn } from '../app.mjs'

const results = []
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`) }
const visible = locator => locator.first().waitFor({ timeout: 10_000 }).then(() => true, () => false)
const log = () => readFileSync(`${OUT}/stub-calls.log`, 'utf8').trim().split('\n').map(l => JSON.parse(l))
const dialog = page => page.getByRole('dialog', { name: 'Options' })
const row = (page, name) => dialog(page).getByRole('listitem').filter({ hasText: name })
const openOptions = page => page.getByRole('button', { name: 'Options', exact: true }).click()

for (const port of [2034, 2035, 2036]) await fetch(`http://localhost:${port}/__mode?mode=normal`)
let { app, page, profile } = await launch()

// Three stub tenants, each ready; the first one orchestrates.
await signIn(page, 'http://localhost:2034', 'alpha')
await signIn(page, 'http://localhost:2035', 'beta')
await signIn(page, 'http://localhost:2036', 'gamma')
await openOptions(page)
for (const name of ['alpha', 'beta', 'gamma']) check(`${name} ready`, await visible(row(page, name).getByText('Ready')))
check('the first plugin orchestrates', await visible(row(page, 'alpha').getByText('Orchestrator', { exact: true })))
check('each plugin has its default workspace', await visible(row(page, 'beta').getByRole('combobox', { name: 'Default workspace' }).getByText('Beta production')))

// An unsupported tenant shows as unsupported after a status refresh.
await fetch('http://localhost:2036/__mode?mode=unsupported')
await dialog(page).getByRole('button', { name: 'Refresh status' }).click()
check('unsupported tenant shown', await visible(row(page, 'gamma').getByText('Unsupported')))
await fetch('http://localhost:2036/__mode?mode=normal')
await dialog(page).getByRole('button', { name: 'Refresh status' }).click()

// Moving the orchestrator label moves where /chat goes.
await row(page, 'beta').getByRole('button', { name: 'Make orchestrator' }).click()
check('label moves', await visible(row(page, 'beta').getByText('Orchestrator', { exact: true })) && !(await row(page, 'alpha').getByText('Orchestrator', { exact: true }).isVisible()))
await page.keyboard.press('Escape')
const mark = log().length
await page.getByRole('textbox').fill('Reply with just the word ok.')
await page.getByRole('textbox').press('Enter')
await page.getByRole('button', { name: 'Stop', exact: true }).waitFor({ timeout: 20_000 }).catch(() => {})
await page.getByRole('button', { name: 'Submit' }).waitFor({ timeout: 120_000 })
const chats = log().slice(mark).filter(e => e.route === 'chat')
check('/chat went to the new orchestrator', chats.length > 0 && chats.every(e => e.origin === 2035), JSON.stringify(chats.map(e => e.origin)))

// Groups: @all is built in; @prod saves and survives a restart.
await openOptions(page)
await dialog(page).getByRole('tab', { name: 'Groups' }).click()
check('@all lists every plugin', await visible(dialog(page).getByRole('listitem').filter({ hasText: '@all' }).getByText('alpha, beta, gamma')))
await dialog(page).getByRole('button', { name: 'New group' }).click()
await dialog(page).getByLabel('Group name').fill('prod')
await dialog(page).getByLabel('beta').check()
await dialog(page).getByLabel('gamma').check()
await dialog(page).getByRole('button', { name: 'Save group' }).click()
check('@prod saved', await visible(dialog(page).getByRole('listitem').filter({ hasText: '@prod' }).getByText('beta, gamma')))
await app.close()
;({ app, page } = await launch(profile))
await ready(page)
await openOptions(page)
await dialog(page).getByRole('tab', { name: 'Groups' }).click()
check('@prod reloads', await visible(dialog(page).getByRole('listitem').filter({ hasText: '@prod' }).getByText('beta, gamma')))

// Removing a plugin keeps its runs readable and warns where it's named.
await dialog(page).getByRole('tab', { name: 'Plugins' }).click()
await row(page, 'beta').getByRole('button', { name: 'Remove' }).click()
check('beta removed', await row(page, 'beta').waitFor({ state: 'detached', timeout: 10_000 }).then(() => true, () => false))
await dialog(page).getByRole('tab', { name: 'Groups' }).click()
check('group warns about the removed plugin', await visible(dialog(page).getByRole('listitem').filter({ hasText: '@prod' }).getByText(/removed/)))
await page.keyboard.press('Escape')
await page.getByRole('button', { name: 'Reply with just the word ok.' }).first().click()
check('runs stay readable', await visible(page.getByText('Reply with just the word ok.')))

await page.screenshot({ path: `${OUT}/plugins.png` })
await app.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
