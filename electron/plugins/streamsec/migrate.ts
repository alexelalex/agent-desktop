import { safeStorage } from 'electron'
import type { Tokens } from '@/lib/auth'
import { readFile, removeFile } from '../../store'
import { listPlugins, newPluginId, savePlugin } from '../store'
import { setTokens } from './tokens'

/** A session saved before plugins becomes the orchestrator plugin, once. */
export function migrateSession() {
  const encrypted = readFile('session.bin')
  const plain = readFile('session.json')
  if (!encrypted && !plain) return
  try {
    const { baseUrl, workspaceId, ...tokens } = JSON.parse(
      encrypted ? safeStorage.decryptString(encrypted) : plain!.toString('utf8'),
    ) as Tokens & { baseUrl: string; workspaceId?: string }
    if (!listPlugins().some(p => p.origin === baseUrl)) {
      const plugin = {
        id: newPluginId(new URL(baseUrl).host),
        kind: 'streamsec',
        label: new URL(baseUrl).host,
        origin: baseUrl,
        orchestrator: listPlugins().length === 0,
        defaultScope: workspaceId,
      }
      savePlugin(plugin)
      setTokens(plugin, { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
    }
  } catch {
    // An unreadable session means signing in again.
  }
  removeFile('session.bin')
  removeFile('session.json')
}
