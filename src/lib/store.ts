import { useEffect, useState } from 'react'
import type { ChannelInfo, Delivery } from './channels'
import type { RunSummary } from './desktop'
import type { Template } from './templates'

const byRecent = (a: RunSummary, b: RunSummary) => b.updatedAt - a.updatedAt

/** Every run, most recent first, kept current as they change. */
export function useRuns(): RunSummary[] {
  const [runs, setRuns] = useState<RunSummary[]>([])
  useEffect(() => {
    let live = true
    const offChange = window.desktop.runs.onChange(run => {
      if (run.readOnly) return
      setRuns(list => [run, ...list.filter(r => r.id !== run.id)].sort(byRecent))
    })
    const offDelete = window.desktop.runs.onDelete(id =>
      setRuns(list => list.filter(r => r.id !== id)),
    )
    void window.desktop.runs.list().then(list => live && setRuns(list))
    return () => {
      live = false
      offChange()
      offDelete()
    }
  }, [])
  return runs
}

/** Runs from before plugins, read-only. */
export function useEarlierRuns(): RunSummary[] {
  const [runs, setRuns] = useState<RunSummary[]>([])
  useEffect(() => {
    let live = true
    const offDelete = window.desktop.runs.onDelete(id =>
      setRuns(list => list.filter(r => r.id !== id)),
    )
    void window.desktop.runs.earlier().then(list => live && setRuns(list))
    return () => {
      live = false
      offDelete()
    }
  }, [])
  return runs
}

/** The saved templates. */
export function useAgents(): Template[] {
  const [agents, setAgents] = useState<Template[]>([])
  useEffect(() => {
    let live = true
    const load = () =>
      void window.desktop.agents.list().then(list => live && setAgents(list))
    load()
    const off = window.desktop.agents.onChange(load)
    return () => {
      live = false
      off()
    }
  }, [])
  return agents
}

/** Where artifacts can be sent. */
export function useChannels(): ChannelInfo[] {
  const [channels, setChannels] = useState<ChannelInfo[]>([])
  useEffect(() => {
    let live = true
    const load = () =>
      void window.desktop.channels.list().then(list => live && setChannels(list))
    load()
    const off = window.desktop.channels.onChange(load)
    return () => {
      live = false
      off()
    }
  }, [])
  return channels
}

/** What a run's artifacts were sent to, oldest first. */
export function useDeliveries(runId: string): Delivery[] {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  useEffect(() => {
    let live = true
    const load = () =>
      void window.desktop.deliveries
        .list(runId)
        .then(list => live && setDeliveries(list))
    load()
    const off = window.desktop.deliveries.onChange(changed => {
      if (changed === runId) load()
    })
    return () => {
      live = false
      off()
    }
  }, [runId])
  return deliveries
}

/** How many tasks wait for Resume since the app last closed. */
export function useQueue(): number {
  const [held, setHeld] = useState(0)
  useEffect(() => {
    let live = true
    const off = window.desktop.claudeCode.onQueue(queue => setHeld(queue.held))
    // The queue was read before any window existed, so it's asked for too.
    void window.desktop.claudeCode.queue().then(queue => live && setHeld(queue.held))
    return () => {
      live = false
      off()
    }
  }, [])
  return held
}
