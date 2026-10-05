import type { DynamicToolUIPart, UIMessage } from 'ai'
import type { ArtifactRef } from './artifacts'
import type { ReplacedAttempt } from './desktop'
import type { Step, StepStatus } from './todo'

// The desktop MCP server's UI tools, as a Claude Code session's transcript names
// them once the `mcp__<server>__` prefix is dropped.
export const SET_PLAN = 'ui_set_plan'
export const UPDATE_STEP = 'ui_update_step'
export const POST_ACTIVITY = 'ui_post_activity'
export const RENDER_ARTIFACT = 'ui_render_artifact'
export const REQUEST_APPROVAL = 'ui_request_approval'
/** Claude Code's own tool for asking the user multiple-choice questions. */
export const ASK_USER_QUESTION = 'AskUserQuestion'
export const UI_TOOLS = new Set([
  SET_PLAN,
  UPDATE_STEP,
  POST_ACTIVITY,
  RENDER_ARTIFACT,
  REQUEST_APPROVAL,
])

/** How to start Claude Code so the app can message its terminal sessions. */
export const CHANNELS_COMMAND =
  'claude --dangerously-load-development-channels plugin:agent-desktop@agent-desktop-local'

/** Where an action sits: a json_table row by its first cell, or a markdown heading by its text. */
export type ActionAnchor = { key: string } | { heading: string }

/** Work the agent offers on an artifact; the user launches it as a task. */
export interface ArtifactAction {
  id: string
  label: string
  title: string
  /** Left out under a heading anchor: the first fenced block under that heading. */
  prompt?: string
  anchor?: ActionAnchor
  cwd?: string
  worktree?: boolean
  base?: string
}

export interface ClaudeCodeArtifact {
  id: string
  title: string
  format: 'markdown' | 'mermaid' | 'json_table'
  content: string
  actions: ArtifactAction[]
  /** Its latest render is still in flight. */
  pending?: boolean
}

export interface ActivityInput {
  message?: string
  tenantId?: string
  level?: 'info' | 'warning' | 'error' | 'success'
}

export interface ApprovalInput {
  tenantId?: string
  action?: string
  description?: string
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  payload?: Record<string, unknown>
}

function uiCalls(messages: UIMessage[]): DynamicToolUIPart[] {
  return messages.flatMap(m =>
    m.parts.filter(
      (p): p is DynamicToolUIPart =>
        p.type === 'dynamic-tool' && UI_TOOLS.has(p.toolName),
    ),
  )
}

// A call the server rejected (e.g. an unknown step) changed nothing.
const accepted = (part: DynamicToolUIPart) => part.state !== 'output-error'

export const MAX_ACTIONS = 20
export const MAX_LABEL = 24
export const MAX_TITLE = 80
export const MAX_PROMPT = 8_000
export const MAX_PROMPTS = 60_000
export const ACTION_ID = /^[a-z0-9][a-z0-9-]{0,63}$/

/** An ATX heading outside fenced code: its text without the `#`s, whitespace collapsed. */
export interface Heading {
  text: string
  line: number
}

const collapse = (text: string) => text.replace(/\s+/g, ' ').trim()
/** How an anchor names a heading: the same text, with any leading `#`s it was given dropped. */
export const headingText = (text: string) => collapse(text.replace(/^\s*#{1,6}(?=\s|$)/, ''))

type Fence = { char: string; length: number; indent: number }

function fenceOpen(line: string): Fence | undefined {
  const match = line.match(/^( {0,3})(`{3,}|~{3,})(.*)$/)
  if (!match) return undefined
  // A backtick fence's info string can't hold a backtick.
  if (match[2][0] === '`' && match[3].includes('`')) return undefined
  return { char: match[2][0], length: match[2].length, indent: match[1].length }
}

// CommonMark: the same character, at least as long, and nothing after it.
const fenceCloses = (line: string, fence: Fence) => {
  const match = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/)
  return !!match && match[1][0] === fence.char && match[1].length >= fence.length
}

/** Each line of `markdown`, with the fence it opens or sits in. */
function scan(markdown: string) {
  const lines = markdown.split(/\r?\n/)
  let fence: Fence | undefined
  return lines.map((text, index) => {
    if (fence) {
      const closing = fenceCloses(text, fence)
      const at = { text, index, fence, role: closing ? ('close' as const) : ('inside' as const) }
      if (closing) fence = undefined
      return at
    }
    const opened = fenceOpen(text)
    if (opened) {
      fence = opened
      return { text, index, fence: opened, role: 'open' as const }
    }
    return { text, index, fence: undefined, role: 'text' as const }
  })
}

export function headingsOf(markdown: string): Heading[] {
  return scan(markdown).flatMap(({ text, index, role }) => {
    if (role !== 'text') return []
    const match = text.match(/^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/)
    if (!match) return []
    // A closing sequence of #s goes when a space comes before it, or it's all there is.
    const body = (match[2] ?? '').replace(/(^|[ \t]+)#+$/, '')
    return [{ text: collapse(body), line: index }]
  })
}

/** Each closed ```mermaid block of a markdown document, as the renderer would draw it. */
export function mermaidBlocks(markdown: string): string[] {
  const blocks: string[] = []
  let body: string[] | undefined
  for (const line of scan(markdown)) {
    if (line.role === 'open') body = /^ {0,3}(`{3,}|~{3,})\s*mermaid(\s|$)/i.test(line.text) ? [] : undefined
    else if (line.role === 'inside') body?.push(line.text)
    else if (line.role === 'close' && body) {
      blocks.push(body.join('\n'))
      body = undefined
    }
  }
  return blocks
}

/** The first fenced block under the heading on `line`, before the next heading: its fence lines and content. */
export function fencedBlockUnder(
  markdown: string,
  line: number,
): { open: number; close: number; content: string } | undefined {
  const lines = scan(markdown)
  const headings = new Set(headingsOf(markdown).map(h => h.line))
  for (let i = line + 1; i < lines.length; i++) {
    const at = lines[i]
    if (headings.has(i)) return undefined
    if (at.role !== 'open') continue
    const body: string[] = []
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].role === 'close' && lines[j].fence === at.fence)
        return { open: i, close: j, content: body.join('\n') }
      body.push(lines[j].text.replace(new RegExp(`^ {0,${at.fence!.indent}}`), ''))
    }
    // An unclosed fence runs to the end of the document, past later headings.
    return undefined
  }
  return undefined
}

/** The content of the first fenced block under the heading on `line`, before the next heading. */
export const fencedUnder = (markdown: string, line: number) =>
  fencedBlockUnder(markdown, line)?.content

/**
 * The markdown cut after each of `lines` (heading lines), so a row can follow each heading.
 * Every chunk repeats the reference-style link definitions, which resolve across the document.
 */
export function splitAtHeadings(markdown: string, lines: number[]): string[] {
  const scanned = scan(markdown)
  const definitions = scanned
    .filter(l => l.role === 'text' && /^ {0,3}\[[^\]]+\]:\s*\S/.test(l.text))
    .map(l => l.text)
  const footer = definitions.length > 0 ? `\n\n${definitions.join('\n')}` : ''
  const cuts = [...new Set(lines)].sort((a, b) => a - b)
  const chunks: string[] = []
  let from = 0
  for (const cut of [...cuts, scanned.length - 1]) {
    if (cut < from) continue
    chunks.push(scanned.slice(from, cut + 1).map(l => l.text).join('\n') + footer)
    from = cut + 1
  }
  return chunks.length > cuts.length ? chunks : [...chunks, '']
}

/** `String(row[0])` of each array row; undefined for a row that isn't an array. */
export function rowKeys(content: string): (string | undefined)[] {
  try {
    const rows = (JSON.parse(content) as { rows?: unknown })?.rows
    return Array.isArray(rows) ? rows.map(row => (Array.isArray(row) ? String(row[0]) : undefined)) : []
  } catch {
    return []
  }
}

type Artifactish = Pick<ClaudeCodeArtifact, 'format' | 'content'>

/** Where an action sits, or why its anchor fits nothing. */
export type Placement = { row: number } | { line: number } | { tray: true }

export function resolveAnchor(
  artifact: Artifactish,
  anchor: ActionAnchor | undefined,
): { placement: Placement } | { problem: string } {
  if (!anchor) return { placement: { tray: true } }
  const { format, content } = artifact
  if (format === 'mermaid') return { problem: 'actions on a mermaid artifact take no anchor' }
  if ('key' in anchor) {
    if (format !== 'json_table') return { problem: 'a key anchor needs a json_table artifact; use { heading }' }
    const keys = rowKeys(content)
    const rows = keys.flatMap((k, i) => (k === anchor.key ? [i] : []))
    if (rows.length === 1) return { placement: { row: rows[0] } }
    const known = [...new Set(keys.filter(k => k !== undefined))]
    return {
      problem:
        rows.length === 0
          ? `its key "${anchor.key}" matches no row. The keys are: ${known.map(k => `"${k}"`).join(', ') || 'none'}`
          : `its key "${anchor.key}" matches ${rows.length} rows`,
    }
  }
  if (format !== 'markdown') return { problem: 'a heading anchor needs a markdown artifact; use { key }' }
  const wanted = headingText(anchor.heading)
  const headings = headingsOf(content)
  const found = headings.filter(h => h.text === wanted)
  if (found.length === 1) return { placement: { line: found[0].line } }
  return {
    problem:
      found.length === 0
        ? `its heading "${wanted}" matches no heading. The headings are: ${headings.map(h => `"${h.text}"`).join(', ') || 'none'}`
        : `its heading "${wanted}" matches ${found.length} headings`,
  }
}

/** The action's prompt: its own, else the first fenced block under its heading. */
export function resolvePrompt(artifact: Artifactish, action: ArtifactAction): string | undefined {
  if (action.prompt !== undefined) return action.prompt
  if (!action.anchor || !('heading' in action.anchor) || artifact.format !== 'markdown') return undefined
  const resolved = resolveAnchor(artifact, action.anchor)
  return 'placement' in resolved && 'line' in resolved.placement
    ? fencedUnder(artifact.content, resolved.placement.line)
    : undefined
}

/** Each action's place in the artifact; one whose anchor fits nothing goes to the tray. */
export function placeActions(artifact: ClaudeCodeArtifact) {
  const rows = new Map<number, ArtifactAction[]>()
  const headings = new Map<number, ArtifactAction[]>()
  const tray: ArtifactAction[] = []
  for (const action of artifact.actions) {
    const resolved = resolveAnchor(artifact, action.anchor)
    const placement: Placement = 'placement' in resolved ? resolved.placement : { tray: true }
    if ('row' in placement) rows.set(placement.row, [...(rows.get(placement.row) ?? []), action])
    else if ('line' in placement)
      headings.set(placement.line, [...(headings.get(placement.line) ?? []), action])
    else tray.push(action)
  }
  return { rows, headings, tray }
}

/** FNV-1a over the UTF-8 bytes, as hex: tells when an agent's prompt changed. */
export function promptHash(text: string): string {
  let hash = 0x811c9dc5
  for (const byte of new TextEncoder().encode(text)) {
    hash ^= byte
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

// The transcript holds what the agent sent; only well-formed actions are read back.
function actionsOf(value: unknown): ArtifactAction[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.flatMap((a): ArtifactAction[] => {
    if (!a || typeof a !== 'object' || typeof a.id !== 'string') return []
    const anchor =
      a.anchor && typeof a.anchor.key === 'string'
        ? { key: a.anchor.key }
        : a.anchor && typeof a.anchor.heading === 'string'
          ? { heading: a.anchor.heading }
          : undefined
    return [
      {
        id: a.id,
        label: String(a.label ?? a.id),
        title: String(a.title ?? a.label ?? a.id),
        ...(typeof a.prompt === 'string' && { prompt: a.prompt }),
        ...(anchor && { anchor }),
        ...(typeof a.cwd === 'string' && { cwd: a.cwd }),
        ...(a.worktree === true && { worktree: true }),
        ...(typeof a.base === 'string' && { base: a.base }),
      },
    ]
  })
}

/** The session's plan, replayed from its plan calls in order. */
export function claudeCodePlan(
  messages: UIMessage[],
): { goal?: string; steps: Step[] } | undefined {
  let plan: { goal?: string; steps: Step[] } | undefined
  for (const part of uiCalls(messages)) {
    if (!accepted(part)) continue
    const input = (part.input ?? {}) as Record<string, unknown>
    if (part.toolName === SET_PLAN) {
      const steps = (input.steps as Partial<Step>[] | undefined) ?? []
      plan = {
        goal: typeof input.goal === 'string' ? input.goal : undefined,
        steps: steps.map((s, i) => ({
          id: s.id ?? `step-${i + 1}`,
          title: s.title ?? '',
          status: s.status ?? 'pending',
          tools: [],
          assignee: 'self',
          targets: s.targets,
          dependsOn: s.dependsOn,
          note: s.note,
        })),
      }
    } else if (part.toolName === UPDATE_STEP && plan) {
      const { stepId, status, note } = input as {
        stepId?: string
        status?: StepStatus
        note?: string
      }
      plan = {
        ...plan,
        steps: plan.steps.map(s =>
          s.id === stepId
            ? { ...s, status: status ?? s.status, note: note ?? s.note }
            : s,
        ),
      }
    }
  }
  return plan
}

const inFlight = (part: DynamicToolUIPart) => !part.state.startsWith('output-')

/**
 * The session's artifacts, latest render of each id, in first-render order. A render
 * without `actions` keeps the previous ones. A call still in flight counts only while
 * the session is `running` (or awaiting approval); `skip` leaves one call out.
 */
export function claudeCodeArtifacts(
  messages: UIMessage[],
  options: { running?: boolean; skip?: string } = {},
): ClaudeCodeArtifact[] {
  const byId = new Map<string, ClaudeCodeArtifact>()
  for (const part of uiCalls(messages)) {
    if (part.toolName !== RENDER_ARTIFACT || part.toolCallId === options.skip) continue
    if (part.state === 'output-error' || (inFlight(part) && !options.running)) continue
    const input = (part.input ?? {}) as Record<string, unknown>
    if (typeof input.id !== 'string' || !input.id) continue
    const format = input.format === 'mermaid' || input.format === 'json_table' ? input.format : 'markdown'
    byId.set(input.id, {
      id: input.id,
      title: typeof input.title === 'string' ? input.title : input.id,
      format,
      content: String(input.content ?? ''),
      actions: actionsOf(input.actions) ?? byId.get(input.id)?.actions ?? [],
      ...(inFlight(part) && { pending: true }),
    })
  }
  return [...byId.values()]
}

export const artifactRefs = (messages: UIMessage[]): ArtifactRef[] =>
  claudeCodeArtifacts(messages).map((a, i) => ({
    id: a.id,
    title: a.title,
    revision: i + 1,
    updatedAt: 0,
    kind: 'view',
    ...(a.actions.length > 0 && {
      actions: a.actions.map(action => action.id),
      bookmarks: a.actions.map(action => ({
        id: action.id,
        title: action.title,
        label: action.label,
        hash: promptHash(resolvePrompt(a, action) ?? ''),
      })),
    }),
  }))

/** The replaced attempts still on the session's line: a later retry from an earlier message replaced the others' place too. */
export const attemptsOnLine = (attempts: ReplacedAttempt[] = []) =>
  attempts
    .map((attempt, index) => ({ ...attempt, index }))
    .filter(a => !attempts.slice(a.index + 1).some(later => later.at < a.at))
