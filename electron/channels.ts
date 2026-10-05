import { randomUUID } from 'node:crypto'
import { safeStorage } from 'electron'
import {
  CHANNEL_KINDS,
  DESKTOP_CHANNEL,
  type ChannelInfo,
  type ChannelInput,
} from '@/lib/channels'
import { readJson, writeJson } from './store'

/** A channel with its secrets, to send through. */
export type Channel = { id: string; name: string } & (
  | { kind: 'desktop' }
  | ChannelInput
)

// The whole input is sealed, since webhook URLs and SMTP passwords are secrets.
interface StoredChannel {
  id: string
  info: ChannelInfo
  sealed: string
  encrypted: boolean
}

const FILE = 'channels.json'
let stored: StoredChannel[] | undefined
const all = () => (stored ??= readJson<StoredChannel[]>(FILE, []))

const DESKTOP: ChannelInfo = {
  id: DESKTOP_CHANNEL,
  kind: 'desktop',
  name: 'Desktop notification',
  detail: 'This computer',
}

function detailOf(input: ChannelInput): string {
  if (input.kind === 'email') return input.to.join(', ')
  try {
    return new URL(input.url).host
  } catch {
    return CHANNEL_KINDS[input.kind]
  }
}

export function listChannels(): ChannelInfo[] {
  return [DESKTOP, ...all().map(c => c.info)]
}

export function addChannel(input: ChannelInput): ChannelInfo {
  const id = randomUUID()
  const info: ChannelInfo = {
    id,
    kind: input.kind,
    name: input.name.trim() || CHANNEL_KINDS[input.kind],
    detail: detailOf(input),
  }
  const json = JSON.stringify(input)
  const encrypted = safeStorage.isEncryptionAvailable()
  const sealed = encrypted
    ? safeStorage.encryptString(json).toString('base64')
    : json
  stored = [...all(), { id, info, sealed, encrypted }]
  writeJson(FILE, stored)
  return info
}

export function removeChannel(id: string) {
  stored = all().filter(c => c.id !== id)
  writeJson(FILE, stored)
}

export function channelFor(id: string): Channel | undefined {
  if (id === DESKTOP_CHANNEL) return { kind: 'desktop', id, name: DESKTOP.name }
  const channel = all().find(c => c.id === id)
  if (!channel) return undefined
  const json = channel.encrypted
    ? safeStorage.decryptString(Buffer.from(channel.sealed, 'base64'))
    : channel.sealed
  return { ...(JSON.parse(json) as ChannelInput), id, name: channel.info.name }
}
