// Scenario 4: writes name their tenant, wait for an approval that shows it, and /approve works per tenant.
import { checker, start, setupTenants, send, ask, idle, newChat, logLength, toolCalls, need, visible, setMode, TENANTS } from './lib.mjs'

const writes = (start, tenant) => toolCalls(start, tenant).filter(c => /setStatus|comment__create/.test(c.name))
const { check, finish } = checker('4 cross-tenant writes')
await finish(async () => {
  const { app, page } = await start()
  await setupTenants(page)

  // An unnamed write never runs.
  let mark = logLength()
  await ask(page, 'Set detection det-201 to closed.')
  const approveOpen = await page.getByRole('button', { name: 'Approve' }).isVisible()
  if (approveOpen) {
    check('an unnamed write names its tenant before approval', await visible(page.getByText(/changes data in (alpha|beta|gamma) ·/)))
    await page.getByRole('button', { name: 'Deny' }).first().click()
    await idle(page)
  }
  check('an unnamed write ran nowhere', writes(mark).length === 0, JSON.stringify(writes(mark).map(c => [c.origin, c.name])))

  // A named write shows its tenant; denying it runs nothing.
  await newChat(page)
  mark = logLength()
  await send(page, 'Set detection det-201 on beta to closed; det-201 is its id.')
  await need(page.getByRole('button', { name: 'Approve' }), 'an approval card', 300_000)
  check('approval card shows the tenant and workspace', await visible(page.getByText(`beta · ${TENANTS.beta.workspace}`)))
  await page.getByRole('button', { name: 'Deny' }).first().click()
  await idle(page)
  check('a denied write runs nothing', writes(mark).length === 0)

  // Approved, it runs once, on beta only.
  await newChat(page)
  mark = logLength()
  await send(page, 'Set detection det-201 on beta to closed; det-201 is its id.')
  await need(page.getByRole('button', { name: 'Approve' }), 'an approval card', 300_000)
  await page.getByRole('button', { name: 'Approve' }).first().click()
  await idle(page)
  check('an approved write runs on beta', writes(mark, 'beta').length === 1, JSON.stringify(writes(mark).map(c => [c.origin, c.name])))
  check('and nowhere else', writes(mark).every(c => c.origin === TENANTS.beta.origin))

  // Two tenants waiting: a bare /approve is refused; /approve @beta answers beta's only.
  // The model makes one change at a time, so the two waits come from calls the tenants
  // themselves count as changes, held by the app.
  await newChat(page)
  await setMode('beta', 'write-flag', 'detections__summary')
  await setMode('gamma', 'write-flag', 'detections__summary')
  mark = logLength()
  const held = (start, tenant) => toolCalls(start, tenant).filter(c => c.name === 'detections__summary')
  await send(page, 'Get the summary of det-201 on beta and of det-301 on gamma with detections__summary, both calls in the same step.')
  await need(page.getByRole('button', { name: 'Approve' }).nth(1), 'two approval cards', 300_000)
  await page.getByRole('textbox').fill('/approve')
  await page.getByRole('textbox').press('Enter')
  check('bare /approve refused with two tenants pending', await visible(page.getByText(/\/approve @beta|\/approve @gamma/)))
  check('bare /approve ran nothing', held(mark).length === 0)
  await page.getByRole('textbox').fill('/approve @beta')
  await page.getByRole('textbox').press('Enter')
  await page.waitForTimeout(3000)
  check('/approve @beta runs beta only', held(mark, 'beta').length === 1 && held(mark, 'gamma').length === 0, JSON.stringify(held(mark).map(c => c.origin)))
  await page.getByRole('textbox').fill('/deny @gamma')
  await page.getByRole('textbox').press('Enter')
  await idle(page)
  check('/deny @gamma runs nothing on gamma', held(mark, 'gamma').length === 0)
  await setMode('beta', 'normal')
  await setMode('gamma', 'normal')
  await app.close()
})
