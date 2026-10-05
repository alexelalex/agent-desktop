import type { Template } from '@/lib/templates'
import { readJson, writeJson } from './store'

// Agents are the saved templates; a step's targets say which tenants it runs on.
const FILE = 'agents.json'
let agents: Template[] | undefined
const all = () => (agents ??= readJson<Template[]>(FILE, []))

export function listAgents(): Template[] {
  return [...all()].sort((a, b) => a.name.localeCompare(b.name))
}

export function saveAgent(agent: Template) {
  agents = [agent, ...all().filter(a => a.id !== agent.id)]
  writeJson(FILE, agents)
}

export function deleteAgent(id: string) {
  agents = all().filter(a => a.id !== id)
  writeJson(FILE, agents)
}

/** Drops a deleted channel from every agent's notifications; returns whether any changed. */
export function removeChannelFromAgents(channelId: string): boolean {
  const uses = (agent: Template) =>
    agent.notifications?.some(n => n.channelIds.includes(channelId))
  if (!all().some(uses)) return false
  agents = all().map(agent => ({
    ...agent,
    notifications: agent.notifications
      ?.map(n => ({ ...n, channelIds: n.channelIds.filter(id => id !== channelId) }))
      .filter(n => n.channelIds.length > 0),
  }))
  writeJson(FILE, agents)
  return true
}
