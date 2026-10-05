// The tasks feature's success measures, from the app's local records: the sessions file and the
// parents' transcripts. Usage: node scripts/task-metrics.mjs [data folder]
import { existsSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const support = path.join(os.homedir(), 'Library', 'Application Support')
const dir =
  process.argv[2] ??
  ['Agent Desktop', 'agent-desktop'].map(name => path.join(support, name)).find(d => existsSync(path.join(d, 'claude-code-sessions.json')))
if (!dir) {
  console.error('No claude-code-sessions.json found; pass the app data folder.')
  process.exit(1)
}
const sessions = JSON.parse(readFileSync(path.join(dir, 'claude-code-sessions.json'), 'utf8'))
const tasks = sessions.filter(s => s.claudeCode?.task)

const entries = file => {
  try {
    return readFileSync(file, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line))
  } catch {
    return []
  }
}

// Offered: the action ids of accepted renders, with when each render was written.
const offered = new Map()
for (const session of sessions) {
  const lines = entries(session.transcriptPath)
  const results = new Map(
    lines
      .flatMap(e => (e.type === 'user' && Array.isArray(e.message?.content) ? e.message.content : []))
      .filter(c => c.type === 'tool_result')
      .map(c => [c.tool_use_id, c]),
  )
  for (const entry of lines) {
    if (entry.type !== 'assistant' || !Array.isArray(entry.message?.content)) continue
    for (const block of entry.message.content) {
      if (block.type !== 'tool_use' || !block.name?.endsWith('ui_render_artifact')) continue
      const result = results.get(block.id)
      if (!result || result.is_error || !Array.isArray(block.input?.actions)) continue
      for (const action of block.input.actions) {
        const key = `${session.id}/${block.input.id}/${action.id}`
        if (!offered.has(key)) offered.set(key, { at: Date.parse(entry.timestamp) || undefined, artifact: `${session.id}/${block.input.id}` })
      }
    }
  }
}

const keyOf = task => `${task.claudeCode.task.parentRunId}/${task.claudeCode.task.artifactId}/${task.claudeCode.task.actionId}`
const launchedKeys = new Set(tasks.map(keyOf))
const launched = [...offered.keys()].filter(k => launchedKeys.has(k)).length
const edited = tasks.filter(t => t.claudeCode.task.promptEdited).length
// Completed with no user message besides approvals: the transcript holds only the first prompt.
const prompts = task =>
  entries(task.transcriptPath).filter(
    e => e.type === 'user' && !e.isMeta && !e.isSidechain && (typeof e.message?.content === 'string' || e.message?.content?.some?.(c => c.type === 'text')),
  ).length
const completed = tasks.filter(t => t.status === 'completed')
const alone = completed.filter(t => prompts(t) === 1).length
// Dispatch: from a render to the last launch from that artifact.
const lastLaunch = new Map()
for (const task of tasks) {
  const artifact = `${task.claudeCode.task.parentRunId}/${task.claudeCode.task.artifactId}`
  lastLaunch.set(artifact, Math.max(lastLaunch.get(artifact) ?? 0, task.claudeCode.task.launchedAt))
}
const rendered = new Map()
for (const { at, artifact } of offered.values()) if (at) rendered.set(artifact, Math.min(rendered.get(artifact) ?? Infinity, at))
const dispatch = [...lastLaunch].flatMap(([artifact, last]) => (rendered.has(artifact) ? [(last - rendered.get(artifact)) / 60_000] : [])).sort((a, b) => a - b)

const pct = (n, of) => (of ? `${Math.round((100 * n) / of)}% (${n}/${of})` : 'n/a')
const rows = [
  ['Offered actions that get launched', pct(launched, offered.size), 'at least 40%'],
  ["Launches whose prompt the user edited", pct(edited, tasks.length), 'at most 30%'],
  ['Completed tasks with no user message besides approvals', pct(alone, completed.length), 'at least 60%'],
  ['Render to last launch, median', dispatch.length ? `${dispatch[Math.floor(dispatch.length / 2)].toFixed(1)} min (${dispatch.length} artifacts)` : 'n/a', 'at most 2 min for 10 actions'],
]
const width = Math.max(...rows.map(r => r[0].length))
for (const [name, value, target] of rows) console.log(`${name.padEnd(width)}  ${value.padEnd(24)}  target ${target}`)
