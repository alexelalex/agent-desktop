import { z } from 'zod'

// What a run publishes. A view is a tree of components, the same contract as
// Stream Security's chat artifacts (charts aside); a message is an e-mail or
// chat message, which notifications send as written.

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'muted'
  | 'outline'

export type ArtifactComponent =
  | {
      type: 'layout'
      direction: 'vertical' | 'horizontal'
      components: ArtifactComponent[]
      align?: 'start' | 'center' | 'end' | 'stretch'
    }
  | { type: 'card'; title: string; content: ArtifactComponent }
  | { type: 'typography'; content: string; size?: 'H1' | 'H2' | 'H3' | 'P' }
  | { type: 'badge'; text: string; variant?: BadgeVariant }
  | {
      type: 'alert'
      body: string
      title?: string
      variant?: 'default' | 'destructive' | 'warning'
    }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'separator'; orientation?: 'horizontal' | 'vertical' }
  | { type: 'kbd'; keys: string }
  | { type: 'progress'; value: number }
  | {
      type: 'metric'
      label: string
      value: string
      caption?: string
      badge?: { text: string; variant?: BadgeVariant }
    }

const badgeVariant = z
  .enum(['default', 'secondary', 'destructive', 'success', 'warning', 'muted', 'outline'])
  .describe(
    'Colour: "destructive" for critical/high, "warning" for medium, "success" for resolved/ok, "muted" for low.',
  )

export const artifactComponentSchema: z.ZodType<ArtifactComponent> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z
      .object({
        type: z.literal('layout'),
        direction: z.enum(['vertical', 'horizontal']),
        components: z.array(artifactComponentSchema),
        align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
      })
      .describe('Arranges child components in a column or a row: the main structural node.'),
    z
      .object({
        type: z.literal('card'),
        title: z.string(),
        content: artifactComponentSchema,
      })
      .describe('A titled panel around one child; use a layout inside for several.'),
    z
      .object({
        type: z.literal('typography'),
        content: z.string(),
        size: z.enum(['H1', 'H2', 'H3', 'P']).optional(),
      })
      .describe('A heading (H1–H3) or a paragraph (P, the default).'),
    z
      .object({
        type: z.literal('badge'),
        text: z.string(),
        variant: badgeVariant.optional(),
      })
      .describe('A small label for a status or severity.'),
    z
      .object({
        type: z.literal('alert'),
        body: z.string(),
        title: z.string().optional(),
        variant: z.enum(['default', 'destructive', 'warning']).optional(),
      })
      .describe('A callout for something the reader must not miss.'),
    z
      .object({
        type: z.literal('table'),
        columns: z.array(z.string()),
        rows: z.array(z.array(z.string())),
      })
      .describe('A table of plain-text cells; each row aligns to the columns.'),
    z
      .object({
        type: z.literal('separator'),
        orientation: z.enum(['horizontal', 'vertical']).optional(),
      })
      .describe('A divider line.'),
    z
      .object({ type: z.literal('kbd'), keys: z.string() })
      .describe('A key or shortcut, e.g. "Cmd+K".'),
    z
      .object({ type: z.literal('progress'), value: z.number().min(0).max(100) })
      .describe('A progress bar, 0–100.'),
    z
      .object({
        type: z.literal('metric'),
        label: z.string(),
        value: z.string(),
        caption: z.string().optional(),
        badge: z.object({ text: z.string(), variant: badgeVariant.optional() }).optional(),
      })
      .describe('A stat tile: a large value with a label. Put several in a row.'),
  ]),
)

export type ArtifactContent =
  | { kind: 'view'; view: ArtifactComponent }
  | { kind: 'message'; subject: string; body: string }

export interface Artifact {
  /** A slug, stable across an agent's runs so a later run can compare. */
  id: string
  runId: string
  title: string
  content: ArtifactContent
  revision: number
  createdAt: number
  updatedAt: number
}

/** What a run summary lists of each artifact. */
export type ArtifactRef = Pick<Artifact, 'id' | 'title' | 'revision' | 'updatedAt'> & {
  kind: ArtifactContent['kind']
  /** A Claude Code artifact's action ids. */
  actions?: string[]
  /** Its actions as the sidebar lists them, in the artifact's order; `hash` is of the agent's prompt. */
  bookmarks?: { id: string; title: string; label: string; hash: string }[]
}

export const artifactIdSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{0,63}$/)
  .describe(
    'A lowercase slug (letters, digits, hyphens), e.g. "daily-digest". Keep it the same across runs of an agent.',
  )

export const MAX_ARTIFACTS_PER_RUN = 20
export const MAX_ARTIFACT_CHARS = 200_000

export const refOf = (artifact: Artifact): ArtifactRef => ({
  id: artifact.id,
  title: artifact.title,
  revision: artifact.revision,
  updatedAt: artifact.updatedAt,
  kind: artifact.content.kind,
})
