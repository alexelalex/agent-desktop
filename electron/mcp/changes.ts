import type { ChangedFile, FileDiff, TaskLink } from "@/lib/desktop";
import { countChanges, diffLines, linesOf } from "@/lib/diff";
import type { UIMessage } from "ai";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { git } from "./git";

// What a task changed: in a worktree, git since the base commit; elsewhere, its own edits taken back.

type Worktree = NonNullable<TaskLink["worktree"]>;

export const EDIT_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);
/** Listed in a task's outcome at most; `filesChanged` counts them all. */
export const MAX_LISTED_FILES = 500;
const MAX_BYTES = 1_000_000;

/** One version of a file; no text and no flag: it doesn't exist. */
type Version = { text?: string; binary?: boolean; tooLarge?: boolean };

function asVersion(text: string): Version {
  if (text.length > MAX_BYTES) return { tooLarge: true };
  return text.slice(0, 8000).includes("\0") ? { binary: true } : { text };
}

function onDisk(file: string): Version {
  try {
    const stat = statSync(file);
    if (!stat.isFile()) return {};
    if (stat.size > MAX_BYTES) return { tooLarge: true };
    return asVersion(readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

const exists = (version: Version) =>
  version.text !== undefined || !!version.binary || !!version.tooLarge;

function diffOf(file: ChangedFile, absolute: string, before: Version, after: Version, note?: string): FileDiff {
  if (before.binary || after.binary) return { file, absolute, binary: true };
  if (before.tooLarge || after.tooLarge) return { file, absolute, tooLarge: true };
  return { file, absolute, before: before.text, after: after.text, ...(note && { note }) };
}

const STATUS: Record<string, ChangedFile["status"]> = { A: "added", D: "deleted", R: "renamed" };

/** The worktree's changes since its base commit, committed or not, untracked files included. */
export async function worktreeChanges(worktree: Worktree): Promise<ChangedFile[]> {
  const cwd = worktree.path!;
  const names = (await git(["diff", "--name-status", "-z", "-M", worktree.commit], cwd)).split("\0");
  const stats = (await git(["diff", "--numstat", "-z", "-M", worktree.commit], cwd)).split("\0");
  const untracked = await git(["ls-files", "--others", "--exclude-standard", "-z"], cwd);
  const files = new Map<string, ChangedFile>();
  for (let i = 0; i < names.length && names[i]; ) {
    const code = names[i++];
    const oldPath = code[0] === "R" || code[0] === "C" ? names[i++] : undefined;
    const file = names[i++];
    files.set(file, {
      path: file,
      status: STATUS[code[0]] ?? (code[0] === "C" ? "added" : "modified"),
      ...(code[0] === "R" && { oldPath }),
    });
  }
  // `-z --numstat` gives a rename as an empty path, then its old and new paths.
  for (let i = 0; i < stats.length; ) {
    const match = stats[i++].match(/^(-|\d+)\t(-|\d+)\t([\s\S]*)$/);
    if (!match) continue;
    let file = match[3];
    if (file === "") file = stats[(i += 2) - 1];
    const entry = files.get(file);
    if (!entry) continue;
    if (match[1] === "-") entry.binary = true;
    else Object.assign(entry, { additions: Number(match[1]), deletions: Number(match[2]) });
  }
  for (const file of untracked.split("\0").filter(Boolean)) {
    const version = onDisk(path.join(cwd, file));
    files.set(file, {
      path: file,
      status: "added",
      ...(version.binary && { binary: true }),
      ...(version.text !== undefined && { additions: linesOf(version.text).length, deletions: 0 }),
    });
  }
  return [...files.values()].sort((a, b) => a.path.localeCompare(b.path));
}

export async function worktreeFileDiff(worktree: Worktree, file: ChangedFile): Promise<FileDiff> {
  const cwd = worktree.path!;
  const absolute = path.join(cwd, file.path);
  if (file.binary) return { file, absolute, binary: true };
  const before =
    file.status === "added"
      ? {}
      : asVersion(await git(["show", `${worktree.commit}:${file.oldPath ?? file.path}`], cwd));
  const after = file.status === "deleted" ? {} : onDisk(absolute);
  return diffOf(file, absolute, before, after);
}

type Edit = { tool: string; input: Record<string, unknown>; created: boolean };
type Replace = { old_string?: unknown; new_string?: unknown; replace_all?: unknown };

/** The task's own edits, by absolute path, in the order made. */
function editsByFile(messages: UIMessage[], cwd: string): Map<string, Edit[]> {
  const edits = new Map<string, Edit[]>();
  for (const part of messages.flatMap((m) => m.parts)) {
    if (part.type !== "dynamic-tool" || !EDIT_TOOLS.has(part.toolName)) continue;
    if (part.state !== "output-available") continue;
    const input = (part.input ?? {}) as Record<string, unknown>;
    const named = input.file_path ?? input.notebook_path;
    if (typeof named !== "string" || !named) continue;
    const file = path.resolve(cwd, named);
    const created = part.toolName === "Write" && /created/i.test(String(part.output));
    edits.set(file, [...(edits.get(file) ?? []), { tool: part.toolName, input, created }]);
  }
  return edits;
}

// `text` with one replacement taken back, if making it again gives `text`.
function unreplace(text: string, replace: Replace): string | undefined {
  const from = String(replace.old_string ?? "");
  const to = String(replace.new_string ?? "");
  const all = replace.replace_all === true;
  if (!from || !to) return undefined;
  const parts = text.split(to);
  if (parts.length < 2 || (!all && parts.length > 2)) return undefined;
  const undone = parts.join(from);
  const again = undone.split(from);
  if ((!all && again.length !== 2) || again.join(to) !== text) return undefined;
  return undone;
}

/** The file before the task's edits: null when one of them created it, undefined when it can't be told. */
function undo(current: string | undefined, edits: Edit[]): string | null | undefined {
  let text = current;
  for (const edit of [...edits].reverse()) {
    if (edit.tool === "Write") return edit.created ? null : undefined;
    const replaces =
      edit.tool === "Edit"
        ? [edit.input as Replace]
        : edit.tool === "MultiEdit" && Array.isArray(edit.input.edits)
          ? (edit.input.edits as Replace[])
          : undefined;
    if (!replaces) return undefined;
    for (const replace of [...replaces].reverse()) {
      if (text === undefined) return undefined;
      text = unreplace(text, replace);
    }
  }
  return text;
}

const committed = (file: string) =>
  git(["show", `HEAD:./${path.basename(file)}`], path.dirname(file)).then(asVersion, () => undefined);

const shownPath = (absolute: string, cwd: string) => {
  const relative = path.relative(cwd, absolute);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative) ? relative : absolute;
};

// Undefined when the task's edits came to nothing.
async function editedDiff(absolute: string, edits: Edit[], cwd: string): Promise<FileDiff | undefined> {
  const after = onDisk(absolute);
  const shown = shownPath(absolute, cwd);
  if (after.binary || after.tooLarge)
    return diffOf({ path: shown, status: "modified", ...(after.binary && { binary: true }) }, absolute, {}, after);
  const undone = undo(after.text, edits);
  let before: Version | undefined = undone === null ? {} : undone === undefined ? undefined : { text: undone };
  let note: string | undefined;
  if (!before) {
    before = await committed(absolute);
    note = before
      ? "Compared with the last commit: the task's own edits couldn't be traced back."
      : "Its earlier version isn't known.";
  }
  if (before && !exists(before) && !exists(after)) return undefined;
  if (before?.text !== undefined && before.text === after.text) return undefined;
  const status =
    before && !exists(before) ? "added" : !exists(after) ? "deleted" : "modified";
  const stats =
    before?.text !== undefined || (before && !exists(before))
      ? countChanges(diffLines(before.text, after.text))
      : undefined;
  const file: ChangedFile = { path: shown, status, ...stats, ...(before?.binary && { binary: true }) };
  return diffOf(file, absolute, before ?? {}, after, note);
}

/** The files the task edited outside a worktree, in path order. */
export async function editedChanges(messages: UIMessage[], cwd: string): Promise<ChangedFile[]> {
  const diffs = await Promise.all(
    [...editsByFile(messages, cwd)].map(([file, edits]) => editedDiff(file, edits, cwd)),
  );
  return diffs
    .flatMap((diff) => (diff ? [diff.file] : []))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export async function editedFileDiff(
  messages: UIMessage[],
  cwd: string,
  shown: string,
): Promise<FileDiff | undefined> {
  const absolute = path.resolve(cwd, shown);
  const edits = editsByFile(messages, cwd).get(absolute);
  return edits && editedDiff(absolute, edits, cwd);
}
