import type { Group } from '@/lib/desktop'
import { readJson, writeJson } from '../store'
import { listPlugins } from './store'

// The user's groups; `@all` is never stored, since it always holds every plugin.
const FILE = 'groups.json'
export const ALL = '@all'

let groups: Group[] | undefined
const stored = () => (groups ??= readJson<Group[]>(FILE, []))

export const listGroups = (): Group[] => [
  { id: ALL, members: listPlugins().map(p => p.id) },
  ...stored(),
]

export function saveGroup(group: Group) {
  if (group.id === ALL) throw new Error('@all is built in.')
  if (!/^@[\w-]+$/.test(group.id)) throw new Error('A group name is @ followed by letters, digits, - or _.')
  groups = [...stored().filter(g => g.id !== group.id), group]
  writeJson(FILE, groups)
}

export function deleteGroup(id: string) {
  groups = stored().filter(g => g.id !== id)
  writeJson(FILE, groups)
}
