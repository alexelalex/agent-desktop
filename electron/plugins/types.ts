import type { PluginStatus, ScopeInfo } from '@/lib/desktop'
import type { Trigger } from '@/lib/triggers'

/** A configured connection to one tenant, of one kind. */
export interface Plugin {
  id: string
  kind: string
  label: string
  /** The tenant's origin, e.g. https://app.streamsec.io */
  origin: string
  /** The plugin whose /chat runs every run's model. */
  orchestrator?: boolean
  /** Where calls land unless one names another scope; only the kind knows what it means. */
  defaultScope?: string
}

/** Where a run's model turns go, and the fetch that reaches it. */
export interface ChatEndpoint {
  api: string
  headers: Record<string, string>
  fetch: typeof fetch
}

/** A trigger's state between polls; a source keeps its own fields here too. */
export interface TriggerState {
  /** When it last started a run, or was added: a schedule missed since then runs at launch. */
  lastRunAt?: number
  runId?: string
  [field: string]: unknown
}

/** Something outside the app that starts runs, polled by the trigger manager. */
export interface TriggerSource {
  /** The events since the last poll, as run contexts, and the state to keep. */
  poll(
    plugin: Plugin,
    trigger: Trigger,
    state: TriggerState,
  ): Promise<{ contexts: string[]; state: TriggerState }>
}

/** The code for one kind of backend. The core never looks inside a kind's credentials or scopes. */
export interface Kind {
  id: string
  /** Keeps what the window signed in with, sealed; undefined signs the plugin out. */
  setCredentials(plugin: Plugin, credentials: unknown): void
  signedIn(plugin: Plugin): boolean
  /** Calls back when a plugin's credentials change, e.g. after a refresh or an expiry. */
  watch(listener: (pluginId: string) => void): void
  /** Whether the tenant can be used now, and why not. */
  status(plugin: Plugin): Promise<{ status: PluginStatus; text?: string }>
  /** The scopes calls can land in, e.g. workspaces. */
  scopes(plugin: Plugin): Promise<ScopeInfo[]>
  /** An authenticated call to the plugin's own origin, landing in `scope` inside it. */
  fetch(
    plugin: Plugin,
    url: string | URL,
    init?: RequestInit,
    scope?: string,
  ): Promise<Response>
  /** The plugin's chat endpoint, which lets it orchestrate. */
  chat(plugin: Plugin, scope?: string): ChatEndpoint
  triggerSources: Record<string, TriggerSource>

  // Routing calls across tenants.
  /** The tenant's own tools, by name, and whether each one changes data. */
  catalog(plugin: Plugin): Promise<Map<string, boolean>>
  /** Fields the model may set on every call, as JSON Schema properties. */
  callParams: Record<string, Record<string, unknown>>
  /** The plugin's line in the model's plugin list, after its id and label. */
  describe(plugin: Plugin, status: PluginStatus, scopes: ScopeInfo[]): string
  /**
   * Where a call lands: the scope its params name, else `last`, else the default.
   * Throws, with a message for the model, when the params name no such scope.
   */
  resolveScope(
    plugin: Plugin,
    params: Record<string, unknown>,
    last: string | undefined,
    scopes: ScopeInfo[],
  ): string | undefined
  /** Runs one catalog call on the tenant; throws with a message for the model. */
  execute(
    plugin: Plugin,
    tool: string,
    input: unknown,
    scope: string | undefined,
    signal: AbortSignal,
  ): Promise<unknown>
}
