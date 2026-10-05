import {
  ArrowLeftIcon,
  Columns2Icon,
  FileDiffIcon,
  FileMinusIcon,
  FilePlusIcon,
  FileSymlinkIcon,
  FolderOpenIcon,
  Rows2Icon,
  UnfoldVerticalIcon,
  XIcon,
} from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ipcError } from '@/components/RetryParts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { ChangedFile, FileDiff } from '@/lib/desktop'
import {
  changedSpan,
  counterparts,
  diffLines,
  linesOf,
  segments,
  splitRows,
  type DiffLine,
} from '@/lib/diff'
import { useElementWidth } from '@/lib/layout'
import { cn } from '@/lib/utils'

const LAYOUT_KEY = 'agent-desktop.diff-layout'
// Narrower than this, split view falls back to inline.
const SPLIT_MIN = 520

type Layout = 'split' | 'inline'

function storedLayout(): Layout {
  try {
    return localStorage.getItem(LAYOUT_KEY) === 'inline' ? 'inline' : 'split'
  } catch {
    return 'split'
  }
}

export const baseName = (file: string) => file.split('/').at(-1) ?? file
export const dirName = (file: string) => file.split('/').slice(0, -1).join('/')

const STATUS_ICON = {
  added: { Icon: FilePlusIcon, className: 'text-emerald-600 dark:text-emerald-400' },
  deleted: { Icon: FileMinusIcon, className: 'text-red-600 dark:text-red-400' },
  modified: { Icon: FileDiffIcon, className: 'text-amber-600 dark:text-amber-400' },
  renamed: { Icon: FileSymlinkIcon, className: 'text-sky-600 dark:text-sky-400' },
} as const

export function FileChangeIcon({ status }: { status: ChangedFile['status'] }) {
  const { Icon, className } = STATUS_ICON[status]
  return <Icon aria-hidden className={cn('size-3.5 shrink-0', className)} />
}

/** `+12 −3`, or `binary`; nothing when the counts aren't known. */
export function DiffStat({ file }: { file: ChangedFile }) {
  if (file.binary) return <>binary</>
  if (file.additions === undefined) return null
  return (
    <span className="tabular-nums">
      <span className="text-emerald-600 dark:text-emerald-400">+{file.additions}</span>{' '}
      <span className="text-red-600 dark:text-red-400">−{file.deletions ?? 0}</span>
    </span>
  )
}

/** The changed characters of a line, marked against its counterpart on the other side. */
export function ChangedText({ line, other, strike }: { line: DiffLine; other?: DiffLine; strike?: boolean }) {
  const span = other && changedSpan(line.text, other.text)
  if (!span || !line.text) return <>{line.text || ' '}</>
  const mark = line.kind === 'del' ? 'bg-red-500/30' : 'bg-emerald-500/30'
  return (
    <>
      {line.text.slice(0, span[0])}
      <span className={cn('rounded-[2px]', mark, strike && line.kind === 'del' && 'line-through')}>
        {line.text.slice(span[0], span[1])}
      </span>
      {line.text.slice(span[1])}
    </>
  )
}

const ROW = {
  same: '',
  del: 'bg-red-500/10',
  add: 'bg-emerald-500/10',
}
const NUMBER = 'w-10 select-none px-2 text-right align-top text-muted-foreground/70 tabular-nums'
const CODE = 'whitespace-pre-wrap px-2 align-top [overflow-wrap:anywhere]'

function Fold({ count, columns, onExpand }: { count: number; columns: number; onExpand: () => void }) {
  return (
    <tr className="bg-muted/50 text-muted-foreground">
      <td colSpan={columns} className="p-0">
        <button
          className="flex w-full items-center gap-2 px-2 py-1 text-left hover:bg-muted hover:text-foreground"
          onClick={onExpand}
        >
          <UnfoldVerticalIcon className="size-3.5" />
          {count} unchanged {count === 1 ? 'line' : 'lines'}
        </button>
      </td>
    </tr>
  )
}

function InlineRows({ lines, pairs }: { lines: DiffLine[]; pairs: Map<DiffLine, DiffLine> }) {
  return lines.map((line, i) => (
    <tr key={i} className={ROW[line.kind]}>
      <td className={NUMBER}>{line.old}</td>
      <td className={NUMBER}>{line.new}</td>
      <td className="w-4 select-none text-center align-top text-muted-foreground">
        {line.kind === 'del' ? '−' : line.kind === 'add' ? '+' : ''}
      </td>
      <td className={CODE}>
        <ChangedText line={line} other={pairs.get(line)} />
      </td>
    </tr>
  ))
}

function SplitSide({ line, other }: { line?: DiffLine; other?: DiffLine }) {
  if (!line)
    return (
      <>
        <td className="bg-muted/40" />
        <td className="border-r bg-muted/40" />
      </>
    )
  const number = line.kind === 'add' ? line.new : line.old
  return (
    <>
      <td className={cn(NUMBER, ROW[line.kind])}>{number}</td>
      <td className={cn(CODE, 'border-r', ROW[line.kind])}>
        <ChangedText line={line} other={line.kind === 'same' ? undefined : other} />
      </td>
    </>
  )
}

function DiffTable({ lines, layout, fold }: { lines: DiffLine[]; layout: Layout; fold: boolean }) {
  const parts = useMemo(() => (fold ? segments(lines) : [{ folded: false, lines }]), [lines, fold])
  const pairs = useMemo(() => counterparts(lines), [lines])
  const [opened, setOpened] = useState<Set<number>>(() => new Set())
  useEffect(() => setOpened(new Set()), [lines])
  const columns = 4
  return (
    <table className="w-full table-fixed border-collapse font-mono text-xs leading-5">
      {layout === 'split' ? (
        <colgroup>
          <col className="w-10" />
          <col />
          <col className="w-10" />
          <col />
        </colgroup>
      ) : (
        <colgroup>
          <col className="w-10" />
          <col className="w-10" />
          <col className="w-4" />
          <col />
        </colgroup>
      )}
      <tbody>
        {parts.map((part, i) =>
          part.folded && !opened.has(i) ? (
            <Fold
              key={i}
              count={part.lines.length}
              columns={columns}
              onExpand={() => setOpened(current => new Set(current).add(i))}
            />
          ) : layout === 'inline' ? (
            <InlineRows key={i} lines={part.lines} pairs={pairs} />
          ) : (
            <Fragment key={i}>
              {splitRows(part.lines).map((row, r) => (
                <tr key={r}>
                  <SplitSide line={row.left} other={row.right} />
                  <SplitSide line={row.right} other={row.left} />
                </tr>
              ))}
            </Fragment>
          ),
        )}
      </tbody>
    </table>
  )
}

function Notice({ children }: { children: ReactNode }) {
  return <p className="px-4 py-3 text-sm text-muted-foreground">{children}</p>
}

/** A file a task changed, before and after, in the artifact panel's place. */
export function FileDiffPanel({
  runId,
  path,
  listed,
  version,
  narrow,
  onClose,
  className,
}: {
  runId: string
  /** As the task's outcome lists it. */
  path: string
  /** Its entry in the outcome, shown until the diff loads. */
  listed?: ChangedFile
  /** Changes when the task's changes may have: the diff is read again. */
  version: string
  /** Shown in the chat's place rather than beside it. */
  narrow?: boolean
  onClose: () => void
  className?: string
}) {
  const [diff, setDiff] = useState<FileDiff>()
  const [error, setError] = useState<string>()
  const [layout, setLayout] = useState<Layout>(storedLayout)
  const root = useRef<HTMLElement>(null)
  const width = useElementWidth(root)
  const tooNarrow = width !== undefined && width < SPLIT_MIN
  const shownLayout = tooNarrow ? 'inline' : layout

  useEffect(() => {
    let current = true
    setError(undefined)
    window.desktop.claudeCode.fileDiff(runId, path).then(
      next => current && setDiff(next),
      (e: unknown) => {
        if (!current) return
        setDiff(undefined)
        setError(ipcError(e))
      },
    )
    return () => {
      current = false
    }
  }, [runId, path, version])

  const shown = diff?.file.path === path ? diff : undefined
  const file = shown?.file ?? listed
  // An earlier version that isn't known: the file as it is, unmarked.
  const unknown = !!shown && shown.before === undefined && shown.file.status !== 'added'
  const lines = useMemo(() => {
    if (!shown || shown.binary || shown.tooLarge) return []
    if (unknown)
      return linesOf(shown.after).map((text, i): DiffLine => ({ kind: 'same', text, new: i + 1 }))
    return diffLines(shown.before, shown.after)
  }, [shown, unknown])
  const choose = (next: Layout) => {
    setLayout(next)
    try {
      localStorage.setItem(LAYOUT_KEY, next)
    } catch {
      // Storage unavailable: the choice lasts for this window.
    }
  }
  const dir = dirName(path)

  return (
    <aside
      ref={root}
      aria-label="File change"
      className={cn('flex min-h-0 min-w-0 flex-col bg-background', className)}
    >
      <header className="flex h-11 shrink-0 items-center gap-2 border-b px-4">
        {narrow && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeftIcon /> Chat
          </Button>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2" title={path}>
          {file && <FileChangeIcon status={file.status} />}
          <h2 className="truncate text-sm font-semibold">{baseName(path)}</h2>
          {(file?.oldPath || dir) && (
            <span className="truncate text-xs text-muted-foreground">
              {file?.oldPath ? `from ${file.oldPath}` : dir}
            </span>
          )}
          {file && (
            <Badge variant="outline" className="h-4 px-1.5 py-0 font-mono text-[10px] uppercase">
              {file.status}
            </Badge>
          )}
          {file && (
            <span className="shrink-0 text-xs">
              <DiffStat file={file} />
            </span>
          )}
        </div>
        <div role="group" aria-label="Diff layout" className="flex shrink-0 items-center">
          <Button
            size="icon-sm"
            variant={shownLayout === 'split' ? 'secondary' : 'ghost'}
            aria-label="Split view"
            aria-pressed={shownLayout === 'split'}
            title={tooNarrow ? 'Split view needs a wider panel' : 'Split view'}
            disabled={tooNarrow}
            onClick={() => choose('split')}
          >
            <Columns2Icon />
          </Button>
          <Button
            size="icon-sm"
            variant={shownLayout === 'inline' ? 'secondary' : 'ghost'}
            aria-label="Inline view"
            aria-pressed={shownLayout === 'inline'}
            title="Inline view"
            onClick={() => choose('inline')}
          >
            <Rows2Icon />
          </Button>
        </div>
        {shown && (
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Reveal in Finder"
            title="Reveal in Finder"
            disabled={shown.file.status === 'deleted'}
            onClick={() => void window.desktop.claudeCode.reveal(shown.absolute)}
          >
            <FolderOpenIcon />
          </Button>
        )}
        <Button size="icon-sm" variant="ghost" aria-label="Close file" title="Close" onClick={onClose}>
          <XIcon />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {shown?.note && (
          <p className="border-b bg-amber-500/10 px-4 py-2 text-xs">{shown.note}</p>
        )}
        {error ? (
          <Notice>{error}</Notice>
        ) : !shown ? (
          <div className="flex justify-center p-6">
            <Spinner />
          </div>
        ) : shown.binary ? (
          <Notice>A binary file: its contents aren't shown.</Notice>
        ) : shown.tooLarge ? (
          <Notice>Over 1 MB: its contents aren't shown.</Notice>
        ) : lines.length === 0 ? (
          <Notice>The file is empty.</Notice>
        ) : !unknown && lines.every(l => l.kind === 'same') ? (
          <Notice>
            {shown.file.status === 'renamed'
              ? 'Renamed; its contents are unchanged.'
              : 'No line changed: only its mode or line endings did.'}
          </Notice>
        ) : (
          <DiffTable lines={lines} layout={unknown ? 'inline' : shownLayout} fold={!unknown} />
        )}
      </div>
    </aside>
  )
}
