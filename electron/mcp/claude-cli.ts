import type { ClaudeCodeInfo, ClaudeCodeSetup } from "@/lib/desktop";
import { app } from "electron";
import { execFile } from "node:child_process";
import { accessSync, constants, mkdirSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { readJson, writeJson } from "../store";

// Claude Code on this machine: where it is, and how the app runs a turn with it.

const FILE = "claude-code.json";
/** Hooks from a turn the app runs carry this header, so it isn't taken for a terminal. */
export const DRIVER_HEADER = "x-agent-desktop-driver";
/** A turn the app runs names its session on its MCP connection. */
export const RUN_HEADER = "x-agent-desktop-run";
export const PERMISSION_TOOL = "mcp__desktop__ui_permission";
// SessionStart takes no HTTP hooks; the first prompt's hook names the transcript.
const HOOK_EVENTS = [
  "UserPromptSubmit",
  "Stop",
  "StopFailure",
  "SessionEnd",
];
// Set when the app is started from a Claude Code session; a turn is its own session.
const INHERITED = [
  "CLAUDECODE",
  "CLAUDE_CODE_ENTRYPOINT",
  "CLAUDE_CODE_SESSION_ID",
  "CLAUDE_CODE_CHILD_SESSION",
  "CLAUDE_PID",
  "ELECTRON_RUN_AS_NODE",
  "AGENT_DESKTOP_RUN",
];
/** How long a task's approval waits; tests shorten it. */
export const TASK_APPROVAL_MS =
  Number(process.env.AGENT_DESKTOP_TASK_APPROVAL_MS) || 60 * 60_000;

const defaultCwd = () => path.join(app.getPath("userData"), "claude-code");

export const getSetup = () =>
  readJson<ClaudeCodeSetup>(FILE, { orchestrator: false });

export function saveSetup(change: Partial<ClaudeCodeSetup>) {
  const next = { ...getSetup(), ...change };
  if (!next.command) delete next.command;
  if (!next.cwd) delete next.cwd;
  writeJson(FILE, next);
}

// An app opened from the Dock doesn't see the shell's PATH, so the usual installs are tried too.
function candidates(command?: string): string[] {
  if (command) return [command];
  const home = os.homedir();
  return [
    path.join(home, ".local/bin/claude"),
    path.join(home, ".claude/local/claude"),
    "/opt/homebrew/bin/claude",
    "/usr/local/bin/claude",
    ...(process.env.PATH ?? "")
      .split(path.delimiter)
      .filter(Boolean)
      .map((dir) => path.join(dir, "claude")),
  ];
}

const versionOf = (file: string) =>
  new Promise<string | undefined>((resolve) =>
    execFile(file, ["--version"], { timeout: 15_000 }, (error, stdout) =>
      resolve(error ? undefined : stdout.trim().split(/\s/)[0]),
    ),
  );

const NO_SESSION = "00000000-0000-0000-0000-000000000000";
// Retry rests on two flags `--help` doesn't list; an unknown one fails before the session lookup.
const takesFlag = (file: string, flag: string) =>
  new Promise<boolean>((resolve) => {
    const probe = execFile(
      file,
      ["-p", "--resume", NO_SESSION, flag, NO_SESSION],
      { timeout: 15_000 },
      (error, stdout, stderr) =>
        resolve(!/unknown option/.test(`${error?.message}${stdout}${stderr}`)),
    );
    probe.stdin?.end();
  });
const takesRetry = async (file: string) =>
  (await takesFlag(file, "--resume-session-at")) &&
  (await takesFlag(file, "--rewind-files"));
// A build that knows the mode looks the session up and finds none.
const takesAcceptEdits = (file: string) =>
  new Promise<boolean>((resolve) => {
    const probe = execFile(
      file,
      ["-p", "--resume", NO_SESSION, "--permission-mode", "acceptEdits"],
      { timeout: 15_000 },
      (error, stdout, stderr) =>
        resolve(/No conversation found/i.test(`${error?.message}${stdout}${stderr}`)),
    );
    probe.stdin?.end();
  });

let found: { key: string; value: ClaudeCodeInfo["found"] } | undefined;

export async function claudeCodeInfo(): Promise<ClaudeCodeInfo> {
  const setup = getSetup();
  const key = setup.command ?? "";
  if (found?.key !== key) {
    let value: ClaudeCodeInfo["found"];
    for (const file of candidates(setup.command)) {
      try {
        accessSync(file, constants.X_OK);
      } catch {
        continue;
      }
      const version = await versionOf(file);
      if (version) {
        value = {
          path: file,
          version,
          retry: await takesRetry(file),
          acceptEdits: await takesAcceptEdits(file),
        };
        break;
      }
    }
    found = { key, value };
  }
  return { ...setup, found: found.value, defaultCwd: defaultCwd() };
}

/** Where a session started here runs; made on first use. */
export function sessionCwd(): string {
  const cwd = getSetup().cwd || defaultCwd();
  mkdirSync(cwd, { recursive: true });
  return cwd;
}

export function turnEnv(
  port: number,
  options: { runId?: string; task?: boolean } = {},
): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const name of INHERITED) delete env[name];
  // The plugin's hooks read these: the driver header, and where the app listens.
  env.AGENT_DESKTOP_DRIVER = "app";
  env.AGENT_DESKTOP_MCP_PORT = String(port);
  // The plugin's own connection sends it as the run header, e.g. in a worktree of this repo.
  if (options.runId) env.AGENT_DESKTOP_RUN = options.runId;
  // A task's approval may wait an hour; Claude Code must not give up on the call first.
  if (options.task) {
    const wait = String(TASK_APPROVAL_MS + 5 * 60_000);
    env.MCP_TOOL_TIMEOUT = wait;
    env.CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT = wait;
  }
  // Off by default in `-p`; a retry restores files from these checkpoints.
  env.CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING = "true";
  return env;
}

/**
 * One headless turn: a new session, the session itself, or a copy of it under
 * `sessionId`, cut after the message `resumeAt` when one is given.
 */
export function turnArgs(options: {
  sessionId: string;
  runId: string;
  resume?: string;
  resumeAt?: string;
  port: number;
  /** A worktree task: edits inside it don't ask. */
  acceptEdits?: boolean;
  addDir?: string;
  /** Tools the session runs without, e.g. a dig's edit tools. */
  disallowedTools?: string[];
}): string[] {
  const { sessionId, runId, resume, resumeAt, port, acceptEdits, addDir, disallowedTools } =
    options;
  const hook = [
    {
      hooks: [
        {
          type: "http",
          url: `http://127.0.0.1:${port}/hooks`,
          timeout: 2,
          headers: { [DRIVER_HEADER]: "app" },
        },
      ],
    },
  ];
  const session = !resume
    ? ["--session-id", sessionId]
    : resume === sessionId
      ? ["--resume", resume]
      : [
          "--resume",
          resume,
          "--fork-session",
          "--session-id",
          sessionId,
          ...(resumeAt ? ["--resume-session-at", resumeAt] : []),
        ];
  return [
    // The prompt goes on stdin, so text starting with "-" is never read as a flag.
    "-p",
    ...session,
    "--input-format",
    "stream-json",
    "--output-format",
    "stream-json",
    "--verbose",
    "--mcp-config",
    JSON.stringify({
      mcpServers: {
        desktop: {
          type: "sse",
          url: `http://127.0.0.1:${port}/sse`,
          headers: { [RUN_HEADER]: runId },
        },
      },
    }),
    "--settings",
    JSON.stringify({
      hooks: Object.fromEntries(HOOK_EVENTS.map((event) => [event, hook])),
    }),
    // Variadic: the option after it ends the list.
    ...(disallowedTools?.length ? ["--disallowedTools", ...disallowedTools] : []),
    "--permission-prompt-tool",
    PERMISSION_TOOL,
    ...(acceptEdits ? ["--permission-mode", "acceptEdits"] : []),
    ...(addDir ? ["--add-dir", addDir] : []),
  ];
}

/** Puts the files a session changed with its edit tools back as they were before `checkpoint`, a user message. */
export function rewindFiles(options: {
  command: string;
  cwd: string;
  sessionId: string;
  checkpoint: string;
  port: number;
}): Promise<void> {
  const { command, cwd, sessionId, checkpoint, port } = options;
  return new Promise((resolve, reject) => {
    const child = execFile(
      command,
      ["-p", "--resume", sessionId, "--rewind-files", checkpoint],
      { cwd, env: turnEnv(port), timeout: 60_000 },
      (error, stdout, stderr) => {
        if (!error) return resolve();
        const said = `${stdout}\n${stderr}`.trim().split("\n").at(-1);
        reject(new Error(said || error.message));
      },
    );
    child.stdin?.end();
  });
}

export const configDir = () =>
  process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), ".claude");

/** A session's transcript, when no hook has named it. */
export function findTranscript(sessionId: string): string | undefined {
  const root = path.join(configDir(), "projects");
  try {
    for (const dir of readdirSync(root)) {
      const file = path.join(root, dir, `${sessionId}.jsonl`);
      try {
        accessSync(file);
        return file;
      } catch {
        // not in this project
      }
    }
  } catch {
    // no projects yet
  }
  return undefined;
}
