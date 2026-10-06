import { ArtifactIcon } from "@/components/ArtifactView";
import { SidebarBranchMenu } from "@/components/BranchMenu";
import {
  baseName,
  DiffStat,
  dirName,
  FileChangeIcon,
} from "@/components/FileDiffPanel";
import { ResizeHandle } from "@/components/ResizeHandle";
import { RunStatusIcon, runStatusLabel } from "@/components/RunStatus";
import { TemplateIcon } from "@/components/TemplateStage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RunSummary } from "@/lib/desktop";
import { formatStarted } from "@/lib/format";
import { useStoredWidth } from "@/lib/layout";
import { useShell } from "@/lib/plugins";
import {
  actionSessions,
  actionStatus,
  ancestors,
  descendants,
  foldAction,
  foldTasks,
  isActive,
  isDig,
  isRoot,
  isSpinoff,
  plural,
  taskOf,
  taskTree,
  treeUpdated,
  urgentStatus,
} from "@/lib/tasks";
import type { ArtifactRef } from "@/lib/artifacts";
import { suggestionsOf, waiting } from "@/lib/dig";
import type { Template } from "@/lib/templates";
import { cn } from "@/lib/utils";
import {
  BookmarkIcon,
  BookmarkPlusIcon,
  ChevronRightIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SquareIcon,
  SquareTerminalIcon,
  Trash2Icon,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";

export type View =
  /** A run's chat, with the panel open on `artifactId`, or on a task's changed `file`. */
  | {
      kind: "run";
      runId: string;
      artifactId?: string;
      file?: string;
      /** The action the panel scrolls to; `at` tells a second click from the first. */
      bookmark?: { actionId: string; at: number };
      /** What its sidebar ⎇ menu asked for: a prompt for the composer, or why it couldn't write one. */
      branch?: BranchHandoff;
    }
  | { kind: "agent"; agentId: string }
  /** Nothing open: on a small window, the list alone. */
  | { kind: "sessions" };

/** A sidebar ⎇ menu's result for its session's chat; `at` tells repeats apart. */
export interface BranchHandoff {
  prompt?: { text: string; ask: string; afterSend?: { match: string; run: () => void } };
  error?: string;
  at: number;
}

const EARLIER = "earlier";

// 20 px at step 1, 12 px per step to 3, then 8 px: a sub-task's sessions sit at step 6.
const INDENT = ["", "ml-5", "ml-8", "ml-11", "ml-13", "ml-15", "ml-17"];

// A task's changed files shown before the rest fold under "N more files".
const SHOWN_FILES = 8;

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 420;

// A Claude Code session: its status while it works, else the terminal, green while attached.
// A task always shows its status.
function ClaudeCodeIcon(props: { run: RunSummary }) {
  const { run } = props;
  if (run.claudeCode?.task || run.status === "running" || run.status === "awaiting_approval")
    return <RunStatusIcon status={run.status} />;
  return (
    <SquareTerminalIcon
      aria-hidden
      className={cn(
        "size-3.5 shrink-0",
        run.claudeCode?.live ? "text-emerald-500" : "text-muted-foreground",
      )}
    />
  );
}

function claudeCodeTitle(run: RunSummary) {
  const where = run.claudeCode?.cwd ? ` in ${run.claudeCode.cwd}` : "";
  const state = run.claudeCode?.live ? "attached" : "ended";
  const bound = (run.claudeCode?.branches ?? []).map((b) => ` · ⎇ ${b.name}`).join("");
  return `Claude Code${where} · ${state} · ${runStatusLabel(run.status)}${bound}`;
}

type Depth = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const deeper = (depth: Depth) => Math.min(depth + 1, 6) as Depth;

function Row(props: {
  label: string;
  /** What the row is called when its label is short, e.g. a task's title under its action. */
  name?: string;
  /** What the row stands for, for tests and styling. */
  kind?: "session" | "artifact" | "action";
  title?: string;
  icon?: ReactNode;
  depth?: Depth;
  /** Shown after the label, muted, e.g. a file's folder. */
  detail?: string;
  /** Shown at the end, e.g. a collapsed row's task counts. */
  meta?: ReactNode;
  active?: boolean;
  /** Set for a node that has children. */
  open?: boolean;
  onToggle?: () => void;
  onSelect: () => void;
  children?: ReactNode;
}) {
  const {
    label,
    title,
    icon,
    depth = 0,
    active,
    open,
    onToggle,
    onSelect,
  } = props;
  const name = props.name ?? label;
  return (
    <div
      data-row={props.kind}
      className={cn(
        "group flex items-center rounded-md text-sm hover:bg-muted",
        active && "bg-muted",
        INDENT[depth],
      )}
    >
      {onToggle ? (
        <button
          aria-label={open ? `Collapse ${name}` : `Expand ${name}`}
          aria-expanded={open}
          className="flex size-6 shrink-0 items-center justify-center text-muted-foreground"
          onClick={onToggle}
        >
          <ChevronRightIcon
            className={cn("size-3.5 transition-transform", open && "rotate-90")}
          />
        </button>
      ) : (
        <span className="size-6 shrink-0" />
      )}
      <button
        className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left"
        title={title}
        aria-label={props.name}
        onClick={onSelect}
      >
        {icon}
        <span className="truncate">{label}</span>
        {props.detail && (
          <span className="min-w-0 truncate text-xs text-muted-foreground">
            {props.detail}
          </span>
        )}
        {props.meta && (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {props.meta}
          </span>
        )}
      </button>
      {props.children}
    </div>
  );
}

function Action(props: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      aria-label={props.label}
      title={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </Button>
  );
}

/** Agents with their runs, the chats started without one, then runs from before plugins. */
export function Sidebar(props: {
  agents: Template[];
  runs: RunSummary[];
  earlier: RunSummary[];
  view: View;
  onNewChat: () => void;
  onSelect: (view: View) => void;
  onStartRun: (agent: Template) => void;
  onEditAgent: (agent: Template) => void;
  onDeleteAgent: (agent: Template) => void;
  onSaveAsAgent: (run: RunSummary) => void;
  onDeleteRun: (run: RunSummary) => void;
  /** Tasks queued when the app last closed, waiting for Resume. */
  held?: number;
  /** Takes the whole width, without a resize handle. */
  fill?: boolean;
  className?: string;
}) {
  const { agents, runs, earlier, view, onSelect } = props;
  const { blocked, claudeCode: claudeCodeSetup } = useShell();
  const byId = useMemo(() => new Map(runs.map((r) => [r.id, r])), [runs]);
  const children = useMemo(() => taskTree(runs), [runs]);
  const listedIds = useMemo(() => new Set(runs.map((r) => r.id)), [runs]);
  // Rows whose tasks past the first five are shown too.
  const [unfolded, setUnfolded] = useState<Set<string>>(() => new Set());
  // Tasks whose files past the first few are shown too.
  const [unfoldedFiles, setUnfoldedFiles] = useState<Set<string>>(() => new Set());
  const [stopping, setStopping] = useState<{ run: RunSummary; count: number }>();
  const [width, setWidth] = useStoredWidth("sidebar", 256);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const agentIds = new Set(agents.map((a) => a.id));
  // A run whose agent was deleted is listed at root level with sessions.
  const parentOf = (run: RunSummary) =>
    run.agentId && agentIds.has(run.agentId) ? run.agentId : undefined;
  // Tasks list under their parents; a session sorts by the latest update in its tree.
  const sessions = runs
    .filter((run) => parentOf(run) === undefined && isRoot(run, listedIds))
    .sort((a, b) => treeUpdated(b, children) - treeUpdated(a, children));

  // Reveal the open run, and its open artifact, in the tree.
  const activeRun =
    view.kind === "run"
      ? (runs.find((r) => r.id === view.runId) ??
        earlier.find((r) => r.id === view.runId))
      : undefined;
  // Opening a task expands its parent chain.
  const chain = ancestors(activeRun, byId);
  const top = chain.at(-1) ?? activeRun;
  const revealed = top && (top.readOnly ? EARLIER : parentOf(top));
  const artifactOpen =
    view.kind === "run" && (view.artifactId !== undefined || view.file !== undefined);
  const openArtifact = view.kind === "run" ? view.artifactId : undefined;
  // A task sits under its action, under its artifact: those expand too.
  const chainKey = [
    ...chain.map((r) => r.id),
    ...[activeRun, ...chain].flatMap((r) => {
      const task = r && taskOf(r);
      if (!task?.actionId) return [];
      const artifact = `${task.parentRunId}/${task.artifactId}`;
      return [artifact, `${artifact}/${task.actionId}`];
    }),
  ].join(",");
  useEffect(() => {
    if (revealed) setOpen((current) => new Set(current).add(revealed));
  }, [revealed]);
  useEffect(() => {
    if (chainKey)
      setOpen((current) => new Set([...current, ...chainKey.split(",")]));
  }, [chainKey]);
  useEffect(() => {
    if (artifactOpen && activeRun) {
      setOpen((current) => {
        const next = new Set(current).add(activeRun.id);
        return openArtifact ? next.add(`${activeRun.id}/${openArtifact}`) : next;
      });
    }
  }, [artifactOpen, activeRun?.id, openArtifact]);

  const taskTitle = (run: RunSummary) => {
    const task = taskOf(run)!;
    const parent = byId.get(task.parentRunId);
    if (isSpinoff(run))
      return `Sent from ${parent?.title ?? "its session"}${task.context ? " with context" : ""} · ${runStatusLabel(run.status)}`;
    const artifact = parent?.artifacts?.find((a) => a.id === task.artifactId);
    const branch = task.worktree?.branch ? ` · ${task.worktree.branch}` : "";
    return `From ${artifact?.title ?? task.artifactId} · ${task.actionId}${branch} · ${runStatusLabel(run.status)}`;
  };

  // An action of an artifact: a bookmark into it, with the sessions launched from it below.
  const actionRow = (
    run: RunSummary,
    artifactId: string,
    bookmark: NonNullable<ArtifactRef["bookmarks"]>[number],
    depth: Depth,
  ): ReactNode => {
    const key = `${run.id}/${artifactId}/${bookmark.id}`;
    const sessions = actionSessions(children.get(run.id) ?? [], artifactId, bookmark.id);
    const fixes = sessions.filter((s) => !isDig(s));
    const status = actionStatus(sessions, children);
    const pending = waiting(suggestionsOf(run, artifactId, bookmark.id), run).length;
    const isOpen = open.has(key);
    const { shown, folded } = foldAction(sessions, children);
    const unfoldedHere =
      unfolded.has(key) ||
      folded.some((t) => t.id === activeRun?.id || chain.some((c) => c.id === t.id));
    const label = (session: RunSummary) =>
      isDig(session)
        ? "Dig"
        : fixes.length > 1
          ? `${bookmark.label} · ${fixes.indexOf(session) + 1}`
          : bookmark.label;
    return (
      <Fragment key={key}>
        <Row
          kind="action"
          depth={depth}
          label={bookmark.title}
          title={bookmark.title}
          meta={pending > 0 ? `✎ ${pending}` : undefined}
          icon={
            status ? (
              <RunStatusIcon status={status} />
            ) : (
              <BookmarkIcon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
            )
          }
          active={
            view.kind === "run" &&
            view.runId === run.id &&
            view.artifactId === artifactId &&
            view.bookmark?.actionId === bookmark.id
          }
          open={sessions.length > 0 ? isOpen : undefined}
          onToggle={sessions.length > 0 ? () => toggle(key) : undefined}
          onSelect={() =>
            onSelect({
              kind: "run",
              runId: run.id,
              artifactId,
              bookmark: { actionId: bookmark.id, at: Date.now() },
            })
          }
        />
        {isOpen &&
          (unfoldedHere ? [...shown, ...folded] : shown).map((session) =>
            runRow(session, label(session), true, deeper(depth)),
          )}
        {isOpen && folded.length > 0 && !unfoldedHere && (
          <Row
            depth={deeper(depth)}
            label={plural(folded.length, "earlier session")}
            onSelect={() => setUnfolded((current) => new Set(current).add(key))}
          />
        )}
      </Fragment>
    );
  };

  const artifactRow = (run: RunSummary, artifact: ArtifactRef, depth: Depth): ReactNode => {
    const key = `${run.id}/${artifact.id}`;
    const bookmarks = artifact.bookmarks ?? [];
    const isOpen = open.has(key);
    const here = view.kind === "run" && view.runId === run.id;
    return (
      <Fragment key={key}>
        <Row
          kind="artifact"
          depth={depth}
          label={artifact.title}
          icon={<ArtifactIcon kind={artifact.kind} />}
          meta={!isOpen && bookmarks.length > 0 ? plural(bookmarks.length, "action") : undefined}
          active={
            here &&
            view.file === undefined &&
            view.artifactId === artifact.id &&
            view.bookmark === undefined
          }
          open={bookmarks.length > 0 ? isOpen : undefined}
          onToggle={bookmarks.length > 0 ? () => toggle(key) : undefined}
          onSelect={() => onSelect({ kind: "run", runId: run.id, artifactId: artifact.id })}
        />
        {isOpen && bookmarks.map((b) => actionRow(run, artifact.id, b, deeper(depth)))}
      </Fragment>
    );
  };

  const runRow = (
    run: RunSummary,
    label: string,
    showStatus: boolean,
    depth: Depth = 1,
  ): ReactNode => {
    const artifacts = run.artifacts ?? [];
    const tasks = children.get(run.id) ?? [];
    // Sessions of an action still listed sit under it; those whose action is gone, here.
    const listedActions = new Set(
      artifacts.flatMap((a) => (a.bookmarks ?? []).map((b) => `${a.id}/${b.id}`)),
    );
    const loose = tasks.filter(
      (t) => !listedActions.has(`${taskOf(t)!.artifactId}/${taskOf(t)!.actionId}`),
    );
    const taskCount = tasks.filter((t) => !isDig(t)).length;
    const outcome = taskOf(run)?.outcome;
    const files = outcome?.files ?? [];
    const here = view.kind === "run" && view.runId === run.id;
    const openFile = here ? view.file : undefined;
    const childDepth = deeper(depth);
    const expandable = artifacts.length > 0 || tasks.length > 0 || files.length > 0;
    // The open file may be folded here.
    const filesUnfolded =
      unfoldedFiles.has(run.id) ||
      files.findIndex((f) => f.path === openFile) >= SHOWN_FILES;
    const listedFiles = filesUnfolded ? files : files.slice(0, SHOWN_FILES);
    const unlisted = (outcome?.filesChanged ?? files.length) - files.length;
    const isOpen = open.has(run.id);
    const below = descendants(children, run.id);
    const awaiting = below.filter((r) => r.status === "awaiting_approval").length;
    const live = below.filter(isActive).length;
    // Collapsed: its direct tasks, what waits below it, and the most urgent status there.
    const collapsed = !isOpen && tasks.length > 0;
    const urgent = collapsed ? urgentStatus(run, children) : undefined;
    const { shown, folded } = foldTasks(loose, children);
    // The open run, or a task above it, may be folded here.
    const unfoldedHere =
      unfolded.has(run.id) ||
      folded.some((t) => t.id === activeRun?.id || chain.some((c) => c.id === t.id));
    const listedTasks = unfoldedHere ? [...shown, ...folded] : shown;
    return (
      <Fragment key={run.id}>
        <Row
          kind="session"
          depth={depth}
          label={label}
          name={taskOf(run) && label !== run.title ? run.title : undefined}
          meta={
            collapsed && taskCount > 0
              ? `${plural(taskCount, "task")}${awaiting > 0 ? ` · ${awaiting} awaiting approval` : ""}`
              : undefined
          }
          title={
            taskOf(run)
              ? taskTitle(run)
              : run.claudeCode
                ? claudeCodeTitle(run)
                : `${runStatusLabel(run.status)} · ${formatStarted(run.createdAt)}`
          }
          icon={
            urgent && urgent !== run.status ? (
              <RunStatusIcon status={urgent} />
            ) : run.claudeCode ? (
              <ClaudeCodeIcon run={run} />
            ) : (
              showStatus && <RunStatusIcon status={run.status} />
            )
          }
          active={here && view.artifactId === undefined && openFile === undefined}
          open={expandable ? isOpen : undefined}
          onToggle={expandable ? () => toggle(run.id) : undefined}
          onSelect={() => onSelect({ kind: "run", runId: run.id })}
        >
          {live > 0 && (
            <Action
              label={`Stop all tasks (${live})`}
              onClick={() => setStopping({ run, count: live })}
            >
              <SquareIcon />
            </Action>
          )}
          {!run.readOnly && !run.claudeCode && parentOf(run) === undefined && (
            <Action
              label="Save as template"
              onClick={() => props.onSaveAsAgent(run)}
            >
              <BookmarkPlusIcon />
            </Action>
          )}
          {run.claudeCode && !run.readOnly && !isDig(run) && (
            <SidebarBranchMenu
              run={run}
              below={below}
              canRun={!!claudeCodeSetup?.found}
              onPrompt={(prompt) =>
                onSelect({
                  kind: "run",
                  runId: run.id,
                  ...(here && view.artifactId && { artifactId: view.artifactId }),
                  branch: { prompt, at: Date.now() },
                })
              }
              onError={(error) =>
                onSelect({
                  kind: "run",
                  runId: run.id,
                  ...(here && view.artifactId && { artifactId: view.artifactId }),
                  branch: { error, at: Date.now() },
                })
              }
            />
          )}
          <Action
            label={run.claudeCode ? "Remove from list" : "Delete run"}
            onClick={() => props.onDeleteRun(run)}
          >
            <Trash2Icon />
          </Action>
        </Row>
        {isOpen && artifacts.map((artifact) => artifactRow(run, artifact, childDepth))}
        {isOpen &&
          listedFiles.map((file) => (
            <Row
              key={`file:${file.path}`}
              depth={childDepth}
              label={baseName(file.path)}
              detail={dirName(file.path) || undefined}
              title={`${file.oldPath ? `${file.oldPath} → ` : ""}${file.path} · ${file.status}`}
              icon={<FileChangeIcon status={file.status} />}
              meta={<DiffStat file={file} />}
              active={openFile === file.path}
              onSelect={() =>
                onSelect({ kind: "run", runId: run.id, file: file.path })
              }
            />
          ))}
        {isOpen && files.length > SHOWN_FILES && !filesUnfolded && (
          <Row
            depth={childDepth}
            label={plural(files.length - SHOWN_FILES, "more file")}
            onSelect={() =>
              setUnfoldedFiles((current) => new Set(current).add(run.id))
            }
          />
        )}
        {isOpen && filesUnfolded && unlisted > 0 && (
          <p className={cn("py-1 pl-6 text-xs text-muted-foreground", INDENT[childDepth])}>
            {plural(unlisted, "more file")} not listed
          </p>
        )}
        {isOpen &&
          listedTasks.map((task) => runRow(task, task.title, true, childDepth))}
        {isOpen && folded.length > 0 && !unfoldedHere && (
          <Row
            depth={childDepth}
            label={`${plural(folded.length, "more task")}`}
            onSelect={() =>
              setUnfolded((current) => new Set(current).add(run.id))
            }
          />
        )}
      </Fragment>
    );
  };

  return (
    <aside
      className={cn(
        "relative flex shrink-0 flex-col",
        props.fill ? "min-w-0 flex-1" : "border-r",
        props.className,
      )}
      style={props.fill ? undefined : { width }}
    >
      {!props.fill && (
        <ResizeHandle
          label="Resize sidebar"
          edge="right"
          width={width}
          min={SIDEBAR_MIN}
          max={SIDEBAR_MAX}
          onResize={setWidth}
        />
      )}
      {!!props.held && (
        <div className="flex shrink-0 items-center gap-2 border-b bg-amber-500/10 px-4 py-2 text-xs">
          <span className="min-w-0 flex-1">
            {plural(props.held, "task")} {props.held === 1 ? "was" : "were"} queued when
            Agent Desktop closed
          </span>
          <span aria-hidden>·</span>
          <Button
            variant="link"
            size="xs"
            className="h-auto p-0"
            onClick={() => void window.desktop.claudeCode.resumeQueue()}
          >
            Resume
          </Button>
        </div>
      )}
      <header className="flex h-11 shrink-0 items-center justify-between border-b pr-2 pl-4">
        <h2 className="text-sm font-medium">Sessions</h2>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="New session"
          title="New session"
          onClick={props.onNewChat}
        >
          <PlusIcon />
        </Button>
      </header>
      <nav
        aria-label="Agents and runs"
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2"
      >
        {agents.map((agent) => {
          const agentRuns = runs.filter((run) => run.agentId === agent.id);
          return (
            <Fragment key={agent.id}>
              <Row
                label={agent.name}
                icon={<TemplateIcon kind={agent.kind} />}
                active={view.kind === "agent" && view.agentId === agent.id}
                open={open.has(agent.id)}
                onToggle={() => toggle(agent.id)}
                onSelect={() => onSelect({ kind: "agent", agentId: agent.id })}
              >
                <Action
                  label="New run"
                  disabled={!!blocked}
                  onClick={() => props.onStartRun(agent)}
                >
                  <PlayIcon />
                </Action>
                <Action
                  label="Edit agent"
                  onClick={() => props.onEditAgent(agent)}
                >
                  <PencilIcon />
                </Action>
                <Action
                  label="Delete agent"
                  onClick={() => props.onDeleteAgent(agent)}
                >
                  <Trash2Icon />
                </Action>
              </Row>
              {open.has(agent.id) &&
                (agentRuns.length > 0 ? (
                  agentRuns.map((run) =>
                    runRow(run, formatStarted(run.createdAt), true, 1),
                  )
                ) : (
                  <p className="ml-11 py-1 text-xs text-muted-foreground">
                    No runs yet.
                  </p>
                ))}
            </Fragment>
          );
        })}
        {sessions.map((run) =>
          runRow(
            run,
            run.title,
            run.status !== "completed" && run.status !== "stopped",
            0,
          ),
        )}
        {earlier.length > 0 && (
          <>
            <Row
              label="Earlier"
              title="Runs from before plugins, read-only"
              open={open.has(EARLIER)}
              onToggle={() => toggle(EARLIER)}
              onSelect={() => toggle(EARLIER)}
            />
            {open.has(EARLIER) &&
              earlier.map((run) => runRow(run, run.title, false, 1))}
          </>
        )}
      </nav>
      {stopping && (
        <Dialog open onOpenChange={(o) => !o && setStopping(undefined)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Stop {plural(stopping.count, "task")}?</DialogTitle>
              <DialogDescription>
                Every running and queued task under "{stopping.run.title}" stops.
                Tasks that had started can continue from their chat.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStopping(undefined)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  void window.desktop.claudeCode.stopTasks(stopping.run.id);
                  setStopping(undefined);
                }}
              >
                Stop all
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </aside>
  );
}
