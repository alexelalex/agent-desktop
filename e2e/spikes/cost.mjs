// Token cost of routed work: the routing overhead per parent step, a parent's read and audit on
// Sonnet, and one fan-out child auditing one tenant on Haiku, with small and realistic tool
// outputs. Uses the routing eval's contract. Needs AWS creds in the env.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { WORKTREE, model, system, entries, groupOf, makeTools, converse } from './routing-eval.mjs'

const req = createRequire(`${WORKTREE}/ms_ai/package.json`)
const { generateText, dynamicTool, jsonSchema, stepCountIs } = await import(req.resolve('ai-v7'))
const { createAmazonBedrock } = await import(req.resolve('@ai-sdk/amazon-bedrock-v7'))
const haiku = createAmazonBedrock({ region: 'us-east-1' })('us.anthropic.claude-haiku-4-5-20251001-v1:0')
const RUNS = Number(process.env.RUNS ?? 3)

// USD per 1M tokens (shared/ai/models-catalog.json); v7's cache points are 5-minute ones.
const PRICE = { sonnet: [3, 15], haiku: [1, 5] }
const sum = usages => usages.reduce((a, u) => ({
  noCache: a.noCache + u.inputTokenDetails.noCacheTokens,
  cacheRead: a.cacheRead + u.inputTokenDetails.cacheReadTokens,
  cacheWrite: a.cacheWrite + u.inputTokenDetails.cacheWriteTokens,
  output: a.output + u.outputTokens,
}), { noCache: 0, cacheRead: 0, cacheWrite: 0, output: 0 })
const usd = (u, [inp, out]) => (u.noCache * inp + u.cacheRead * inp * 0.1 + u.cacheWrite * inp * 1.25 + u.output * out) / 1e6
const k = n => `${(n / 1000).toFixed(1)}k`
const row = (label, runs, price) => {
  const us = runs.map(r => sum(r.usage)), cost = us.map(u => usd(u, price))
  const mean = f => us.reduce((a, u) => a + f(u), 0) / us.length
  console.log(`${label}: $${(cost.reduce((a, b) => a + b) / cost.length).toFixed(3)} mean ($${Math.min(...cost).toFixed(3)}–$${Math.max(...cost).toFixed(3)})` +
    `, steps ${runs.map(r => r.steps).join('/')}, uncached in ${k(mean(u => u.noCache))}, cache read ${k(mean(u => u.cacheRead))}, cache write ${k(mean(u => u.cacheWrite))}, out ${k(mean(u => u.output))}`)
}

// 1. The fixed prefix one parent step carries, with and without routing.
const ask = { role: 'user', content: 'Reply with just "ok".' }
const detectionsTools = entries.filter(e => groupOf(e.name) === 'detections').map(e => e.name)
const routed = makeTools([], { loaded: new Set() })
const plain = { ...routed }
for (const e of entries) plain[e.name] = dynamicTool({ description: e.description, inputSchema: jsonSchema(e.inputSchema), execute: async () => ({}) })
const prefix = async (sys, tools, active) => (await generateText({ model, system: sys, messages: [ask], tools, activeTools: active, maxOutputTokens: 20 })).totalUsage.inputTokens
const base = ['loadToolGroup', 'todo', 'delegate']
for (const [label, active] of [['first step', base], ['detections group loaded', [...base, ...detectionsTools]]]) {
  const [withRouting, without] = [await prefix(system, routed, active), await prefix([system[0]], plain, active)]
  console.log(`prefix, ${label}: ${withRouting} tokens routed, ${without} without, +${withRouting - without}`)
}

// 2. The parent's side of a read and of an audit, as the routing eval runs them.
for (const [label, turns] of RUNS === 0 ? [] : [
  ['parent, one read', ['List the open critical detections on acme.']],
  ['parent, audit of 3 ready tenants', ['Audit every tenant for open critical detections and give me a per-tenant table.']],
]) {
  const runs = []
  for (let i = 0; i < RUNS; i++) runs.push(await converse(turns))
  row(label, runs, PRICE.sonnet)
}

// 3. One child, as ms_ai's delegate runs it: Haiku, no cache point, read tools only, 15 steps.
const text = n => 'The role assumed a new session from an unfamiliar ASN and attached an inline policy that grants iam:PassRole on all resources. '.repeat(n)
const record = i => ({
  _id: `66f1c0de${String(i).padStart(16, '0')}`, timestamp: new Date(Date.now() - i * 3600e3).toISOString(), activity_type: 'IAM Policy Change',
  account_id: ['123456789012'], anomaly_severity: i % 4 === 0 ? 4 : 3, source: 'aws', service: 'iam', status: 'open',
  resource_id: `arn:aws:iam::123456789012:role/svc-deployer-${i}`, resource_type: 'AWS::IAM::Role', resource_name: `svc-deployer-${i}`,
  mitre_categories: ['Privilege Escalation', 'Persistence'], signal_types: ['suspicious_identity_activity'],
  session_list: [{ ip_address: `203.0.113.${i}`, access_key: `AKIAEXAMPLE${String(i).padStart(9, '0')}`, user_agent: 'aws-cli/2.15.0 Python/3.11.6 Darwin/23.1.0 exe/x86_64', country_code_iso: 'US', mfa: false }],
  triage_summary: text(2), triage_reasoning: text(5), triage_confidence: 'Medium', triage_recommended_verdict: 'Suspicious',
  triage_status: 'Completed', triage_suggested_severity: i % 4 === 0 ? 'Critical' : 'High', acknowledged: false,
})
const OUTPUTS = {
  small: () => ({ total_count: 3, results: [record(4), record(8), record(12)].map(({ _id, timestamp, anomaly_severity, resource_name, status }) => ({ _id, timestamp, anomaly_severity, resource_name, status })) }),
  realistic: args => {
    const all = Array.from({ length: 40 }, (_, i) => record(i + 1)).filter(d => args?.anomaly_severity === undefined || String(d.anomaly_severity) === String(args.anomaly_severity))
    return { total_count: all.length, results: all.slice(args?.skip ?? 0, (args?.skip ?? 0) + Math.min(args?.limit ?? 50, 50)) }
  },
}
const delegatePrompt = readFileSync(`${WORKTREE}/ms_ai/src/prompts/chat-v7-delegate.md`, 'utf8').replace('{{today}}', '2026-09-28')
const readGroups = ['detections', 'inventory']
const child = async size => {
  const tools = {}
  for (const e of entries.filter(e => readGroups.includes(groupOf(e.name)) && !e.needsApproval)) {
    tools[e.name] = dynamicTool({ description: e.description, inputSchema: jsonSchema(e.inputSchema), execute: async args => (e.name === 'detections__list' ? OUTPUTS[size](args) : { total_count: 0, results: [] }) })
  }
  const r = await generateText({
    model: haiku, system: delegatePrompt, tools, stopWhen: stepCountIs(15), maxOutputTokens: 8_000,
    messages: [{ role: 'user', content: 'Audit every tenant for open critical detections and give me a per-tenant table.' }, { role: 'user', content: 'Audit acme: open critical detections' }],
  })
  return { usage: [r.totalUsage], steps: r.steps.length }
}
for (const size of RUNS === 0 ? [] : ['small', 'realistic']) {
  const runs = []
  for (let i = 0; i < RUNS; i++) runs.push(await child(size))
  row(`child, ${size} outputs (${k(JSON.stringify(OUTPUTS[size]({})).length)} chars per full list)`, runs, PRICE.haiku)
}
