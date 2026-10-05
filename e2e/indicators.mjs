// Time and cost indicators on the rig, for the success targets (docs/plugins-program.md):
// a cross-tenant ask against the same ask sent to each tenant in turn, and a 4-tenant audit
// with its cost and its children's step counts. Canned data: these indicate, they don't gate.
import { start, setupTenants, ask, newChat, latestRun, runMessages } from './scenarios/lib.mjs'

const RUNS = Number(process.env.RUNS ?? 3)
// USD per 1M tokens (shared/ai/models-catalog.json); cache writes at the 5-minute rate.
const PRICE = { sonnet: [3, 15], haiku: [1, 5] }
const median = xs => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

async function timed(page, text) {
  const t = Date.now()
  await ask(page, text)
  return (Date.now() - t) / 1000
}

// Usage the server attached to each response, the children's included.
function usageOf(messages) {
  const entries = []
  for (const message of messages) {
    for (const usage of Object.values(message.metadata?.usage ?? {})) entries.push(usage)
    for (const part of message.parts ?? []) {
      for (const run of part.output?.runs ?? []) if (run.message) entries.push(...usageOf([run.message]))
    }
  }
  return entries
}
function dollars(entries) {
  return entries.reduce((sum, u) => {
    const [input, output] = PRICE[u.model] ?? PRICE.sonnet
    const d = u.inputTokenDetails ?? {}
    return sum + ((d.noCacheTokens ?? 0) * input + (d.cacheReadTokens ?? 0) * input * 0.1 + (d.cacheWriteTokens ?? 0) * input * 1.25 + (u.outputTokens ?? 0) * output) / 1e6
  }, 0)
}
const childSteps = messages =>
  messages.flatMap(m => m.parts ?? []).flatMap(p => p.output?.runs ?? [])
    .filter(r => r.message).map(r => r.message.parts.filter(p => p.type === 'step-start').length)

const { app, page, profile } = await start()
await setupTenants(page, { ready: ['alpha', 'beta', 'gamma', 'delta'] })
const routed = [], inTurn = [], audits = []
for (let i = 0; i < RUNS; i++) {
  await newChat(page)
  routed.push(await timed(page, 'How many open detections does each of alpha, beta and gamma have?'))
  await newChat(page)
  let total = 0
  for (const name of ['alpha', 'beta', 'gamma']) total += await timed(page, `How many open detections does ${name} have?`)
  inTurn.push(total)
  await newChat(page)
  const seconds = await timed(page, '/each @all Audit open critical detections and give me a per-tenant table.')
  const messages = runMessages(profile, latestRun(profile).id)
  audits.push({ seconds, cost: dollars(usageOf(messages)), steps: childSteps(messages) })
}
await app.close()

console.log(`cross-tenant ask, 3 tenants: median ${median(routed).toFixed(1)} s (${routed.map(s => s.toFixed(1)).join(', ')})`)
console.log(`same ask to each tenant in turn: median ${median(inTurn).toFixed(1)} s (${inTurn.map(s => s.toFixed(1)).join(', ')})`)
console.log(`ratio: ${(median(routed) / median(inTurn)).toFixed(2)} (target at most 0.5)`)
console.log(`4-tenant audit: median ${median(audits.map(a => a.seconds)).toFixed(1)} s, cost median $${median(audits.map(a => a.cost)).toFixed(3)} (${audits.map(a => `$${a.cost.toFixed(3)}`).join(', ')})`)
console.log(`children's steps: ${audits.map(a => a.steps.join('/')).join('; ')}`)
