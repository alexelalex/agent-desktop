// Reply suggestions: the rail above the composer, and the suggester process behind it.
import { mkdtempSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fake } from '../fake-scripts.mjs'
import { fakeLog, launchWithClaudeCode, sessions, startSession, until } from '../claude-code.mjs'
import { OUT } from '../app.mjs'

const results = []
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`) }
const visible = (locator, timeout = 10_000) => locator.first().waitFor({ timeout }).then(() => true, () => false)
const rail = page => page.getByRole('group', { name: 'Suggested replies' })
const chip = (page, name) => rail(page).getByRole('button', { name, exact: true })
const box = page => page.locator('textarea:enabled').first()
// The agent's turn says `text`; the suggester follows `plan` for it.
const says = (text, plan) => fake('steps', [['say', `${text} [fake-suggest:${JSON.stringify(plan)}]`]])
const requests = (since, type = 'suggest') => fakeLog(since).filter(e => e.event === 'suggester-request' && e.request.type === type).map(e => e.request)
const calls = since => fakeLog(since).filter(e => e.event === 'suggester-call')
const spawns = since => fakeLog(since).filter(e => e.event === 'spawn' && e.argv.includes('--system-prompt'))
const setup = profile => JSON.parse(readFileSync(`${profile}/suggester.json`, 'utf8'))
const send = async (page, text) => {
  await box(page).fill(text)
  await box(page).press('Enter')
}

const profile = mkdtempSync(path.join(OUT, 'profile-'))
writeFileSync(`${profile}/suggester.json`, JSON.stringify({ enabled: true }))
const start = Date.now()
const { app, page } = await launchWithClaudeCode({ profile })

// A new chat: openers from the suggester, in place of fixed examples.
await page.getByRole('button', { name: 'New session', exact: true }).click()
check('start: a new chat gets openers', await visible(chip(page, 'Go on'), 20_000))
const opener = requests(start, 'start')[0]
check('start: the request holds recent sessions and tenants, no conversation', Array.isArray(opener?.recent) && Array.isArray(opener?.tenants) && opener.conversation === undefined, JSON.stringify(opener))
await box(page).press('Tab')
check('start: Tab takes the opener', (await box(page).inputValue()) === 'go on')
await box(page).fill('')

// A turn that asks something: the rail shows what the suggester sent.
const run = await startSession(page, profile, `Check the buckets. ${says('Should I block it or ticket it?', [['suggest', { replies: [
  { label: 'Block it now', text: 'block public access on acme-backups now', kind: 'answer' },
  { label: 'Ticket it first', text: 'open a ticket first', kind: 'answer' },
  { label: 'Check reads first', text: 'list who read it in the last 30 days', kind: 'redirect', blank: '30 days' },
] }]])}`)
check('rail: shows the suggested replies', await visible(chip(page, 'Block it now'), 20_000))
check('rail: a chip per reply', (await rail(page).getByRole('button').count()) === 4)
const meter = (await page.getByLabel('Token usage').textContent().catch(() => '')) ?? ''
check('usage: the composer shows the session\'s context tokens', /^[\d.,]+K? context$/.test(meter), meter)

const [spawn] = spawns(start)
const argv = spawn?.argv ?? []
const after = name => argv[argv.indexOf(name) + 1]
check('suggester: no built-in tools, user settings or other MCP servers', after('--tools') === '' && after('--setting-sources') === '' && argv.includes('--strict-mcp-config'), argv.join(' ').slice(0, 300))
check('suggester: thinking off', JSON.parse(after('--settings') ?? '{}').alwaysThinkingEnabled === false)
check('suggester: the default model', after('--model') === 'claude-sonnet-5-5')
const allowed = argv.slice(argv.indexOf('--allowedTools') + 1, argv.indexOf('--allowedTools') + 4)
check('suggester: only its own tools are allowed', allowed.join(',') === 'mcp__desktop__ui_suggest_replies,mcp__desktop__ui_read_conversation,mcp__desktop__ui_set_reply_notes', allowed.join(','))
check('suggester: runs in its own folder', spawn?.cwd === path.join(profile, 'suggester'), spawn?.cwd)
const tools = fakeLog(start).find(e => e.event === 'suggester-tools')?.names ?? []
check('suggester: its connection lists its tools and nothing else', [...tools].sort().join(',') === 'ui_read_conversation,ui_set_reply_notes,ui_suggest_replies', tools.join(','))
check('suggester: not listed as a session', !sessions(profile).some(s => s.id === spawn?.sessionId))
const [first] = requests(start)
check('request: names the run and holds its conversation', first?.run_id === run && /Should I block it/.test(first?.conversation ?? ''))
check('request: a Claude Code session, not a task', first?.session?.engine === 'claude-code' && first?.session?.task === false)

// Picking fills the composer; nothing is sent.
await chip(page, 'Check reads first').click()
const filled = await box(page).evaluate(el => ({ value: el.value, selected: el.value.slice(el.selectionStart, el.selectionEnd), focused: document.activeElement === el }))
check('fill: a click puts the text in the composer', filled.value === 'list who read it in the last 30 days', filled.value)
check('fill: the blank arrives selected, the composer focused', filled.selected === '30 days' && filled.focused, JSON.stringify(filled))
check('rail: hidden while the composer has text', !(await rail(page).isVisible()))
await box(page).fill('')
check('rail: back once the composer is empty', await visible(rail(page), 3000))
await box(page).press('Tab')
check('keyboard: Tab takes the first reply', (await box(page).inputValue()) === 'block public access on acme-backups now')
await box(page).fill('')
await box(page).press('Alt+2')
check('keyboard: ⌥2 takes the second', (await box(page).inputValue()) === 'open a ticket first')

// Sending an edited pick: its feedback rides with the next request, after a /clear.
const second = Date.now()
await box(page).press('End')
await box(page).pressSequentially(', today')
await box(page).press('Enter')
check('rail: the next turn gets its own replies', await visible(chip(page, 'Go on'), 20_000))
const feedback = requests(second)[0]?.feedback?.[0]
check('feedback: which reply was picked, and the edited text', feedback?.picked === 2 && feedback.edited === true && feedback.sent === 'open a ticket first, today', JSON.stringify(feedback))
const inputs = fakeLog(second).filter(e => e.event === 'input' && e.sessionId === spawn?.sessionId).map(e => e.content)
check('requests: a later one starts with /clear', inputs[0] === '/clear' && inputs[1]?.startsWith('{'), JSON.stringify(inputs.map(c => c.slice(0, 12))))
check('suggester: one process serves both turns', spawns(start).length === 1)

// Validation: a reply that would run as a command is refused, and fixed in the same turn.
const third = Date.now()
await send(page, `Go. ${says('Approve the change?', [
  ['read', { max_chars: 50 }],
  ['suggest', { replies: [{ label: 'Approve', text: '/approve', kind: 'answer' }] }],
  ['suggest', { replies: [{ label: 'Approve it', text: 'approve it', kind: 'answer' }] }],
  ['notes', ['Short lowercase replies']],
])}`)
check('rail: the corrected reply shows', await visible(chip(page, 'Approve it'), 20_000))
const refused = calls(third).find(c => c.input?.replies?.[0]?.text === '/approve')?.result
check('validation: a "/" reply is refused, saying why', refused?.isError === true && /can't start with "\/"/.test(refused.text), refused?.text)
check('read: its own request\'s run can be read', calls(third).find(c => c.tool === 'ui_read_conversation')?.result?.isError === false)
check('notes: saved for every later request', setup(profile).notes?.[0] === 'Short lowercase replies', JSON.stringify(setup(profile)))
await rail(page).getByRole('button', { name: 'Hide suggestions for this turn' }).click()
check('dismiss: hides the rail for this turn', !(await rail(page).isVisible()))

// A reply for a turn that moved on is dropped, and the next turn still gets its own.
const fourth = Date.now()
await send(page, `More. ${says('Step one done.', [['wait', 2500], ['suggest', { replies: [{ label: 'Late reply', text: 'late', kind: 'next' }] }]])}`)
await until(() => requests(fourth).length > 0, 20_000)
check('notes: the next request carries them', requests(fourth)[0]?.notes?.[0] === 'Short lowercase replies')
await send(page, `And again. ${fake('steps', [['say', 'Second.']])}`)
const late = await until(() => calls(fourth).find(c => c.input?.replies?.[0]?.label === 'Late reply'), 20_000)
check('stale: a reply for a turn that moved on is dropped', late?.result?.text === 'Dropped: that session has moved on.', late?.result?.text)
check('stale: the queued turn is served next', await visible(chip(page, 'Go on'), 20_000))
check('stale: the dropped reply never shows', !(await chip(page, 'Late reply').isVisible()))

// No replies: no rail.
const fifth = Date.now()
await send(page, `Finish. ${says('All done.', [['suggest', { replies: [], none_reason: 'nothing-to-answer' }]])}`)
await until(() => calls(fifth).some(c => c.tool === 'ui_suggest_replies'), 20_000)
await page.waitForTimeout(500)
check('none: no rail when it suggests nothing', !(await rail(page).isVisible()))

// Options: what it learned, the model, and off.
await page.getByRole('button', { name: 'Options', exact: true }).click()
const dialog = page.getByRole('dialog', { name: 'Options' })
await dialog.getByRole('tab', { name: 'Replies' }).click()
check('options: shows what it learned', await visible(dialog.getByText('Short lowercase replies'), 5000))
await dialog.getByRole('button', { name: 'Forget: Short lowercase replies' }).click()
check('options: forgetting a note saves it', await until(() => setup(profile).notes?.length === 0, 5000))
await dialog.getByRole('combobox', { name: 'Model' }).click()
await page.getByRole('option', { name: 'Haiku 4.5 (faster)' }).click()
check('options: a new model ends the running process', await until(() => fakeLog(start).some(e => e.event === 'exit' && e.pid === spawn?.pid), 5000))
await page.keyboard.press('Escape')
const sixth = Date.now()
await send(page, `Next. ${says('Which one?', [['suggest', { replies: [{ label: 'The first', text: 'the first', kind: 'answer' }] }]])}`)
check('model: the next turn starts a process on it', await visible(chip(page, 'The first'), 20_000) && spawns(sixth)[0]?.argv.includes('claude-haiku-4-5-20251001'))

await page.getByRole('button', { name: 'Options', exact: true }).click()
await dialog.getByRole('tab', { name: 'Replies' }).click()
await dialog.getByLabel('Suggest replies').uncheck()
check('options: off is saved', await until(() => setup(profile).enabled === false, 5000))
await page.keyboard.press('Escape')
const seventh = Date.now()
await send(page, `Last. ${says('Anything else?', [['suggest', { replies: [{ label: 'Nope', text: 'nope', kind: 'next' }] }]])}`)
await until(() => fakeLog(seventh).some(e => e.event === 'result' && e.sessionId === run), 20_000)
await page.waitForTimeout(1000)
check('off: no request goes out', requests(seventh).length === 0)
check('off: no rail', !(await rail(page).isVisible()))

// A session whose folder is gone: no suggestions, and a reply says why it can't run.
await page.evaluate(() => window.desktop.suggester.save({ enabled: true }))
const folder = sessions(profile).find(s => s.id === run)?.claudeCode?.cwd
renameSync(folder, `${folder}-moved`)
const gone = await page.evaluate(async id => {
  const last = (await window.desktop.runs.get(id)).messages.at(-1)
  return window.desktop.replies.request(id, `${last.id}#${last.parts.length}`)
}, run)
check('gone: no suggestions for a session whose folder is gone', gone === undefined, JSON.stringify(gone))
// Its process from the last turn would take the reply; an idle one ends the same way.
const live = fakeLog(start).filter(e => e.event === 'spawn' && e.sessionId === run).at(-1)
await page.evaluate(id => window.desktop.runs.stop(id), run)
await until(() => fakeLog(start).some(e => e.event === 'exit' && e.pid === live?.pid), 10_000)
const eighth = Date.now()
await send(page, 'Still there?')
const notice = await until(() => /no longer exists/.test(sessions(profile).find(s => s.id === run)?.notice ?? '') && sessions(profile).find(s => s.id === run).notice, 10_000)
check('gone: a reply says the folder is gone', notice === `This session's folder no longer exists: ${folder}`, notice)
check('gone: nothing is spawned for it', !fakeLog(eighth).some(e => e.event === 'spawn' && e.sessionId === run))
renameSync(`${folder}-moved`, folder)

// Openers know the sessions so far.
const ninth = Date.now()
await page.getByRole('button', { name: 'New session', exact: true }).click()
await until(() => requests(ninth, 'start').length > 0, 20_000)
const recent = requests(ninth, 'start')[0]?.recent ?? []
check('start: recent sessions go by title', recent.some(r => r.title.startsWith('Check the buckets.') && r.engine === 'claude-code'), JSON.stringify(recent).slice(0, 300))

await app.close()
const failed = results.filter(ok => !ok).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
