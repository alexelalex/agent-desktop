import type { RunStatus, RunSummary, TaskLink } from './desktop'

// Tasks as the window sees them: runs whose Claude Code record links back to an action.

export const taskOf = (run: RunSummary): TaskLink | undefined => run.claudeCode?.task

export const isDig = (run: RunSummary) => taskOf(run)?.kind === 'dig'

export const isSpinoff = (run: RunSummary) => taskOf(run)?.kind === 'spinoff'

/** Shown at most, per row, before the rest fold under "N more tasks". */
export const SHOWN_TASKS = 5

export const SUB_TASK_REASON = "Sub-tasks can't launch tasks."
export const NO_CLAUDE_CODE = 'Set up Claude Code in Options to launch tasks.'
export const RENDERING = 'The agent is still writing this artifact.'

const launched = (run: RunSummary) => taskOf(run)?.launchedAt ?? run.createdAt

/** Every run under `runId` by its task links, keyed by parent. */
export function taskTree(runs: RunSummary[]): Map<string, RunSummary[]> {
  const listed = new Set(runs.map(r => r.id))
  const children = new Map<string, RunSummary[]>()
  for (const run of runs) {
    const task = taskOf(run)
    if (!task || task.parentRemoved || !listed.has(task.parentRunId)) continue
    children.set(task.parentRunId, [...(children.get(task.parentRunId) ?? []), run])
  }
  for (const list of children.values()) list.sort((a, b) => launched(a) - launched(b))
  return children
}

/** A run with no listed parent: a session, a kept task, or one whose parent isn't loaded. */
export function isRoot(run: RunSummary, listed: Set<string>) {
  const task = taskOf(run)
  return !task || !!task.parentRemoved || !listed.has(task.parentRunId)
}

export function descendants(children: Map<string, RunSummary[]>, runId: string): RunSummary[] {
  return (children.get(runId) ?? []).flatMap(run => [run, ...descendants(children, run.id)])
}

/** Every session launched from one action, tasks and digs, oldest first. */
export const actionSessions = (runs: RunSummary[], artifactId: string, actionId: string) =>
  runs.filter(t => taskOf(t)?.artifactId === artifactId && taskOf(t)?.actionId === actionId)

/** The tasks launched from one action, oldest first. */
export const actionTasks = (runs: RunSummary[], artifactId: string, actionId: string) =>
  actionSessions(runs, artifactId, actionId).filter(t => !isDig(t))

/** The digs into one action, oldest first. */
export const actionDigs = (runs: RunSummary[], artifactId: string, actionId: string) =>
  actionSessions(runs, artifactId, actionId).filter(isDig)

/** What an action shows: its newest task, unless an older one awaits approval. */
export const shownTask = (tasks: RunSummary[]) =>
  tasks.find(t => t.status === 'awaiting_approval') ?? tasks.at(-1)

/** Selectable for a bulk launch: no task yet, or the newest failed or stopped. */
export const selectable = (tasks: RunSummary[]) => {
  const newest = tasks.at(-1)
  return !newest || newest.status === 'failed' || newest.status === 'stopped'
}

const ACTIVE = new Set<RunStatus>(['awaiting_approval', 'running', 'queued'])
const URGENCY: RunStatus[] = ['awaiting_approval', 'failed', 'running', 'queued']
export const isActive = (run: RunSummary) => ACTIVE.has(run.status)

/**
 * Which tasks a row shows before folding: those with anything active in their subtree, in
 * launch order, then the newest of the rest.
 */
export function foldTasks(
  tasks: RunSummary[],
  children: Map<string, RunSummary[]>,
): { shown: RunSummary[]; folded: RunSummary[] } {
  const busy = (t: RunSummary) => isActive(t) || descendants(children, t.id).some(isActive)
  const active = tasks.filter(busy)
  const rest = tasks.filter(t => !busy(t)).sort((a, b) => launched(b) - launched(a))
  const ordered = [...active, ...rest]
  return { shown: ordered.slice(0, SHOWN_TASKS), folded: ordered.slice(SHOWN_TASKS) }
}

/**
 * What an action's row shows before folding: anything active below it, the task its button
 * shows, and the newest dig not yet archived; the rest fold, newest first.
 */
export function foldAction(
  sessions: RunSummary[],
  children: Map<string, RunSummary[]>,
): { shown: RunSummary[]; folded: RunSummary[] } {
  const busy = (t: RunSummary) => isActive(t) || descendants(children, t.id).some(isActive)
  const fixes = sessions.filter(s => !isDig(s))
  const dig = sessions.filter(s => isDig(s) && !taskOf(s)!.archived).at(-1)
  const keep = new Set([...sessions.filter(busy), shownTask(fixes), dig])
  return {
    shown: sessions.filter(s => keep.has(s)),
    folded: sessions.filter(s => !keep.has(s)).reverse(),
  }
}

/** For an action's row: the most urgent status of its lead task and dig, and below them. */
export function actionStatus(
  sessions: RunSummary[],
  children: Map<string, RunSummary[]>,
): RunStatus | undefined {
  const fix = shownTask(sessions.filter(s => !isDig(s)))
  const lead = [fix, sessions.filter(isDig).at(-1)].filter(s => s !== undefined)
  const statuses = lead.flatMap(r => [r.status, ...descendants(children, r.id).map(d => d.status)])
  return URGENCY.find(s => statuses.includes(s)) ?? fix?.status
}

// A failed task stops counting once a newer task of its action exists.
function superseded(task: RunSummary, siblings: RunSummary[]) {
  const link = taskOf(task)!
  if (!link.actionId) return false
  return siblings.some(
    s =>
      s !== task &&
      taskOf(s)?.artifactId === link.artifactId &&
      taskOf(s)?.actionId === link.actionId &&
      launched(s) > launched(task),
  )
}


/** For a collapsed row: its most urgent status, counting everything below it. */
export function urgentStatus(
  run: RunSummary,
  children: Map<string, RunSummary[]>,
): RunStatus | undefined {
  const statuses: RunStatus[] = [run.status]
  const walk = (id: string) => {
    const tasks = children.get(id) ?? []
    for (const task of tasks) {
      if (!(task.status === 'failed' && superseded(task, tasks))) statuses.push(task.status)
      walk(task.id)
    }
  }
  walk(run.id)
  return URGENCY.find(s => statuses.includes(s))
}

/** The latest update anywhere in the run's tree, which orders top-level sessions. */
export function treeUpdated(run: RunSummary, children: Map<string, RunSummary[]>): number {
  return Math.max(run.updatedAt, ...(children.get(run.id) ?? []).map(c => treeUpdated(c, children)))
}

/** The parent chain of a run, nearest first. */
export function ancestors(run: RunSummary | undefined, byId: Map<string, RunSummary>): RunSummary[] {
  const chain: RunSummary[] = []
  for (let task = run && taskOf(run); task && !task.parentRemoved && chain.length < 10; ) {
    const parent = byId.get(task.parentRunId)
    if (!parent) break
    chain.push(parent)
    task = taskOf(parent)
  }
  return chain
}

/** Whether the parent's current artifacts still offer the task's action; a spin-off has none. */
export function actionGone(task: TaskLink, parent: RunSummary | undefined) {
  if (!task.actionId) return false
  const artifact = parent?.artifacts?.find(a => a.id === task.artifactId)
  return !artifact?.actions?.includes(task.actionId)
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
