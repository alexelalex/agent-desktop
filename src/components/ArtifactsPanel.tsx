import { ArrowLeftIcon, BellIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ArtifactBody, ArtifactIcon } from '@/components/ArtifactView'
import { DeliveryLine, NotifyDialog } from '@/components/NotifyDialog'
import { Button } from '@/components/ui/button'
import type { Artifact, ArtifactRef } from '@/lib/artifacts'
import { useChannels, useDeliveries } from '@/lib/store'
import type { Template } from '@/lib/templates'
import { cn } from '@/lib/utils'

/** A run's artifacts: beside the chat on wide screens, in its place on narrow ones. */
export function ArtifactsPanel(props: {
  runId: string
  refs: ArtifactRef[]
  selectedId: string
  /** Shown in the chat's place rather than beside it. */
  narrow?: boolean
  onSelect: (id: string) => void
  onClose: () => void
  /** The run's agent, which holds the artifacts' notifications. */
  agent?: Template
  onSaveAgent: (agent: Template) => void
  className?: string
}) {
  const { runId, refs, selectedId, narrow, onSelect, onClose, agent } = props
  const channels = useChannels()
  const deliveries = useDeliveries(runId)
  const [notifying, setNotifying] = useState(false)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  // Refetch whenever an artifact is added or gets a new revision.
  const version = refs.map(r => `${r.id}@${r.revision}`).join(',')
  useEffect(() => {
    let live = true
    void window.desktop.artifacts
      .list(runId)
      .then(list => live && setArtifacts(list))
    return () => {
      live = false
    }
  }, [runId, version])

  const selected =
    artifacts.find(a => a.id === selectedId) ?? artifacts.at(-1)
  const subscribed = selected
    ? (agent?.notifications?.find(n => n.artifactId === selected.id)?.channelIds
        .length ?? 0)
    : 0
  const sentNow = deliveries.filter(
    d => d.artifactId === selected?.id && d.revision === selected.revision,
  )

  return (
    <aside
      aria-label="Artifacts"
      className={cn('flex min-h-0 min-w-0 flex-col bg-background', props.className)}
    >
      <header className="flex h-11 shrink-0 items-center gap-2 border-b px-3">
        {narrow ? (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeftIcon /> Chat
          </Button>
        ) : (
          <>
            <h2 className="text-sm font-medium">Artifacts</h2>
            <Button
              size="icon-sm"
              variant="ghost"
              className="ml-auto"
              aria-label="Close artifacts"
              title="Close"
              onClick={onClose}
            >
              <XIcon />
            </Button>
          </>
        )}
      </header>
      {refs.length > 1 && (
        <nav
          aria-label="Artifact list"
          className="flex flex-wrap gap-1 border-b px-2 py-1.5"
        >
          {refs.map(ref => (
            <Button
              key={ref.id}
              size="sm"
              variant={ref.id === selected?.id ? 'secondary' : 'ghost'}
              onClick={() => onSelect(ref.id)}
            >
              <ArtifactIcon kind={ref.kind} />
              {ref.title}
            </Button>
          ))}
        </nav>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {selected ? (
          <article className="flex flex-col gap-4">
            <header className="flex items-center gap-2">
              <ArtifactIcon kind={selected.content.kind} className="size-4" />
              <h3 className="min-w-0 flex-1 truncate font-semibold">{selected.title}</h3>
              <span className="text-xs text-muted-foreground">
                revision {selected.revision}
              </span>
              <Button
                size="sm"
                variant="outline"
                title="Where this artifact is sent"
                onClick={() => setNotifying(true)}
              >
                <BellIcon />
                Notify{subscribed > 0 && ` · ${subscribed}`}
              </Button>
            </header>
            {sentNow.length > 0 && (
              <ul className="flex flex-col gap-1">
                {sentNow.map(delivery => (
                  <DeliveryLine key={delivery.id} delivery={delivery} />
                ))}
              </ul>
            )}
            <ArtifactBody artifact={selected} />
            {notifying && (
              <NotifyDialog
                onClose={() => setNotifying(false)}
                runId={runId}
                artifact={selected}
                agent={agent}
                channels={channels}
                deliveries={deliveries}
                onSaveAgent={props.onSaveAgent}
              />
            )}
          </article>
        ) : (
          <p className="text-sm text-muted-foreground">
            This run hasn't published an artifact.
          </p>
        )}
      </div>
    </aside>
  )
}
