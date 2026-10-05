import {
  CircleCheckIcon,
  CircleXIcon,
  PlusIcon,
  SendIcon,
  Trash2Icon,
} from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import type { Artifact } from '@/lib/artifacts'
import {
  CHANNEL_KINDS,
  DESKTOP_CHANNEL,
  type ChannelInfo,
  type ChannelInput,
  type Delivery,
} from '@/lib/channels'
import { formatStarted } from '@/lib/format'
import type { Template } from '@/lib/templates'

export function DeliveryLine({ delivery }: { delivery: Delivery }) {
  const failed = delivery.status === 'failed'
  const Icon = failed ? CircleXIcon : CircleCheckIcon
  return (
    <li className="flex items-start gap-2 text-xs">
      <Icon
        aria-hidden
        className={`mt-0.5 size-3.5 shrink-0 ${failed ? 'text-destructive' : 'text-muted-foreground'}`}
      />
      <span className="min-w-0 flex-1">
        {failed ? 'Failed to send to ' : 'Sent to '}
        {delivery.channelName} · revision {delivery.revision} ·{' '}
        {formatStarted(delivery.at)}
        {delivery.manual && ' · sent now'}
        {delivery.error && (
          <span className="block text-destructive">{delivery.error}</span>
        )}
      </span>
    </li>
  )
}

/** Where an artifact goes: an agent's subscriptions, or a one-off send. Mount it to open it. */
export function NotifyDialog(props: {
  onClose: () => void
  runId: string
  artifact: Artifact
  /** The run's agent; without one, the artifact can only be sent now. */
  agent?: Template
  channels: ChannelInfo[]
  deliveries: Delivery[]
  onSaveAgent: (agent: Template) => void
}) {
  const { runId, artifact, agent, channels, onSaveAgent } = props
  // The dialog owns the choice while it's open, so quick changes don't race
  // the save; without an agent, it only picks where Send now goes.
  const [chosen, setChosen] = useState<string[]>(() =>
    agent
      ? (agent.notifications?.find(n => n.artifactId === artifact.id)
          ?.channelIds ?? [])
      : [DESKTOP_CHANNEL],
  )
  const selected = chosen.filter(id => channels.some(c => c.id === id))
  const [adding, setAdding] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<Delivery[]>()

  const setSelected = (channelIds: string[]) => {
    setChosen(channelIds)
    if (!agent) return
    const others = (agent.notifications ?? []).filter(
      n => n.artifactId !== artifact.id,
    )
    onSaveAgent({
      ...agent,
      notifications:
        channelIds.length > 0
          ? [...others, { artifactId: artifact.id, channelIds }]
          : others,
    })
  }
  const toggle = (id: string) =>
    setSelected(
      selected.includes(id) ? selected.filter(c => c !== id) : [...selected, id],
    )

  const sendNow = async () => {
    setSending(true)
    try {
      setSent(await window.desktop.deliveries.send(runId, artifact.id, selected))
    } finally {
      setSending(false)
    }
  }

  const history = props.deliveries
    .filter(d => d.artifactId === artifact.id)
    .slice(-8)
    .reverse()

  return (
    <Dialog open onOpenChange={open => !open && props.onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>
            {agent
              ? `Each completed run of ${agent.name} that publishes "${artifact.id}" sends it to the channels you check.`
              : "This chat isn't an agent, so nothing is sent on its own. Send it now, or save the chat as a template to send it on every run."}
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col divide-y rounded-md border">
          {channels.map(channel => (
            <li key={channel.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <input
                type="checkbox"
                id={`channel-${channel.id}`}
                className="size-4 accent-primary"
                checked={selected.includes(channel.id)}
                onChange={() => toggle(channel.id)}
              />
              <label htmlFor={`channel-${channel.id}`} className="min-w-0 flex-1">
                <span className="font-medium">{channel.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {channel.kind === 'desktop'
                    ? channel.detail
                    : `${CHANNEL_KINDS[channel.kind]} · ${channel.detail}`}
                </span>
              </label>
              {channel.id !== DESKTOP_CHANNEL && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Delete ${channel.name}`}
                  title="Delete channel"
                  onClick={() => {
                    setChosen(chosen.filter(id => id !== channel.id))
                    void window.desktop.channels.remove(channel.id)
                  }}
                >
                  <Trash2Icon />
                </Button>
              )}
            </li>
          ))}
        </ul>

        {adding ? (
          <ChannelForm
            onCancel={() => setAdding(false)}
            onAdd={async input => {
              const channel = await window.desktop.channels.add(input)
              setSelected([...chosen, channel.id])
              setAdding(false)
            }}
          />
        ) : (
          <Button variant="outline" size="sm" className="w-fit" onClick={() => setAdding(true)}>
            <PlusIcon /> Add channel
          </Button>
        )}

        {(sent ?? history).length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {(sent ?? history).map(delivery => (
              <DeliveryLine key={delivery.id} delivery={delivery} />
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button
            disabled={selected.length === 0 || sending}
            onClick={() => void sendNow()}
          >
            <SendIcon /> {sending ? 'Sending…' : `Send revision ${artifact.revision} now`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type Kind = ChannelInput['kind']
const FORM_KINDS: Kind[] = ['slack', 'teams', 'google-chat', 'webhook', 'email']

function Field(props: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={props.id} className="text-xs font-medium text-muted-foreground">
        {props.label}
      </label>
      {props.children}
    </div>
  )
}

function ChannelForm(props: {
  onCancel: () => void
  onAdd: (channel: ChannelInput) => Promise<void>
}) {
  const id = useId()
  const [kind, setKind] = useState<Kind>('slack')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [to, setTo] = useState('')
  const [from, setFrom] = useState('')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('587')
  const [secure, setSecure] = useState(false)
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()

  const recipients = to.split(/[,;\s]+/).filter(Boolean)
  const validUrl = (() => {
    try {
      return /^https?:$/.test(new URL(url).protocol)
    } catch {
      return false
    }
  })()
  const problem =
    kind === 'email'
      ? (recipients.length === 0 && 'Add a recipient.') ||
        (!from.trim() && 'Add a sender address.') ||
        (!host.trim() && 'Add the SMTP server.') ||
        (!(Number(port) > 0 && Number(port) < 65536) && 'The port is a number from 1 to 65535.') ||
        undefined
      : validUrl
        ? undefined
        : 'Paste the webhook URL.'

  const add = () => {
    const input: ChannelInput =
      kind === 'email'
        ? {
            kind,
            name,
            to: recipients,
            from: from.trim(),
            host: host.trim(),
            port: Number(port),
            secure,
            user: user.trim() || undefined,
            password: password || undefined,
          }
        : { kind, name, url: url.trim() }
    props.onAdd(input).catch((e: unknown) =>
      setError(e instanceof Error ? e.message : String(e)),
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kind" id={`${id}-kind`}>
          <Select value={kind} onValueChange={v => setKind(v as Kind)}>
            <SelectTrigger id={`${id}-kind`} aria-label="Channel kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORM_KINDS.map(k => (
                <SelectItem key={k} value={k}>
                  {CHANNEL_KINDS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Name" id={`${id}-name`}>
          <Input
            id={`${id}-name`}
            placeholder={kind === 'email' ? 'Security team' : '#secops'}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </Field>
      </div>
      {kind === 'email' ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="To" id={`${id}-to`}>
            <Input id={`${id}-to`} placeholder="a@example.com, b@example.com" value={to} onChange={e => setTo(e.target.value)} />
          </Field>
          <Field label="From" id={`${id}-from`}>
            <Input id={`${id}-from`} placeholder="agent@example.com" value={from} onChange={e => setFrom(e.target.value)} />
          </Field>
          <Field label="SMTP server" id={`${id}-host`}>
            <Input id={`${id}-host`} placeholder="smtp.example.com" value={host} onChange={e => setHost(e.target.value)} />
          </Field>
          <Field label="Port" id={`${id}-port`}>
            <Input id={`${id}-port`} inputMode="numeric" value={port} onChange={e => setPort(e.target.value)} />
          </Field>
          <Field label="Username (optional)" id={`${id}-user`}>
            <Input id={`${id}-user`} value={user} onChange={e => setUser(e.target.value)} />
          </Field>
          <Field label="Password (optional)" id={`${id}-password`}>
            <Input id={`${id}-password`} type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </Field>
          <label className="col-span-2 flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={secure}
              onChange={e => setSecure(e.target.checked)}
            />
            Use TLS from the start (usually port 465). Otherwise STARTTLS is used when the server offers it.
          </label>
        </div>
      ) : (
        <Field label="Webhook URL" id={`${id}-url`}>
          <Input id={`${id}-url`} placeholder="https://…" value={url} onChange={e => setUrl(e.target.value)} />
        </Field>
      )}
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 text-xs text-muted-foreground">
          {error ?? problem ?? 'Secrets are stored encrypted on this computer.'}
        </span>
        <Button size="sm" variant="ghost" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!!problem} onClick={add}>
          Add channel
        </Button>
      </div>
    </div>
  )
}
