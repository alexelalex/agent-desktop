import { getToolName, isToolUIPart, type UIMessage } from 'ai'
import { z } from 'zod'
import {
  artifactComponentSchema,
  artifactIdSchema,
  MAX_ARTIFACT_CHARS,
  MAX_ARTIFACTS_PER_RUN,
  refOf,
  type ArtifactContent,
} from '@/lib/artifacts'
import type { RunSummary } from '@/lib/desktop'
import { listArtifacts, saveArtifact } from './artifacts'
import { webFetch } from './web-fetch'

export interface ToolContext {
  run: RunSummary
  signal: AbortSignal
  /** This run's agent's earlier runs, newest first. */
  earlierRuns: () => RunSummary[]
}

// Tools the app runs itself. The chat request declares them; the model's call
// ends the server's turn, and the run sends the history back with the output.
interface ClientTool<T extends z.ZodType = z.ZodType> {
  name: string
  description: string
  input: T
  execute(input: z.infer<T>, context: ToolContext): unknown
}

const clientTool = <T extends z.ZodType>(tool: ClientTool<T>) =>
  tool as unknown as ClientTool

function publish(
  run: RunSummary,
  id: string,
  title: string,
  content: ArtifactContent,
) {
  const chars = JSON.stringify(content).length
  if (chars > MAX_ARTIFACT_CHARS) {
    throw new Error(
      `The artifact is ${chars} characters; the limit is ${MAX_ARTIFACT_CHARS}. Split it or shorten it.`,
    )
  }
  const existing = listArtifacts(run.id)
  const previous = existing.find(a => a.id === id)
  if (!previous && existing.length >= MAX_ARTIFACTS_PER_RUN) {
    throw new Error(
      `This run already has ${MAX_ARTIFACTS_PER_RUN} artifacts. Replace one by reusing its id.`,
    )
  }
  const now = Date.now()
  const revision = (previous?.revision ?? 0) + 1
  saveArtifact({
    id,
    runId: run.id,
    title,
    content,
    revision,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  })
  return { ok: true, id, revision }
}

const TOOLS = [
  clientTool({
    name: 'webFetch',
    description:
      "Fetch a public web page (http or https) and return its title and readable text, up to 20,000 characters. Use it to read advisories, threat intelligence feeds, blog posts and other public sources. It runs in the user's desktop app and can't reach private or internal addresses.",
    input: z.object({ url: z.url().describe('The page to fetch.') }),
    execute: ({ url }, { signal }) => webFetch(url, signal),
  }),
  clientTool({
    name: 'artifacts_create',
    description:
      'Publish a view artifact in this run: a report, findings list or dashboard shown to the user in a panel beside the chat. Artifacts are what an agent publishes; the user can attach notifications to one to receive it. The content is a tree of components (layout, card, typography, table, badge, alert, separator, kbd, progress, metric); build the view from these, not HTML. Use it for a run\'s findings or report and for anything the user should keep; ordinary answers belong in the chat. Reusing an id replaces that artifact. Keep ids the same across runs of an agent, e.g. "daily-digest", so later runs can compare with artifacts_previous.',
    input: z.object({
      id: artifactIdSchema,
      title: z.string().min(1).max(200).describe('A short title, without emojis.'),
      content: artifactComponentSchema.describe(
        'The view as a JSON object, not a string: usually a vertical layout holding the other components.',
      ),
    }),
    execute: ({ id, title, content }, { run }) =>
      publish(run, id, title, { kind: 'view', view: content }),
  }),
  clientTool({
    name: 'artifacts_message',
    description:
      'Publish a message artifact in this run: an e-mail or chat message for people to receive. The notifications the user attached to this id send it as written: the subject as the e-mail subject, the body as the message. Write the body in Markdown, short enough to read in a chat channel. Reusing an id replaces that message.',
    input: z.object({
      id: artifactIdSchema,
      subject: z.string().min(1).max(200),
      body: z.string().min(1).max(20_000).describe('The message, in Markdown.'),
    }),
    execute: ({ id, subject, body }, { run }) =>
      publish(run, id, subject, { kind: 'message', subject, body }),
  }),
  clientTool({
    name: 'artifacts_read',
    description: 'Read an artifact of this run in full.',
    input: z.object({ id: artifactIdSchema }),
    execute: ({ id }, { run }) => {
      const artifact = listArtifacts(run.id).find(a => a.id === id)
      if (!artifact) throw new Error(`This run has no artifact "${id}".`)
      const { title, revision, content } = artifact
      return { id, title, revision, content }
    },
  }),
  clientTool({
    name: 'artifacts_list',
    description: "List this run's artifacts.",
    input: z.object({}),
    execute: (_, { run }) => ({ artifacts: listArtifacts(run.id).map(refOf) }),
  }),
  clientTool({
    name: 'artifacts_previous',
    description:
      "Read an artifact by id from this agent's earlier runs, newest first. Use it to compare with what earlier runs published, or to leave out what they already reported.",
    input: z.object({
      id: artifactIdSchema,
      runs: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .describe('How many earlier runs to return it from, 1–5. Defaults to 1.'),
    }),
    execute: ({ id, runs = 1 }, { run, earlierRuns }) => {
      if (!run.agentId) {
        return { artifacts: [], note: 'This run has no agent, so it has no earlier runs.' }
      }
      const artifacts = earlierRuns()
        .flatMap(earlier => {
          const found = listArtifacts(earlier.id).find(a => a.id === id)
          return found
            ? [
                {
                  runId: earlier.id,
                  runStartedAt: new Date(earlier.createdAt).toISOString(),
                  title: found.title,
                  content: found.content,
                },
              ]
            : []
        })
        .slice(0, runs)
      return { artifacts }
    },
  }),
]

const byName = new Map(TOOLS.map(tool => [tool.name, tool]))

export const isClientTool = (name: string) => byName.has(name)

/** The tools as the `/chat` request declares them. */
export const clientToolDescriptors = TOOLS.map(tool => {
  const { $schema: _, ...inputSchema } = z.toJSONSchema(tool.input)
  return { name: tool.name, description: tool.description, inputSchema }
})

// Models sometimes pass an object argument as a JSON string.
function parseStringifiedObjects(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => {
      if (typeof value !== 'string' || !/^\s*[[{]/.test(value)) return [key, value]
      try {
        return [key, JSON.parse(value)]
      } catch {
        return [key, value]
      }
    }),
  )
}

export async function runClientTool(
  name: string,
  input: unknown,
  context: ToolContext,
): Promise<unknown> {
  const tool = byName.get(name)
  if (!tool) throw new Error(`Unknown tool: ${name}`)
  let parsed = tool.input.safeParse(input)
  if (!parsed.success) {
    const lenient = tool.input.safeParse(parseStringifiedObjects(input))
    if (lenient.success) parsed = lenient
  }
  if (!parsed.success) throw new Error(z.prettifyError(parsed.error))
  return tool.execute(parsed.data, context)
}

const ANSWERED = new Set([
  'output-available',
  'output-error',
  'output-denied',
  'approval-responded',
])

/** The last step called a client tool, and every call in it has its answer. */
export function clientToolsAnswered(messages: UIMessage[]): boolean {
  const last = messages.at(-1)
  if (last?.role !== 'assistant') return false
  const start = last.parts.findLastIndex(p => p.type === 'step-start')
  const calls = last.parts.slice(start + 1).filter(isToolUIPart)
  return (
    calls.some(p => isClientTool(getToolName(p))) &&
    calls.every(p => ANSWERED.has(p.state))
  )
}
