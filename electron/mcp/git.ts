import { execFile } from "node:child_process";
import { accessSync, constants, realpathSync } from "node:fs";
import path from "node:path";

// git on this machine, found the way `claude` is: an app opened from the Dock doesn't see the shell's PATH.

const GIT_TIMEOUT_MS = 120_000;

let found: string | undefined;
function gitPath(): string {
  if (found) return found;
  const candidates = [
    "/usr/bin/git",
    "/opt/homebrew/bin/git",
    "/usr/local/bin/git",
    ...(process.env.PATH ?? "")
      .split(path.delimiter)
      .filter(Boolean)
      .map((dir) => path.join(dir, "git")),
  ];
  for (const file of candidates) {
    try {
      accessSync(file, constants.X_OK);
      return (found = file);
    } catch {
      // not here
    }
  }
  return (found = "git");
}

// Agents name these folders: a repo's own config mustn't run programs before the user launches.
// Only a worktree's checkout, which the user launched, runs the repo's hooks.
const HARDENED = ["-c", "core.fsmonitor=false"];
const NO_HOOKS = ["-c", "core.hooksPath=/dev/null"];

/** Runs git in `cwd`; a failure throws git's last line on stderr. */
export function git(
  args: string[],
  cwd: string,
  options: { hooks?: boolean } = {},
): Promise<string> {
  return new Promise((resolve, reject) =>
    execFile(
      gitPath(),
      [...HARDENED, ...(options.hooks ? [] : NO_HOOKS), ...args],
      {
        cwd,
        timeout: GIT_TIMEOUT_MS,
        maxBuffer: 16 * 1024 * 1024,
        // GIT_OPTIONAL_LOCKS=0: `status` never writes the index.
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_OPTIONAL_LOCKS: "0" },
      },
      (error, stdout, stderr) => {
        if (!error) return resolve(stdout);
        const said = stderr.trim().split("\n").filter(Boolean).at(-1);
        reject(new Error(said || error.message));
      },
    ),
  );
}

export interface Checkout {
  /** The work tree's top level, symlinks resolved. */
  top: string;
  /** The main repo's git dir, shared by all its worktrees. */
  common: string;
  /** The main repo's folder name. */
  repo: string;
  /** `dir` relative to `top`. */
  sub: string;
  /** `base`, resolved to a commit. */
  commit?: string;
  /** Lines of `git status --porcelain`. */
  dirty: number;
}

/** The git work tree `dir` is in; throws when it's in none, or `base` names no commit. */
export async function inspect(dir: string, base?: string): Promise<Checkout> {
  const real = realpathSync(dir);
  let out: string;
  try {
    out = await git(["rev-parse", "--show-toplevel", "--git-common-dir"], real);
  } catch {
    throw new Error(`${dir} isn't inside a git work tree`);
  }
  const [top, common] = out.trim().split("\n");
  const commonDir = realpathSync(path.resolve(real, common));
  const name = path.basename(commonDir);
  const repo =
    name === ".git" ? path.basename(path.dirname(commonDir)) : name.replace(/\.git$/, "");
  let commit: string | undefined;
  if (base !== undefined) {
    commit = (
      await git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`], real).catch(() => "")
    ).trim();
    if (!commit) throw new Error(`Base ${base} not found`);
  }
  const status = await git(["status", "--porcelain"], real);
  const topReal = realpathSync(top);
  return {
    top: topReal,
    common: commonDir,
    repo,
    sub: path.relative(topReal, real),
    commit,
    dirty: status.split("\n").filter(Boolean).length,
  };
}
