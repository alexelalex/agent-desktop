import { moveFile, readJson, writeJson } from './store'

// Stored data's shape. Version 2 keys runs and agents globally, not per instance
// and workspace; data from before is kept aside, and only old runs stay readable.
const VERSION = 2

export function freshStart() {
  const { version = 1 } = readJson<{ version?: number }>('meta.json', {})
  if (version >= VERSION) return
  moveFile('runs.json', 'earlier-runs.json')
  moveFile('agents.json', 'earlier-agents.json')
  moveFile('triggers.json', 'earlier-triggers.json')
  writeJson('meta.json', { version: VERSION })
}
