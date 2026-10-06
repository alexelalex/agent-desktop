import type { UIMessage } from 'ai'
import type { ReplyKind, SuggestedReply } from './desktop'

// Reply suggestions: a system-run Claude Code session suggests what the user may send next.

export const SUGGEST_REPLIES = 'ui_suggest_replies'
export const READ_CONVERSATION = 'ui_read_conversation'
export const SET_REPLY_NOTES = 'ui_set_reply_notes'
export const MAX_REPLIES = 3
export const MAX_LABEL = 40
export const MAX_REPLY = 600
export const MAX_NOTES = 12
export const MAX_NOTE = 160
export const REPLY_KINDS: ReplyKind[] = ['answer', 'next', 'redirect']
export const NONE_REASONS = ['working', 'nothing-to-answer', 'unclear']
/** A new chat's turn, before its first message: what the user may open with. */
export const START_TURN = 'start'

export const SUGGESTER_MODELS = [
  { id: 'claude-sonnet-5-5', label: 'Sonnet 5.5' },
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 (faster)' },
]
export const DEFAULT_SUGGESTER_MODEL = SUGGESTER_MODELS[0].id

/** Names the turn a message ends; a message that grows names a new one. */
export const turnKey = (message: UIMessage) => `${message.id}#${message.parts.length}`

/** A conversation as text for another session: what was said, and which tools ran. */
export function conversationText(messages: UIMessage[], max: number): string {
  const text = messages
    .map(m => {
      const said = m.parts.flatMap(p =>
        p.type === 'text' ? [p.text] : p.type === 'dynamic-tool' ? [`[tool: ${p.toolName}]`] : [],
      )
      return `${m.role === 'user' ? 'User' : 'Assistant'}: ${said.join('\n')}`
    })
    .join('\n\n')
  return text.length > max ? `…${text.slice(-max)}` : text
}

/** The replies in a ui_suggest_replies call, or every problem with them at once. */
export function checkReplies(args: Record<string, unknown>):
  | { replies: SuggestedReply[]; problems?: undefined }
  | { problems: string[]; replies?: undefined } {
  const problems: string[] = []
  const list = Array.isArray(args.replies) ? (args.replies as Record<string, unknown>[]) : []
  if (!Array.isArray(args.replies)) problems.push('replies must be an array.')
  if (list.length > MAX_REPLIES)
    problems.push(`Send at most ${MAX_REPLIES} replies; these are ${list.length}.`)
  if (list.length === 0 && !NONE_REASONS.includes(args.none_reason as string))
    problems.push(`With no replies, give none_reason: one of ${NONE_REASONS.join(', ')}.`)
  const labels = new Set<string>()
  const replies = list.map((r, i): SuggestedReply => {
    const name = `Reply ${i + 1}`
    const label = typeof r?.label === 'string' ? r.label.trim() : ''
    const text = typeof r?.text === 'string' ? r.text.trim() : ''
    const blank = typeof r?.blank === 'string' && r.blank ? r.blank : undefined
    if (!label) problems.push(`${name}: label is empty.`)
    else if (label.length > MAX_LABEL)
      problems.push(`${name}: label has ${label.length} characters; the most is ${MAX_LABEL}.`)
    else if (labels.has(label)) problems.push(`${name}: label repeats an earlier one.`)
    labels.add(label)
    if (!text) problems.push(`${name}: text is empty.`)
    else if (text.length > MAX_REPLY)
      problems.push(`${name}: text has ${text.length} characters; the most is ${MAX_REPLY}.`)
    // The composer runs a leading slash as a command, e.g. /approve.
    else if (text.startsWith('/'))
      problems.push(`${name}: text can't start with "/"; the message box would run it as a command.`)
    if (!REPLY_KINDS.includes(r?.kind as ReplyKind))
      problems.push(`${name}: kind must be one of ${REPLY_KINDS.join(', ')}.`)
    if (blank !== undefined && text && text.split(blank).length !== 2)
      problems.push(`${name}: blank must appear exactly once in text.`)
    return { label, text, kind: r?.kind as ReplyKind, ...(blank && { blank }) }
  })
  return problems.length > 0 ? { problems } : { replies }
}
