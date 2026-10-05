// Where published artifacts go. The main process keeps the channels and their
// secrets (webhook URLs, SMTP passwords); the window only sees ChannelInfo.

export type ChannelKind =
  | 'desktop'
  | 'email'
  | 'slack'
  | 'teams'
  | 'google-chat'
  | 'webhook'

export const CHANNEL_KINDS: Record<ChannelKind, string> = {
  desktop: 'Desktop notification',
  email: 'E-mail (SMTP)',
  slack: 'Slack webhook',
  teams: 'Microsoft Teams webhook',
  'google-chat': 'Google Chat webhook',
  webhook: 'Webhook (JSON)',
}

/** Always there, with nothing to configure. */
export const DESKTOP_CHANNEL = 'desktop'

export interface ChannelInfo {
  id: string
  kind: ChannelKind
  name: string
  /** What it sends to, without secrets: recipients, or the webhook's host. */
  detail: string
}

export interface EmailSettings {
  host: string
  port: number
  /** TLS from the start (usually port 465); otherwise STARTTLS when offered. */
  secure: boolean
  user?: string
  password?: string
  from: string
  to: string[]
}

export type ChannelInput =
  | { kind: 'slack' | 'teams' | 'google-chat' | 'webhook'; name: string; url: string }
  | ({ kind: 'email'; name: string } & EmailSettings)

/** On an agent: each run that publishes `artifactId` sends it to the channels. */
export interface Subscription {
  artifactId: string
  channelIds: string[]
}

export interface Delivery {
  id: string
  runId: string
  artifactId: string
  revision: number
  channelId: string
  channelName: string
  status: 'sent' | 'failed'
  error?: string
  /** Sent with Send now rather than by a subscription. */
  manual: boolean
  at: number
}
