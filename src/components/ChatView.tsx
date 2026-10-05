import type { UIMessage } from 'ai'
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  FolderOpenIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  SquareTerminalIcon,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { StickToBottomContext } from 'use-stick-to-bottom'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { ArtifactsPanel } from '@/components/ArtifactsPanel'
import { ClaudeCodeAgents, useClaudeCodeAgents } from '@/components/ClaudeCodeAgents'
import { Composer } from '@/components/Composer'
import { MessageParts } from '@/components/MessageParts'
import { OperationSearch } from '@/components/OperationSearch'
import { TemplateNote, TemplateStage } from '@/components/TemplateStage'
import { TodoPanel } from '@/components/TodoPanel'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FileDiffPanel } from '@/components/FileDiffPanel'
import { McpArtifactPanel } from '@/components/McpArtifactPanel'
import { ResizeHandle } from '@/components/ResizeHandle'
import { actionKey, type ActionsContextValue } from '@/components/TaskActions'
import { TaskLaunchDialog } from '@/components/TaskLaunchDialog'
import { SuggestionList, SuggestionsDialog, useDecide } from '@/components/Suggestions'
import {
  atStake,
  ipcError,
  MessageEditor,
  messageText,
  ReplacedAttempts,
  replacedAt,
  RetryDialog,
  UserMessageActions,
} from '@/components/RetryParts'
import type { ArtifactRef } from '@/lib/artifacts'
import {
  CHANNELS_COMMAND,
  claudeCodeArtifacts,
  claudeCodePlan,
} from '@/lib/claude-code'
import type { RetryPreflight, RunSummary } from '@/lib/desktop'
import { suggestionsOf } from '@/lib/dig'
import {
  actionGone,
  actionDigs,
  actionTasks,
  NO_CLAUDE_CODE,
  plural,
  RENDERING,
  selectable,
  SUB_TASK_REASON,
  taskOf,
} from '@/lib/tasks'
import { COMMANDS, parseCommand, splitTargets } from '@/lib/commands'
import { downloadChat } from '@/lib/history'
import { useElementWidth, useStoredWidth } from '@/lib/layout'
import {
  pendingApprovalsByTenant,
  stampsOf,
  touchedPlugins,
} from '@/lib/routing'
import { chatTitle } from '@/lib/runs'
import type { SpecOperation } from '@/lib/spec'
import {
  fill,
  templateMessage,
  variableNames,
  type Template,
} from '@/lib/templates'
import { delegations, latestPlan } from '@/lib/todo'
import { claudeCodeOrchestrates, ShellContext, useShell } from '@/lib/plugins'
import { useRun } from '@/lib/use-run'
import { cn } from '@/lib/utils'

const EXAMPLES = [
  'What are my critical open detections from the last 24 hours, and why?',
  'Which internet-exposed resources have critical vulnerabilities?',
]

const PANEL_MIN = 480
const CHAT_MIN = 440

export function ChatView(props: {
  chatId: string
  /** A run from before plugins: shown, never continued. */
  readOnly?: boolean
  /** Why the run's last turn stopped short. */
  notice?: string
  operations?: Map<string, SpecOperation>
  /** What the run published so far. */
  artifacts: ArtifactRef[]
  /** The artifact the panel shows; the panel is closed without one. */
  artifactId?: string
  /** An action the panel scrolls to, picked in the sidebar. */
  focus?: { actionId: string; at: number }
  onArtifact: (id?: string) => void
  /** For a task: the changed file the panel shows instead of an artifact. */
  file?: string
  /** The run's agent, which holds its artifacts' notifications. */
  agent?: Template
  onSaveAgent: (agent: Template) => void
  /** Picked in the sidebar for this chat, to inspect before it's sent. */
  template?: Template
  /** The template was sent or put away. */
  onTemplateDone: () => void
  onCreateTemplate: (messages: UIMessage[]) => void
  /** Set for a Claude Code session, which is shown here but driven from its terminal. */
  claudeCode?: RunSummary['claudeCode']
  /** The run's summary, once it's listed. */
  run?: RunSummary
  /** For a task: the session it was launched from. */
  parent?: RunSummary
  /** The session's direct tasks. */
  tasks?: RunSummary[]
  /** Opens another run, at an artifact if one is given, scrolled to an action if one is given. */
  onOpenRun?: (runId: string, artifactId?: string, actionId?: string) => void
  /** Set on a small window, where the session list takes the chat's place. */
  onBack?: () => void
}) {
  const {
    chatId,
    readOnly,
    operations,
    artifacts,
    artifactId,
    onArtifact,
    template,
    onTemplateDone,
    onCreateTemplate,
  } = props

  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    addToolApprovalResponse,
    loaded,
    running,
  } = useRun(chatId, { agentId: template?.id })
  const shell = useShell()
  const { blocked, openOptions, mentionables, claudeCode: setup } = shell

  const busy = status === 'submitted' || status === 'streaming'
  const pendingApprovals = pendingApprovalsByTenant(messages)
  const awaitingApproval = pendingApprovals.length > 0
  const tenants = useMemo(() => touchedPlugins(messages), [messages])
  const { claudeCode } = props
  const isClaudeCode = claudeCode !== undefined
  const agents = useClaudeCodeAgents(chatId, isClaudeCode)
  // A terminal session takes messages over its channel; any other resumes with `claude -p`.
  const unreachable = claudeCode?.live && claudeCode.channels === false
  const canReply = !isClaudeCode || (claudeCode.live ? !unreachable : !!setup?.found)
  const { plan, goal } = useMemo(() => {
    if (!isClaudeCode) return { plan: latestPlan(messages), goal: undefined }
    const session = claudeCodePlan(messages)
    return { plan: session?.steps, goal: session?.goal }
  }, [isClaudeCode, messages])
  // A render still in flight counts only while the session is running.
  const sessionRunning =
    props.run?.status === 'running' || props.run?.status === 'awaiting_approval' || running
  const sessionArtifacts = useMemo(
    () => (isClaudeCode ? claudeCodeArtifacts(messages, { running: sessionRunning }) : []),
    [isClaudeCode, messages, sessionRunning],
  )
  const task = props.run && taskOf(props.run)
  const [launching, setLaunching] = useState<{ artifactId: string; actionIds: string[] }>()
  const [reviewing, setReviewing] = useState<{ artifactId: string; actionId: string }>()
  // Back to the action once the dialog is gone, whose focus trap would take it back before.
  const [refocus, setRefocus] = useState<string>()
  useEffect(() => {
    if (!refocus || launching) return
    document.querySelector<HTMLElement>(`[data-action="${CSS.escape(refocus)}"] button`)?.focus()
    setRefocus(undefined)
  }, [refocus, launching])
  const [digError, setDigError] = useState<string>()
  const startDig = (artifactId: string, actionId: string) => {
    setDigError(undefined)
    window.desktop.claudeCode.dig(chatId, artifactId, actionId).catch(e => setDigError(ipcError(e)))
  }
  const [selected, setSelected] = useState<Map<string, Set<string>>>(new Map())
  const runs = useMemo(() => delegations(messages, busy), [messages, busy])

  // Retry and Edit: in sessions the app runs, not in one a terminal has open.
  const retryable = isClaudeCode && !claudeCode.live && !readOnly
  const retryBlocked = !setup?.found?.retry
    ? 'Needs a Claude Code that can fork a session at a message'
    : undefined
  const attempts = useMemo(() => replacedAt(claudeCode?.attempts), [claudeCode?.attempts])
  const [editing, setEditing] = useState<number>()
  const [confirming, setConfirming] = useState<{
    index: number
    text: string
    edited: boolean
    preflight: RetryPreflight
  }>()
  const [retryError, setRetryError] = useState<string>()
  const retry = async (index: number, text: string, edited: boolean) => {
    setRetryError(undefined)
    try {
      const preflight = await window.desktop.claudeCode.preflight(chatId, index)
      setEditing(undefined)
      if (atStake(preflight)) return setConfirming({ index, text, edited, preflight })
      await window.desktop.claudeCode.retry(chatId, index, text, false)
    } catch (error) {
      setRetryError(ipcError(error))
    }
  }
  const confirmRetry = async (restoreFiles: boolean) => {
    if (!confirming) return
    setConfirming(undefined)
    try {
      await window.desktop.claudeCode.retry(chatId, confirming.index, confirming.text, restoreFiles)
    } catch (error) {
      setRetryError(ipcError(error))
    }
  }

  const [stage, setStage] = useState(
    () => template && { template, values: {} as Record<string, string> },
  )
  // A prompt template fills the input; a plan template waits in the stage.
  const [draft, setDraft] = useState(() =>
    template?.kind === 'prompt' ? { text: template.prompt } : undefined,
  )
  const started = messages.length > 0
  // A chat started here goes to Claude Code when it orchestrates; its own commands pass through.
  const viaClaudeCode =
    isClaudeCode || (claudeCodeOrchestrates(shell.plugins, setup) && !started && !template)
  useEffect(() => {
    if (started && template) onTemplateDone()
  }, [started, template, onTemplateDone])

  const setValues = (values: Record<string, string>) => {
    if (!stage) return
    setStage({ ...stage, values })
    if (stage.template.kind === 'prompt') {
      setDraft({ text: fill(stage.template.prompt, values) })
    }
  }
  const closeStage = () => {
    setStage(undefined)
    onTemplateDone()
  }
  const loadPlan = (run: boolean) => {
    if (!stage) return
    sendMessage(templateMessage(stage.template, stage.values, run))
    closeStage()
  }

  const respond = (id: string, approved: boolean, answers?: Record<string, string>) =>
    addToolApprovalResponse({ id, approved, answers })
  const setAutoApprove = (on: boolean) =>
    window.desktop.claudeCode.setAutoApprove(chatId, on)

  const [opsQuery, setOpsQuery] = useState<string>()
  const chatState = {
    awaitingApproval,
    hasPlan: !!plan?.length,
    hasMessages: messages.length > 0,
  }
  const commands = viaClaudeCode
    ? []
    : COMMANDS.filter(c => !c.blocked?.(chatState))

  // Returns why the text wasn't sent, if it wasn't.
  const submit = (text: string): string | undefined => {
    if (viaClaudeCode) return void sendMessage({ text })
    const unfilled = variableNames({ prompt: text })
    if (unfilled.length > 0) return `Fill in ${unfilled.join(', ')} first.`
    const parsed = parseCommand(text)
    if (!parsed) return void sendMessage({ text })
    const { command, args } = parsed
    const problem = command.blocked?.(chatState)
    if (problem) return problem
    if (command.args && !args) return `Usage: /${command.name} ${command.args}`
    if (command.name === 'each' && splitTargets(args).targets.length === 0) {
      return 'Name the tenants first, e.g. /each @all Audit open critical detections.'
    }
    if (command.prompt) {
      return void sendMessage({ text: `/${command.name} ${args}`.trim() })
    }
    switch (command.name) {
      case 'approve':
      case 'deny': {
        // Approvals go one tenant at a time: a bare command only when one is waiting.
        const tenant = args.replace(/^@/, '')
        const waiting = [...new Set(pendingApprovals.map(a => a.stamp?.label ?? ''))]
        const chosen = pendingApprovals.filter(a =>
          tenant ? a.stamp?.label === tenant || a.stamp?.plugin === tenant : true,
        )
        if (!tenant && waiting.length > 1) {
          return `Changes wait on ${waiting.join(' and ')}. Name one: ${waiting
            .map(w => `/${command.name} @${w}`)
            .join(' or ')}.`
        }
        if (chosen.length === 0) return `No change is waiting on ${tenant}.`
        for (const { id } of chosen) respond(id, command.name === 'approve')
        return
      }
      case 'ops':
        if (!operations) return 'The API spec is still loading.'
        return void setOpsQuery(args)
      case 'export':
        return void downloadChat({
          id: chatId,
          title: chatTitle(messages),
          messages,
        })
      case 'template':
        return void onCreateTemplate(messages)
    }
  }

  const sessionArtifact = sessionArtifacts.find(a => a.id === artifactId)
  const actionsDisabled =
    (task?.depth ?? 0) >= 2
      ? SUB_TASK_REASON
      : !setup?.found
        ? NO_CLAUDE_CODE
        : sessionArtifact?.pending
          ? RENDERING
          : undefined
  const actionsContext: ActionsContextValue | undefined =
    sessionArtifact && sessionArtifact.actions.length > 0 && !readOnly
      ? {
          artifact: sessionArtifact,
          run: props.run,
          tasks: props.tasks ?? [],
          disabled: actionsDisabled,
          selected: selected.get(sessionArtifact.id) ?? new Set(),
          selecting:
            sessionArtifact.actions.filter(a =>
              selectable(actionTasks(props.tasks ?? [], sessionArtifact.id, a.id)),
            ).length >= 2,
          onSelect: (actionId, on) =>
            setSelected(current => {
              const next = new Map(current)
              const ids = new Set(next.get(sessionArtifact.id))
              if (on) ids.add(actionId)
              else ids.delete(actionId)
              return next.set(sessionArtifact.id, ids)
            }),
          onLaunch: actionIds =>
            !actionsDisabled && setLaunching({ artifactId: sessionArtifact.id, actionIds }),
          onOpen: runId => props.onOpenRun?.(runId),
          onStop: runId => void window.desktop.runs.stop(runId),
          onDig: actionId => !actionsDisabled && startDig(sessionArtifact.id, actionId),
          onReview: actionId => setReviewing({ artifactId: sessionArtifact.id, actionId }),
          notice: digError,
        }
      : undefined
  const launchArtifact = launching && sessionArtifacts.find(a => a.id === launching.artifactId)
  // A dig's own chat: what it suggested, to accept or dismiss right there.
  const digSuggestions =
    task?.kind === 'dig' && props.parent
      ? (props.parent.claudeCode?.suggestions ?? []).filter(s => s.digRunId === chatId)
      : []
  const { error: decideError, decide } = useDecide(props.parent?.id ?? '')
  const reviewDig =
    reviewing && actionDigs(props.tasks ?? [], reviewing.artifactId, reviewing.actionId).at(-1)
  // A task's first message never reached Claude Code: it has no composer until it starts.
  const notStarted =
    !!task &&
    loaded &&
    !messages.some(m => m.role === 'user' && !(m.metadata as { pending?: boolean } | undefined)?.pending)
  const parentTitle = props.parent?.title
  const sourceArtifact = task && props.parent?.artifacts?.find(a => a.id === task.artifactId)
  const worktree = task?.worktree
  const outcome = task?.outcome
  const shown = isClaudeCode ? sessionArtifacts : artifacts
  const fileOpen = props.file !== undefined && !!task
  const panelOpen = fileOpen || (artifactId !== undefined && (!isClaudeCode || !!sessionArtifact))
  const root = useRef<HTMLDivElement>(null)
  // Remounted once loaded and scrolled before paint: a run opens at its end, unanimated.
  const conversation = useRef<StickToBottomContext>(null)
  useLayoutEffect(() => {
    const scroller = conversation.current?.scrollRef.current
    if (loaded && scroller) scroller.scrollTop = scroller.scrollHeight
  }, [loaded])
  const available = useElementWidth(root)
  const [panelWidth, setPanelWidth] = useStoredWidth('artifacts', 560)
  // Too narrow for both side by side: the panel takes the chat's place.
  const narrow = available !== undefined && available < PANEL_MIN + CHAT_MIN
  const panelMax = (available ?? 0) - CHAT_MIN
  const shownWidth = Math.max(PANEL_MIN, Math.min(panelWidth, panelMax))
  const counter = shown.length > 0 && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() =>
        panelOpen ? onArtifact(undefined) : onArtifact(shown.at(-1)?.id)
      }
    >
      <LayoutDashboardIcon />
      {shown.length} {shown.length === 1 ? 'artifact' : 'artifacts'}
    </Button>
  )

  // Claude Code answers this session's approvals, whatever state the plugins are in.
  return (
    <ShellContext.Provider
      value={isClaudeCode ? { ...shell, blocked: undefined } : shell}
    >
      <div ref={root} className="flex h-full min-h-0">
        <div
          className={cn(
            'flex h-full min-h-0 min-w-0 flex-1 flex-col',
            panelOpen && narrow && 'hidden',
          )}
        >
          <header
            className={cn(
              'flex shrink-0 items-center gap-4 border-b px-4',
              task ? 'min-h-11 py-1.5' : 'h-11',
            )}
          >
            {props.onBack && (
              <Button variant="ghost" size="sm" className="-ml-2 shrink-0" onClick={props.onBack}>
                <ArrowLeftIcon /> Sessions
              </Button>
            )}
            {task ? (
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <h2 className="flex min-w-0 items-center gap-1 text-sm font-medium">
                  {props.parent && !task.parentRemoved ? (
                    <button
                      className="max-w-1/2 shrink truncate text-muted-foreground hover:text-foreground hover:underline"
                      onClick={() => props.onOpenRun?.(props.parent!.id)}
                    >
                      {parentTitle}
                    </button>
                  ) : (
                    <span className="shrink-0 text-muted-foreground">Parent removed</span>
                  )}
                  <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 truncate">{props.run?.title}</span>
                </h2>
                <p className="flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  {props.parent && !task.parentRemoved && (
                    <button
                      className="truncate hover:text-foreground hover:underline"
                      onClick={() => props.onOpenRun?.(props.parent!.id, task.artifactId)}
                    >
                      from {sourceArtifact?.title ?? task.artifactId}
                    </button>
                  )}
                  {props.parent && !task.parentRemoved && actionGone(task, props.parent) && (
                    <span className="text-amber-600 dark:text-amber-400">Its action is gone</span>
                  )}
                  {worktree?.branch && (
                    <span className="flex min-w-0 items-center gap-1">
                      <GitBranchIcon className="size-3 shrink-0" />
                      <code className="truncate font-mono">{worktree.branch}</code>
                      {outcome?.commitsAhead !== undefined && (
                        <span>
                          · {plural(outcome.commitsAhead, 'commit')} ·{' '}
                          {plural(outcome.filesChanged ?? 0, 'file')} changed
                          {outcome.dirty && ' · uncommitted changes'}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Reveal in Finder"
                        title="Reveal in Finder"
                        onClick={() => void window.desktop.claudeCode.reveal(worktree.path!)}
                      >
                        <FolderOpenIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Copy path"
                        title="Copy path"
                        onClick={() => void navigator.clipboard?.writeText(worktree.path!)}
                      >
                        <CopyIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="h-5 px-1"
                        onClick={() => void navigator.clipboard?.writeText(worktree.branch!)}
                      >
                        Copy branch
                      </Button>
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <h2 className="min-w-0 flex-1 truncate text-sm font-medium">
                {isClaudeCode ? (props.run?.title ?? chatTitle(messages)) : chatTitle(messages)}
              </h2>
            )}
            {tenants.length > 0 && (
              <p
                className="max-w-1/2 truncate text-xs text-muted-foreground"
                title={tenants.join(', ')}
              >
                Tenants: {tenants.join(', ')}
              </p>
            )}
          </header>
          <Conversation key={String(loaded)} contextRef={conversation}>
            <ConversationContent className="mx-auto w-full max-w-3xl">
              {!loaded ? null : messages.length === 0 && isClaudeCode ? (
                <ConversationEmptyState
                  icon={<SquareTerminalIcon />}
                  title="Waiting for Claude Code"
                  description="Prompts, thinking and tool calls show here as the session runs."
                />
              ) : messages.length === 0 ? (
                <ConversationEmptyState>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">
                      Ask about your cloud security posture
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {viaClaudeCode
                        ? 'Claude Code answers here, using your tenants through the app. Anything it wants to change waits for your approval.'
                        : 'The assistant queries your tenants through their APIs. Changes wait for your approval.'}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    {EXAMPLES.map(text => (
                      <Button
                        key={text}
                        variant="outline"
                        className="h-auto whitespace-normal text-left"
                        disabled={!!blocked}
                        onClick={() => sendMessage({ text })}
                      >
                        {text}
                      </Button>
                    ))}
                  </div>
                </ConversationEmptyState>
              ) : (
                messages.map((message, index) => {
                  const meta = message.metadata as
                    | { pending?: boolean; midTurn?: boolean }
                    | undefined
                  const replaced = attempts.get(index)
                  return (
                    <div key={message.id} className="contents">
                      {replaced && message.role === 'user' && (
                        <ReplacedAttempts runId={chatId} attempts={replaced} />
                      )}
                      <Message from={message.role}>
                        {editing === index ? (
                          <MessageEditor
                            initial={messageText(message)}
                            onCancel={() => setEditing(undefined)}
                            onSubmit={text =>
                              void retry(index, text, text !== messageText(message))
                            }
                          />
                        ) : (
                          <MessageContent>
                            <TemplateNote messages={messages} index={index} live={busy} />
                            {meta?.pending && claudeCode?.live && (
                              <p className="text-xs text-muted-foreground">
                                Waiting for the terminal session to take it
                              </p>
                            )}
                            <MessageParts
                              parts={message.parts}
                              stamps={stampsOf(message)}
                              keyPrefix={message.id}
                              operations={operations}
                              plan={plan}
                              onApprovalResponse={respond}
                              onApproveAll={
                                isClaudeCode ? () => void setAutoApprove(true) : undefined
                              }
                              onOpenArtifact={onArtifact}
                              // Between requests the run still goes: routed calls and subagents run in the app.
                              live={(busy || running) && index === messages.length - 1}
                            />
                          </MessageContent>
                        )}
                        {retryable &&
                          message.role === 'user' &&
                          !meta?.pending &&
                          editing !== index && (
                            <UserMessageActions
                              blocked={
                                retryBlocked ??
                                (meta?.midTurn
                                  ? 'Sent mid-turn: retry from the message that started this turn'
                                  : undefined)
                              }
                              onRetry={() => void retry(index, messageText(message), false)}
                              onEdit={() => setEditing(index)}
                            />
                          )}
                      </Message>
                    </div>
                  )
                })
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 p-4">
            {plan && plan.length > 0 && (
              <TodoPanel
                goal={goal}
                steps={plan}
                operations={operations}
                runs={runs}
                live={busy}
                onSaveTemplate={
                  isClaudeCode ? undefined : () => onCreateTemplate(messages)
                }
              />
            )}
            <ClaudeCodeAgents agents={agents} />
            {stage && !started && (
              <TemplateStage
                template={stage.template}
                values={stage.values}
                onValuesChange={setValues}
                operations={operations}
                onLoad={loadPlan}
                onClose={() => {
                  if (stage.template.kind === 'prompt') setDraft({ text: '' })
                  closeStage()
                }}
              />
            )}
            {opsQuery !== undefined && operations && (
              <OperationSearch
                query={opsQuery}
                operations={operations}
                onClose={() => setOpsQuery(undefined)}
              />
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            {retryError && (
              <Alert variant="destructive">
                <AlertDescription>{retryError}</AlertDescription>
              </Alert>
            )}
            {task && digSuggestions.length > 0 && (
              <section
                aria-label="Suggested changes"
                className="flex flex-col gap-2 rounded-lg border p-3"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <h3 className="font-medium">Suggested changes to the prompt</h3>
                  {props.parent && !task.parentRemoved && (
                    <Button
                      variant="link"
                      size="xs"
                      className="h-auto p-0"
                      onClick={() =>
                        props.onOpenRun?.(props.parent!.id, task.artifactId, task.actionId)
                      }
                    >
                      Go to the action
                    </Button>
                  )}
                </div>
                <SuggestionList
                  className="max-h-72 overflow-y-auto"
                  suggestions={digSuggestions}
                  parent={props.parent}
                  onDecide={decide}
                />
                {decideError && (
                  <Alert variant="destructive">
                    <AlertDescription>{decideError}</AlertDescription>
                  </Alert>
                )}
              </section>
            )}
            {props.notice && !busy && (
              <Alert>
                <AlertDescription>{props.notice}</AlertDescription>
              </Alert>
            )}
            {claudeCode && (
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <p className="flex min-w-0 items-center gap-2">
                  <SquareTerminalIcon className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {claudeCode.live ? 'Claude Code, open in a terminal' : 'Claude Code'} ·{' '}
                    <span className="font-mono">{claudeCode.cwd}</span>
                  </span>
                </p>
                <Button
                  variant="outline"
                  size="xs"
                  aria-pressed={!!claudeCode.autoApprove}
                  className={cn(
                    'shrink-0',
                    claudeCode.autoApprove &&
                      'border-amber-500/40 text-amber-600 dark:text-amber-400',
                  )}
                  title={
                    claudeCode.autoApprove
                      ? 'Approvals in this session are given without asking. Click to ask again.'
                      : 'Give every approval in this session without asking'
                  }
                  onClick={() => void setAutoApprove(!claudeCode.autoApprove)}
                >
                  {claudeCode.autoApprove ? 'Auto-approving · Turn off' : 'Approve all'}
                </Button>
              </div>
            )}
            {notStarted ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                {props.run?.status === 'queued' ? (
                  <p className="flex items-center gap-2">
                    Queued ·
                    <Button size="sm" variant="outline" onClick={() => void window.desktop.claudeCode.startNow(chatId)}>
                      Start now
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void stop()}>
                      Stop
                    </Button>
                  </p>
                ) : props.run?.status === 'running' ? (
                  <p className="flex items-center gap-2">
                    Starting…
                    <Button size="sm" variant="ghost" onClick={() => void stop()}>
                      Stop
                    </Button>
                  </p>
                ) : (
                  <p className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => void window.desktop.claudeCode.startAgain(chatId)}>
                      Start again
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void window.desktop.claudeCode.startNow(chatId)}>
                      Start now
                    </Button>
                  </p>
                )}
                {counter}
              </div>
            ) : !canReply ? (
              <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                {unreachable ? (
                  <p className="min-w-0">
                    This terminal session doesn't take messages from the app. To
                    reply here, start Claude Code with{' '}
                    <code className="font-mono text-xs break-all">{CHANNELS_COMMAND}</code>
                  </p>
                ) : (
                  <p>
                    Reply in its terminal, or set up Claude Code in{' '}
                    <Button variant="link" className="h-auto p-0" onClick={openOptions}>
                      Options
                    </Button>{' '}
                    to reply here.
                  </p>
                )}
                {counter}
              </div>
            ) : readOnly ? (
              <p className="text-center text-sm text-muted-foreground">
                This run is from before plugins and is read-only.
              </p>
            ) : (
              <>
                {blocked && !isClaudeCode && (
                  <Alert>
                    <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                      {blocked}
                      <Button size="sm" variant="outline" onClick={openOptions}>
                        Open Options
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                <Composer
                  disabled={isClaudeCode ? false : !!blocked}
                  mentionables={mentionables}
                  commands={commands}
                  onSubmit={submit}
                  locked={awaitingApproval && !viaClaudeCode}
                  placeholder={
                    claudeCode?.live
                      ? 'Message the terminal session'
                      : isClaudeCode
                        ? 'Reply to this Claude Code session'
                        : viaClaudeCode
                          ? 'Ask Claude Code'
                          : awaitingApproval
                            ? 'Approve or deny the pending change, or type /approve or /deny'
                            : 'Ask a question, or type / for commands'
                  }
                  // Between requests, while a client tool runs, the turn is still going.
                  status={running && !busy ? 'submitted' : status}
                  onStop={stop}
                  draft={draft}
                  onEdit={() => {
                    if (stage?.template.kind === 'prompt') closeStage()
                  }}
                  tools={counter}
                />
              </>
            )}
          </div>
        </div>
        {panelOpen && (
          <div
            className={cn('relative flex min-h-0 min-w-0', narrow ? 'flex-1' : 'shrink-0 border-l')}
            style={narrow ? undefined : { width: shownWidth }}
          >
            {!narrow && (
              <ResizeHandle
                label="Resize artifacts"
                edge="left"
                width={shownWidth}
                min={PANEL_MIN}
                max={panelMax}
                onResize={setPanelWidth}
              />
            )}
            {fileOpen ? (
              <FileDiffPanel
                runId={chatId}
                path={props.file!}
                listed={outcome?.files?.find(f => f.path === props.file)}
                version={JSON.stringify([props.run?.updatedAt, props.run?.status, outcome])}
                narrow={narrow}
                onClose={() => onArtifact(undefined)}
                className="flex-1"
              />
            ) : sessionArtifact ? (
              <McpArtifactPanel
                artifact={sessionArtifact}
                focus={props.focus}
                narrow={narrow}
                onClose={() => onArtifact(undefined)}
                className="flex-1"
                actions={actionsContext}
              />
            ) : artifactId ? (
              <ArtifactsPanel
                runId={chatId}
                refs={artifacts}
                selectedId={artifactId}
                narrow={narrow}
                onSelect={onArtifact}
                onClose={() => onArtifact(undefined)}
                agent={props.agent}
                onSaveAgent={props.onSaveAgent}
                className="flex-1"
              />
            ) : null}
          </div>
        )}
      </div>
      {reviewing && props.run && (
        <SuggestionsDialog
          parent={props.run}
          actionTitle={
            sessionArtifacts
              .find(a => a.id === reviewing.artifactId)
              ?.actions.find(a => a.id === reviewing.actionId)?.title ?? reviewing.actionId
          }
          suggestions={suggestionsOf(props.run, reviewing.artifactId, reviewing.actionId)}
          onOpenDig={
            reviewDig
              ? () => {
                  setReviewing(undefined)
                  props.onOpenRun?.(reviewDig.id)
                }
              : undefined
          }
          onClose={() => setReviewing(undefined)}
        />
      )}
      {launching && launchArtifact && (
        <TaskLaunchDialog
          parentRunId={chatId}
          run={props.run}
          tasks={props.tasks ?? []}
          onDig={actionId => startDig(launchArtifact.id, actionId)}
          artifact={launchArtifact}
          actions={launchArtifact.actions.filter(a => launching.actionIds.includes(a.id))}
          onClose={launched => {
            setLaunching(undefined)
            if (launched)
              setSelected(current => new Map(current).set(launchArtifact.id, new Set()))
            setRefocus(actionKey(launchArtifact.id, launched ?? launching.actionIds[0]))
          }}
        />
      )}
      {confirming && (
        <RetryDialog
          preflight={confirming.preflight}
          edited={confirming.edited}
          cwd={claudeCode?.cwd}
          onCancel={() => setConfirming(undefined)}
          onConfirm={restoreFiles => void confirmRetry(restoreFiles)}
        />
      )}
    </ShellContext.Provider>
  )
}
