// Scenario 2: a single-tenant ask reaches only that tenant, and a follow-up read stays there.
import { checker, start, setupTenants, ask, logLength, toolCalls, latestRun, runMessages, lastAnswer, grounded, visible, TENANTS } from './lib.mjs'

const { check, finish } = checker('2 one tenant')
await finish(async () => {
  const { app, page, profile } = await start()
  await setupTenants(page)

  const first = logLength()
  await ask(page, 'List the open detections on beta.')
  const turn1 = toolCalls(first)
  check('turn 1 reached beta', turn1.some(c => c.origin === TENANTS.beta.origin), JSON.stringify(turn1.map(c => [c.origin, c.name])))
  check('turn 1 reached only beta', turn1.every(c => c.origin === TENANTS.beta.origin))
  check('tool card stamped with tenant and workspace', await visible(page.getByText(`beta · ${TENANTS.beta.workspace}`)))

  const second = logLength()
  await ask(page, 'Which of those are critical? Check the data again.')
  const turn2 = toolCalls(second)
  check('follow-up read stays on beta', turn2.length > 0 && turn2.every(c => c.origin === TENANTS.beta.origin), JSON.stringify(turn2.map(c => [c.origin, c.name])))

  const messages = runMessages(profile, latestRun(profile).id)
  const g = grounded(lastAnswer(messages), messages)
  check('every detection id in the answer came from a tool output', g.ok, JSON.stringify(g))
  await app.close()
})
