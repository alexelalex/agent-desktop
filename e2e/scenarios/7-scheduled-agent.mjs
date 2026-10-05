// Scenario 7: an @all agent covers a newly added plugin on its next run, visibly.
import { checker, start, setupTenants, addPlugin, closeOptions, ask, logLength, toolCalls, need, visible, captureNotifications, TENANTS } from './lib.mjs'

const nav = page => page.getByRole('navigation', { name: 'Agents and runs' })
const { check, finish } = checker('7 scheduled agent')
await finish(async () => {
  const { app, page } = await start()
  const shown = await captureNotifications(app)
  await setupTenants(page, { ready: ['alpha', 'beta'] })

  // A fan-out chat saved as an agent keeps @all as its step targets.
  await ask(page, '/each @all Count the open detections.')
  await page.getByRole('textbox').fill('/template')
  await page.getByRole('textbox').press('Enter')
  await page.getByRole('dialog').getByRole('textbox').first().fill('Tenant counter')
  check('template keeps @all as a chip', await visible(page.getByRole('dialog').getByText('@all')))
  await page.getByRole('button', { name: 'Save template' }).click()
  await nav(page).getByRole('button', { name: 'Tenant counter', exact: true }).click()

  // A new plugin joins @all, and the dashboard shows it before the next run.
  await addPlugin(page, 'gamma')
  await closeOptions(page)
  await nav(page).getByRole('button', { name: 'Tenant counter', exact: true }).click()
  await need(page.getByText(/Next run covers/), 'the coverage list on the dashboard (phase 6)')
  check('dashboard lists the new plugin', await visible(page.getByText(new RegExp(`Next run covers.*gamma · ${TENANTS.gamma.workspace}`))))

  // Its next scheduled run covers gamma, and a notification names it.
  await page.getByRole('button', { name: 'Add trigger' }).click()
  await page.getByRole('combobox', { name: 'Trigger kind' }).click()
  await page.getByRole('option', { name: 'On a schedule' }).click()
  await page.getByLabel('Schedule (cron, local time)').fill('*/20 * * * * *')
  await page.getByRole('button', { name: 'Add trigger' }).last().click()
  const mark = logLength()
  for (let i = 0; i < 150 && toolCalls(mark, 'gamma').length === 0; i++) await page.waitForTimeout(2000)
  check('scheduled run covers gamma', toolCalls(mark, 'gamma').length > 0)
  // The notification comes when the run completes.
  let titles = []
  for (let i = 0; i < 90 && !titles.some(t => /gamma/.test(t)); i++) {
    await page.waitForTimeout(2000)
    titles = await shown()
  }
  check('a notification names gamma', titles.some(t => /gamma/.test(t) && /first time/i.test(t)), JSON.stringify(titles))
  await app.close()
})
