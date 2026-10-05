import type { Artifact } from '@/lib/artifacts'
import { readJson, removeFile, writeJson } from './store'

// Each run's artifacts in one file, latest revision of each.
const fileOf = (runId: string) => `artifacts/${runId}.json`
const cache = new Map<string, Artifact[]>()
const listeners = new Set<(runId: string, artifacts: Artifact[]) => void>()

export function listArtifacts(runId: string): Artifact[] {
  let artifacts = cache.get(runId)
  if (!artifacts) {
    artifacts = readJson<Artifact[]>(fileOf(runId), [])
    cache.set(runId, artifacts)
  }
  return artifacts
}

export function saveArtifact(artifact: Artifact) {
  const current = listArtifacts(artifact.runId)
  const index = current.findIndex(a => a.id === artifact.id)
  // A replaced artifact keeps its place.
  const artifacts =
    index >= 0 ? current.with(index, artifact) : [...current, artifact]
  cache.set(artifact.runId, artifacts)
  writeJson(fileOf(artifact.runId), artifacts)
  listeners.forEach(listener => listener(artifact.runId, artifacts))
}

export function deleteArtifacts(runId: string) {
  cache.delete(runId)
  removeFile(fileOf(runId))
}

export function onArtifactsChange(
  listener: (runId: string, artifacts: Artifact[]) => void,
) {
  listeners.add(listener)
}
