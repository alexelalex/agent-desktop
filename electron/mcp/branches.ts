import type { BranchState, LocalBranch } from "@/lib/desktop";
import { existsSync, realpathSync } from "node:fs";
import path from "node:path";
import { git } from "./git";

// What the branch menus read from git. Like worktrees.ts, the app never merges, pushes or fetches.

const inRepo = (common: string, args: string[]) => git(["--git-dir", common, ...args], common);

const commitOf = (common: string, ref: string) =>
  inRepo(common, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]).then(
    (out) => out.trim() || undefined,
    () => undefined,
  );

const count = (common: string, range: string) =>
  inRepo(common, ["rev-list", "--count", range]).then(
    (out) => Number(out.trim()) || 0,
    () => undefined,
  );

const realOrSame = (file: string) => {
  try {
    return realpathSync(file);
  } catch {
    return file;
  }
};

/** Each worktree of the repo, with the branch checked out in it. */
async function worktrees(common: string): Promise<{ path: string; branch?: string }[]> {
  const out = await inRepo(common, ["worktree", "list", "--porcelain"]).catch(() => "");
  return out.split("\n\n").flatMap((block) => {
    const at = block.match(/^worktree (.+)$/m)?.[1];
    if (!at || /^prunable/m.test(block)) return [];
    return [{ path: realOrSame(at), branch: block.match(/^branch refs\/heads\/(.+)$/m)?.[1] }];
  });
}

/** The worktree a branch is checked out in, if it still exists. */
export async function worktreeOf(common: string, name: string): Promise<string | undefined> {
  const at = (await worktrees(common)).find((w) => w.branch === name)?.path;
  return at && existsSync(at) ? at : undefined;
}

/** The repo's local branches, those checked out in a worktree first. */
export async function localBranches(common: string): Promise<LocalBranch[]> {
  const out = await inRepo(common, ["for-each-ref", "--format=%(refname:short)", "refs/heads/"]);
  const checkedOut = new Map(
    (await worktrees(common)).flatMap((w) => (w.branch ? [[w.branch, w.path] as const] : [])),
  );
  return out
    .split("\n")
    .filter(Boolean)
    .map((name) => ({ name, worktree: checkedOut.get(name) }))
    .sort((a, b) => Number(!a.worktree) - Number(!b.worktree) || a.name.localeCompare(b.name));
}

/** What `origin/HEAD` points to, or the first of origin/main, origin/master, main, master. */
export async function defaultBase(common: string): Promise<string | undefined> {
  const head = await inRepo(common, ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]).then(
    (out) => out.trim(),
    () => "",
  );
  if (head) return head;
  for (const name of ["origin/main", "origin/master", "main", "master"])
    if (await commitOf(common, name)) return name;
  return undefined;
}

const IN_PROGRESS: [file: string, what: string][] = [
  ["CHERRY_PICK_HEAD", "a cherry-pick"],
  ["REVERT_HEAD", "a revert"],
  ["MERGE_HEAD", "a merge"],
  ["rebase-merge", "a rebase"],
  ["rebase-apply", "a rebase"],
];

async function inProgress(worktree: string): Promise<string | undefined> {
  const out = await git(
    ["rev-parse", ...IN_PROGRESS.flatMap(([file]) => ["--git-path", file])],
    worktree,
  );
  const files = out.trim().split("\n");
  const at = files.findIndex((file) => existsSync(path.resolve(worktree, file)));
  return at < 0 ? undefined : IN_PROGRESS[at][1];
}

/** The branch as git has it now; `base` is what behind counts against. */
export async function branchState(common: string, name: string, base?: string): Promise<BranchState> {
  const tip = await commitOf(common, `refs/heads/${name}`);
  if (!tip) return { exists: false, pushed: false };
  const worktree = (await worktrees(common)).find((w) => w.branch === name)?.path;
  const here = worktree && existsSync(worktree) ? worktree : undefined;
  const dirty = here
    ? await git(["status", "--porcelain"], here).then((s) => s.trim().length > 0, () => false)
    : undefined;
  const busy = here ? await inProgress(here).catch(() => undefined) : undefined;
  const upstream =
    (await inRepo(common, ["rev-parse", "--abbrev-ref", `refs/heads/${name}@{upstream}`]).then(
      (out) => out.trim(),
      () => "",
    )) || ((await commitOf(common, `refs/remotes/origin/${name}`)) ? `origin/${name}` : "");
  return {
    exists: true,
    worktree: here,
    dirty,
    inProgress: busy,
    tip: tip.slice(0, 7),
    pushed: !!upstream,
    ahead: upstream ? await count(common, `${upstream}..refs/heads/${name}`) : undefined,
    behind: base ? await count(common, `refs/heads/${name}..${base}`) : undefined,
  };
}

export const branchExists = async (common: string, name: string) =>
  !!(await commitOf(common, `refs/heads/${name}`));

/** A branch's commits since `base`, oldest first. */
export async function commitsSince(
  common: string,
  base: string,
  branch: string,
): Promise<{ hash: string; subject: string }[]> {
  const out = await inRepo(common, [
    "log",
    "--reverse",
    "--format=%H%x09%s",
    `${base}..refs/heads/${branch}`,
  ]).catch(() => "");
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, ...subject] = line.split("\t");
      return { hash, subject: subject.join("\t") };
    });
}

/** The files a branch changed since `base`, committed only. */
export async function filesSince(common: string, base: string, branch: string): Promise<string[]> {
  const out = await inRepo(common, ["diff", "--name-only", base, `refs/heads/${branch}`]).catch(
    () => "",
  );
  return out.split("\n").filter(Boolean);
}

const TEST_FILE =
  /(^|\/)(tests?|__tests__|spec)\/|\.(test|spec)\.[cm]?[jt]sx?$|_test\.(go|py)$|(^|\/)test_[^/]+\.py$/;
export const testFiles = (files: string[]) => files.filter((f) => TEST_FILE.test(f));

const TRAILER = /\(cherry picked from commit ([0-9a-f]{40})\)/g;

/**
 * Whether every commit of a task is in `target`. Any one test is enough for a commit: the
 * branch is an ancestor; a `-x` trailer names it; a commit with its patch id is there; or
 * re-applying it onto `target` changes nothing. Patch ids alone miss picks whose context moved.
 */
export async function mergedInto(
  common: string,
  base: string,
  branch: string,
  target: string,
  commits: string[],
): Promise<boolean> {
  if (commits.length === 0) return false;
  const targetRef = `refs/heads/${target}`;
  const ancestor = await inRepo(common, [
    "merge-base",
    "--is-ancestor",
    `refs/heads/${branch}`,
    targetRef,
  ]).then(
    () => true,
    () => false,
  );
  if (ancestor) return true;
  const messages = await inRepo(common, ["log", "--format=%B", `${base}..${targetRef}`]).catch(
    () => "",
  );
  const picked = new Set([...messages.matchAll(TRAILER)].map((m) => m[1]));
  const cherry = await inRepo(common, ["cherry", targetRef, `refs/heads/${branch}`, base]).catch(
    () => "",
  );
  const equivalent = new Set(
    cherry
      .split("\n")
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2).trim()),
  );
  let targetTree: string | undefined;
  for (const hash of commits) {
    if (picked.has(hash) || equivalent.has(hash)) continue;
    targetTree ??= (await inRepo(common, ["rev-parse", `${targetRef}^{tree}`])).trim();
    const tree = await inRepo(common, [
      "merge-tree",
      "--write-tree",
      `--merge-base=${hash}^`,
      targetRef,
      hash,
    ]).then(
      (out) => out.split("\n")[0].trim(),
      () => undefined,
    );
    if (tree !== targetTree) return false;
  }
  return true;
}

/** "Done when" and what follows it, up to the next blank line, from a brief. */
export function doneWhen(brief: string): string | undefined {
  const at = brief.search(/^[ \t>*_#-]*done when\b/im);
  if (at < 0) return undefined;
  const block = brief.slice(at).split(/\n[ \t]*\n/)[0].trim();
  return block.length > 1500 ? `${block.slice(0, 1500)}…` : block;
}
