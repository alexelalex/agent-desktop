import { SEVERITIES, type Severity } from '@/lib/triggers'
import type { TriggerSource } from '../types'
import { tenantFetch } from './tokens'

interface Detection {
  _id: string
  timestamp?: string
  anomaly_severity?: number
  status?: string
  activity_type?: string
  resource_id?: string
  resource_name?: string
  resource_type?: string
  triage_summary?: string | null
}

// A burst of detections starts at most this many runs per trigger and poll.
const MAX_PER_POLL = 5

const detectionContext = (d: Detection) =>
  `This run was started by a new detection:\n\n${JSON.stringify(
    {
      id: d._id,
      severity: SEVERITIES[d.anomaly_severity as Severity],
      timestamp: d.timestamp,
      activity_type: d.activity_type,
      resource: d.resource_name ?? d.resource_id,
      resource_type: d.resource_type,
      triage_summary: d.triage_summary ?? undefined,
    },
    null,
    2,
  )}`

/** "New detection": polls the tenant for detections at or above the trigger's severity. */
export const newDetection: TriggerSource = {
  async poll(plugin, trigger, state) {
    if (trigger.kind !== 'detection') return { contexts: [], state }
    const lastSeenAt = state.lastSeenAt as number | undefined
    // The first poll only marks where the next one starts.
    if (lastSeenAt === undefined) {
      return { contexts: [], state: { ...state, lastSeenAt: Date.now() } }
    }
    const url = new URL(`${plugin.origin}/openapi/detections`)
    url.searchParams.set('from_timestamp', new Date(lastSeenAt).toISOString())
    url.searchParams.set('limit', '50')
    const response = await tenantFetch(plugin, url)
    if (!response.ok) return { contexts: [], state }
    const detections = ((await response.json()) as { results?: Detection[] }).results ?? []

    const time = (d: Detection) => Date.parse(d.timestamp ?? '') || 0
    const seen = new Set((state.seen as string[] | undefined) ?? [])
    const fresh = detections
      .filter(
        d =>
          !seen.has(d._id) &&
          d.status !== 'closed' &&
          (d.anomaly_severity ?? 0) >= trigger.minSeverity,
      )
      .sort((a, b) => time(a) - time(b))
    const started = fresh.slice(0, MAX_PER_POLL)
    return {
      contexts: started.map(detectionContext),
      state: {
        ...state,
        // Past the cap, the rest wait for the next poll.
        lastSeenAt:
          fresh.length > MAX_PER_POLL
            ? time(started.at(-1)!)
            : Math.max(lastSeenAt, ...detections.map(time)),
        seen: [...started.map(d => d._id), ...seen].slice(0, 200),
      },
    }
  },
}
