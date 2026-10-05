import type { PromptSuggestion, RunSummary } from './desktop'

// Digs suggest changes to an action's prompt; what the user accepts goes on top of the agent's.

export const SUGGEST_TOOL = 'ui_suggest_prompt_changes'
export const MAX_SUGGESTIONS = 10
export const MAX_SUGGESTION = 2_000
export const MAX_WHY = 300

export const suggestionsOf = (run: RunSummary | undefined, artifactId: string, actionId: string) =>
  (run?.claudeCode?.suggestions ?? []).filter(
    s => s.artifactId === artifactId && s.actionId === actionId,
  )

/** Made against an agent's prompt that has changed since. */
export const isStale = (s: PromptSuggestion, run: RunSummary | undefined) => {
  const bookmark = run?.artifacts
    ?.find(a => a.id === s.artifactId)
    ?.bookmarks?.find(b => b.id === s.actionId)
  return !!bookmark && bookmark.hash !== s.agentHash
}

/** Suggestions still waiting on the user, made against the prompt as it is. */
export const waiting = (suggestions: PromptSuggestion[], run: RunSummary | undefined) =>
  suggestions.filter(s => s.status === 'pending' && !isStale(s, run))

const occurrences = (text: string, find: string) => (find ? text.split(find).length - 1 : 0)

/**
 * The prompt a task gets: the agent's, with the accepted suggestions applied in the order they
 * came. A replace whose text is no longer there once is left out, and named in `unapplied`.
 */
export function effectivePrompt(
  agent: string,
  suggestions: PromptSuggestion[],
): { text: string; applied: PromptSuggestion[]; unapplied: PromptSuggestion[] } {
  let text = agent
  const applied: PromptSuggestion[] = []
  const unapplied: PromptSuggestion[] = []
  const accepted = suggestions
    .filter(s => s.status === 'accepted')
    .sort((a, b) => a.createdAt - b.createdAt)
  for (const s of accepted) {
    if (s.kind === 'append') {
      text = `${text.trimEnd()}\n\n${s.text.trim()}`
      applied.push(s)
    } else if (s.find && occurrences(text, s.find) === 1) {
      text = text.replace(s.find, () => s.text)
      applied.push(s)
    } else unapplied.push(s)
  }
  return { text, applied, unapplied }
}

/** Why a replace can't be accepted against `text` now, if it can't. */
export const replaceProblem = (text: string, find: string | undefined) => {
  const count = occurrences(text, find ?? '')
  return count === 1
    ? undefined
    : count === 0
      ? 'The text it replaces is no longer in the prompt.'
      : 'The text it replaces is in the prompt more than once.'
}
