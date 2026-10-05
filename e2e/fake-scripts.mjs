// What a fake `claude` turn does: a `[fake:<name> <json>]` marker anywhere in the prompt names
// a script and its argument. `steps` takes the steps themselves: [["say", "Done."], ...].
// A dig reads `[fake-dig:…]` instead, so an action's prompt scripts its task and its dig apart.
// A prompt without a marker just answers.

const SCRIPTS = {
  steps: list => list,
  // Renders an artifact, then answers.
  render: args => [['render', args], ['say', `Rendered ${args.title ?? args.id}.`]],
  // Works for a while, then answers: holds a queue slot.
  work: ({ ms = 1500, say = 'Done.' } = {}) => [['wait', ms], ['say', say]],
}

// One JSON value from `start`: brackets and braces matched, strings skipped.
function jsonAt(text, start) {
  let depth = 0
  let string = false
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (string) {
      if (c === '\\') i++
      else if (c === '"') string = false
    } else if (c === '"') string = true
    else if (c === '[' || c === '{') depth++
    else if (c === ']' || c === '}') {
      depth--
      if (depth === 0) return { value: JSON.parse(text.slice(start, i + 1)), end: i + 1 }
    }
  }
  throw new Error('Unclosed fake marker')
}

export function scriptOf(content) {
  const tag = /^\s*<task_origin kind="dig"/.test(content) ? '[fake-dig:' : '[fake:'
  // The app's notes quote titles, which may hold markers of their own.
  const prompt = content
    .replace(/^\s*<task_origin[\s\S]*?<\/task_origin>/, '')
    .replace(/<user_requested_regenerate>[\s\S]*?<\/user_requested_regenerate>/g, '')
  const at = prompt.indexOf(tag)
  if (at < 0) return [['say', 'OK.']]
  const name = prompt.slice(at + tag.length).match(/^[\w-]+/)?.[0]
  const script = SCRIPTS[name]
  if (!script) return [['fail', `Unknown fake script: ${name}`]]
  const rest = at + tag.length + name.length
  const open = prompt.slice(rest).search(/\S/)
  const arg = open >= 0 && /[[{]/.test(prompt[rest + open]) ? jsonAt(prompt, rest + open).value : undefined
  return script(arg)
}

/** A marker for a prompt: `fake('steps', [['say', 'Hi']])`. */
export const fake = (name, arg) => `[fake:${name} ${JSON.stringify(arg)}]`
/** What a dig into the prompt does. */
export const fakeDig = (name, arg) => `[fake-dig:${name} ${JSON.stringify(arg)}]`
