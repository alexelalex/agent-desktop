import { useEffect, useState } from 'react'
import { fetchVia } from './auth-fetch'
import type { PluginInfo } from './desktop'

export interface SpecOperation {
  method: string
  path: string
  summary?: string
  /** Parameter or body-field name → its description in the spec. */
  params: Record<string, string>
}

interface SpecDocument {
  paths: Record<
    string,
    Record<
      string,
      {
        operationId?: string
        summary?: string
        parameters?: { name: string; description?: string }[]
        requestBody?: {
          content?: Record<
            string,
            { schema?: { properties?: Record<string, { description?: string }> } }
          >
        }
      }
    >
  >
}

function indexOperations(doc: SpecDocument): Map<string, SpecOperation> {
  const operations = new Map<string, SpecOperation>()
  for (const [path, methods] of Object.entries(doc.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!op.operationId) continue
      const params: Record<string, string> = {}
      for (const p of op.parameters ?? []) {
        if (p.description) params[p.name] = p.description
      }
      const body = op.requestBody?.content?.['application/json']?.schema
      for (const [name, field] of Object.entries(body?.properties ?? {})) {
        if (field.description) params[name] = field.description
      }
      operations.set(op.operationId, {
        method: method.toUpperCase(),
        path,
        summary: op.summary,
        params,
      })
    }
  }
  return operations
}

// Chat tools are named after the tRPC path joined by `__`; the spec's
// operationIds join the same path with `-`.
export function operationFor(
  operations: Map<string, SpecOperation> | undefined,
  toolName: string,
): SpecOperation | undefined {
  return operations?.get(toolName.replaceAll('__', '-'))
}

/** A plugin's live OpenAPI spec, indexed by operationId; none without a plugin. */
export function useSpecOperations(plugin: PluginInfo | undefined) {
  const [operations, setOperations] = useState<Map<string, SpecOperation>>()
  const id = plugin?.id
  const origin = plugin?.origin
  useEffect(() => {
    if (!id || !origin) return setOperations(undefined)
    let live = true
    fetchVia(id)(`${origin}/docs/json`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((doc: SpecDocument) => live && setOperations(indexOperations(doc)))
      .catch(() => live && setOperations(new Map()))
    return () => {
      live = false
    }
  }, [id, origin])
  return operations
}

/** Operations whose id, method, path or summary contain every search word. */
export function searchOperations(
  operations: Map<string, SpecOperation>,
  query: string,
): [string, SpecOperation][] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return [...operations].filter(([id, op]) => {
    const text = `${id} ${op.method} ${op.path} ${op.summary ?? ''}`.toLowerCase()
    return words.every(word => text.includes(word))
  })
}
