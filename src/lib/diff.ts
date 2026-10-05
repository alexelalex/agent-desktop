// Line diffs of a task's changed files: shared by the main process, which counts them, and the panel.

export type DiffLine = {
  kind: 'same' | 'del' | 'add'
  text: string
  /** 1-based, in the file before; unset for an added line. */
  old?: number
  /** 1-based, in the file after; unset for a deleted line. */
  new?: number
}

/** Unchanged lines shown around each change. */
export const CONTEXT = 3
// Past this many edits the middle shows as replaced whole, rather than diffed.
const MAX_EDITS = 4000

export function linesOf(text: string | undefined): string[] {
  if (!text) return []
  const lines = text.split(/\r?\n/)
  if (lines.at(-1) === '') lines.pop()
  return lines
}

// Myers' O(ND) diff of a and b; each snapshot holds k in [-d-1, d+1] before step d.
function myers(a: string[], b: string[]): DiffLine['kind'][] | undefined {
  const n = a.length
  const m = b.length
  const offset = n + m + 1
  const v = new Int32Array(2 * offset + 1)
  const trace: Int32Array[] = []
  let edits = -1
  outer: for (let d = 0; d <= n + m; d++) {
    if (d > MAX_EDITS) return undefined
    trace.push(v.slice(offset - d - 1, offset + d + 2))
    for (let k = -d; k <= d; k += 2) {
      let x =
        k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])
          ? v[offset + k + 1]
          : v[offset + k - 1] + 1
      let y = x - k
      while (x < n && y < m && a[x] === b[y]) {
        x++
        y++
      }
      v[offset + k] = x
      if (x >= n && y >= m) {
        edits = d
        break outer
      }
    }
  }
  const ops: DiffLine['kind'][] = []
  let x = n
  let y = m
  for (let d = edits; d > 0; d--) {
    const snap = trace[d]
    const at = (k: number) => snap[k + d + 1]
    const k = x - y
    const prev = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1
    const px = at(prev)
    const py = px - prev
    for (; x > px && y > py; x--, y--) ops.push('same')
    if (x === px) {
      ops.push('add')
      y--
    } else {
      ops.push('del')
      x--
    }
  }
  for (; x > 0 && y > 0; x--, y--) ops.push('same')
  return ops.reverse()
}

/** Every line of both versions, in order, each kept, deleted or added. */
export function diffLines(before: string | undefined, after: string | undefined): DiffLine[] {
  const a = linesOf(before)
  const b = linesOf(after)
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let end = 0
  while (
    end < a.length - start &&
    end < b.length - start &&
    a[a.length - 1 - end] === b[b.length - 1 - end]
  )
    end++
  const midA = a.slice(start, a.length - end)
  const midB = b.slice(start, b.length - end)
  const middle = myers(midA, midB) ?? [
    ...midA.map(() => 'del' as const),
    ...midB.map(() => 'add' as const),
  ]
  const kinds = [...Array<'same'>(start).fill('same'), ...middle, ...Array<'same'>(end).fill('same')]
  const lines: DiffLine[] = []
  let i = 0
  let j = 0
  for (const kind of kinds) {
    if (kind === 'same') lines.push({ kind, text: a[i], old: ++i, new: ++j })
    else if (kind === 'del') lines.push({ kind, text: a[i], old: ++i })
    else lines.push({ kind, text: b[j], new: ++j })
  }
  return lines
}

export function countChanges(lines: DiffLine[]) {
  let additions = 0
  let deletions = 0
  for (const line of lines) {
    if (line.kind === 'add') additions++
    else if (line.kind === 'del') deletions++
  }
  return { additions, deletions }
}

/** Runs of lines: changes with their context, and the unchanged stretches between, folded. */
export type Segment = { folded: boolean; lines: DiffLine[] }

export function segments(lines: DiffLine[], context = CONTEXT): Segment[] {
  const near = new Array<boolean>(lines.length).fill(false)
  lines.forEach((line, i) => {
    if (line.kind === 'same') return
    for (let k = Math.max(0, i - context); k <= Math.min(lines.length - 1, i + context); k++)
      near[k] = true
  })
  const out: Segment[] = []
  let i = 0
  while (i < lines.length) {
    let j = i
    while (j < lines.length && near[j] === near[i]) j++
    // A fold must save more than the row that stands for it.
    const folded = !near[i] && j - i > 1
    const last = out.at(-1)
    if (last && !last.folded && !folded) last.lines.push(...lines.slice(i, j))
    else out.push({ folded, lines: lines.slice(i, j) })
    i = j
  }
  return out
}

/** Side-by-side rows: a deleted run sits beside the added run that follows it. */
export type SplitRow = { left?: DiffLine; right?: DiffLine }

export function splitRows(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = []
  let i = 0
  while (i < lines.length) {
    if (lines[i].kind === 'same') {
      rows.push({ left: lines[i], right: lines[i] })
      i++
      continue
    }
    const dels: DiffLine[] = []
    const adds: DiffLine[] = []
    while (i < lines.length && lines[i].kind === 'del') dels.push(lines[i++])
    while (i < lines.length && lines[i].kind === 'add') adds.push(lines[i++])
    for (let k = 0; k < Math.max(dels.length, adds.length); k++)
      rows.push({ left: dels[k], right: adds[k] })
  }
  return rows
}

/** For a changed line and its counterpart: where the changed characters start and end. */
export function changedSpan(text: string, other: string): [number, number] | undefined {
  let start = 0
  while (start < text.length && start < other.length && text[start] === other[start]) start++
  let end = 0
  while (
    end < text.length - start &&
    end < other.length - start &&
    text[text.length - 1 - end] === other[other.length - 1 - end]
  )
    end++
  // Nothing in common: the line's own colour says it all.
  if (start === 0 && end === 0) return undefined
  return [start, text.length - end]
}

/** Each deleted line's added counterpart and back, as split view pairs them. */
export function counterparts(lines: DiffLine[]): Map<DiffLine, DiffLine> {
  const pairs = new Map<DiffLine, DiffLine>()
  for (const { left, right } of splitRows(lines))
    if (left && right && left !== right) {
      pairs.set(left, right)
      pairs.set(right, left)
    }
  return pairs
}
