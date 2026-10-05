import type { ChatStatus, UIMessage } from 'ai'
import { useEffect, useState } from 'react'
import type { OutgoingMessage, RunContext, RunPatch } from './desktop'

interface RunView {
  messages: UIMessage[]
  status: ChatStatus
  error?: Error
  running: boolean
  /** False until the main process has sent the run's current state. */
  loaded: boolean
}

function applyPatch(view: RunView, patch: RunPatch): RunView {
  const messages = view.messages.slice(0, patch.length)
  for (const [index, message] of patch.messages) messages[index] = message
  return {
    messages,
    status: patch.status,
    error: patch.error ? new Error(patch.error) : undefined,
    running: patch.running,
    loaded: true,
  }
}

/**
 * A run as `useChat` would show it. The main process drives the chat, so the
 * run goes on when the view closes, and a view can open a run already going.
 */
export function useRun(runId: string, context: RunContext) {
  const [view, setView] = useState<RunView>({
    messages: [],
    status: 'ready',
    running: false,
    loaded: false,
  })

  useEffect(() => {
    let live = true
    const unsubscribe = window.desktop.runs.onPatch(patch => {
      // The snapshot from `open` is newer than any patch before it.
      if (patch.runId === runId) {
        setView(v => (v.loaded ? applyPatch(v, patch) : v))
      }
    })
    void window.desktop.runs.open(runId).then(snapshot => {
      if (!live) return
      setView({
        messages: snapshot.messages,
        status: snapshot.status,
        error: snapshot.error ? new Error(snapshot.error) : undefined,
        running: snapshot.running,
        loaded: true,
      })
    })
    return () => {
      live = false
      unsubscribe()
      void window.desktop.runs.close(runId)
    }
  }, [runId])

  const { agentId } = context
  return {
    ...view,
    sendMessage: (message: OutgoingMessage) =>
      window.desktop.runs.send(runId, message, { agentId }),
    stop: () => window.desktop.runs.stop(runId),
    addToolApprovalResponse: ({
      id,
      approved,
      answers,
    }: {
      id: string
      approved: boolean
      answers?: Record<string, string>
    }) => window.desktop.runs.respond(runId, id, approved, answers),
  }
}
