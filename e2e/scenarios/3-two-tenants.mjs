// Scenario 3: one ask reaches two tenants, and a later turn switches tenant.
import { checker, start, setupTenants, ask, logLength, toolCalls, visible, TENANTS } from './lib.mjs'

const { check, finish } = checker('3 two tenants')
await finish(async () => {
  const { app, page } = await start()
  await setupTenants(page)

  const first = logLength()
  await ask(page, 'Compare the number of open detections between alpha and beta.')
  const turn1 = toolCalls(first)
  const origins = new Set(turn1.map(c => c.origin))
  check('one ask reaches alpha and beta', origins.has(TENANTS.alpha.origin) && origins.has(TENANTS.beta.origin), JSON.stringify([...origins]))
  check('and not gamma', !origins.has(TENANTS.gamma.origin))
  check('run header lists both tenants', await visible(page.getByText(/Tenants: .*alpha.*beta|Tenants: .*beta.*alpha/)))

  const second = logLength()
  await ask(page, "Now list gamma's open detections.")
  const turn2 = toolCalls(second)
  check('later turn switches to gamma', turn2.length > 0 && turn2.every(c => c.origin === TENANTS.gamma.origin), JSON.stringify(turn2.map(c => [c.origin, c.name])))
  await app.close()
})
