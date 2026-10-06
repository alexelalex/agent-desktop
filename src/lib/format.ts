const started = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export const formatStarted = (time: number) => started.format(time)

export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 })
const whole = new Intl.NumberFormat()

/** `425810` → `425.8K`. */
export const formatTokens = (tokens: number) => compact.format(tokens)
export const formatCount = (count: number) => whole.format(count)
