import { safeStorage } from 'electron'
import { readFile, readJson, removeFile, writeFile, writeJson } from '../store'
import type { Plugin } from './types'

// Plugins are listed in plugins.json; each one's secrets sit in their own file,
// encrypted with the OS keychain when it's available.
const FILE = 'plugins.json'
const sealed = (id: string) => `plugins/${id}.bin`
const plain = (id: string) => `plugins/${id}.json`

let plugins: Plugin[] | undefined
const all = () => (plugins ??= readJson<Plugin[]>(FILE, []))
const listeners = new Set<() => void>()

function save(next: Plugin[]) {
  plugins = next
  writeJson(FILE, next)
  listeners.forEach(listener => listener())
}

export const listPlugins = (): Plugin[] => [...all()]
export const getPlugin = (id: string) => all().find(p => p.id === id)
export const orchestrator = () => all().find(p => p.orchestrator)

export function savePlugin(plugin: Plugin) {
  // One orchestrator at a time; a plugin keeps its place in the list.
  const next = all().map(p =>
    p.id === plugin.id
      ? plugin
      : plugin.orchestrator && p.orchestrator
        ? { ...p, orchestrator: false }
        : p,
  )
  save(next.some(p => p.id === plugin.id) ? next : [...next, plugin])
}

export function removePlugin(id: string) {
  writeSecrets(id, undefined)
  save(all().filter(p => p.id !== id))
}

export function onPluginsChange(listener: () => void) {
  listeners.add(listener)
}

export function readSecrets<T>(id: string): T | undefined {
  const encrypted = readFile(sealed(id))
  const text = readFile(plain(id))
  try {
    if (encrypted) return JSON.parse(safeStorage.decryptString(encrypted)) as T
    if (text) return JSON.parse(text.toString('utf8')) as T
  } catch {
    return undefined
  }
  return undefined
}

export function writeSecrets(id: string, secrets: unknown) {
  removeFile(sealed(id))
  removeFile(plain(id))
  if (secrets === undefined) return
  const json = JSON.stringify(secrets)
  if (safeStorage.isEncryptionAvailable()) {
    writeFile(sealed(id), safeStorage.encryptString(json))
  } else {
    writeFile(plain(id), json)
  }
}

/** A plugin id from a name: `App Staging` → `app-staging`, unique among plugins. */
export function newPluginId(name: string): string {
  const base =
    name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 48) ||
    'plugin'
  let id = base
  for (let n = 2; getPlugin(id); n++) id = `${base}-${n}`
  return id
}
