import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ExternalLinkIcon, GitBranchIcon } from 'lucide-react'
import { ipcError } from '@/components/RetryParts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ArtifactRef } from '@/lib/artifacts'
import type {
  BoundBranch,
  BranchAction,
  BranchRow,
  BranchState,
  BranchView,
  LocalBranch,
  RunSummary,
} from '@/lib/desktop'
import { plural } from '@/lib/tasks'
import { cn } from '@/lib/utils'

// A session's branches: the ⎇ menu, its line in the header, and the dialogs its items open.

/** The session's branches as git has them, refreshed as runs change and when the window takes focus. */
export function useBranchView(runId: string, enabled: boolean, version: string) {
  const [view, setView] = useState<BranchView>()
  const [error, setError] = useState<string>()
  // One read at a time: changes while it runs ask for one more after it.
  const reading = useRef<{ again: boolean }>(undefined)
  const refresh = useCallback(() => {
    if (!enabled) return
    if (reading.current) return void (reading.current.again = true)
    const read = (reading.current = { again: false })
    window.desktop.claudeCode
      .branchView(runId)
      .then(
        next => (setView(next), setError(undefined)),
        e => setError(ipcError(e)),
      )
      .finally(() => {
        reading.current = undefined
        if (read.again) refresh()
      })
  }, [runId, enabled])
  useEffect(() => {
    refresh()
  }, [refresh, version])
  useEffect(() => {
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [refresh])
  return { view: enabled ? view : undefined, error, refresh }
}

/** Rows a branch's merged count is out of: each action's newest direct task in its repo, not split out. */
const countable = (rows: BranchRow[], common: string) =>
  rows.filter(
    r =>
      r.common === common &&
      r.reason !== 'earlier attempt' &&
      r.reason !== 'split out' &&
      !r.reason?.startsWith('sub-task'),
  )

/** Rows in artifact order, then action order, then launch order. */
export function ordered(rows: BranchRow[], artifacts: ArtifactRef[]) {
  const place = (r: BranchRow) => {
    const a = artifacts.findIndex(x => x.id === r.artifactId)
    const b = artifacts[a]?.bookmarks?.findIndex(x => x.id === r.actionId) ?? -1
    return [a < 0 ? Infinity : a, b < 0 ? Infinity : b]
  }
  return rows
    .map((row, i) => ({ row, i, at: place(row) }))
    .sort((x, y) => x.at[0] - y.at[0] || x.at[1] - y.at[1] || x.i - y.i)
    .map(x => x.row)
}

const prLabel = (pr: { url: string; number?: number }) => (pr.number ? `PR #${pr.number}` : 'PR')

/** Why a bound branch can't take a merge, a split or a sync now. */
function writeBlock(bound: BoundBranch, state: BranchState): string | undefined {
  if (bound.creating) return `${bound.name} is being created`
  if (!state.exists) return `${bound.name} no longer exists`
  if (!state.worktree) return `${bound.name} needs a worktree`
  if (state.inProgress) return `${bound.name} has ${state.inProgress} in progress`
  if (state.dirty) return `${bound.name} has uncommitted changes`
  return undefined
}

/** The facts on a bound branch's line: merged count, push state, how far behind. */
export function BranchFacts(props: {
  bound: BoundBranch
  state: BranchState
  rows: BranchRow[]
  defaultBase?: string
}) {
  const { bound, state } = props
  const rows = countable(props.rows, bound.common)
  const merged = rows.filter(r => r.merged).length
  const facts = bound.creating
    ? ['being created']
    : !state.exists
      ? ['branch gone']
      : [
          ...(rows.length > 0 ? [`${merged}/${rows.length} merged`] : []),
          state.pushed
            ? state.ahead
              ? `${plural(state.ahead, 'commit')} to push`
              : 'pushed'
            : 'unpushed',
          ...(state.behind && props.defaultBase
            ? [`${state.behind} behind ${props.defaultBase} as of last fetch`]
            : []),
          ...(state.inProgress ? [`${state.inProgress} in progress`] : []),
          ...(state.dirty ? ['uncommitted changes'] : []),
        ]
  return (
    <span className="flex min-w-0 items-center gap-1">
      <GitBranchIcon className="size-3 shrink-0" />
      <code className="truncate font-mono">{bound.name}</code>
      <span className="truncate">· {facts.join(' · ')}</span>
      {bound.report?.pr && (
        <a
          href={bound.report.pr.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-0.5 hover:text-foreground hover:underline"
          title="Reported by the agent"
        >
          {prLabel(bound.report.pr)} <ExternalLinkIcon className="size-3" />
        </a>
      )}
    </span>
  )
}

/** A session row's ⎇ menu in the sidebar: it reads git once opened, and its prompts open the session. */
export function SidebarBranchMenu(props: {
  run: RunSummary
  /** Its tasks, any depth, whose changes refresh its rows. */
  below: RunSummary[]
  /** Claude Code can run a turn for a session not open in a terminal. */
  canRun: boolean
  onPrompt: (prompt: { text: string; ask: string; afterSend?: { match: string; run: () => void } }) => void
  onError: (message: string) => void
}) {
  const { run } = props
  const [armed, setArmed] = useState(false)
  const version = JSON.stringify([
    run.updatedAt,
    run.status,
    run.claudeCode?.branches,
    props.below.map(t => [t.id, t.status, t.updatedAt]),
  ])
  const branches = useBranchView(run.id, armed, version)
  const bound = run.claudeCode?.branches ?? []
  const blocked =
    run.status === 'running' || run.status === 'awaiting_approval'
      ? 'The session is mid-turn'
      : run.status === 'queued'
        ? "This task hasn't sent its first message yet"
        : run.claudeCode?.live && run.claudeCode.channels === false
          ? "This terminal session doesn't take messages from the app"
          : !run.claudeCode?.live && !props.canRun
            ? 'Set up Claude Code in Options to message this session'
            : undefined
  const { refresh } = branches
  return (
    <BranchMenu
      runId={run.id}
      view={branches.view}
      artifacts={run.artifacts ?? []}
      blocked={blocked}
      tickets={!!run.claudeCode?.tickets}
      onRefresh={() => (armed ? refresh() : setArmed(true))}
      onError={message => message && props.onError(message)}
      onPrompt={(text, ask, afterSend) => props.onPrompt({ text, ask, afterSend })}
      trigger={{
        size: 'icon-sm',
        // Bound: always shown, so the list says which sessions own a branch.
        className:
          bound.length > 0
            ? 'text-muted-foreground'
            : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100',
        title:
          bound.length > 0
            ? `${bound.map(b => `⎇ ${b.name}`).join(', ')} · branch menu`
            : 'Branch: bind, merge, split, push, PRs',
      }}
    />
  )
}

type Dialogs =
  | { kind: 'bind'; common?: string }
  | { kind: 'new' }
  | { kind: 'choose'; common: string }
  | { kind: 'split'; row: BranchRow; prefix?: string }

/** The ⎇ menu: merge, split, sync, test, push and PRs, each as a prompt for this session. */
export function BranchMenu(props: {
  runId: string
  view?: BranchView
  artifacts: ArtifactRef[]
  /** Why nothing can be sent to the session now, e.g. it's mid-turn. */
  blocked?: string
  tickets: boolean
  onRefresh: () => void
  /** Puts `text` in the composer; `afterSend` runs once the user sends text that still holds its `match`. */
  onPrompt: (text: string, ask: string, afterSend?: { match: string; run: () => void }) => void
  /** A merge or split asked for from elsewhere, e.g. an action's menu; `at` tells repeats apart. */
  request?: { kind: 'merge' | 'split'; row: BranchRow; at: number }
  onError: (message?: string) => void
  /** The trigger's look: the header's small icon, or a sidebar row's action. */
  trigger?: { size?: 'icon-xs' | 'icon-sm'; className?: string; title?: string }
}) {
  const { runId, view, blocked, onRefresh, onError } = props
  const [open, setOpen] = useState(false)
  const [dialog, setDialog] = useState<Dialogs>()
  const handled = useRef<number>(undefined)

  const ask = (action: BranchAction, what: string, afterSend?: { match: string; run: () => void }) => {
    onError(undefined)
    window.desktop.claudeCode.branchPrompt(runId, action).then(
      text => props.onPrompt(text, what, afterSend),
      e => onError(ipcError(e)),
    )
  }

  const { request } = props
  useEffect(() => {
    if (!request || handled.current === request.at) return
    handled.current = request.at
    const { row } = request
    const target = view?.bound.find(b => !b.implicit && b.common === row.common)
    if (request.kind === 'split') setDialog({ kind: 'split', row, prefix: target?.prefix })
    else ask({ kind: 'merge', common: row.common, taskIds: [row.runId] }, 'the merge prompt')
  }, [request])

  const self = view?.self
  const upstream = view?.upstream
  const explicit = (view?.bound ?? []).filter(b => !b.implicit)
  const own = (view?.bound ?? []).find(b => b.implicit)
  const rows = useMemo(() => ordered(view?.rows ?? [], props.artifacts), [view?.rows, props.artifacts])
  const titleOf = (artifactId: string) =>
    props.artifacts.find(a => a.id === artifactId)?.title ?? artifactId

  const item = (label: string, action: BranchAction, what: string, block?: string) => (
    <DropdownMenuItem
      key={label}
      disabled={!!(blocked ?? block)}
      title={blocked ?? block}
      onSelect={() => ask(action, what)}
    >
      {label}
    </DropdownMenuItem>
  )

  // Push and PRs on a branch; Open PR… pushes it first when it needs to.
  const prItems = (b: BoundBranch & { state: BranchState }, at: { common?: string }, block?: string) => {
    const pr = b.report?.pr
    return (
      <>
        {(!b.state.pushed || !!b.state.ahead) && item('Push', { kind: 'push', ...at }, 'the push prompt', block)}
        {!pr && item('Open PR…', { kind: 'open-pr', ...at }, 'the PR prompt', block)}
        {pr && <PrLink pr={pr} />}
        {pr && item('Update PR description', { kind: 'update-pr', ...at }, 'the PR prompt')}
        {pr && item('Address review comments', { kind: 'comments', ...at }, 'the review prompt')}
      </>
    )
  }

  // A task's own branch, against its upstream.
  const taskSection = self && own && (
    <>
      <DropdownMenuLabel className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
        <GitBranchIcon className="size-3" />
        <span className="truncate font-mono">{self.branch}</span>
      </DropdownMenuLabel>
      {upstream ? (
        <DropdownMenuItem
          disabled={!!blocked || !self.ready || !!writeBlock(upstream, upstream.state)}
          title={blocked ?? self.reason ?? writeBlock(upstream, upstream.state)}
          onSelect={() =>
            ask({ kind: 'merge', common: upstream.common, taskIds: [runId] }, `the merge prompt`)
          }
        >
          <span className="truncate">Merge into ⎇ {upstream.name}</span>
          {self.merged && <span className="ml-auto pl-2 text-xs text-muted-foreground">merged</span>}
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem disabled title="Bind a branch to the parent session to merge into it">
          Merge into the parent's branch
        </DropdownMenuItem>
      )}
      <SplitItem
        row={self}
        blocked={blocked}
        onSplit={() => setDialog({ kind: 'split', row: self, prefix: upstream?.prefix })}
      />
      <DropdownMenuSeparator />
      {item('Sync with base', { kind: 'sync' }, 'the sync prompt', self.merged ? 'Already merged' : undefined)}
      {item('Run tests', { kind: 'test' }, 'the test prompt')}
      {prItems(own, {}, self.commits === 0 ? 'No commits yet' : undefined)}
    </>
  )

  const boundSection = (b: BranchView['bound'][number]) => {
    const block = writeBlock(b, b.state)
    const mine = rows.filter(r => r.common === b.common)
    const ready = mine.filter(r => r.ready)
    const merged = mine.filter(r => r.merged)
    const splittable = mine.filter(
      r => !splitBlock(r) && r.reason !== 'earlier attempt' && !r.reason?.startsWith('sub-task'),
    )
    const splitOut = mine.filter(r => r.report?.remote && r.report.pr)
    let lastArtifact: string | undefined
    return (
      <div key={b.common}>
        <DropdownMenuLabel className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
          <GitBranchIcon className="size-3" />
          <span className="truncate font-mono">{b.name}</span>
          <span className="shrink-0">· {b.repo}</span>
        </DropdownMenuLabel>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={!!(blocked ?? block)} title={blocked ?? block}>
            Merge
            {ready.length > 0 && (
              <span className="ml-auto pl-2 text-xs text-muted-foreground">{ready.length} ready</span>
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-96 w-auto max-w-96 min-w-64 overflow-y-auto">
            <DropdownMenuItem
              disabled={ready.length === 0}
              onSelect={() =>
                ask(
                  { kind: 'merge', common: b.common, taskIds: ready.map(r => r.runId) },
                  'the merge prompt',
                )
              }
            >
              All ready ({ready.length})
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={ready.length === 0}
              onSelect={() => setDialog({ kind: 'choose', common: b.common })}
            >
              Choose…
            </DropdownMenuItem>
            {mine.length === 0 && (
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                No task branches in {b.repo} yet
              </DropdownMenuLabel>
            )}
            {mine.map(r => {
              const header = r.artifactId !== lastArtifact
              lastArtifact = r.artifactId
              return (
                <div key={r.runId}>
                  {header && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                        {titleOf(r.artifactId)}
                      </DropdownMenuLabel>
                    </>
                  )}
                  <DropdownMenuItem
                    disabled={!r.ready}
                    title={r.reason ?? `${plural(r.commits, 'commit')} on ${r.branch}`}
                    className={cn(r.depth > 1 && 'pl-5')}
                    onSelect={() =>
                      ask({ kind: 'merge', common: b.common, taskIds: [r.runId] }, 'the merge prompt')
                    }
                  >
                    <span className="truncate">{r.title}</span>
                    <span className="ml-auto shrink-0 pl-3 text-xs text-muted-foreground">
                      {r.reason ?? plural(r.commits, 'commit')}
                    </span>
                  </DropdownMenuItem>
                </div>
              )
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={splittable.length === 0 && splitOut.length === 0}>
            Split out
            {splitOut.length > 0 && (
              <span className="ml-auto pl-2 text-xs text-muted-foreground">
                {plural(splitOut.length, 'PR')}
              </span>
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-96 w-auto max-w-96 min-w-56 overflow-y-auto">
            {splittable.map(r => (
              <DropdownMenuItem
                key={r.runId}
                disabled={!!blocked}
                title={blocked}
                onSelect={() => setDialog({ kind: 'split', row: r, prefix: b.prefix })}
              >
                <span className="truncate">{r.title}</span>
              </DropdownMenuItem>
            ))}
            {splittable.length > 0 && splitOut.length > 0 && <DropdownMenuSeparator />}
            {splitOut.map(r => (
              <PrLink key={r.runId} pr={r.report!.pr!} task={r.title} />
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        {item('Sync with base', { kind: 'sync', common: b.common }, 'the sync prompt', block)}
        {item(
          'Run tests',
          { kind: 'test', common: b.common },
          'the test prompt',
          !b.state.worktree ? block : merged.length === 0 ? 'Nothing is merged into it yet' : undefined,
        )}
        {prItems(b, { common: b.common }, b.state.worktree ? undefined : block)}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setDialog({ kind: 'bind', common: b.common })}>
          Change binding…
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            void window.desktop.claudeCode
              .unbindBranch(runId, b.common)
              .then(onRefresh, e => onError(ipcError(e)))
          }
        >
          Unbind
        </DropdownMenuItem>
      </div>
    )
  }

  // An ancestor's branch: this session pushes it, tests it and opens its PR; merging stays with the owner.
  const inheritedSection = (b: BranchView['inherited'][number]) => {
    const block = writeBlock(b, b.state)
    return (
      <div key={b.common}>
        <DropdownMenuLabel className="flex flex-col gap-0.5 text-xs font-normal text-muted-foreground">
          <span className="flex items-center gap-1">
            <GitBranchIcon className="size-3" />
            <span className="truncate font-mono">{b.name}</span>
            <span className="shrink-0">· {b.repo}</span>
          </span>
          <span className="max-w-80 truncate" title={b.ownerTitle}>
            Bound to {b.ownerTitle}
          </span>
        </DropdownMenuLabel>
        {item('Sync with base', { kind: 'sync', common: b.common }, 'the sync prompt', block)}
        {item('Run tests', { kind: 'test', common: b.common }, 'the test prompt', b.state.worktree ? undefined : block)}
        {prItems(b, { common: b.common }, b.state.worktree ? undefined : block)}
      </div>
    )
  }
  const inherited = view?.inherited ?? []

  return (
    <>
      <DropdownMenu
        open={open}
        onOpenChange={next => {
          setOpen(next)
          if (next) onRefresh()
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={props.trigger?.size ?? 'icon-xs'}
            className={props.trigger?.className}
            aria-label="Branch menu"
            title={props.trigger?.title ?? 'Branch: bind, merge, split, push, PRs'}
            // A sidebar row selects its session on click; the menu opens in place instead.
            onClick={e => e.stopPropagation()}
          >
            <GitBranchIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto max-w-96 min-w-60" align="start">
          {!view && <DropdownMenuLabel className="text-xs font-normal">Reading git…</DropdownMenuLabel>}
          {taskSection}
          {taskSection && explicit.length > 0 && <DropdownMenuSeparator />}
          {explicit.map(boundSection)}
          {(taskSection || explicit.length > 0) && inherited.length > 0 && <DropdownMenuSeparator />}
          {inherited.map(inheritedSection)}
          {view && (
            <>
              {(taskSection || explicit.length > 0 || inherited.length > 0) && <DropdownMenuSeparator />}
              <DropdownMenuItem onSelect={() => setDialog({ kind: 'bind' })}>Bind branch…</DropdownMenuItem>
              <DropdownMenuItem disabled={!!blocked} title={blocked} onSelect={() => setDialog({ kind: 'new' })}>
                New branch…
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {view && dialog?.kind === 'bind' && (
        <BindBranchDialog
          view={view}
          common={dialog.common}
          onClose={() => setDialog(undefined)}
          onBind={binding =>
            window.desktop.claudeCode.bindBranch(runId, binding).then(() => {
              setDialog(undefined)
              onRefresh()
            })
          }
        />
      )}
      {view && dialog?.kind === 'new' && (
        <NewBranchDialog
          view={view}
          onClose={() => setDialog(undefined)}
          onCreate={({ dir, name, base, prefix }) => {
            setDialog(undefined)
            ask({ kind: 'new-branch', dir, name, base }, 'the new branch prompt', {
              match: name,
              run: () =>
                void window.desktop.claudeCode
                  .bindBranch(runId, { dir, name, prefix, creating: { base } })
                  .then(onRefresh, e => onError(ipcError(e))),
            })
          }}
        />
      )}
      {dialog?.kind === 'choose' && (
        <ChooseMergeDialog
          rows={rows.filter(r => r.common === dialog.common)}
          titleOf={titleOf}
          target={explicit.find(b => b.common === dialog.common)?.name ?? ''}
          onClose={() => setDialog(undefined)}
          onMerge={taskIds => {
            setDialog(undefined)
            ask({ kind: 'merge', common: dialog.common, taskIds }, 'the merge prompt')
          }}
        />
      )}
      {dialog?.kind === 'split' && (
        <SplitDialog
          row={dialog.row}
          prefix={dialog.prefix}
          tickets={props.tickets}
          onClose={() => setDialog(undefined)}
          onSplit={(remote, ticket) => {
            setDialog(undefined)
            ask({ kind: 'split', taskId: dialog.row.runId, remote, ticket }, 'the split prompt')
          }}
        />
      )}
    </>
  )
}

/** Why a task can't be split out now: split before merging, from a finished, committed branch. */
export function splitBlock(row: BranchRow): string | undefined {
  if (row.merged) return 'Already merged: split a task before merging it'
  if (row.report?.remote) return `Already split out as ${row.report.remote}`
  if (row.reason === 'branch gone') return 'Its branch is gone'
  if (row.commits === 0) return 'No commits yet'
  if (row.dirty) return 'Its worktree has uncommitted changes'
  if (row.status !== 'completed') return `It's ${row.status.replace('_', ' ')}`
  return undefined
}

/** A reported PR, opened in the browser: "View PR #N", or a task's title with its PR beside it. */
function PrLink(props: { pr: { url: string; number?: number }; task?: string }) {
  return (
    <DropdownMenuItem asChild>
      <a href={props.pr.url} target="_blank" rel="noreferrer" title={`${props.pr.url} · reported by the agent`}>
        <span className="truncate">{props.task ?? `View ${prLabel(props.pr)}`}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1 pl-3 text-xs text-muted-foreground">
          {props.task && prLabel(props.pr)}
          <ExternalLinkIcon className="size-3" />
        </span>
      </a>
    </DropdownMenuItem>
  )
}

function SplitItem(props: { row: BranchRow; blocked?: string; onSplit: () => void }) {
  const block = props.blocked ?? splitBlock(props.row)
  return (
    <DropdownMenuItem disabled={!!block} title={block} onSelect={props.onSplit}>
      Split out into its own PR…
    </DropdownMenuItem>
  )
}

/** A ticket key at the start of a branch name, e.g. DEV-22044 in DEV-22044-batch-7. */
const ticketKey = (name: string) => /^([A-Z][A-Z0-9]+-\d+)/.exec(name)?.[1]

function RepoSelect(props: {
  repos: BranchView['repos']
  value: string
  onChange: (common: string) => void
}) {
  if (props.repos.length < 2) return null
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      Repository
      <Select value={props.value} onValueChange={props.onChange}>
        <SelectTrigger className="w-full" aria-label="Repository">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {props.repos.map(r => (
            <SelectItem key={r.common} value={r.common}>
              {r.repo} <span className="text-muted-foreground">{r.dir}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

/** Picks a local branch of one of the session's repos to bind, worktrees first. */
function BindBranchDialog(props: {
  view: BranchView
  common?: string
  onBind: (binding: { dir: string; name: string; prefix?: string }) => Promise<void>
  onClose: () => void
}) {
  const { repos } = props.view
  const current = props.view.bound.find(b => !b.implicit && b.common === props.common)
  const [common, setCommon] = useState(props.common ?? repos[0]?.common ?? '')
  const [branches, setBranches] = useState<LocalBranch[]>()
  const [filter, setFilter] = useState('')
  const [picked, setPicked] = useState(current?.name)
  const [prefix, setPrefix] = useState(current?.prefix ?? '')
  const [prefixEdited, setPrefixEdited] = useState(!!current)
  const [error, setError] = useState<string>()
  const repo = repos.find(r => r.common === common)
  useEffect(() => {
    let live = true
    setBranches(undefined)
    if (common)
      window.desktop.claudeCode.localBranches(common).then(
        list => live && setBranches(list),
        e => live && setError(ipcError(e)),
      )
    return () => {
      live = false
    }
  }, [common])
  const shown = (branches ?? []).filter(b => b.name.toLowerCase().includes(filter.toLowerCase())).slice(0, 200)
  const pick = (name: string) => {
    setPicked(name)
    if (!prefixEdited) setPrefix(ticketKey(name) ?? '')
  }
  return (
    <Dialog open onOpenChange={open => !open && props.onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bind a branch</DialogTitle>
          <DialogDescription>
            Its tasks in this repo merge into it, and its menu pushes it and opens its PR. The branch and
            its worktree stay as they are.
          </DialogDescription>
        </DialogHeader>
        {repos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Neither this session's folder nor its tasks are in a git repo.
          </p>
        ) : (
          <>
            <RepoSelect repos={repos} value={common} onChange={c => (setCommon(c), setPicked(undefined))} />
            <Input
              aria-label="Filter branches"
              placeholder="Filter branches"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            <ul role="listbox" aria-label="Branches" className="-mx-1 min-h-24 flex-1 overflow-y-auto px-1">
              {!branches && <li className="p-2 text-sm text-muted-foreground">Reading branches…</li>}
              {shown.map(b => (
                <li key={b.name}>
                  <button
                    role="option"
                    aria-selected={picked === b.name}
                    className={cn(
                      'flex w-full flex-col items-start rounded-md px-2 py-1 text-left text-sm hover:bg-muted',
                      picked === b.name && 'bg-muted',
                    )}
                    onClick={() => pick(b.name)}
                  >
                    <span className="font-mono">{b.name}</span>
                    {b.worktree && (
                      <span className="truncate text-xs text-muted-foreground">{b.worktree}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Commit prefix
              <Input
                aria-label="Commit prefix"
                placeholder="e.g. DEV-22044"
                value={prefix}
                onChange={e => (setPrefix(e.target.value), setPrefixEdited(true))}
              />
              <span className="text-xs font-normal text-muted-foreground">
                Merges put it in front of each commit subject. Leave it empty for none.
              </span>
            </label>
          </>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            disabled={!picked || !repo}
            onClick={() =>
              void props
                .onBind({ dir: repo!.dir, name: picked!, prefix })
                .catch(e => setError(ipcError(e)))
            }
          >
            Bind {picked ? <code className="font-mono">{picked}</code> : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Names a branch for the agent to create; the app binds it once the prompt is sent. */
function NewBranchDialog(props: {
  view: BranchView
  onCreate: (branch: { dir: string; name: string; base: string; prefix?: string }) => void
  onClose: () => void
}) {
  const { repos, defaultBases } = props.view
  const [common, setCommon] = useState(repos[0]?.common ?? '')
  const [name, setName] = useState('')
  const [base, setBase] = useState(defaultBases[repos[0]?.common ?? ''] ?? '')
  const [prefix, setPrefix] = useState('')
  const [prefixEdited, setPrefixEdited] = useState(false)
  const repo = repos.find(r => r.common === common)
  return (
    <Dialog open onOpenChange={open => !open && props.onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New branch</DialogTitle>
          <DialogDescription>
            The agent creates it in its own worktree. It's bound to this session once you send the prompt.
          </DialogDescription>
        </DialogHeader>
        <RepoSelect
          repos={repos}
          value={common}
          onChange={c => {
            setCommon(c)
            setBase(defaultBases[c] ?? '')
          }}
        />
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Name
          <Input
            aria-label="Branch name"
            placeholder="e.g. DEV-22044-batch-8"
            value={name}
            onChange={e => {
              setName(e.target.value)
              if (!prefixEdited) setPrefix(ticketKey(e.target.value) ?? '')
            }}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          From
          <Input aria-label="Base" value={base} onChange={e => setBase(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Commit prefix
          <Input
            aria-label="Commit prefix"
            value={prefix}
            onChange={e => (setPrefix(e.target.value), setPrefixEdited(true))}
          />
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            disabled={!repo || !name.trim() || !base.trim()}
            onClick={() =>
              props.onCreate({ dir: repo!.dir, name: name.trim(), base: base.trim(), prefix })
            }
          >
            Write the prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Checkboxes over a repo's task branches; the ready ones start checked. */
function ChooseMergeDialog(props: {
  rows: BranchRow[]
  target: string
  titleOf: (artifactId: string) => string
  onMerge: (taskIds: string[]) => void
  onClose: () => void
}) {
  const [checked, setChecked] = useState(() => new Set(props.rows.filter(r => r.ready).map(r => r.runId)))
  const picked = props.rows.filter(r => r.ready && checked.has(r.runId)).map(r => r.runId)
  let lastArtifact: string | undefined
  return (
    <Dialog open onOpenChange={open => !open && props.onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Merge into {props.target}</DialogTitle>
          <DialogDescription>
            The agent cherry-picks them in this order, then runs their checks on the combined branch.
          </DialogDescription>
        </DialogHeader>
        <ul aria-label="Task branches" className="-mx-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1">
          {props.rows.map(r => {
            const header = r.artifactId !== lastArtifact
            lastArtifact = r.artifactId
            return (
              <li key={r.runId} className="flex flex-col">
                {header && (
                  <span className="mt-2 mb-1 truncate text-xs text-muted-foreground">
                    {props.titleOf(r.artifactId)}
                  </span>
                )}
                <label
                  className={cn(
                    'flex items-center gap-2 rounded-md px-1 py-1 text-sm',
                    r.depth > 1 && 'pl-5',
                    !r.ready && 'text-muted-foreground',
                  )}
                >
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 accent-primary"
                    disabled={!r.ready}
                    checked={r.ready && checked.has(r.runId)}
                    onChange={e =>
                      setChecked(current => {
                        const next = new Set(current)
                        if (e.target.checked) next.add(r.runId)
                        else next.delete(r.runId)
                        return next
                      })
                    }
                  />
                  <span className="min-w-0 flex-1 truncate">{r.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {r.reason ?? plural(r.commits, 'commit')}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancel
          </Button>
          <Button disabled={picked.length === 0} onClick={() => props.onMerge(picked)}>
            Write the prompt for {plural(picked.length, 'branch', 'branches')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Names the remote branch a task is split out as, and whether a ticket is filed first. */
function SplitDialog(props: {
  row: BranchRow
  prefix?: string
  tickets: boolean
  onSplit: (remote: string, ticket: boolean) => void
  onClose: () => void
}) {
  const { row } = props
  const [remote, setRemote] = useState(
    `${props.prefix ? `${props.prefix}-` : ''}${row.actionId}`.slice(0, 100),
  )
  const [ticket, setTicket] = useState(false)
  return (
    <Dialog open onOpenChange={open => !open && props.onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Split out into its own PR</DialogTitle>
          <DialogDescription>
            {row.title}: its {plural(row.commits, 'commit')} go to a remote branch of their own, with a
            draft PR. The local branch keeps its name.
          </DialogDescription>
        </DialogHeader>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Remote branch
          <Input aria-label="Remote branch" value={remote} onChange={e => setRemote(e.target.value)} />
        </label>
        {props.tickets ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={ticket}
              onChange={e => setTicket(e.target.checked)}
            />
            File a Jira ticket first, and put its key in front of the branch name and the PR title
          </label>
        ) : (
          <p className="text-xs text-muted-foreground">
            Filing a ticket needs a Jira tool in this session's Claude Code.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancel
          </Button>
          <Button disabled={!remote.trim()} onClick={() => props.onSplit(remote.trim(), ticket)}>
            Write the prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
