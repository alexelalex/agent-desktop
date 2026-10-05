import { streamsec } from './streamsec'
import type { Kind, Plugin } from './types'

const KINDS: Record<string, Kind> = { [streamsec.id]: streamsec }

export function kindOf(plugin: Plugin): Kind {
  const kind = KINDS[plugin.kind]
  if (!kind) throw new Error(`Unknown plugin kind: ${plugin.kind}`)
  return kind
}

export const allKinds = (): Kind[] => Object.values(KINDS)
