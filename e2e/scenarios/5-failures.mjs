// Scenario 5: each failure gives its error, and the run carries on.
import { checker, start, setupTenants, openOptions, closeOptions, ask, send, idle, newChat, logLength, logSince, toolCalls, setMode, need, visible, latestRun, runMessages, lastAnswer, TENANTS } from './lib.mjs'

const partsOf = messages => messages.flatMap(m => m.parts ?? [])
const errors = messages => partsOf(messages).filter(p => p.state === 'output-error').map(p => p.errorText ?? '')
const { check, finish } = checker('5 failures')
await finish(async () => {
  const { app, page, profile } = await start()
  await setupTenants(page)
  const current = () => runMessages(profile, latestRun(profile).id)

  // An unsupported tenant: shown in Options, and its calls fail with the reason.
  await setMode('gamma', 'unsupported')
  await openOptions(page)
  await page.getByRole('button', { name: 'Refresh status' }).click().catch(() => {})
  check('unsupported tenant shown', await visible(page.getByRole('listitem').filter({ hasText: 'gamma' }).getByText('Unsupported')))
  await closeOptions(page)
  let mark = logLength()
  await ask(page, 'List the open detections on gamma.')
  // The model may skip a tenant it's told is unsupported, or call it and get the error.
  check('unsupported: the run names gamma as unavailable', errors(current()).some(e => /gamma/.test(e)) || /gamma/i.test(lastAnswer(current())), JSON.stringify(errors(current())))
  check('unsupported: nothing ran on gamma', toolCalls(mark, 'gamma').length === 0)
  check('unsupported: run carries on', latestRun(profile).status === 'completed', latestRun(profile).status)
  await setMode('gamma', 'normal')

  // A token that expires mid-run is refreshed once, and the call goes through.
  await newChat(page)
  await fetch(`${TENANTS.beta.url}/__expire`)
  mark = logLength()
  await ask(page, 'List the open detections on beta.')
  const betaLog = logSince(mark).filter(e => e.origin === TENANTS.beta.origin)
  check('expired token refreshed', betaLog.some(e => e.route === 'auth.refreshToken'))
  check('expired token: call succeeded', toolCalls(mark, 'beta').length > 0 && latestRun(profile).status === 'completed')

  // A tool the target lacks is refused with an error the model can read.
  await newChat(page)
  await setMode('beta', 'missing-tool', 'detections__top')
  mark = logLength()
  await ask(page, 'On beta, call detections__top grouped by accounts, then tell me what you found.')
  check('missing tool: refused with its name', errors(current()).some(e => /detections__top/.test(e) && /beta/.test(e)), JSON.stringify(errors(current())))
  check('missing tool: never sent to beta', !toolCalls(mark, 'beta').some(c => c.name === 'detections__top'))
  check('missing tool: run carries on', latestRun(profile).status === 'completed')
  await setMode('beta', 'normal')

  // A write flag that differs on the target is held for approval.
  await newChat(page)
  await setMode('beta', 'write-flag', 'detections__summary')
  mark = logLength()
  await send(page, 'On beta, get the summary of detection det-201 with detections__summary.')
  await need(page.getByRole('button', { name: 'Approve' }), 'a held call shown for approval (phase 4)', 300_000)
  check('write-flag: nothing ran before approval', !toolCalls(mark, 'beta').some(c => c.name === 'detections__summary'))
  await page.getByRole('button', { name: 'Approve' }).first().click()
  await idle(page)
  check('write-flag: runs once approved', toolCalls(mark, 'beta').some(c => c.name === 'detections__summary'))
  await setMode('beta', 'normal')

  // A call outside the in-progress step's targets is refused.
  await newChat(page)
  mark = logLength()
  const plan = [{ id: 'read', title: 'List the open detections on alpha', tools: ['detections'], status: 'pending', assignee: 'self', targets: ['beta'] }]
  await ask(page, `Record this plan with the todo tool exactly as given, then run it:\n\n${JSON.stringify(plan)}`)
  check('outside targets: nothing reached alpha', toolCalls(mark, 'alpha').length === 0, JSON.stringify(toolCalls(mark).map(c => [c.origin, c.name])))
  // The router refuses a call outside the targets; the model may also keep to them unasked.
  const triedAlpha = partsOf(current()).some(p => p.type === 'dynamic-tool' && p.input?.plugin === 'alpha')
  check('outside targets: a call on alpha was refused with the step limit', !triedAlpha || errors(current()).some(e => /limited to beta/.test(e)), JSON.stringify(errors(current())))

  // Inside a subagent, a call the target marks as a write is refused (phase 5).
  if (!process.env.SKIP_SUBAGENT) {
    await newChat(page)
    await setMode('beta', 'write-flag', 'detections__list')
    mark = logLength()
    await send(page, '/each @beta List the open detections.')
    const held = await Promise.race([
      idle(page).then(() => false),
      page.getByRole('button', { name: 'Approve' }).first().waitFor({ timeout: 300_000 }).then(() => true),
    ])
    check('subagent write: the parent was not asked to approve', !held)
    check('subagent write: never reached beta', !toolCalls(mark, 'beta').some(c => c.name === 'detections__list'))
    check('subagent write: refused with the tenant named', JSON.stringify(current()).includes("subagents can't make changes"))
    await setMode('beta', 'normal')
    if (held) await page.getByRole('button', { name: 'Deny' }).first().click()
  }

  await app.close()

  // A turn stops at the routed step cap, lowered here to 3 so a plain task reaches it.
  process.env.AGENT_DESKTOP_ROUTED_STEP_CAP = '3'
  const capped = await start()
  await setupTenants(capped.page)
  mark = logLength()
  await ask(capped.page, 'Check the open detections on alpha, then on beta, then on gamma: one tenant per step, each after the previous result.')
  check('step cap: the turn stopped short of gamma', toolCalls(mark, 'gamma').length === 0, JSON.stringify(toolCalls(mark).map(c => c.origin)))
  check('step cap: the run says so', await visible(capped.page.getByText(/Stopped after 3 routed steps\. Send a message to continue\./)))
  await capped.app.close()
})
