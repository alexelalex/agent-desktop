import { LayoutDashboardIcon, MailIcon } from 'lucide-react'
import { MessageResponse } from '@/components/ai-elements/message'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type {
  Artifact,
  ArtifactComponent,
  ArtifactContent,
  BadgeVariant,
} from '@/lib/artifacts'
import { cn } from '@/lib/utils'

export function ArtifactIcon(props: {
  kind: ArtifactContent['kind']
  className?: string
}) {
  const Icon = props.kind === 'message' ? MailIcon : LayoutDashboardIcon
  return (
    <Icon
      aria-hidden
      className={cn('size-3.5 shrink-0 text-muted-foreground', props.className)}
    />
  )
}

const ALIGN = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}

// The theme has no success or warning badge; these match its destructive one.
const BADGE_CLASSES: Partial<Record<BadgeVariant, string>> = {
  success: 'bg-green-600/10 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  warning: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  muted: 'bg-muted text-muted-foreground',
}

function ArtifactBadge(props: { text: string; variant?: BadgeVariant }) {
  const variant = props.variant ?? 'default'
  const custom = BADGE_CLASSES[variant]
  return (
    <Badge
      variant={custom ? 'outline' : (variant as 'default')}
      className={cn('w-fit border-transparent', custom)}
    >
      {props.text}
    </Badge>
  )
}

const TYPOGRAPHY = {
  H1: 'text-xl font-semibold',
  H2: 'text-lg font-semibold',
  H3: 'text-base font-semibold',
  P: 'text-sm leading-relaxed whitespace-pre-wrap',
}

/** A view artifact's component tree. Every value renders as text. */
export function ArtifactComponentView({ node }: { node: ArtifactComponent }) {
  switch (node.type) {
    case 'layout':
      return (
        <div
          className={cn(
            'flex min-w-0 gap-3',
            node.direction === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
            ALIGN[node.align ?? 'stretch'],
          )}
        >
          {node.components.map((child, i) => (
            <ArtifactComponentView key={i} node={child} />
          ))}
        </div>
      )
    case 'card':
      return (
        <section className="flex min-w-0 flex-1 flex-col gap-3 rounded-lg border bg-card p-4">
          <h4 className="text-sm font-semibold">{node.title}</h4>
          <ArtifactComponentView node={node.content} />
        </section>
      )
    case 'typography': {
      const size = node.size ?? 'P'
      const Tag = size === 'P' ? 'p' : size === 'H1' ? 'h2' : size === 'H2' ? 'h3' : 'h4'
      return <Tag className={TYPOGRAPHY[size]}>{node.content}</Tag>
    }
    case 'badge':
      return <ArtifactBadge text={node.text} variant={node.variant} />
    case 'alert':
      return (
        <Alert
          variant={node.variant === 'destructive' ? 'destructive' : 'default'}
          className={cn(
            node.variant === 'warning' && 'border-amber-500/40 text-amber-700 dark:text-amber-400',
          )}
        >
          {node.title && <AlertTitle>{node.title}</AlertTitle>}
          <AlertDescription className="whitespace-pre-wrap">{node.body}</AlertDescription>
        </Alert>
      )
    case 'table':
      return (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b">
                {node.columns.map((column, i) => (
                  <th key={i} className="px-3 py-2 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {node.rows.map((row, r) => (
                <tr key={r} className="border-b last:border-0">
                  {node.columns.map((_, c) => (
                    <td key={c} className="px-3 py-2 align-top">
                      {row[c] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'separator':
      return <Separator orientation={node.orientation ?? 'horizontal'} />
    case 'kbd':
      return (
        <kbd className="w-fit rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
          {node.keys}
        </kbd>
      )
    case 'progress':
      return (
        <div
          role="progressbar"
          aria-valuenow={node.value}
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, Math.max(0, node.value))}%` }}
          />
        </div>
      )
    case 'metric':
      return (
        <div className="flex min-w-36 flex-1 flex-col gap-1 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{node.label}</span>
            {node.badge && <ArtifactBadge {...node.badge} />}
          </div>
          <div className="text-2xl font-semibold">{node.value}</div>
          {node.caption && (
            <div className="text-xs text-muted-foreground">{node.caption}</div>
          )}
        </div>
      )
  }
}

export function ArtifactBody({ artifact }: { artifact: Artifact }) {
  const { content } = artifact
  if (content.kind === 'view') return <ArtifactComponentView node={content.view} />
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs text-muted-foreground">Subject</p>
        <h3 className="font-semibold">{content.subject}</h3>
      </div>
      <Separator />
      <MessageResponse>{content.body}</MessageResponse>
    </div>
  )
}
