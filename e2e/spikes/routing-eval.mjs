// L2.4: does the model route well under the proposed contract? Runs scripted scenarios on
// Bedrock with a plugins section, `plugin`/`workspace` fields and step `targets`, against a fake
// router with canned per-plugin data. Needs AWS creds in the env (aws configure export-credentials).
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

export const WORKTREE = process.env.LIGHTLYTICS_WORKTREE ?? `${process.env.HOME}/git/lightlytics-worktrees/ai-sdk-v7-demo-chat`
const req = createRequire(`${WORKTREE}/ms_ai/package.json`)
const { generateText, dynamicTool, jsonSchema, stepCountIs } = await import(req.resolve('ai-v7'))
const { createAmazonBedrock } = await import(req.resolve('@ai-sdk/amazon-bedrock-v7'))
export const model = createAmazonBedrock({ region: 'us-east-1' })('us.anthropic.claude-sonnet-4-6')

export const PLUGINS = [
  { id: 'staging', host: 'app.staging.lightops.io', status: 'ready', workspaces: ['Default', 'Dev'] },
  { id: 'acme', host: 'acme.streamsec.io', status: 'ready', workspaces: ['Production', 'Sandbox'] },
  { id: 'prod', host: 'app.streamsec.io', status: 'ready', workspaces: ['Main'] },
  { id: 'globex', host: 'globex.streamsec.io', status: 'signed out', workspaces: ['Default'] },
]
const GROUPS = { '@all': PLUGINS.map(p => p.id), '@prod': ['acme', 'prod', 'globex'] }
const IDS = PLUGINS.map(p => p.id)

// The proposed system section: plugin list, groups and routing rules.
const pluginSection = `## Tenants

You work across several Stream Security tenants, called plugins. Every API tool takes an optional \`plugin\`, and an optional \`workspace\` inside it.
- Name \`plugin\` whenever the user's request concerns a specific tenant. For a read, leaving it out keeps working on the tenant you used last.
- A change must always name \`plugin\`, even when the tenant is obvious from the conversation.
- Leave \`workspace\` out for the plugin's default workspace, or the one you used last there.
- Plugins that aren't ready can't be called. Say which ones you skipped, and why.
- For deep work on each of several tenants, such as an audit, plan a subagent step with \`targets\` set to the plugins or a group. \`delegate\` then runs one subagent per plugin, each on its own tenant, and returns one report per plugin. A step of your own with \`targets\` limits your calls to those plugins while it is in progress.
- After a fan-out, build on the reports. If a report lacks something, delegate a follow-up for that tenant instead of re-reading the data yourself.

Plugins:
${PLUGINS.map(p => `- ${p.id}: ${p.host}, ${p.status}, workspaces ${p.workspaces.map((w, i) => (i === 0 ? `${w} (default)` : w)).join(', ')}`).join('\n')}

Groups: ${Object.entries(GROUPS).map(([g, m]) => `${g} (${m.join(', ')})`).join('; ')}`

const base = readFileSync(`${WORKTREE}/ms_ai/src/prompts/chat-v7.md`, 'utf8').replace('{{today}}', '2026-09-28')
export const system = [
  { role: 'system', content: base, providerOptions: { bedrock: { cachePoint: { type: 'default' } } } },
  { role: 'system', content: pluginSection },
]

// Canned per-plugin data; det-101 exists only on acme.
const DATA = {
  staging: [{ id: 'det-s1', severity: 'critical', status: 'open', name: 'Public RDS snapshot' }, { id: 'det-s2', severity: 'high', status: 'open', name: 'Unused admin key' }],
  acme: [{ id: 'det-101', severity: 'critical', status: 'open', name: 'Root login without MFA' }, { id: 'det-102', severity: 'critical', status: 'open', name: 'S3 bucket made public' }, { id: 'det-103', severity: 'high', status: 'open', name: 'Unusual IAM key' }],
  prod: [{ id: 'det-p1', severity: 'medium', status: 'open', name: 'Security group opened to 0.0.0.0/0' }],
}

const catalog = JSON.parse(readFileSync(new URL('../fixtures/v7-catalog.json', import.meta.url), 'utf8'))
// A customer plugin tool on staging, to test the clash with a tenant plugin also named acme.
const pluginTool = { name: 'plugin__acme__sync', description: 'Acme integration (customer plugin): sync assets now.', inputSchema: { type: 'object', properties: {} }, needsApproval: true }
const GROUPS_OF_TOOLS = ['detections', 'inventory', 'plugin__acme']
export const groupOf = name => (name.startsWith('plugin__') ? name.split('__').slice(0, 2).join('__') : name.split('__')[0])
export const entries = [...catalog.filter(t => GROUPS_OF_TOOLS.includes(groupOf(t.name))), pluginTool]

export function makeTools(trace, state) {
  const route = (name, input, write) => {
    const { plugin, workspace, ...args } = input ?? {}
    const step = state.plan?.find(s => s.assignee === 'self' && s.status === 'in_progress')
    const ready = PLUGINS.filter(p => p.status === 'ready').length
    if (write && !plugin && ready >= 2) {
      trace.push({ name, write, error: 'write without plugin' })
      return { error: 'A change must name the plugin it runs on.' }
    }
    let target = plugin
    if (!target && step?.targets?.length === 1) target = step.targets[0]
    if (!target) target = state.focus
    if (!target) {
      trace.push({ name, write, error: 'no plugin' })
      return { error: `Name a plugin: ${IDS.join(', ')}` }
    }
    if (step?.targets && !expand(step.targets).includes(target) && !step.targets.includes(target)) {
      trace.push({ name, write, target, error: 'outside step targets' })
      return { error: `Step "${step.id}" is limited to ${step.targets.join(', ')}.` }
    }
    if (target.startsWith('@')) {
      if (write) {
        trace.push({ name, write, target, error: 'group write' })
        return { error: 'A change must name exactly one plugin.' }
      }
      trace.push({ name, write, target, fanout: expand(target) })
      return { byPlugin: Object.fromEntries(expand(target).map(id => [id, run(id, name, args, workspace)])) }
    }
    state.focus = target
    trace.push({ name, write, target, workspace, named: !!plugin })
    return run(target, name, args, workspace)
  }
  const run = (id, name, args, workspace) => {
    const p = PLUGINS.find(x => x.id === id)
    if (!p) return { error: `Unknown plugin ${id}` }
    if (p.status !== 'ready') return { skipped: true, reason: `${id} is signed out. Connect it in Options.` }
    if (name.endsWith('__list') || name.endsWith('__top')) return { items: DATA[id] ?? [], workspace: workspace ?? p.workspaces[0] }
    if (name === 'detections__summary') return { open: (DATA[id] ?? []).length, critical: (DATA[id] ?? []).filter(d => d.severity === 'critical').length }
    if (name === 'detections__setStatus') {
      const found = (DATA[id] ?? []).some(d => d.id === (args.detections_ids?.[0] ?? args.id))
      return found ? { success: true } : { error: `No such detection on ${id}` }
    }
    if (name === 'plugin__acme__sync') return { success: true, synced: 12 }
    return { items: [] }
  }
  const tools = {
    loadToolGroup: dynamicTool({
      description: `Unlock a group of API tools. Groups: ${GROUPS_OF_TOOLS.join(', ')}`,
      inputSchema: jsonSchema({ type: 'object', properties: { group: { type: 'string', enum: GROUPS_OF_TOOLS } }, required: ['group'] }),
      execute: async ({ group }) => { state.loaded.add(group); return { group, tools: entries.filter(e => groupOf(e.name) === group).map(e => e.name) } },
    }),
    todo: dynamicTool({
      description: 'Write your plan for a request that takes three or more steps. Each call replaces the whole list. While one of your own steps is in_progress, its tools are available. Hand subagent steps to delegate by stepId.',
      inputSchema: jsonSchema({
        type: 'object', required: ['steps'], properties: { steps: { type: 'array', items: { type: 'object', required: ['id', 'title', 'tools', 'status', 'assignee'], properties: {
          id: { type: 'string' }, title: { type: 'string' }, tools: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['pending', 'in_progress', 'done', 'blocked', 'skipped'] },
          assignee: { type: 'string', enum: ['self', 'subagent'] }, dependsOn: { type: 'array', items: { type: 'string' } }, note: { type: 'string' },
          targets: { type: 'array', items: { type: 'string', enum: [...IDS, ...Object.keys(GROUPS)] }, description: 'Plugins or groups the step runs on. On a subagent step, one subagent runs per plugin.' },
        } } } },
      }),
      execute: async ({ steps }) => {
        const before = new Map((state.plan ?? []).map(st => [st.id, st.targets]))
        const kept = steps.map(st => (st.targets?.length || !before.get(st.id)?.length ? st : { ...st, targets: before.get(st.id), carried: true }))
        state.plan = kept; trace.push({ name: 'todo', steps: kept, sent: steps }); return { ok: true }
      },
    }),
    delegate: dynamicTool({
      description: 'Hand a read-only plan step to subagents. A step with targets runs one subagent per plugin and returns one report per plugin.',
      inputSchema: jsonSchema({ type: 'object', properties: { stepId: { type: 'string' }, brief: { type: 'string' } }, required: ['stepId'] }),
      execute: async ({ stepId }) => {
        const step = state.plan?.find(s => s.id === stepId)
        const targets = expand(step?.targets ?? [state.focus].filter(Boolean))
        trace.push({ name: 'delegate', stepId, targets })
        return targets.map(id => {
          const r = run(id, 'detections__list', {}, undefined)
          return r.skipped ? `### ${id} (skipped)\n${r.reason}` : `### ${id} (done)\n${r.items.length} open detections: ${r.items.map(d => `${d.id} ${d.severity}`).join(', ')}`
        }).join('\n\n')
      },
    }),
  }
  for (const e of entries) {
    const write = e.needsApproval
    const schema = structuredClone(e.inputSchema)
    schema.properties = { ...(schema.properties ?? {}),
      plugin: { type: 'string', enum: IDS, description: write ? 'The tenant to run on. Required for a change.' : 'The tenant to run on. Leave out to keep the last one.' },
      workspace: { type: 'string', description: "A workspace in the plugin. Leave out for the plugin's default." },
    }
    tools[e.name] = dynamicTool({ description: e.description, inputSchema: jsonSchema(schema), execute: async input => route(e.name, input, write) })
  }
  return tools
}
const expand = t => (Array.isArray(t) ? t.flatMap(expand) : GROUPS[t] ?? [t])

export async function converse(turns) {
  const trace = [], state = { loaded: new Set() }, messages = []
  const tools = makeTools(trace, state)
  const turnTraces = [], usage = []
  let steps = 0
  let text = ''
  for (const turn of turns) {
    const start = trace.length
    messages.push({ role: 'user', content: turn })
    const result = await generateText({
      model, system, messages, tools, stopWhen: stepCountIs(20), maxOutputTokens: 16_000,
      // As the v7 route: loaded groups plus the in-progress own step's groups.
      prepareStep: () => {
        const stepGroups = (state.plan ?? []).filter(st => st.assignee === 'self' && st.status === 'in_progress').flatMap(st => st.tools)
        const groups = new Set([...state.loaded, ...stepGroups])
        return { activeTools: ['loadToolGroup', 'todo', 'delegate', ...entries.filter(e => groups.has(groupOf(e.name)) || stepGroups.includes(e.name)).map(e => e.name)] }
      },
      providerOptions: { bedrock: { reasoningConfig: { type: 'enabled', budgetTokens: 4096 } } },
    })
    // In AI SDK 7, response.messages is the last step only; history needs every step.
    messages.push(...result.steps.flatMap(step => step.response.messages))
    if (process.env.DEBUG_MSGS) console.log('   history:', JSON.stringify(messages.map(m => [m.role, Array.isArray(m.content) ? m.content.map(c => c.type) : 'text'])))
    text = result.text
    usage.push(result.totalUsage)
    steps += result.steps.length
    turnTraces.push(trace.slice(start))
  }
  return { turns: turnTraces, text, trace, usage, steps }
}

const calls = t => t.filter(c => c.name !== 'todo' && c.name !== 'delegate' && c.name !== 'loadToolGroup')
const onlyOn = (t, id) => calls(t).length > 0 && calls(t).every(c => c.target === id)
const SCENARIOS = [
  { name: 'names the plugin for a single-tenant ask', turns: ['List the open critical detections on acme.'], pass: ({ turns }) => onlyOn(turns[0], 'acme') },
  { name: 'follow-up stays on the tenant', turns: ['How many open detections does staging have?', 'Which of those are critical?'], pass: ({ turns }) => onlyOn(turns[0], 'staging') && calls(turns[1]).every(c => c.target === 'staging') },
  { name: 'a later turn switches tenant', turns: ['Show the open detections on acme.', 'Now do the same for staging.'], pass: ({ turns }) => onlyOn(turns[0], 'acme') && onlyOn(turns[1], 'staging') },
  { name: 'one ask spanning two tenants reaches both', turns: ['Compare the number of open detections between staging and acme.'], pass: ({ turns }) => { const t = new Set([...calls(turns[0]).flatMap(c => c.fanout ?? [c.target]), ...turns[0].filter(c => c.name === 'delegate').flatMap(c => c.targets)]); return t.has('staging') && t.has('acme') && !t.has('prod') } },
  { name: 'a cross-tenant question uses a group or covers every ready plugin', turns: ['How many open critical detections does each tenant have?'], pass: ({ turns, text }) => { const t = new Set([...calls(turns[0]).flatMap(c => c.fanout ?? [c.target]), ...turns[0].filter(c => c.name === 'delegate').flatMap(c => c.targets)]); return ['staging', 'acme', 'prod'].every(id => t.has(id)) && /globex/i.test(text) } },
  { name: 'an audit becomes a fan-out subagent step', turns: ['Audit every tenant for open critical detections and give me a per-tenant table.'], pass: ({ trace }) => { const fans = trace.filter(c => c.name === 'todo').flatMap(c => c.steps).filter(s => s.assignee === 'subagent' && expand(s.targets ?? []).length >= 3); return trace.some(c => c.name === 'delegate' && fans.some(f => f.id === c.stepId) && c.targets.length >= 3) } },
  { name: 'a write names exactly one plugin', turns: ['Set detection det-101 on acme to closed.'], pass: ({ trace }) => trace.some(c => c.write && c.target === 'acme' && !c.error) && !trace.some(c => c.write && c.target !== 'acme') },
  { name: 'an ambiguous write is not guessed', turns: ['Set detection det-101 to closed.'], pass: ({ trace }) => !trace.some(c => c.write && !c.error) },
  { name: 'a write after a read names its tenant', turns: ['Show the open detections on acme.', 'Set det-101 to closed.'], pass: ({ turns }) => turns[1].some(c => c.write && !c.error && c.target === 'acme' && c.named) && !turns[1].some(c => c.write && !c.error && c.target !== 'acme') },
  { name: 'a workspace inside a plugin', turns: ["List the open detections in acme's Sandbox workspace."], pass: ({ turns }) => calls(turns[0]).some(c => c.target === 'acme' && c.workspace === 'Sandbox') },
  { name: 'own steps carry per-tenant targets', turns: ['Make a plan and run it: first check the open detections on staging, then set det-101 on acme to closed.'], pass: ({ trace }) => { const plan = trace.filter(c => c.name === 'todo').at(-1)?.steps ?? []; return plan.some(s => s.targets?.includes('staging')) && plan.some(s => s.targets?.includes('acme')) && trace.some(c => c.write && c.target === 'acme' && !c.error) } },
  { name: 'a recorded template plan keeps its group targets', turns: [`Audit the prod tenants.\n\nDon't write a new plan. Record this one with the todo tool exactly as given, with the same ids, titles, tools, assignees, dependencies and targets, then run it:\n\n${JSON.stringify([{ id: 'audit', title: 'Audit {{plugin}}: open critical detections', tools: ['detections'], status: 'pending', assignee: 'subagent', targets: ['@prod'] }, { id: 'report', title: 'Compare the tenants in a table', tools: [], status: 'pending', assignee: 'self', dependsOn: ['audit'] }])}`], pass: ({ trace }) => { const first = trace.find(c => c.name === 'todo')?.steps ?? []; return JSON.stringify(first.find(s => s.id === 'audit')?.targets) === '["@prod"]' && trace.some(c => c.name === 'delegate' && c.stepId === 'audit') } },
  { name: 'a customer plugin tool is not confused with the tenant named acme', turns: ['On staging, run the Acme integration sync now.'], pass: ({ trace }) => trace.some(c => c.name === 'plugin__acme__sync' && c.target === 'staging' && !c.error) && !trace.some(c => c.target === 'acme') },
  { name: 'a signed-out plugin is reported, not retried', turns: ['List the open detections on globex.'], pass: ({ text, trace }) => /sign|connect/i.test(text) && calls(trace).filter(c => c.target === 'globex').length <= 1 },
]

if (import.meta.main) {
  const only = process.env.GROUNDING ? [0] : process.argv.slice(2).map(Number)
  let passed = 0
  for (const [i, s] of SCENARIOS.entries()) {
    if (only.length && !only.includes(i + 1)) continue
    const t0 = Date.now()
    try {
      const r = await converse(s.turns)
      const ok = s.pass(r)
      passed += ok
      console.log(`${ok ? 'PASS' : 'FAIL'} ${i + 1}. ${s.name} (${Math.round((Date.now() - t0) / 1000)}s)`)
      const brief = r.trace.map(c => c.name === 'todo' ? `todo[${c.steps.map(st => `${st.id}:${st.assignee}${st.targets ? `→${st.targets.join('+')}` : ''}`).join(' ')}]` : c.name === 'delegate' ? `delegate(${c.stepId}→${c.targets.join('+')})` : `${c.name}@${c.target ?? '-'}${c.workspace ? `/${c.workspace}` : ''}${c.error ? `!${c.error}` : ''}`)
      console.log(`   ${brief.join(' | ')}`)
      if (!ok) console.log(`   answer: ${r.text.slice(0, 300).replace(/\n/g, ' ')}`)
      if (!ok && r.turns.length > 1) console.log(`   calls per turn: ${r.turns.map(t => t.length).join(', ')}`)
      // A later todo that re-sends a step without the targets it had.
      const seen = new Map(), dropped = new Set()
      for (const c of r.trace.filter(c => c.name === 'todo')) for (const st of c.sent ?? c.steps) {
        if (seen.get(st.id)?.length && !st.targets?.length) dropped.add(st.id)
        if (st.targets?.length) seen.set(st.id, st.targets)
      }
      if (dropped.size) console.log(`   targets dropped on a later todo (carried forward): ${[...dropped].join(', ')}`)
      const direct = r.trace.some(c => c.name === 'delegate') && r.trace.findIndex(c => c.name === 'delegate') < r.trace.findLastIndex(c => c.name.endsWith('__list'))
      if (direct) console.log('   re-read data itself after delegating')
    } catch (e) {
      console.log(`FAIL ${i + 1}. ${s.name}: ${e.message}`)
    }
  }
  console.log(`${passed}/${only.length || SCENARIOS.length} passed`)

  // Grounding control: does a first turn answer without any tool call, with and without the tenants section?
  if (process.env.GROUNDING) {
    const n = Number(process.env.GROUNDING)
    for (const [label, sys, ask] of [
      ['with tenants section', system, 'Show the open detections on acme.'],
      ['v7 prompt alone', [system[0]], 'Show the open detections.'],
    ]) {
      let noTool = 0
      for (let i = 0; i < n; i++) {
        const trace = [], state = { loaded: new Set() }
        const tools = makeTools(trace, state)
        const r = await generateText({
          model, system: sys, messages: [{ role: 'user', content: ask }], tools, stopWhen: stepCountIs(20), maxOutputTokens: 16_000,
          prepareStep: () => ({ activeTools: ['loadToolGroup', 'todo', 'delegate', ...entries.filter(e => state.loaded.has(groupOf(e.name))).map(e => e.name)] }),
          providerOptions: { bedrock: { reasoningConfig: { type: 'enabled', budgetTokens: 4096 } } },
        })
        const called = r.steps.some(s => s.toolCalls.some(c => c.toolName !== 'loadToolGroup'))
        if (!called) noTool++
      }
      console.log(`${label}: ${noTool} of ${n} first answers made no data call`)
    }
  }
}
