// Scenario 1: first launch and signed out. No model calls.
import { writeFileSync } from 'node:fs'
import { addPlugin, checker, closeOptions, makeOrchestrator, need, oldProfile, openOptions, signOutPlugin, start, visible } from './lib.mjs'

const { check, finish } = checker('1 first launch and signed out')
await finish(async () => {
  // An upgraded profile: the shell renders with no plugins, and old runs are read-only under Earlier.
  const profile = oldProfile()
  writeFileSync(`${profile}/claude-code.json`, JSON.stringify({ orchestrator: false, command: '/nonexistent/claude' }))
  const { app, page } = await start(profile)
  await need(page.getByText('Set up Claude Code or add a plugin in Options to chat.'), 'the no-plugins prompt (phase 1)')
  check('no plugins: prompt to add one', true)
  check('no plugins: composer disabled', await page.getByRole('textbox').isDisabled())
  check('no sign-in screen', !(await page.getByLabel('Password').isVisible()))
  check('no header workspace picker', (await page.getByRole('banner').getByRole('combobox').count()) === 0)
  check('no header Sign out', !(await page.getByRole('banner').getByRole('button', { name: 'Sign out' }).isVisible()))

  const earlier = page.getByRole('navigation', { name: 'Agents and runs' })
  await (await need(earlier.getByRole('button', { name: 'Earlier' }), 'the Earlier section (phase 1)')).click()
  await earlier.getByRole('button', { name: 'Old question about detections' }).click()
  check('old run renders', await visible(page.getByText('An old answer that stays readable.')))
  check('old run is read-only', await visible(page.getByText('This run is from before plugins and is read-only.')))
  check('old agent not carried over', !(await earlier.getByRole('button', { name: 'Old agent' }).isVisible()))

  // The cog opens Plugins.
  await openOptions(page)
  check('cog opens Plugins', await visible(page.getByRole('tab', { name: 'Plugins', selected: true })))

  // With the orchestrator signed out, history stays readable and sending is disabled with the reason.
  await addPlugin(page, 'alpha')
  await makeOrchestrator(page, 'alpha')
  await signOutPlugin(page, 'alpha')
  await closeOptions(page)
  await page.getByRole('button', { name: 'New session' }).click()
  check('signed out: composer disabled', await page.getByRole('textbox').isDisabled())
  check('signed out: reason shown', await visible(page.getByText('Connect the orchestrator in Options to chat.')))
  check('signed out: button to Options', await visible(page.getByRole('button', { name: 'Open Options' })))
  await earlier.getByRole('button', { name: 'Old question about detections' }).click()
  check('signed out: history readable', await visible(page.getByText('An old answer that stays readable.')))
  await app.close()
})
