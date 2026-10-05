import { refreshAccessToken, type Tokens } from '@/lib/auth'
import { readSecrets, writeSecrets } from '../store'
import type { Plugin } from '../types'

// A plugin's secrets: its tokens, or a mark that its refresh failed.
type Secrets = Tokens | { expired: true }

// Cached after the first read; undefined means signed out.
const cache = new Map<string, Secrets | undefined>()
const listeners = new Set<(pluginId: string) => void>()

function secretsOf(plugin: Plugin): Secrets | undefined {
  if (!cache.has(plugin.id)) cache.set(plugin.id, readSecrets<Secrets>(plugin.id))
  return cache.get(plugin.id)
}

export function tokensOf(plugin: Plugin): Tokens | undefined {
  const secrets = secretsOf(plugin)
  return secrets && 'accessToken' in secrets ? secrets : undefined
}

export const isExpired = (plugin: Plugin) => {
  const secrets = secretsOf(plugin)
  return !!secrets && 'expired' in secrets
}

export function setTokens(plugin: Plugin, secrets: Secrets | undefined) {
  cache.set(plugin.id, secrets)
  writeSecrets(plugin.id, secrets)
  listeners.forEach(listener => listener(plugin.id))
}

export function onTokensChange(listener: (pluginId: string) => void) {
  listeners.add(listener)
}

const refreshing = new Map<string, Promise<Tokens | undefined>>()

// One refresh serves every request that got a 401 meanwhile. A failed refresh
// leaves the plugin expired until it signs in again.
function refresh(plugin: Plugin, stale: Tokens): Promise<Tokens | undefined> {
  const pending =
    refreshing.get(plugin.id) ??
    refreshAccessToken(plugin.origin, stale.refreshToken)
      .then(accessToken => {
        const current = tokensOf(plugin)
        if (!current) return undefined
        const next = { ...current, accessToken }
        setTokens(plugin, next)
        return next
      })
      .catch(() => {
        if (tokensOf(plugin)?.refreshToken === stale.refreshToken) {
          setTokens(plugin, { expired: true })
        }
        return undefined
      })
      .finally(() => refreshing.delete(plugin.id))
  refreshing.set(plugin.id, pending)
  return pending
}

/**
 * `fetch` to the plugin's own origin only, with its bearer token and a workspace
 * (the call's, or the plugin's default), retried once after a token refresh.
 */
export async function tenantFetch(
  plugin: Plugin,
  url: string | URL,
  init?: RequestInit,
  workspaceId?: string,
): Promise<Response> {
  const tokens = tokensOf(plugin)
  if (!tokens) {
    throw new Error(
      `${plugin.label} is ${isExpired(plugin) ? 'expired' : 'signed out'}. Connect it in Options.`,
    )
  }
  const origin = new URL(url).origin
  if (origin !== new URL(plugin.origin).origin) {
    throw new Error(`${plugin.label} can't send its token to ${origin}`)
  }

  const send = (t: Tokens) => {
    const headers = new Headers(init?.headers)
    headers.set('authorization', `Bearer ${t.accessToken}`)
    const workspace = workspaceId ?? plugin.defaultScope
    if (workspace) headers.set('workspace', workspace)
    return fetch(url, { ...init, headers })
  }

  const response = await send(tokens)
  if (response.status !== 401) return response
  const refreshed = await refresh(plugin, tokens)
  return refreshed ? send(refreshed) : response
}
