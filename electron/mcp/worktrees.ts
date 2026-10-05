import type { TaskLink, WorktreeState } from "@/lib/desktop";
import { copyFileSync, existsSync, mkdirSync, realpathSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { MAX_LISTED_FILES, worktreeChanges } from "./changes";
import { git } from "./git";

// The worktrees the app makes for tasks. It never merges, pushes or fetches.

type Worktree = NonNullable<TaskLink["worktree"]>;

const LOCAL_SETTINGS = path.join(".claude", "settings.local.json");

const root = () =>
  process.env.AGENT_DESKTOP_WORKTREES ?? path.join(os.homedir(), ".agent-desktop", "worktrees");

export const worktreePath = (worktree: Worktree, taskId: string) =>
  path.join(root(), worktree.repo, taskId.slice(0, 8));

// Worktree commands run against the main repo's git dir, wherever the task's checkout is.
const inRepo = (worktree: Worktree, args: string[], hooks = false) =>
  git(["--git-dir", worktree.common, ...args], worktree.common, { hooks });

// One creation at a time per repo: git locks its worktree list.
const queues = new Map<string, Promise<unknown>>();
function serial<T>(key: string, run: () => Promise<T>): Promise<T> {
  const next = (queues.get(key) ?? Promise.resolve()).catch(() => undefined).then(run);
  const settled = next.catch(() => undefined);
  queues.set(key, settled);
  void settled.then(() => queues.get(key) === settled && queues.delete(key));
  return next;
}

/** Waits for any creation still running in the repo. */
export const settled = (worktree: Worktree) =>
  (queues.get(worktree.common) ?? Promise.resolve()).catch(() => undefined);

async function branches(worktree: Worktree): Promise<Set<string>> {
  const out = await inRepo(worktree, ["for-each-ref", "--format=%(refname:short)", "refs/heads/"]);
  return new Set(out.split("\n").filter(Boolean));
}

// A branch named like one of these folders (e.g. `desktop`) blocks every name under it.
const NAMESPACES = ["desktop/task", "desktop-task"];
const TRIES = 1000;

// The first name no branch has, and that no branch blocks as a folder or a file.
function freeBranch(taken: Set<string>, path: string): string {
  for (const namespace of NAMESPACES) {
    const wanted = `${namespace}/${path}`;
    const parts = wanted.split("/");
    if (parts.slice(1).some((_, i) => taken.has(parts.slice(0, i + 1).join("/")))) continue;
    for (let n = 1; n <= TRIES; n++) {
      const name = n === 1 ? wanted : `${wanted}-${n}`;
      if (!taken.has(name) && ![...taken].some((b) => b.startsWith(`${name}/`))) return name;
    }
  }
  throw new Error(`No free branch name for ${path}: existing branches block desktop/task/ and desktop-task/.`);
}

/** The branch a task of this action would get now. */
export async function nextBranch(worktree: Worktree, parentId: string, actionId: string) {
  return freeBranch(await branches(worktree), `${parentId.slice(0, 8)}/${actionId}`);
}

// `git worktree list --porcelain`: path → branch.
async function listed(worktree: Worktree): Promise<Map<string, string | undefined>> {
  const out = await inRepo(worktree, ["worktree", "list", "--porcelain"]);
  const map = new Map<string, string | undefined>();
  for (const block of out.split("\n\n")) {
    const at = block.match(/^worktree (.+)$/m)?.[1];
    if (!at) continue;
    let real = at;
    try {
      real = realpathSync(at);
    } catch {
      // gone: prunable
    }
    map.set(real, block.match(/^branch refs\/heads\/(.+)$/m)?.[1]);
  }
  return map;
}

const realOrSame = (file: string) => {
  try {
    return realpathSync(file);
  } catch {
    return file;
  }
};

/**
 * Makes the task's worktree, or reuses the one an earlier start made at its path on its
 * branch. `record` saves the path and branch before git runs, so a failure can be cleaned up.
 */
export function createWorktree(options: {
  taskId: string;
  parentId: string;
  actionId: string;
  worktree: Worktree;
  record: (worktree: Worktree) => void;
}): Promise<Worktree> {
  const { taskId, parentId, actionId, record } = options;
  return serial(options.worktree.common, async () => {
    let worktree = options.worktree;
    const target = worktreePath(worktree, taskId);
    if (existsSync(target)) {
      const branch = (await listed(worktree)).get(realOrSame(target));
      if (worktree.branch && branch === worktree.branch && worktree.path === target)
        return worktree;
      if (branch !== undefined || (await listed(worktree)).has(realOrSame(target)))
        await inRepo(worktree, ["worktree", "remove", "--force", target]).catch(() => undefined);
      rmSync(target, { recursive: true, force: true });
    }
    await inRepo(worktree, ["worktree", "prune"]).catch(() => undefined);
    // What an earlier failed attempt made goes, so the task ends with one branch.
    if (worktree.created && worktree.branch) {
      await inRepo(worktree, ["branch", "-D", worktree.branch]).catch(() => undefined);
      worktree = { ...worktree, branch: undefined, path: undefined, created: undefined };
    }
    const branch = await nextBranch(worktree, parentId, actionId);
    worktree = { ...worktree, path: target, branch, created: true };
    record(worktree);
    mkdirSync(path.dirname(target), { recursive: true });
    await inRepo(worktree, ["worktree", "add", "-b", branch, target, worktree.commit], true);
    // The user's own allowlist for this repo, when the repo keeps it out of commits.
    const settings = path.join(worktree.source, LOCAL_SETTINGS);
    const ignored = await git(["check-ignore", "-q", LOCAL_SETTINGS], worktree.source).then(
      () => true,
      () => false,
    );
    if (ignored && existsSync(settings)) {
      mkdirSync(path.join(target, ".claude"), { recursive: true });
      copyFileSync(settings, path.join(target, LOCAL_SETTINGS));
    }
    return worktree;
  });
}

/** What the task did in its worktree since `commit`. */
export async function worktreeOutcome(worktree: Worktree) {
  const cwd = worktree.path!;
  const ahead = await git(["rev-list", "--count", `${worktree.commit}..HEAD`], cwd);
  const files = await worktreeChanges(worktree);
  const status = await git(["status", "--porcelain"], cwd);
  return {
    commitsAhead: Number(ahead.trim()) || 0,
    filesChanged: files.length,
    files: files.slice(0, MAX_LISTED_FILES),
    dirty: status.trim().length > 0,
  };
}

export async function worktreeState(worktree: Worktree): Promise<WorktreeState> {
  const target = worktree.path!;
  const exists = existsSync(target);
  const dirty = exists
    ? await git(["status", "--porcelain"], target).then((s) => s.trim().length > 0, () => false)
    : false;
  return { path: target, branch: worktree.branch, exists, dirty };
}

/** Deletes the worktree's folder; its branch stays. */
export async function removeWorktree(worktree: Worktree, force: boolean) {
  if (!worktree.path) return;
  if (!existsSync(worktree.path)) {
    await inRepo(worktree, ["worktree", "prune"]);
    return;
  }
  await inRepo(worktree, ["worktree", "remove", ...(force ? ["--force"] : []), worktree.path]);
}
