# Agent Desktop

A self-hosted desktop app for running your own agents across tenants, built on the
[AI SDK](https://ai-sdk.dev) 7. Each tenant you connect is a **plugin** of a **kind**, the
code that knows one backend; the built-in kind is Stream Security (`streamsec`). One
plugin, the **orchestrator**, runs the model; the app runs every tool call
on the tenant it concerns, with that tenant's own token. One conversation can work across
tenants, and a plan step can fan out to one subagent per tenant.

It demonstrates four AI SDK 7 capabilities:

- **Streamed reasoning.** The model's thinking streams as `reasoning` parts and renders as
  a collapsible "Thought for N seconds" block.
- **Native tool approval.** Any tool call that changes data pauses in the
  `approval-requested` state. The app shows an approval card with the API operation, its
  arguments and the tenant it runs on, and the call runs only after you approve it.
- **Subagents.** The model can hand a read-only investigation to subagents with a
  `delegate` tool: one per tenant for a step with targets. Their runs stream into a card
  with one row per tenant, and the parent model sees only their reports.
- **Plans.** The model keeps a step list with a `todo` tool. Each step names the tool
  groups or operations it needs and whether a subagent does it. The current plan is
  pinned above the prompt input.

The UI is built from [AI Elements](https://ai-sdk.dev/elements) components (shadcn/ui).

## Run it

Requirements:

- Node 22 or newer
- pnpm
- For the `streamsec` kind, an account on each tenant that signs in with an e-mail and password.
  Two-factor authentication by authenticator app or e-mail is supported. Accounts that
  sign in only through SSO can't be plugins.
- Tenants that serve the OpenAPI (`/openapi/*`, described by `GET /docs/json`). A tenant
  without it shows as unsupported. The orchestrator also needs `POST /chat` with `x-version: 7`.

```bash
pnpm install
pnpm dev
```

`pnpm dev` opens the app with hot reload. Open **Options** with the cog in the header and
add a plugin: its name, the instance URL (it defaults to `https://app.streamsec.io`),
your e-mail and password. The first plugin orchestrates until you label another.

To build an installer for your platform (unsigned) into `release/`:

```bash
pnpm dist
```

The app has no backend of its own: it talks to each tenant directly.

## Plugins and groups

**Options** (the cog) holds the plugins and the groups.

- A plugin is one tenant: its name, origin, tokens and default workspace. Each shows its
  status: ready, signed out, expired (its token refresh failed), or unsupported (no
  OpenAPI). **Refresh status** checks them all again.
- One plugin is labeled **orchestrator**: every run's model turns go to its `/chat`.
  Moving the label moves where the next request goes. With the orchestrator signed out,
  history stays readable and sending, approvals and trigger edits are disabled.
- A group is a named set of plugins, written `@name`. `@all` is built in and always holds
  every plugin, so a new plugin joins it at once.
- Removing a plugin keeps its runs readable. Groups and triggers that name it show it as
  removed, and fan-outs skip it.

With two or more plugins, calls are **routed**: the model names the tenant of each call,
and the app runs it there. The tool card shows where a call ran, as `acme · Production`,
and the chat lists the tenants the run touched.

## Slash commands

Type `/` in the prompt input to list the commands that can run now, and `@` to list
plugins and groups. A mention goes to the model as a target, while history keeps it as
typed.

| Command | What it does |
|---|---|
| `/plan <goal>` | The model writes a plan with `todo` and waits |
| `/go` | Runs the current plan |
| `/investigate <detection or resource>` | Plans, then hands read-only steps to parallel subagents |
| `/each <@target…> <task>` | Plans a fan-out over the targets, one subagent per tenant, then a step that combines the reports, and runs it |
| `/approve`, `/deny` | Answers the pending approvals; with approvals on several tenants, name one: `/approve @acme` |
| `/ops <search>` | Searches the spec for operations the assistant can call, in the browser |
| `/export` | Downloads the chat, subagent runs included, as JSON |
| `/template` | Saves the chat's first prompt, or its plan, as a template |

## Agents and runs

An agent is a saved template. Save a chat as a template with `/template`, or with the
bookmark button on a chat or on its plan. A template holds either the chat's first
prompt, or its plan and goal. In the dialog, select a value and make it a
`{{variable}}`: it's replaced everywhere it appears. A plan step's targets show as chips
you can remove or add to; `{{plugin}}` in a step title stands for each tenant of a
fan-out, and is never a variable.

Every chat is a run. The sidebar lists the agents (each with its runs) and the ad-hoc
sessions at the root level, followed by **Earlier**, runs from before plugins, which stay
readable but can't continue. Agents and triggers from before plugins aren't carried over.

- Click an agent to open its dashboard: its prompt or plan, its variables, the tenants
  and workspaces its next run covers, and its latest runs with their status, trigger,
  start time, duration and tool calls.
- Start a run with **New run** on the dashboard, or the play button on the agent. The
  run opens with the template, ready for its variables:
  - A prompt template fills the prompt input. Send it as usual.
  - A plan template shows its plan in place. **Load plan** has the model record it with
    `todo` and wait for `/go`; **Run** has it record the plan and run it. If the model
    records a different plan, the message lists the steps that changed.
- Click a run to open its chat. A run keeps going when you open another one.

### Artifacts

What a run publishes is an artifact: a view (a report or dashboard) or a message (an
e-mail or chat message). Reusing an id replaces the artifact and bumps its revision; an
agent's prompt can name ids like `daily-digest` so each run publishes the same ones.

- The composer shows how many artifacts the run has; click it to open them. On a wide
  window they open beside the chat, on a narrow one in its place.
- In the sidebar, a run with artifacts expands to list them. Click one to open the run
  with that artifact shown.
- Artifacts are JSON files in the app's data folder, one per run. A view renders only
  known components, and every value in it as plain text.

### Tasks

In a Claude Code session, an artifact can carry **actions**: follow-up work the agent
offers, such as one fix per finding in a report. Launching one starts a **task**, a child
Claude Code session listed in the sidebar under its action, which sits under its artifact.
Every action is listed there as a bookmark: picking one scrolls the artifact to it. The agent
writes the prompts; you decide which ones run.

- An action sits on the row or heading it's about, or in the Actions tray at the end. Its
  button opens a review dialog with the title, where the task runs and the editable prompt.
  With two or more actions, select several and launch them together.
- The queue runs at most 4 tasks at once across the app; the rest wait as Queued. A task
  waiting for your approval doesn't hold a slot. **Start now** skips the queue.
- A task can run in a new git worktree under `~/.agent-desktop/worktrees`, on a
  `desktop/task/…` branch from the commit the action names (`desktop-task/…` in a
  repo with a branch named `desktop`, which blocks the first). Edits inside it don't ask;
  shell commands and tenant changes still do. The app never merges, pushes or fetches.
- Approvals in a task show on its row and on every collapsed row above it, with a desktop
  notification. A task asks before any tenant change marked MUTATING, whatever its allow
  rules say, and the global auto mode never answers it.
- Once launched, an action shows its task's status; its ⋯ menu offers Open, Launch again,
  Stop and Copy prompt. A task can read its parent with `ui_read_parent`, and the parent
  reads its tasks' results with `ui_list_tasks` when you ask.
- A task's changed files list under it in the sidebar, and open in the panel as a diff,
  split or inline, with unchanged lines folded: in a worktree, everything since the base
  commit; elsewhere, the task's own Write and Edit changes.
- Removing a session asks whether its tasks go too, and offers to delete each task's
  worktree. Branches are kept.
- Tasks queued when the app closed wait for **Resume** at the next start.
- A sub-task (a task's task) can't launch tasks of its own.

**Dig** (in an action's ⋯ menu, or on its row in the review dialog) starts a read-only
session into the action's prompt before it runs. It forks the parent, so it knows why the
action was written, reads the code at the commit the task would start from, and renders a
one-page verdict: what could break, why the code is the way it is, and what nothing tests.
It may run only read-only git, Read, Grep and Glob; everything else is refused without asking.
Its suggested prompt changes come back as ✎ on the action: accept or dismiss each, and what
you accept goes into the prompt the task gets, on top of the agent's text. Digs run two at a
time beside the task queue; a new dig replaces the last one, and a dig whose suggestions are
all settled folds away.

`node scripts/task-metrics.mjs` prints how actions are used: how many get launched, how
often prompts are edited, and how long dispatching takes.

### Reply suggestions

When an agent ends its turn in the session you're viewing, up to three replies you're likely to
send show above the composer. A click puts one in the composer, with any part you'll likely
change selected; nothing is sent until you press Enter. In an empty composer, Tab takes the
first and ⌥1–3 pick by position; × hides them for the turn. They don't show while an approval
or question waits, in a dig, or where you can't reply.

One Claude Code process the app runs writes them, on Sonnet 5.5 with thinking off. It has no
built-in tools, none of your settings or plugins, and only its own three MCP tools:
`ui_suggest_replies`, `ui_read_conversation` and `ui_set_reply_notes`. Each finished turn
goes to it as a request on stdin, after a `/clear`, so sessions never leak into each other.
What it learns about how you reply is kept as notes, which **Options → Replies** shows and
edits, along with the model and an off switch. It exits after 10 idle minutes.

### Notifications

Artifacts are how an agent reaches people. Open an artifact and choose **Notify** to pick
the channels it goes to:

- In an agent's run, the choice is saved on the agent: every completed run that
  publishes an artifact with that id sends it. Each revision goes to each channel once.
  The agent's dashboard lists what it sends where.
- In a chat without an agent, **Send now** sends the artifact once.
- Every artifact has **Send now**, and the panel lists what was sent where, or why it
  failed.

| Channel | Sends |
|---|---|
| Desktop notification | A system notification; click it to open the artifact. |
| Slack webhook | A header with the subject and the body in Slack markup. |
| Microsoft Teams webhook | An Adaptive Card (Teams workflow webhook). |
| Google Chat webhook | The subject and the body in Google Chat markup. |
| Webhook (JSON) | `{ event: "artifact.published", agent, run, artifact, subject, markdown }`. |
| E-mail (SMTP) | The subject, and the body as text and HTML, through your SMTP server. |

A message artifact is sent as written. A view is sent as Markdown made from its
components; tables go to Slack and Google Chat as preformatted text. Channel settings are
encrypted with the OS keychain where it's available.

### Triggers

Add triggers on an agent's dashboard to start its runs on their own:

| Trigger | Starts a run |
|---|---|
| On a schedule | At each time of a cron pattern, in local time. A schedule missed while the app was closed runs once when it starts. A schedule doesn't start a run while its last one is still running. |
| On a new detection | For each new detection at or above a severity on the tenant it watches (the orchestrator unless you pick one). The app polls `GET /openapi/detections` every minute, puts the detection in the run's prompt, and starts the run on that tenant. |
| After another agent completes | When a run of that agent completes, with its final answer in the prompt. Chains stop at five runs deep. |

A trigger may name the tenant its runs start on; otherwise the steps' own targets decide.
Its runs take the variable values it was given. Triggers fire only while the app is
running: closing the window leaves it in the menu bar (tray), and **Quit** there stops it.
A triggered run that waits for approval or fails shows a system notification, and so does
a run that reaches a tenant its agent never covered before; click it to open the run.

## How it talks to the tenants

| What | Call | Where it's defined |
|---|---|---|
| Sign in | `POST /trpc/auth.login` | Not in the OpenAPI spec (tRPC) |
| Two-factor code | `POST /trpc/twoFactor.requestVerification` (e-mail codes), then `POST /trpc/twoFactor.authenticate` | Not in the spec (tRPC) |
| Refresh the access token | `POST /trpc/auth.refreshToken` | Not in the spec (tRPC) |
| List workspaces | `GET /openapi/workspaces` | OpenAPI spec |
| Status | `GET /openapi/workspaces` | OpenAPI spec |
| Tool list | `GET /docs/json`: each operation is a tool, `detections-list` as `detections__list`; anything but GET is a change | The OpenAPI spec itself, fetched at runtime |
| Run a routed call | The operation's own method and `/openapi/...` path | OpenAPI spec |
| Chat (orchestrator only) | `POST /chat` with `x-version: 7` | AI SDK UI message stream (not in the spec) |

Every authenticated call sends `authorization: Bearer <access token>` and
`workspace: <workspace id>`, and goes only to the plugin's own origin. The main process
makes these calls and holds every plugin's tokens (`electron/plugins/`); the window never
sees them. On a 401 it refreshes the token once and retries.

Everything specific to Stream Security sits in the `streamsec` plugin kind
(`electron/plugins/streamsec/`): sign-in, workspaces, detection polling and its OpenAPI tools. The
core knows plugins, groups, the orchestrator label, routing, runs and triggers.

### The chat endpoint

`POST /chat` with the header `x-version: 7` takes `{ id, messages, clientTools }`, and with
two or more plugins also `{ plugins, groups, callParams }`:

- `messages` is the full `UIMessage[]` history, except that each subagent run is cut
  to its report (`src/lib/delegate.ts`). The full run stays in local history.
- A user message that is a prompt command (`/plan`, `/go`, `/investigate`, `/each`) is
  sent as the prompt it stands for (`src/lib/commands.ts`), with a line naming its
  mentions as targets (`src/lib/mentions.ts`). History keeps it as typed.
- A user message that loads a plan template keeps the goal as its text and the steps in
  `metadata.template`. It's sent as the goal plus an instruction to record those steps
  with `todo` as given, without the metadata (`src/lib/templates.ts`).
- The server keeps no chat history. This app stores each chat as a run in its data
  folder.

It responds with an AI SDK 7 UI message stream (`x-vercel-ai-ui-message-stream: v1`). The
main process consumes it with the AI SDK's `AbstractChat` and `DefaultChatTransport`
(`electron/runs.ts`), so a run goes on whether or not a window shows it. The window
follows a run through `useRun` (`src/lib/use-run.ts`), which returns what `useChat`
would.

The assistant's tools are the instance's REST API operations:

- They run on the server with your permissions, as if you had called the API yourself.
- The model starts with a single `loadToolGroup` tool and unlocks groups of operations (for
  example `detections` or `inventory`) as it needs them.
- A tool named `detections__list` is the spec operation `detections-list`, which the
  app uses to title tool cards as `GET /detections`.
- Each `todo` call sends the whole step list, so the plan is the input of the last
  accepted call (`src/lib/todo.ts`). `delegate({ stepId })` hands a step to a subagent
  with only the tools that step names.
- The request also declares `clientTools`: tools the app runs itself
  (`electron/client-tools.ts`). The model's call to one ends the server's turn; the app
  runs it, adds its output with `addToolOutput`, and sends the history back. Subagents
  don't get them.

When calls are routed (two or more plugins, `electron/router.ts`):

- Every API tool takes `plugin`, required on a change, and the kinds' `callParams` (a
  `workspace`). Its call ends the server's turn unrun; when the stream ends, the app picks
  the tenant (the call's `plugin`, else the in-progress step's single target, else the
  run's focus, else the only ready plugin), checks the call against that tenant's own
  tool list, runs it with that tenant's token, and stamps where it ran in the message's
  metadata.
- A call the tenant counts as a change, though the orchestrator didn't, is held for your
  approval by the app. A tool the tenant lacks is refused with an error the model reads.
- A plan step's `targets` limit where its calls go. On a subagent step they fan it out:
  the app runs one child per ready target, at most four at a time, each a `/chat`
  request in subagent mode pinned to its tenant, and answers `delegate` with one report
  per tenant. Subagents can't make changes.
- A turn stops after 20 routed steps, and says so; a new message continues.

Client tools:

| Tool | What it does |
|---|---|
| `webFetch` | GETs a public web page and returns its title and readable text (up to 20,000 characters). It refuses private, loopback and link-local addresses, follows up to five redirects, and reads text, HTML, JSON and XML only. |
| `artifacts_create` | Publishes a view: a tree of components (layout, card, typography, table, badge, alert, separator, kbd, progress, metric). |
| `artifacts_message` | Publishes a message: a subject and a Markdown body, for e-mail or chat. |
| `artifacts_read`, `artifacts_list` | Read this run's artifacts. |
| `artifacts_previous` | Reads an artifact by id from the same agent's earlier runs in the workspace, so a run can compare or leave out what was already reported. |

When a tool call changes data:

1. The call arrives in the `approval-requested` state.
2. `addToolApprovalResponse({ id, approved })` records your answer.
3. `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses` sends the
   history back.
4. The server runs the approved call, or reports the denial to the model, and the
   model continues.

Reasoning parts carry the model's thinking signatures. Send messages back unmodified;
the server needs them to continue a turn that used tools.

## Notes

- Each plugin's tokens are encrypted with the OS keychain (Electron `safeStorage`) where
  it's available. **Sign out** on a plugin clears them.
- Tokens stay on their own tenant, but data doesn't: every routed call's input and
  output reach the orchestrator, and with it that environment's model provider and
  tracing. Choose the orchestrator with that in mind.
- Plugins, groups, chats (runs) and templates are JSON files in the app's data folder, for example
  `~/Library/Application Support/agent-desktop` on macOS.
- Approval protects you from the assistant acting on its own. It is not a permission
  boundary: the API enforces your account's permissions on every call either way.
- `webFetch` runs without approval, so what the assistant reads can steer what it
  fetches, and a URL it builds can carry data out. It can't reach your own machine or
  network.
- Dependencies are installed only once they have been published for a week
  (`minimumReleaseAge` in `pnpm-workspace.yaml`).

## Layout

```
electron/
  main.ts                 window and IPC handlers
  preload.ts              `window.desktop`, the API the window calls (src/lib/desktop.ts)
  plugins/                plugins, their status and groups; kinds.ts is the kind registry
    streamsec/            the Stream Security kind: tokens, workspaces, detections, OpenAPI tools
  router.ts               picks each routed call's tenant, checks and runs it
  subagents.ts            fan-out: one child chat per tenant, run by the app
  runs.ts                 runs: an AbstractChat per run, stored in the data folder
  fresh-start.ts          sets data from before plugins aside, once
  agents.ts               saved templates
  triggers.ts             schedules, trigger sources, agent chains, notifications
  client-tools.ts         tools the app runs for the model; web-fetch.ts is `webFetch`
  artifacts.ts            each run's artifacts
  channels.ts             notification channels and their encrypted settings
  delivery.ts             sends artifacts to channels; render-artifact.ts formats them
  tray.ts                 the menu-bar icon
  mcp/suggester.ts        reply suggestions: the suggester process and its tools
src/
  App.tsx                 shell: header with the Options cog, sidebar, main view
  components/
    Options.tsx           plugins (sign-in, status, orchestrator label) and groups
    Sidebar.tsx           agents and their runs, then chats, then earlier runs
    AgentDashboard.tsx    an agent's configuration, coverage, triggers and latest runs
    Triggers.tsx          an agent's triggers and the form that adds one
    ArtifactsPanel.tsx    a run's artifacts, beside or in place of the chat
    ArtifactView.tsx      renders a view's components or a message
    NotifyDialog.tsx      an artifact's channels, Send now, and the channel form
    ChatView.tsx          useRun, slash commands, /approve per tenant
    Composer.tsx          prompt input with the slash command and @ mention menus
    ReplyRail.tsx         suggested replies above the composer
    OperationSearch.tsx   `/ops` results
    MessageParts.tsx      text, reasoning and tool parts; nests for subagent runs
    ToolCallCard.tsx      tool call + approval card, with the tenant it ran on
    SubagentCard.tsx      a `delegate` call: one row per tenant, or a single run
    TodoPanel.tsx         the current plan's steps, their tools and subagents
    ai-elements/, ui/     AI Elements and shadcn/ui components
  lib/                    plugins, routing stamps, mentions, auth, spec index, runs,
                          subagent runs, plans, slash commands
e2e/                      Playwright suites and done scenarios on stub tenants (e2e/rig/)
```
