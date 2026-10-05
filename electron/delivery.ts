import { randomUUID } from 'node:crypto'
import { Notification } from 'electron'
import nodemailer from 'nodemailer'
import type { Artifact } from '@/lib/artifacts'
import type { Delivery } from '@/lib/channels'
import type { OpenRun, RunSummary } from '@/lib/desktop'
import { listAgents } from './agents'
import { listArtifacts } from './artifacts'
import { channelFor, type Channel } from './channels'
import { artifactMessage, toChatMarkup, toEmailHtml } from './render-artifact'
import type { RunManager } from './runs'
import { readJson, writeJson } from './store'

const TIMEOUT_MS = 20_000
// Slack rejects a section over 3,000 characters and a message over 50 blocks.
const SLACK_SECTION_CHARS = 2_900
const SLACK_MAX_SECTIONS = 45

const fileOf = (runId: string) => `deliveries/${runId}.json`
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

function chunk(text: string, size: number): string[] {
  const chunks: string[] = []
  let rest = text
  while (rest.length > size) {
    const cut = Math.max(rest.lastIndexOf('\n', size), size / 2)
    chunks.push(rest.slice(0, cut))
    rest = rest.slice(cut).replace(/^\n+/, '')
  }
  return rest ? [...chunks, rest] : chunks
}

const plainText = (markdown: string) =>
  markdown
    .replace(/[#*_`>|]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

async function post(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 200)
    throw new Error(`HTTP ${response.status}${detail ? `: ${detail}` : ''}`)
  }
}

/** Sends artifacts to channels: by subscription when an agent's run completes, or on demand. */
export class DeliveryManager {
  private notifications = new Set<Notification>()

  constructor(
    private readonly runs: RunManager,
    private readonly openRun: (target: OpenRun) => void,
    private readonly broadcast: (channel: string, payload: unknown) => void,
  ) {
    runs.onSettled(run => void this.settled(run))
  }

  list(runId: string): Delivery[] {
    return readJson<Delivery[]>(fileOf(runId), [])
  }

  async send(
    runId: string,
    artifactId: string,
    channelIds: string[],
    manual: boolean,
  ): Promise<Delivery[]> {
    const run = this.runs.summary(runId)
    const artifact = listArtifacts(runId).find(a => a.id === artifactId)
    if (!run || !artifact) throw new Error('The artifact no longer exists.')
    const deliveries = await Promise.all(
      channelIds.map(async (channelId): Promise<Delivery> => {
        const channel = channelFor(channelId)
        const delivery = {
          id: randomUUID(),
          runId,
          artifactId,
          revision: artifact.revision,
          channelId,
          channelName: channel?.name ?? 'Deleted channel',
          manual,
          at: Date.now(),
        }
        try {
          if (!channel) throw new Error('The channel was deleted.')
          await this.deliver(channel, run, artifact)
          return { ...delivery, status: 'sent' }
        } catch (error) {
          return { ...delivery, status: 'failed', error: errorText(error) }
        }
      }),
    )
    writeJson(fileOf(runId), [...this.list(runId), ...deliveries])
    this.broadcast('deliveries:changed', runId)
    return deliveries
  }

  private async settled(run: RunSummary) {
    if (run.status !== 'completed' || !run.agentId) return
    const agent = listAgents().find(a => a.id === run.agentId)
    for (const subscription of agent?.notifications ?? []) {
      const artifact = listArtifacts(run.id).find(
        a => a.id === subscription.artifactId,
      )
      if (!artifact) continue
      // A revision goes to each channel once, however often the run completes.
      const log = this.list(run.id)
      const pending = subscription.channelIds.filter(
        channelId =>
          !log.some(
            d =>
              d.artifactId === artifact.id &&
              d.revision === artifact.revision &&
              d.channelId === channelId &&
              d.status === 'sent',
          ),
      )
      if (pending.length > 0) await this.send(run.id, artifact.id, pending, false)
    }
  }

  private async deliver(channel: Channel, run: RunSummary, artifact: Artifact) {
    const { subject, markdown } = artifactMessage(artifact)
    const agent = run.agentId
      ? listAgents().find(a => a.id === run.agentId)
      : undefined
    switch (channel.kind) {
      case 'desktop': {
        const notification = new Notification({
          title: agent ? `${agent.name}: ${subject}` : subject,
          body: plainText(markdown).slice(0, 240),
        })
        // Held until closed: a collected notification loses its click handler.
        this.notifications.add(notification)
        notification.on('close', () => this.notifications.delete(notification))
        notification.on('click', () => {
          this.notifications.delete(notification)
          this.openRun({ run, artifactId: artifact.id })
        })
        notification.show()
        return
      }
      case 'slack':
        return post(channel.url, {
          text: subject,
          blocks: [
            {
              type: 'header',
              text: { type: 'plain_text', text: subject.slice(0, 150) },
            },
            ...chunk(toChatMarkup(markdown), SLACK_SECTION_CHARS)
              .slice(0, SLACK_MAX_SECTIONS)
              .map(text => ({ type: 'section', text: { type: 'mrkdwn', text } })),
          ],
        })
      case 'google-chat':
        return post(channel.url, {
          text: `*${subject}*\n\n${toChatMarkup(markdown)}`.slice(0, 30_000),
        })
      case 'teams':
        return post(channel.url, {
          type: 'message',
          attachments: [
            {
              contentType: 'application/vnd.microsoft.card.adaptive',
              content: {
                $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                type: 'AdaptiveCard',
                version: '1.4',
                body: [
                  {
                    type: 'TextBlock',
                    text: subject,
                    weight: 'Bolder',
                    size: 'Medium',
                    wrap: true,
                  },
                  { type: 'TextBlock', text: markdown.slice(0, 20_000), wrap: true },
                ],
              },
            },
          ],
        })
      case 'webhook':
        return post(channel.url, {
          event: 'artifact.published',
          agent: agent ? { id: agent.id, name: agent.name } : null,
          run: {
            id: run.id,
            trigger: run.trigger,
            startedAt: new Date(run.createdAt).toISOString(),
          },
          artifact: {
            id: artifact.id,
            title: artifact.title,
            revision: artifact.revision,
            content: artifact.content,
          },
          subject,
          markdown,
        })
      case 'email': {
        const transport = nodemailer.createTransport({
          host: channel.host,
          port: channel.port,
          secure: channel.secure,
          auth: channel.user
            ? { user: channel.user, pass: channel.password }
            : undefined,
          connectionTimeout: TIMEOUT_MS,
          greetingTimeout: TIMEOUT_MS,
          socketTimeout: TIMEOUT_MS,
        })
        await transport.sendMail({
          from: channel.from,
          to: channel.to,
          subject,
          text: markdown,
          html: toEmailHtml(subject, markdown),
        })
        return
      }
    }
  }
}
