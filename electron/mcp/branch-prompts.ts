// The prompts the branch menus put in the composer. The agent does the git work; the app only
// states the facts it read, so the user can check them before sending.

export const REPORT_TOOL = "ui_report_branch";

/** The branch a prompt works on. */
export interface PromptTarget {
  repo: string;
  name: string;
  worktree?: string;
  tip?: string;
  pushed: boolean;
  /** Commits not on its remote. */
  ahead?: number;
  prefix?: string;
  defaultBase?: string;
  /** The session's folder is outside the repo, so the repo's CLAUDE.md wasn't loaded. */
  outside: boolean;
  pr?: { url: string; number?: number };
}

/** A task branch a prompt merges or splits. */
export interface PromptSource {
  title: string;
  branch: string;
  worktree?: string;
  base: string;
  commits: { hash: string; subject: string }[];
  files: string[];
  doneWhen?: string;
  tests: string[];
}

const short = (hash: string) => hash.slice(0, 7);
const code = (text: string) => `\`${text}\``;
const indent = (text: string, by = "   ") =>
  text
    .split("\n")
    .map((line) => `${by}${line}`)
    .join("\n");

function targetFacts(t: PromptTarget): string[] {
  const where = t.worktree ? `checked out at ${code(t.worktree)}` : "not checked out in any worktree";
  return [
    `- Branch ${code(t.name)} in ${t.repo}, ${where}${t.tip ? `, tip ${t.tip}` : ""}, ${t.pushed ? (t.ahead ? `pushed, ${t.ahead} commit${t.ahead === 1 ? "" : "s"} not on its remote` : "pushed") : "not pushed"}.`,
    ...(t.prefix ? [`- Commit prefix: ${code(t.prefix)}`] : []),
    ...(t.defaultBase ? [`- Default base: ${code(t.defaultBase)} (as of the last fetch)`] : []),
    ...(t.pr ? [`- PR: ${t.pr.url}`] : []),
    ...(t.outside && t.worktree
      ? [`- This session's folder is outside the repo: read ${code(`${t.worktree}/CLAUDE.md`)} first, if it exists.`]
      : []),
  ];
}

function sourceFacts(s: PromptSource, n?: number): string {
  const lines = [
    `${n === undefined ? "" : `${n}. `}${s.title}`,
    `   Branch ${code(s.branch)}${s.worktree ? `, worktree ${code(s.worktree)}` : ""}, base ${short(s.base)}`,
    `   Commits:`,
    ...s.commits.map((c) => `   - ${short(c.hash)} ${c.subject}`),
    `   Files (${s.files.length}): ${s.files.slice(0, 12).join(", ")}${s.files.length > 12 ? ", …" : ""}`,
    ...(s.doneWhen ? [indent(s.doneWhen)] : []),
    ...(s.tests.length > 0 ? [`   Tests in its diff: ${s.tests.join(", ")}`] : []),
  ];
  return lines.join("\n");
}

const report = (args: string) => `Call ${REPORT_TOOL} with ${args}.`;

/** Cherry-picks task branches into the target, in order, then runs their checks there. */
export function mergePrompt(target: PromptTarget, sources: PromptSource[]): string {
  const at = code(target.worktree ?? "<worktree>");
  const one = sources.length === 1;
  return [
    one
      ? `Merge ${sources[0].title} into ${code(target.name)}.`
      : `Merge these ${sources.length} task branches into ${code(target.name)}, in this order.`,
    "",
    "Target",
    ...targetFacts(target),
    "",
    one ? "Branch" : "Branches",
    ...sources.map((s, i) => sourceFacts(s, one ? undefined : i + 1)),
    "",
    "Steps",
    `1. If ${at} has no dependencies installed (e.g. no node_modules), install them first.`,
    `2. For each branch, in order: ${code(`git -C ${target.worktree ?? "<worktree>"} cherry-pick -x <base>..<branch>`)}.${target.prefix ? ` Start each new commit's subject with ${code(`${target.prefix}: `)} unless it already does; keep the -x line.` : ""}`,
    "3. On a conflict, resolve it keeping what both sides meant, then continue the cherry-pick. If a resolution changes what either side does, stop and ask me.",
    `4. Run each branch's checks above on ${code(target.name)}, now that they're combined.`,
    "5. Don't push.",
    `6. ${report(`branch ${code(target.name)} and merged: the task branches you merged`)} Then tell me what merged, what conflicted and how the checks went.`,
  ].join("\n");
}

/** Gives a task its own remote branch and draft PR, apart from the batch. */
export function splitPrompt(
  source: PromptSource,
  options: { remote: string; ticket: boolean; defaultBase?: string; onDefault: boolean },
): string {
  const { remote, ticket, defaultBase, onDefault } = options;
  const at = code(source.worktree ?? "<worktree>");
  const base = defaultBase ?? "the default branch";
  // With a ticket, its key leads the name in place of any key the name starts with.
  const named = ticket ? `<KEY>-${remote.replace(/^[A-Z][A-Z0-9]+-\d+-/, "")}` : remote;
  const steps = [
    ...(ticket
      ? [
          `File a Jira ticket for this fix in project DEV, from the brief's title and problem. Its key leads the PR title and names the remote branch: ${code(named)}.`,
        ]
      : []),
    ...(onDefault
      ? [`Its base ${short(source.base)} is already on ${code(base)}, so it needs no rebase.`]
      : [
          `Its base ${short(source.base)} isn't on ${code(base)}: in ${at}, fetch origin, then ${code(`git rebase --onto ${base} ${short(source.base)}`)}. Rerun its checks, then ${report(`branch ${code(source.branch)} and base: the commit you rebased onto`)}`,
        ]),
    `Push it as its own remote branch, keeping the local name: ${code(`git -C ${source.worktree ?? "<worktree>"} push -u origin HEAD:refs/heads/${named}`)}.`,
    `Open a draft PR from that branch into ${code(base.replace(/^origin\//, ""))} with ${code("gh pr create --draft")}: the brief's title, what changed, and the checks you ran.`,
    `${report(`branch ${code(source.branch)}, remote: the remote branch name, and pr: its url and number`)}`,
  ];
  return [
    `Split ${source.title} out into its own PR, apart from any batch branch.`,
    "",
    sourceFacts(source),
    "",
    "Steps",
    ...steps.map((s, i) => `${i + 1}. ${s}`),
  ].join("\n");
}

/** Brings the default base into a branch. */
export function syncPrompt(target: PromptTarget, task?: { base: string }): string {
  const base = target.defaultBase ?? "the default branch";
  const at = target.worktree ?? "<worktree>";
  return [
    `Bring ${code(target.name)} up to date with ${code(base)}.`,
    "",
    ...targetFacts(target),
    "",
    "Steps",
    `1. ${code(`git -C ${at} fetch origin`)}.`,
    task
      ? `2. ${code(`git -C ${at} rebase --onto ${base} ${short(task.base)}`)}, resolving conflicts as you go; if a resolution changes what either side does, stop and ask me.`
      : target.pushed
        ? `2. It's pushed, so merge rather than rebase: ${code(`git -C ${at} merge ${base}`)}. If a conflict resolution changes what either side does, stop and ask me.`
        : `2. It isn't pushed, so rebase: ${code(`git -C ${at} rebase ${base}`)}. If a conflict resolution changes what either side does, stop and ask me.`,
    "3. Rerun the checks of every fix on it.",
    `4. ${task ? report(`branch ${code(target.name)} and base: the commit you rebased onto`) : report(`branch ${code(target.name)}`)} Then tell me what changed and how the checks went.`,
  ].join("\n");
}

/** Runs the checks of the fixes on a branch. */
export function testPrompt(target: PromptTarget, sources: PromptSource[]): string {
  return [
    `Run the checks of ${sources.length === 1 ? "this fix" : `these ${sources.length} fixes`} on ${code(target.name)}, as it is now.`,
    "",
    ...targetFacts(target),
    "",
    ...sources.map((s, i) => sourceFacts(s, sources.length === 1 ? undefined : i + 1)),
    "",
    `Install dependencies first if they're missing. Don't change any code: tell me what passed and what failed, with the failing output.`,
  ].join("\n");
}

export function pushPrompt(target: PromptTarget): string {
  const at = target.worktree ?? "<worktree>";
  return [
    `Push ${code(target.name)}.`,
    "",
    ...targetFacts(target),
    "",
    `Run ${code(`git -C ${at} push -u origin ${target.name}`)}. If the remote has commits it lacks, stop and tell me rather than forcing it. Then ${report(`branch ${code(target.name)}`)}`,
  ].join("\n");
}

/** A draft PR for the branch, listing the fixes merged into it; pushes it first if it needs to. */
export function openPrPrompt(target: PromptTarget, merged: PromptSource[]): string {
  const base = (target.defaultBase ?? "the default branch").replace(/^origin\//, "");
  const at = target.worktree ?? "<worktree>";
  const steps = [
    ...(!target.pushed || target.ahead
      ? [
          `${code(`git -C ${at} push -u origin ${target.name}`)}. If the remote has commits it lacks, stop and tell me rather than forcing it.`,
        ]
      : []),
    `Run the checks of each fix on it, unless you already have on this tip.`,
    `From ${code(at)}, ${code(`gh pr create --draft --head ${target.name} --base ${base}`)}. ${target.prefix ? `Start the title with ${code(target.prefix)}. ` : ""}The body lists each fix with its title and the result of its checks.`,
    report(`branch ${code(target.name)} and pr: its url and number`),
  ];
  return [
    `Open a draft PR from ${code(target.name)} into ${code(base)}.`,
    "",
    ...targetFacts(target),
    "",
    merged.length > 0 ? "Fixes on it" : "It has no merged task fixes; describe its commits.",
    ...merged.map((s) => `- ${s.title} (${s.commits.map((c) => short(c.hash)).join(", ")})`),
    "",
    "Steps",
    ...steps.map((s, i) => `${i + 1}. ${s}`),
  ].join("\n");
}

export function updatePrPrompt(target: PromptTarget, merged: PromptSource[]): string {
  return [
    `Rewrite the description of ${target.pr?.url ?? `the PR from ${code(target.name)}`} from what is on the branch now.`,
    "",
    ...targetFacts(target),
    "",
    "Fixes on it",
    ...merged.map((s) => `- ${s.title} (${s.commits.map((c) => short(c.hash)).join(", ")})`),
    "",
    `Use ${code("gh pr edit --body")}: each fix with its title and its checks' result. Keep anything a reviewer added. Then ${report(`branch ${code(target.name)}`)}`,
  ].join("\n");
}

export function commentsPrompt(target: PromptTarget): string {
  const at = target.worktree ?? "<worktree>";
  return [
    `Address the review comments on ${target.pr?.url ?? `the PR from ${code(target.name)}`}.`,
    "",
    ...targetFacts(target),
    "",
    "Steps",
    `1. Read the PR's review and inline comments with ${code("gh pr view --comments")} and ${code("gh api")}.`,
    `2. Fix what they ask in ${code(at)}, one commit per comment where it makes sense, and rerun the affected checks.`,
    "3. If a comment asks for something you disagree with or that changes the fix's intent, don't do it: tell me.",
    `4. Push, then ${report(`branch ${code(target.name)}`)} Tell me which comments you addressed and which you left for me. Don't resolve threads.`,
  ].join("\n");
}

export function newBranchPrompt(options: { repo: string; dir: string; name: string; base: string }) {
  const { repo, dir, name, base } = options;
  const at = `${dir}/.claude/worktrees/${name}`;
  return [
    `Create branch ${code(name)} in ${repo} from ${code(base)}, in its own worktree.`,
    "",
    `1. ${code(`git -C ${dir} fetch origin`)}, if ${code(base)} is a remote branch.`,
    `2. ${code(`git -C ${dir} worktree add -b ${name} ${at} ${base} --no-track`)}`,
    "3. Don't push it.",
    `4. ${report(`branch ${code(name)} and created: true`)}`,
  ].join("\n");
}
