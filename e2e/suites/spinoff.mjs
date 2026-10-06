// Spin-offs: the message box's prompt sent to a new session under the current one, with context on request.
import { fake } from '../fake-scripts.mjs'
import { fakeLog, launchWithClaudeCode, session, startSession, tasksOf, transcript, until } from '../claude-code.mjs'
import { OUT } from '../app.mjs'

const results = []
const check = (name, ok, extra = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`) }
const visible = (locator, timeout = 10_000) => locator.first().waitFor({ timeout }).then(() => true, () => false)
const nav = page => page.getByRole('navigation', { name: 'Agents and runs' })
const said = (home, id) => transcript(home, id).filter(e => e.type === 'assistant' && e.message.content[0]?.type === 'text').map(e => e.message.content[0].text)
const prompts = (home, id) => transcript(home, id).filter(e => e.type === 'user' && typeof e.message.content === 'string')
const toolResults = (home, id) => transcript(home, id).flatMap(e => (e.type === 'user' && Array.isArray(e.message.content) ? e.message.content.filter(c => c.type === 'tool_result') : []))
const resultText = r => (Array.isArray(r.content) ? r.content.map(c => c.text).join('') : String(r.content))
const spinoffs = (profile, parent) => tasksOf(profile, parent).filter(s => s.claudeCode.task.kind === 'spinoff')
const after = (argv, flag) => argv[argv.indexOf(flag) + 1]

const { app, page, profile, home } = await launchWithClaudeCode()
const parent = await startSession(page, profile, `Find the parser bug. ${fake('steps', [['title', 'Parser hunt'], ['say', 'The bug is in src/parser.ts: tokens past 255 wrap. The lexer is fine; ruled out.']])}`)
await until(() => said(home, parent).some(t => t.includes('ruled out')), 20_000)
const parentPrompts = prompts(home, parent).length

const composer = page.locator('textarea:enabled').first()
const button = page.getByRole('button', { name: 'Send to a new session' })
check('button: shown in a session, off while the box is empty', await visible(button) && await button.isDisabled())

// With context: written from the conversation, edited, then sent.
const PROMPT_A = `Write a regression test for the wrap. [fake-context:${JSON.stringify({ text: '- Bug: src/parser.ts wraps tokens past 255.\n- The lexer was ruled out.' })}] ${fake('steps', [['call', 'ui_read_parent', {}], ['say', 'Test written.']])}`
await composer.fill(PROMPT_A)
await button.click()
const dialog = page.getByRole('dialog', { name: 'Send to a new session' })
await dialog.waitFor()
check('dialog: the prompt comes over', (await dialog.getByRole('textbox', { name: 'Prompt' }).inputValue()) === PROMPT_A)
check('dialog: the title is its first line', (await dialog.getByRole('textbox', { name: 'Session title' }).inputValue()).startsWith('Write a regression test'))
const optIn = dialog.getByRole('checkbox', { name: /Add context from this conversation/ })
check('dialog: context is opt-in', !(await optIn.isChecked()))
const since = Date.now()
await optIn.check()
const contextBox = dialog.getByRole('textbox', { name: 'Context' })
check('context: written and shown to edit', await visible(contextBox, 15_000))
check("context: it is the writer's answer", (await contextBox.inputValue()).includes('wraps tokens past 255'))
const request = fakeLog(since).find(e => e.event === 'context-request')
check('context: the writer read the conversation, then the prompt', request?.content.includes('ruled out') && /<prompt>\nWrite a regression test/.test(request.content), request?.content.slice(0, 120))
const argv = request?.argv ?? []
check('context: one tool-less run that leaves no session behind', after(argv, '--tools') === '' && argv.includes('--no-session-persistence') && argv.includes('--strict-mcp-config') && after(argv, '--model') === 'claude-opus-5-5', argv.join(' ').slice(0, 200))
await page.screenshot({ path: `${OUT}/spinoff-dialog.png` })
await contextBox.fill(`${await contextBox.inputValue()}\n- Use vitest.`)
await dialog.getByRole('button', { name: 'Start session' }).click()
const child = await until(() => spinoffs(profile, parent)[0], 10_000)
check('start: a spin-off under the session', !!child)
check('start: it keeps the edited context', child?.claudeCode.task.context?.endsWith('- Use vitest.'))
const input = await until(() => fakeLog(since).find(e => e.event === 'input' && e.sessionId === child?.id)?.content, 15_000)
check('start: its first message is the note with the context, then the prompt', /^<task_origin kind="spinoff" parent="/.test(input ?? '') && input.includes('<parent_context>\n- Bug: src/parser.ts') && input.includes('- Use vitest.\n</parent_context>') && input.trimEnd().endsWith(PROMPT_A), input?.slice(0, 160))
check('start: it opens the new session', await visible(page.getByRole('heading', { name: /Parser hunt.*Write a regression test/ }), 5000))
check('start: it runs in the parent\'s folder', fakeLog(since).find(e => e.event === 'spawn' && e.run === child?.id)?.cwd === session(profile, parent).claudeCode.cwd)
check('child: it completes', await until(() => session(profile, child.id)?.status === 'completed', 20_000))
const read = toolResults(home, child.id)[0]
check('child: ui_read_parent names the parent and no action', read && !read.is_error && /"title": "Parser hunt"/.test(resultText(read)) && /message box/.test(resultText(read)) && !/"action"/.test(resultText(read)), resultText(read ?? {}).slice(0, 160))
const shown = await page.evaluate(id => window.desktop.runs.get(id), child.id)
check('child: its chat starts at the prompt alone', shown.messages[0]?.parts[0]?.text === PROMPT_A)
check('child: the header says it came with context', await visible(page.getByText('sent from the message box · with context')))
const folded = page.getByRole('button', { name: /Context from “Parser hunt”/ })
check('child: the context shows folded', await visible(folded))
await folded.click()
check('child: unfolded, it shows the context', await visible(page.getByText('Use vitest.')))
await page.screenshot({ path: `${OUT}/spinoff-child.png` })
await nav(page).getByRole('button', { name: 'Expand Parser hunt', exact: true }).click().catch(() => {})
check('sidebar: listed under its session', await visible(nav(page).locator('[data-row="session"]').getByRole('button', { name: /^Write a regression test/ })))

// From the keyboard; the opt-in is remembered, and context with nothing in it is said so.
await nav(page).getByRole('button', { name: 'Parser hunt', exact: true }).click()
const PROMPT_B = `Bump the version. ${fake('steps', [['say', 'Bumped.']])}`
await composer.fill(PROMPT_B)
await composer.press('ControlOrMeta+Shift+Enter')
check('keyboard: ⌘⇧↵ opens it', await visible(dialog))
check('remembered: the opt-in stays on', await optIn.isChecked())
check('none: says it goes without context', await visible(dialog.getByText('Nothing in this conversation bears on the prompt'), 15_000))
await optIn.uncheck()
await dialog.getByRole('button', { name: 'Start session' }).click()
const second = await until(() => spinoffs(profile, parent)[1], 10_000)
const input2 = await until(() => fakeLog(since).find(e => e.event === 'input' && e.sessionId === second?.id)?.content, 15_000)
check('no context: the note alone, without parent_context', !second?.claudeCode.task.context && /^<task_origin kind="spinoff"/.test(input2 ?? '') && !input2.includes('<parent_context>') && input2.includes("You don't have that session's conversation"))
check('parent: it got no new message', prompts(home, parent).length === parentPrompts)

// Failed context can still start without it; closing while it is written stops the writer.
await nav(page).getByRole('button', { name: 'Parser hunt', exact: true }).click()
await composer.fill('Retry the build [fake-context:{"fail":"Overloaded"}]')
await button.click()
await optIn.check()
check('failed: the error shows', await visible(dialog.getByText('Overloaded'), 15_000))
check('failed: it offers to start without context', await visible(dialog.getByRole('button', { name: 'Start without context' })))
await page.keyboard.press('Escape')
await composer.fill('Slow one [fake-context:{"wait":15000,"text":"late"}]')
const slowSince = Date.now()
await button.click()
const slow = await until(() => fakeLog(slowSince).find(e => e.event === 'context-request'), 10_000)
check('writing: Start waits for the context', await visible(dialog.getByRole('button', { name: 'Writing context…' })) && await dialog.getByRole('button', { name: 'Writing context…' }).isDisabled())
await page.keyboard.press('Escape')
check('cancel: closing stops the writer', await until(() => fakeLog(slowSince).some(e => e.pid === slow?.pid && e.event === 'exit' && e.signal === 'SIGTERM'), 5000))

// A spin-off of a spin-off is a sub-task, which can't start more.
await nav(page).locator('[data-row="session"]').getByRole('button', { name: /^Bump the version/ }).click()
await composer.fill(`Tag it. ${fake('steps', [['say', 'Tagged.']])}`)
await button.click()
await optIn.uncheck()
await dialog.getByRole('button', { name: 'Start session' }).click()
const grandchild = await until(() => spinoffs(profile, second.id)[0], 10_000)
check('nested: a spin-off of a spin-off sits at depth 2', grandchild?.claudeCode.task.depth === 2)
await until(() => session(profile, grandchild.id)?.status === 'completed', 20_000)
await composer.fill('More')
check('nested: a sub-task can\'t send to a new session', await button.isDisabled())

await page.screenshot({ path: `${OUT}/spinoff.png` })
await app.close()
const failed = results.filter(ok => !ok).length
console.log(`${results.length - failed}/${results.length} passed`)
process.exitCode = failed ? 1 : 0
