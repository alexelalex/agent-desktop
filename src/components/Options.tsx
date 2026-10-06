import { PlusIcon, RefreshCwIcon, XIcon } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { completeTwoFactor, login, type Tokens, type TwoFactorChallenge } from '@/lib/auth'
import type {
  ClaudeCodeInfo,
  Group,
  PluginInfo,
  ScopeInfo,
  SuggesterInfo,
  SuggesterSetup,
} from '@/lib/desktop'
import { CHANNELS_COMMAND } from '@/lib/claude-code'
import { claudeCodeOrchestrates, orchestratorOf, STATUS_LABELS, useShell } from '@/lib/plugins'
import { MAX_NOTE, MAX_NOTES, SUGGESTER_MODELS } from '@/lib/replies'
import { cn } from '@/lib/utils'

function Field(props: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {props.label}
      {props.children}
    </label>
  )
}

/** The cog's dialog: plugins, each one tenant, and groups of them. */
export function Options(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  plugins: PluginInfo[]
  groups: Group[]
  /** A plugin to open signing in; Options closes once it is signed in. */
  signIn?: string
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Options</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="plugins">
          <TabsList>
            <TabsTrigger value="plugins">Plugins</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="claude-code">Claude Code</TabsTrigger>
            <TabsTrigger value="replies">Replies</TabsTrigger>
          </TabsList>
          <TabsContent value="plugins">
            <PluginsTab
              plugins={props.plugins}
              signIn={props.signIn}
              onSignedIn={() => props.onOpenChange(false)}
            />
          </TabsContent>
          <TabsContent value="groups">
            <GroupsTab plugins={props.plugins} groups={props.groups} />
          </TabsContent>
          <TabsContent value="claude-code">
            <ClaudeCodeTab />
          </TabsContent>
          <TabsContent value="replies">
            <RepliesTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function PluginsTab({ plugins, signIn, onSignedIn }: {
  plugins: PluginInfo[]
  signIn?: string
  onSignedIn: () => void
}) {
  const [adding, setAdding] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Each plugin is one tenant. The orchestrator runs the
        model; the chat runs each call on the tenant it concerns.
      </p>
      <div className="flex gap-2">
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <PlusIcon /> Add plugin
          </Button>
        )}
        {plugins.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => void window.desktop.plugins.refresh()}>
            <RefreshCwIcon /> Refresh status
          </Button>
        )}
      </div>
      {adding && (
        <SignInForm
          onCancel={() => setAdding(false)}
          onTokens={async ({ label, origin }, tokens) => {
            await window.desktop.plugins.add({ kind: 'streamsec', label, origin, tokens })
            setAdding(false)
          }}
        />
      )}
      {plugins.length > 0 && (
        <ul className="divide-y rounded-md border">
          {plugins.map(plugin => (
            <PluginRow
              key={plugin.id}
              plugin={plugin}
              prompted={plugin.id === signIn}
              onSignedIn={onSignedIn}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function PluginRow({ plugin, prompted, onSignedIn }: {
  plugin: PluginInfo
  /** Opened from a sign-in prompt: starts signing in, and closes Options when done. */
  prompted: boolean
  onSignedIn: () => void
}) {
  const [mode, setMode] = useState<'view' | 'sign-in' | 'rename'>(prompted ? 'sign-in' : 'view')
  const [label, setLabel] = useState(plugin.label)
  const signedIn = plugin.status === 'ready' || plugin.status === 'unsupported'
  const { plugins } = window.desktop
  // While Claude Code orchestrates chats, the flagged plugin still runs agents.
  const claudeCodeOrchestrates = !!useShell().claudeCode?.orchestrator
  const orchestrator = plugin.orchestrator && !claudeCodeOrchestrates

  return (
    <li className="flex flex-col gap-3 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{plugin.label}</span>
        <span className="text-muted-foreground">{new URL(plugin.origin).host}</span>
        <Badge variant={plugin.status === 'ready' ? 'secondary' : 'outline'}>
          {STATUS_LABELS[plugin.status]}
        </Badge>
        {orchestrator && <Badge>Orchestrator</Badge>}
        {plugin.orchestrator && claudeCodeOrchestrates && (
          <Badge variant="outline">Runs agents</Badge>
        )}
      </div>
      {plugin.statusText && (
        <p className="text-xs text-muted-foreground">{plugin.statusText}</p>
      )}
      {plugin.status === 'ready' && <DefaultScope plugin={plugin} />}
      {mode === 'rename' ? (
        <form
          className="flex items-end gap-2"
          onSubmit={e => {
            e.preventDefault()
            void plugins.rename(plugin.id, label).then(() => setMode('view'))
          }}
        >
          <Field label="Name">
            <Input value={label} onChange={e => setLabel(e.target.value)} required />
          </Field>
          <Button size="sm" type="submit">Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setMode('view')}>Cancel</Button>
        </form>
      ) : mode === 'sign-in' ? (
        <SignInForm
          plugin={plugin}
          onCancel={() => setMode('view')}
          onTokens={async (_, tokens) => {
            await plugins.signIn(plugin.id, tokens)
            setMode('view')
            if (prompted) onSignedIn()
          }}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {!orchestrator && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void plugins.setOrchestrator(plugin.id)
                if (claudeCodeOrchestrates) {
                  void window.desktop.claudeCode.save({ orchestrator: false })
                }
              }}
            >
              Make orchestrator
            </Button>
          )}
          {signedIn ? (
            <Button size="sm" variant="outline" onClick={() => void plugins.signOut(plugin.id)}>
              Sign out
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setMode('sign-in')}>
              Sign in
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setMode('rename')}>
            Rename
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void plugins.remove(plugin.id)}>
            Remove
          </Button>
        </div>
      )}
    </li>
  )
}

function ClaudeCodeTab() {
  const { claudeCode: info, plugins } = useShell()
  if (!info) return null
  return (
    <ClaudeCodeSetupForm
      key={`${info.command}|${info.cwd}`}
      info={info}
      orchestrates={claudeCodeOrchestrates(plugins, info)}
      switchable={!!orchestratorOf(plugins)}
    />
  )
}

function ClaudeCodeSetupForm({ info, orchestrates, switchable }: {
  info: ClaudeCodeInfo
  orchestrates: boolean
  /** A plugin can orchestrate instead. */
  switchable: boolean
}) {
  const [command, setCommand] = useState(info.command ?? '')
  const [cwd, setCwd] = useState(info.cwd ?? '')
  const [saving, setSaving] = useState(false)
  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await window.desktop.claudeCode.save({ command, cwd })
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="text-muted-foreground">
        As the orchestrator, Claude Code on this machine answers the chats you
        start here, using your tenants through the app's MCP server. You can
        also reply to sessions started in a terminal. It orchestrates whenever
        no plugin does. Agents and scheduled runs stay on the plugin orchestrator.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {info.found ? (
          <>
            <Badge variant="secondary">Claude Code {info.found.version}</Badge>
            <span className="font-mono text-xs text-muted-foreground">{info.found.path}</span>
          </>
        ) : (
          <Badge variant="outline">Not found</Badge>
        )}
        {orchestrates && <Badge>Orchestrator</Badge>}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="font-medium">Terminal sessions</span>
        <p className="text-muted-foreground">
          To message a session while it's open in a terminal, start Claude Code
          with the app's channel. Sessions started without it take replies once
          they end.
        </p>
        <code className="rounded-md border bg-muted/40 px-2 py-1.5 font-mono text-xs break-all select-all">
          {CHANNELS_COMMAND}
        </code>
      </div>
      <form className="flex flex-col gap-3" onSubmit={save}>
        <Field label="Command">
          <Input
            value={command}
            onChange={e => setCommand(e.target.value)}
            placeholder={info.found?.path ?? 'Path to the claude binary'}
          />
        </Field>
        <Field label="Working folder for new sessions">
          <Input
            value={cwd}
            onChange={e => setCwd(e.target.value)}
            placeholder={info.defaultCwd}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" type="submit" disabled={saving}>
            Save
          </Button>
          {!switchable ? null : info.orchestrator ? (
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => void window.desktop.claudeCode.save({ orchestrator: false })}
            >
              Use the plugin orchestrator
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              type="button"
              disabled={!info.found}
              onClick={() => void window.desktop.claudeCode.save({ orchestrator: true })}
            >
              Make orchestrator
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

const SUGGESTER_STATES: Record<SuggesterInfo['state'], string> = {
  off: 'Off',
  idle: 'Not running; it starts with the next turn',
  ready: 'Ready',
  working: 'Suggesting…',
  failed: 'The last request failed',
}

function RepliesTab() {
  const [info, setInfo] = useState<SuggesterInfo>()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string>()
  useEffect(() => {
    void window.desktop.suggester.get().then(setInfo)
    return window.desktop.suggester.onChange(setInfo)
  }, [])
  if (!info) return null
  const save = (change: Partial<SuggesterSetup>) => {
    setError(undefined)
    // Shown at once, so a control doesn't snap back while the save is on its way.
    setInfo(current => current && { ...current, ...change })
    window.desktop.suggester.save(change).then(setInfo, e => setError(String(e?.message ?? e)))
  }
  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return
    save({ notes: [...info.notes, note] })
    setNote('')
  }
  const full = info.notes.length >= MAX_NOTES
  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="text-muted-foreground">
        When an agent ends its turn in the session you're viewing, a Claude Code session the app
        runs suggests up to three replies above the message box. A click puts one in the box;
        nothing is sent until you press Enter.
      </p>
      <label className="flex items-center gap-2 font-medium">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={info.enabled}
          onChange={e => save({ enabled: e.target.checked })}
        />
        Suggest replies
      </label>
      <Field label="Model">
        <Select value={info.model} onValueChange={model => save({ model })}>
          <SelectTrigger className="w-56" aria-label="Model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUGGESTER_MODELS.map(m => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <section aria-label="What it learned" className="flex flex-col gap-2">
        <span className="font-medium">What it learned about how you reply</span>
        {info.notes.length === 0 ? (
          <p className="text-muted-foreground">
            Nothing yet. It updates these from what you pick, edit, or type instead.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {info.notes.map((n, i) => (
              <li key={`${i}:${n}`} className="flex items-center justify-between gap-2 rounded-md bg-muted px-2.5 py-1.5">
                <span className="min-w-0 break-words">{n}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Forget: ${n}`}
                  onClick={() => save({ notes: info.notes.filter((_, j) => j !== i) })}
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form className="flex gap-2" onSubmit={add}>
          <Input
            aria-label="New note"
            value={note}
            maxLength={MAX_NOTE}
            disabled={full}
            placeholder={full ? `At most ${MAX_NOTES} notes` : 'e.g. Short lowercase replies'}
            onChange={e => setNote(e.target.value)}
          />
          <Button size="sm" variant="outline" type="submit" disabled={full || !note.trim()}>
            Add
          </Button>
        </form>
        {info.notes.length > 0 && (
          <Button variant="link" size="xs" className="self-start p-0" onClick={() => save({ notes: [] })}>
            Forget all
          </Button>
        )}
      </section>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span
          aria-hidden
          className={cn(
            'size-1.5 rounded-full bg-muted-foreground',
            info.state === 'ready' && 'bg-emerald-500',
            info.state === 'working' && 'bg-amber-500',
            info.state === 'failed' && 'bg-destructive',
          )}
        />
        <span>{SUGGESTER_STATES[info.state]}</span>
        {info.lastMs !== undefined && <span>· last suggestions in {(info.lastMs / 1000).toFixed(1)} s</span>}
        {info.transcriptPath && (
          <Button
            variant="link"
            size="xs"
            className="h-auto p-0"
            onClick={() => void window.desktop.claudeCode.reveal(info.transcriptPath!)}
          >
            Show transcript file
          </Button>
        )}
      </p>
      {(error ?? (info.state === 'failed' && info.error)) && (
        <Alert variant="destructive">
          <AlertDescription>{error ?? info.error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function DefaultScope({ plugin }: { plugin: PluginInfo }) {
  const [scopes, setScopes] = useState<ScopeInfo[]>([])
  useEffect(() => {
    let live = true
    void window.desktop.plugins
      .scopes(plugin.id)
      .then(list => live && setScopes(list))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [plugin.id])
  if (scopes.length === 0) return null
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Default workspace</span>
      <Select
        value={plugin.defaultScope ?? ''}
        onValueChange={scope => void window.desktop.plugins.setDefaultScope(plugin.id, scope)}
      >
        <SelectTrigger className="w-56" aria-label="Default workspace">
          <SelectValue placeholder="Pick a workspace" />
        </SelectTrigger>
        <SelectContent>
          {scopes.map(scope => (
            <SelectItem key={scope.id} value={scope.id}>
              {scope.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const DEFAULT_INSTANCE = 'https://app.streamsec.io'

/** Password sign-in with 2FA, for a new plugin or an existing one. */
function SignInForm(props: {
  plugin?: PluginInfo
  onCancel?: () => void
  onTokens: (target: { label: string; origin: string }, tokens: Tokens) => Promise<void>
}) {
  const { plugin } = props
  const [label, setLabel] = useState('')
  const [instance, setInstance] = useState(plugin?.origin ?? DEFAULT_INSTANCE)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [challenge, setChallenge] = useState<TwoFactorChallenge>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const origin = instance.trim().replace(/\/+$/, '')
  const target = { label: plugin?.label ?? label, origin }

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const onSignIn = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      const result = await login(origin, email, password)
      if (result.kind === 'signed-in') await props.onTokens(target, result.tokens)
      else setChallenge(result.challenge)
    })
  }

  const onVerify = (e: FormEvent) => {
    e.preventDefault()
    void run(async () =>
      props.onTokens(target, await completeTwoFactor(origin, challenge!, code)),
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      {challenge ? (
        <form className="flex flex-col gap-3" onSubmit={onVerify}>
          <Field
            label={
              challenge.method === 'SECURED_EMAIL'
                ? `Code sent to ${challenge.sentTo ?? 'your e-mail'}`
                : 'Code from your authenticator app'
            }
          >
            <Input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={e => setCode(e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy || !code.trim()}>Verify</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setChallenge(undefined)}>
              Back
            </Button>
          </div>
        </form>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={onSignIn}>
          {!plugin && (
            <>
              <p className="text-xs text-muted-foreground">Kind: Stream Security</p>
              <Field label="Name">
                <Input
                  placeholder="e.g. staging"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                />
              </Field>
              <Field label="Instance URL">
                <Input
                  type="url"
                  placeholder="https://your-tenant.streamsec.io"
                  value={instance}
                  onChange={e => setInstance(e.target.value)}
                  required
                />
              </Field>
            </>
          )}
          <Field label="E-mail">
            <Input
              type="email"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>Sign in</Button>
            {props.onCancel && (
              <Button type="button" size="sm" variant="ghost" onClick={props.onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function GroupsTab({ plugins, groups }: { plugins: PluginInfo[]; groups: Group[] }) {
  const [editing, setEditing] = useState<Group>()
  const labelOf = (id: string) =>
    plugins.find(p => p.id === id)?.label ?? `${id} (removed)`
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        A group names several plugins, as @name in the composer and in a plan
        step's targets. @all always holds every plugin.
      </p>
      {!editing && (
        <Button size="sm" className="w-fit" onClick={() => setEditing({ id: '@', members: [] })}>
          <PlusIcon /> New group
        </Button>
      )}
      {editing && (
        <GroupForm
          group={editing}
          plugins={plugins}
          isNew={!groups.some(g => g.id === editing.id)}
          onDone={() => setEditing(undefined)}
        />
      )}
      <ul className="divide-y rounded-md border">
        {groups.map(group => (
          <li key={group.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
            <span className="font-mono font-medium">{group.id}</span>
            <span className="min-w-0 flex-1 text-muted-foreground">
              {group.members.length > 0 ? group.members.map(labelOf).join(', ') : 'No plugins'}
            </span>
            {group.id === '@all' ? (
              <Badge variant="outline">Built in</Badge>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={() => setEditing(group)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => void window.desktop.groups.delete(group.id)}>
                  Delete group
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function GroupForm(props: {
  group: Group
  plugins: PluginInfo[]
  isNew: boolean
  onDone: () => void
}) {
  const [name, setName] = useState(props.group.id)
  const [members, setMembers] = useState(new Set(props.group.members))
  const [error, setError] = useState<string>()
  const id = name.startsWith('@') ? name.trim() : `@${name.trim()}`
  const toggle = (pluginId: string) =>
    setMembers(current => {
      const next = new Set(current)
      if (!next.delete(pluginId)) next.add(pluginId)
      return next
    })

  return (
    <form
      className="flex flex-col gap-3 rounded-md border p-3"
      onSubmit={e => {
        e.preventDefault()
        window.desktop.groups
          .save({ id, members: [...members] })
          .then(async () => {
            if (!props.isNew && id !== props.group.id) await window.desktop.groups.delete(props.group.id)
            props.onDone()
          })
          .catch((err: Error) => setError(err.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')))
      }}
    >
      <Field label="Group name">
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </Field>
      <fieldset className="flex flex-col gap-1.5 text-sm">
        <legend className="mb-1.5 font-medium">Plugins</legend>
        {props.plugins.map(plugin => (
          <label key={plugin.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={members.has(plugin.id)}
              onChange={() => toggle(plugin.id)}
            />
            {plugin.label}
          </label>
        ))}
      </fieldset>
      <div className="flex gap-2">
        <Button type="submit" size="sm">Save group</Button>
        <Button type="button" size="sm" variant="ghost" onClick={props.onDone}>Cancel</Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}
