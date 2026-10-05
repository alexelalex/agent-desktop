import type { Plugin } from '../types'
import { tenantFetch } from './tokens'

export interface ParameterSpec {
  name: string
  in: 'query' | 'path' | 'header'
  required?: boolean
  description?: string
  schema?: Record<string, unknown>
}

/** One operation in a tenant's OpenAPI spec. */
export interface Operation {
  operationId: string
  method: string
  /** From the origin, e.g. `/openapi/detections/{id}/activities`. */
  path: string
  summary: string
  /** The spec doesn't mark which operations change data, so anything but GET counts. */
  write: boolean
  parameters: ParameterSpec[]
  bodySchema?: Record<string, unknown>
}

interface Spec {
  servers?: { url?: string }[]
  paths?: Record<
    string,
    Record<
      string,
      {
        operationId?: string
        summary?: string
        description?: string
        parameters?: ParameterSpec[]
        requestBody?: { content?: Record<string, { schema?: Record<string, unknown> }> }
      }
    >
  >
}

const METHODS = new Set(['get', 'post', 'put', 'patch', 'delete'])

// An unrouted path gets the web app's index.html with a 200.
export const isHtml = (response: Response) =>
  !!response.headers.get('content-type')?.includes('text/html')

// A failed refresh keeps the last spec, so an expired plugin keeps its tools until sign-in.
const loaded = new Map<string, Operation[]>()

/** The tenant's operations, from the spec it serves at /docs/json; `fresh` skips the cache. */
export async function operations(plugin: Plugin, fresh = false): Promise<Operation[]> {
  const known = loaded.get(plugin.id)
  if (known && !fresh) return known
  const ops = await load(plugin)
  loaded.set(plugin.id, ops)
  return ops
}

async function load(plugin: Plugin): Promise<Operation[]> {
  const response = await tenantFetch(plugin, `${plugin.origin}/docs/json`)
  if (!response.ok || isHtml(response)) {
    throw new Error(`${plugin.label} doesn't serve its OpenAPI spec (HTTP ${response.status}).`)
  }
  const doc = (await response.json()) as Spec
  // Paths are relative to servers[0] (`<host>/openapi`); keep only its path, since
  // that host comes from forwarded headers and tenantFetch only sends to plugin.origin.
  const base = doc.servers?.[0]?.url
    ? new URL(doc.servers[0].url, plugin.origin).pathname.replace(/\/+$/, '')
    : ''
  return Object.entries(doc.paths ?? {}).flatMap(([path, methods]) =>
    Object.entries(methods).flatMap(([method, op]) =>
      METHODS.has(method) && op.operationId
        ? [
            {
              operationId: op.operationId,
              method: method.toUpperCase(),
              path: `${base}${path}`,
              summary: op.summary ?? op.description ?? op.operationId,
              write: method !== 'get',
              parameters: op.parameters ?? [],
              bodySchema: op.requestBody?.content?.['application/json']?.schema,
            },
          ]
        : [],
    ),
  )
}

/** A call from flat input: path params fill the path, query params the query, the rest the body. */
export function request(
  plugin: Plugin,
  op: Operation,
  input: Record<string, unknown>,
): { url: string; init: RequestInit } {
  let path = op.path
  const query = new URLSearchParams()
  const body: Record<string, unknown> = {}
  const where = new Map(op.parameters.map(p => [p.name, p.in]))
  for (const [key, value] of Object.entries(input)) {
    const at = where.get(key)
    if (at === 'path') {
      path = path.replace(`{${key}}`, encodeURIComponent(String(value)))
    } else if (at === 'query') {
      if (Array.isArray(value)) for (const item of value) query.append(key, String(item))
      else if (value !== undefined && value !== null) query.set(key, String(value))
    } else {
      body[key] = value
    }
  }
  const search = query.toString()
  return {
    url: `${plugin.origin}${path}${search ? `?${search}` : ''}`,
    init:
      op.method === 'GET'
        ? { method: op.method }
        : {
            method: op.method,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          },
  }
}
