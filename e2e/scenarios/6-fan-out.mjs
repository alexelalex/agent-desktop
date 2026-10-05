// Scenario 6: /each fans out one child per ready tenant; the parent builds on the reports.
// PROMPT=written runs it as a written prompt, for phase 5's exit before /each exists.
import { checker, start, setupTenants, ask, send, newChat, logLength, logSince, toolCalls, need, visible, latestRun, runMessages, runArtifacts, lastAnswer, grounded, TENANTS } from './lib.mjs'

const AUDIT = 'Audit open critical detections and publish one cross-tenant artifact with a table per tenant.'
const PROMPT = process.env.PROMPT === 'written'
  ? `Plan a subagent step that audits every tenant in @all for open critical detections, one subagent per tenant, then combine the reports and publish one cross-tenant artifact with a table per tenant.`
  : `/each @all ${AUDIT}`

const { check, finish } = checker('6 fan-out')
await finish(async () => {
  const { app, page, profile } = await start()
  await setupTenants(page, { signedOut: ['delta'] })

  const mark = logLength()
  await ask(page, PROMPT)
  for (const name of ['alpha', 'beta', 'gamma']) {
    check(`child row for ${name}`, await visible(page.getByText(`${name} · ${TENANTS[name].workspace}`)))
  }
  check('signed-out tenant skipped with its reason', await visible(page.getByText(/delta.*Skipped.*sign/i)))
  for (const name of ['alpha', 'beta', 'gamma']) {
    const calls = toolCalls(mark, name)
    check(`${name}'s child reached ${name}`, calls.length > 0, String(calls.length))
  }
  check('nothing reached delta', toolCalls(mark, 'delta').length === 0)
  const run = latestRun(profile)
  check('one artifact published', (run.artifacts ?? []).length === 1, JSON.stringify(run.artifacts))

  const messages = runMessages(profile, run.id)
  const parent = messages.filter(m => m.role === 'assistant').flatMap(m => m.parts)
  const delegated = parent.findIndex(p => p.toolName === 'delegate')
  const ownReads = parent.slice(delegated + 1).filter(p => p.type === 'dynamic-tool' && !['todo', 'delegate', 'loadToolGroup', 'artifacts_create', 'artifacts_update'].includes(p.toolName))
  check('parent made no data read of its own after delegating', delegated >= 0 && ownReads.length === 0, ownReads.map(p => p.toolName).join(', '))
  const plans = parent.filter(p => p.toolName === 'todo').map(p => p.input?.steps ?? [])
  const fanStep = plans.flat().find(s => s.assignee === 'subagent')
  check('fan-out step keeps its targets after a plan update', !!fanStep && plans.every(steps => steps.filter(s => s.id === fanStep.id).every(s => (s.targets ?? []).length > 0 || s.carried)), JSON.stringify(plans))
  // The report is the answer and the artifact it published.
  const g = grounded(`${lastAnswer(messages)}\n${runArtifacts(profile, run.id)}`, messages)
  check('every detection id in the report came from a tool output', g.ok, JSON.stringify(g))

  // Stop aborts every child.
  await newChat(page)
  const stopMark = logLength()
  await send(page, PROMPT)
  await need(page.getByText(`beta · ${TENANTS.beta.workspace}`), 'fan-out rows (phase 5)', 120_000)
  await page.getByRole('button', { name: 'Stop', exact: true }).click()
  await page.waitForTimeout(8000)
  const afterStop = logSince(stopMark).filter(e => e.route === 'tool' && e.t > Date.now() - 5000)
  check('Stop aborts every child', afterStop.length === 0, String(afterStop.length))
  await app.close()
})
