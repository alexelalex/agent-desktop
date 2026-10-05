// Scenario 8: each token reaches only its own origin, across a cross-tenant ask and a fan-out.
import { checker, start, setupTenants, ask, newChat, logLength, logSince, tokensStayHome, TENANTS } from './lib.mjs'

const { check, finish } = checker('8 token isolation')
await finish(async () => {
  const { app, page } = await start()
  const mark = logLength()
  await setupTenants(page)
  await ask(page, 'How many open detections does each of alpha, beta and gamma have?')
  await newChat(page)
  await ask(page, '/each @all List the open critical detections.')

  const entries = logSince(mark)
  const origins = new Set(entries.filter(e => e.route === 'tool').map(e => e.origin))
  check('calls reached all three tenants', ['alpha', 'beta', 'gamma'].every(n => origins.has(TENANTS[n].origin)), JSON.stringify([...origins]))
  const home = tokensStayHome(entries)
  check('every token stayed on its own origin', home.ok, JSON.stringify(home.strays.slice(0, 5)))
  check('no request was refused as unauthorized', !entries.some(e => e.status === 401), JSON.stringify(entries.filter(e => e.status === 401).slice(0, 3)))
  await app.close()
})
