import { AgentDashboard } from "@/components/AgentDashboard";
import { ChatView } from "@/components/ChatView";
import { McpApprovalDialog } from "@/components/McpApprovalDialog";
import { Options } from "@/components/Options";
import { RemoveSessionDialog } from "@/components/RemoveSessionDialog";
import { Sidebar, type View } from "@/components/Sidebar";
import { TemplateDialog } from "@/components/TemplateDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMcp } from "@/lib/use-mcp";
import {
  blockedReason,
  orchestratorOf,
  ShellContext,
  useGroups,
  useClaudeCode,
  usePlugins,
} from "@/lib/plugins";
import { useMediaQuery, XS } from "@/lib/layout";
import { chatTitle } from "@/lib/runs";
import { useSpecOperations } from "@/lib/spec";
import { useAgents, useEarlierRuns, useQueue, useRuns } from "@/lib/store";
import type { RunSummary } from "@/lib/desktop";
import { descendants, taskOf, taskTree } from "@/lib/tasks";
import { templateFromChat, type Template } from "@/lib/templates";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

const newChat = (): View => ({ kind: "run", runId: crypto.randomUUID() });
// A small window starts at the session list; a wider one, which always shows it, at a new chat.
const home = (): View =>
  matchMedia(XS).matches ? { kind: "sessions" } : newChat();

export function App() {
  return (
    <TooltipProvider>
      <Home />
    </TooltipProvider>
  );
}

function Home() {
  const loaded = usePlugins();
  const plugins = useMemo(() => loaded ?? [], [loaded]);
  const groups = useGroups();
  const orchestrator = orchestratorOf(plugins);
  const claudeCode = useClaudeCode();
  const blocked = loaded && claudeCode && blockedReason(plugins, claudeCode);
  const operations = useSpecOperations(
    orchestrator?.status === "ready" ? orchestrator : undefined,
  );
  const runs = useRuns();
  const earlier = useEarlierRuns();
  const agents = useAgents();
  const held = useQueue();
  const children = useMemo(() => taskTree(runs), [runs]);
  const [removing, setRemoving] = useState<RunSummary>();
  const [optionsOpen, setOptionsOpen] = useState(false);
  // The plugin a sign-in prompt opened Options to sign in.
  const [signIn, setSignIn] = useState<string>();
  const { pendingApprovals, respondApproval, setAutoApprove } =
    useMcp();
  const shell = useMemo(
    () => ({
      blocked,
      openOptions: () => setOptionsOpen(true),
      mentionables: [
        ...plugins.map((p) => ({
          id: p.id,
          label: p.label,
          kind: "plugin" as const,
        })),
        ...groups.map((g) => ({
          id: g.id,
          label: g.id,
          kind: "group" as const,
        })),
      ],
      plugins,
      groups,
      claudeCode,
    }),
    [blocked, plugins, groups, claudeCode],
  );

  const [view, setView] = useState<View>(home);
  const xs = useMediaQuery(XS);
  const listing = view.kind === "sessions";
  useLayoutEffect(() => {
    if (!xs && listing) setView(newChat());
  }, [xs, listing]);
  const back = xs ? () => setView({ kind: "sessions" }) : undefined;

  // A notification asks to show a run.
  useEffect(
    () =>
      window.desktop.onOpenRun(({ run, artifactId }) =>
        setView({ kind: "run", runId: run.id, artifactId }),
      ),
    [],
  );
  // Removing a session can remove its tasks too; whichever was open goes.
  useEffect(
    () =>
      window.desktop.runs.onDelete((id) =>
        setView((current) =>
          current.kind === "run" && current.runId === id ? home() : current,
        ),
      ),
    [],
  );

  const [editing, setEditing] = useState<Template>();
  const createTemplate = useCallback(
    (messages: UIMessage[]) =>
      setEditing(templateFromChat(messages, chatTitle(messages))),
    [],
  );

  // An agent's new run waits with its template until it's sent or put away.
  const [staged, setStaged] = useState<{ runId: string; template: Template }>();
  const stagedHere =
    view.kind === "run" && staged?.runId === view.runId
      ? staged.template
      : undefined;
  const clearStaged = useCallback(() => setStaged(undefined), []);
  const startRun = (agent: Template) => {
    const runId = crypto.randomUUID();
    setView({ kind: "run", runId });
    setStaged({ runId, template: agent });
  };

  const agent =
    view.kind === "agent"
      ? agents.find((a) => a.id === view.agentId)
      : undefined;
  const activeRun =
    view.kind === "run"
      ? (runs.find((run) => run.id === view.runId) ??
        earlier.find((run) => run.id === view.runId))
      : undefined;
  const saveAgent = (next: Template) => void window.desktop.agents.save(next);
  const deleteAgent = (target: Template) => {
    void window.desktop.agents.delete(target.id);
    if (agent?.id === target.id) setView(home());
  };

  return (
    <ShellContext.Provider value={shell}>
      <div className="flex h-svh flex-col">
        <header className="app-drag flex h-10 shrink-0 items-center justify-between border-b px-4 select-none">
          <div className="app-no-drag flex items-center gap-2 pl-16">

          </div>
          <div className="app-no-drag flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Options"
              title="Options"
              onClick={() => setOptionsOpen(true)}
            >
              <SettingsIcon />
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <Sidebar
            agents={agents}
            runs={runs}
            earlier={earlier}
            view={view}
            onNewChat={() => setView(newChat())}
            onSelect={setView}
            onStartRun={startRun}
            onEditAgent={setEditing}
            onDeleteAgent={deleteAgent}
            onSaveAsAgent={(run) =>
              void window.desktop.runs
                .get(run.id)
                .then((snapshot) => createTemplate(snapshot.messages))
            }
            onDeleteRun={(run) => {
              // A session with tasks, or a task, asks first; others go at once.
              if (taskOf(run) || children.has(run.id)) return setRemoving(run);
              void window.desktop.runs.delete(run.id);
              if (view.kind === "run" && view.runId === run.id)
                setView(home());
            }}
            held={held}
            fill={xs}
            className={cn(xs && !listing && "hidden")}
          />

          <main className={cn("min-w-0 flex-1", xs && listing && "hidden")}>
            {agent ? (
              <AgentDashboard
                agent={agent}
                agents={agents}
                runs={runs.filter((run) => run.agentId === agent.id)}
                operations={operations}
                onSave={saveAgent}
                onStartRun={() => startRun(agent)}
                onEdit={() => setEditing(agent)}
                onDelete={() => deleteAgent(agent)}
                onOpenRun={(runId) => setView({ kind: "run", runId })}
                onBack={back}
              />
            ) : view.kind === "run" ? (
              <ChatView
                key={view.runId}
                chatId={view.runId}
                readOnly={activeRun?.readOnly}
                notice={activeRun?.notice}
                operations={operations}
                artifacts={activeRun?.artifacts ?? []}
                artifactId={view.artifactId}
                focus={view.bookmark}
                onArtifact={(artifactId) =>
                  setView({ kind: "run", runId: view.runId, artifactId })
                }
                file={view.file}
                agent={agents.find((a) => a.id === activeRun?.agentId)}
                onSaveAgent={saveAgent}
                template={stagedHere}
                onTemplateDone={clearStaged}
                onCreateTemplate={createTemplate}
                claudeCode={activeRun?.claudeCode}
                run={activeRun}
                parent={
                  activeRun?.claudeCode?.task
                    ? runs.find((r) => r.id === activeRun.claudeCode?.task?.parentRunId)
                    : undefined
                }
                tasks={activeRun ? (children.get(activeRun.id) ?? []) : []}
                onOpenRun={(runId, artifactId, actionId) =>
                  setView({
                    kind: "run",
                    runId,
                    artifactId,
                    ...(actionId && { bookmark: { actionId, at: Date.now() } }),
                  })
                }
                onBack={back}
                branch={view.branch}
              />
            ) : null}
          </main>
        </div>

        {removing && (
          <RemoveSessionDialog
            run={removing}
            below={descendants(children, removing.id)}
            onCancel={() => setRemoving(undefined)}
            onRemove={(options) => {
              void window.desktop.runs.delete(removing.id, options);
              setRemoving(undefined);
            }}
          />
        )}
        <TemplateDialog
          template={editing}
          onSave={(template) => {
            saveAgent(template);
            setEditing(undefined);
          }}
          onClose={() => setEditing(undefined)}
        />
        <Options
          open={optionsOpen}
          onOpenChange={(open) => {
            setOptionsOpen(open);
            if (!open) setSignIn(undefined);
          }}
          plugins={plugins}
          groups={groups}
          signIn={signIn}
        />
        {/* Hidden while Options is open, so a prompt comes back if sign-in is abandoned. */}
        {pendingApprovals.length > 0 && !optionsOpen && (
          <McpApprovalDialog
            request={pendingApprovals[0]}
            onRespond={respondApproval}
            onApproveAll={() => void setAutoApprove(true)}
            onSignIn={(pluginId) => {
              setSignIn(pluginId);
              setOptionsOpen(true);
            }}
          />
        )}
      </div>
    </ShellContext.Provider>
  );
}
