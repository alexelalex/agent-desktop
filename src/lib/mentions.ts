import type { UIMessage } from 'ai'

/** The `@name` mentions in a text, in order, without repeats. */
export const mentionsIn = (text: string): string[] => [
  ...new Set(text.match(/(?<![\w@])@[\w-]+/g) ?? []),
]

/** Something `@` can name: a plugin by its id, or a group. */
export interface Mentionable {
  id: string
  label: string
  kind: 'plugin' | 'group'
}

// History keeps mentions as typed; the server also gets a line naming them as
// targets, so `@alpha` reads as the plugin alpha and `@all` as the group.
export function withMentionPrompts(
  messages: UIMessage[],
  known: Mentionable[],
): UIMessage[] {
  const byMention = new Map(
    known.map(m => [m.kind === 'group' ? m.id : `@${m.id}`, m]),
  )
  return messages.map(message => {
    if (message.role !== 'user') return message
    return {
      ...message,
      parts: message.parts.map(part => {
        if (part.type !== 'text') return part
        const named = mentionsIn(part.text).flatMap(m => byMention.get(m) ?? [])
        if (named.length === 0) return part
        const list = named
          .map(m => (m.kind === 'group' ? `group ${m.id}` : `plugin ${m.id}`))
          .join(', ')
        return { ...part, text: `${part.text}\n\nTargets named here: ${list}.` }
      }),
    }
  })
}
