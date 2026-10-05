import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleStopIcon,
  CircleXIcon,
  Clock3Icon,
  LoaderCircleIcon,
} from 'lucide-react'
import type { RunStatus } from '@/lib/desktop'
import { cn } from '@/lib/utils'

const STATUS = {
  queued: { Icon: Clock3Icon, label: 'Queued', className: '' },
  running: { Icon: LoaderCircleIcon, label: 'Running', className: 'animate-spin' },
  awaiting_approval: {
    Icon: CircleAlertIcon,
    label: 'Awaiting approval',
    className: 'text-amber-500',
  },
  completed: { Icon: CircleCheckIcon, label: 'Completed', className: '' },
  failed: { Icon: CircleXIcon, label: 'Failed', className: 'text-destructive' },
  stopped: { Icon: CircleStopIcon, label: 'Stopped', className: '' },
} satisfies Record<RunStatus, unknown>

export const runStatusLabel = (status: RunStatus) => STATUS[status].label

export function RunStatusIcon(props: { status: RunStatus; className?: string }) {
  const { Icon, className } = STATUS[props.status]
  return (
    <Icon
      aria-hidden
      className={cn(
        'size-3.5 shrink-0 text-muted-foreground',
        className,
        props.className,
      )}
    />
  )
}
