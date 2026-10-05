import type { DynamicToolUIPart } from 'ai'
import { useEffect, useState } from 'react'
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from '@/components/ai-elements/confirmation'
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'
import { useShell } from '@/lib/plugins'
import { stampText, type Stamp } from '@/lib/routing'
import type { SpecOperation } from '@/lib/spec'

function ParamDocs(props: { input: unknown; params: Record<string, string> }) {
  const names = Object.keys(props.input ?? {}).filter(n => props.params[n])
  if (names.length === 0) return null
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      {names.map(name => (
        <div key={name} className="contents">
          <dt className="font-mono">{name}</dt>
          <dd className="text-muted-foreground">{props.params[name]}</dd>
        </div>
      ))}
    </dl>
  )
}

/** One catalog tool call, annotated with its operation from the OpenAPI spec. */
export function ToolCallCard(props: {
  part: DynamicToolUIPart
  operation?: SpecOperation
  onApprovalResponse: (id: string, approved: boolean) => void
  /** Offered in Claude Code sessions: turns on auto mode. */
  onApproveAll?: () => void
  /** False once the turn has ended, e.g. after Stop. */
  live: boolean
  /** The tenant and workspace a routed call ran on, or will run on. */
  stamp?: Stamp
}) {
  const { part, operation, onApprovalResponse, onApproveAll, live, stamp } = props
  const { blocked } = useShell()
  const approval = 'approval' in part ? part.approval : undefined
  const stopped =
    !live &&
    (part.state === 'input-streaming' || part.state === 'input-available')
  const errorText = stopped
    ? 'Stopped before this call finished.'
    : part.state === 'output-error'
      ? part.errorText
      : undefined
  const [open, setOpen] = useState(false)

  // Show the arguments whenever the user is asked to approve them.
  useEffect(() => {
    if (part.state === 'approval-requested') setOpen(true)
  }, [part.state])

  return (
    <div className="flex flex-col gap-2">
      <Tool open={open} onOpenChange={setOpen}>
        <ToolHeader
          type="dynamic-tool"
          state={stopped ? 'output-error' : part.state}
          toolName={part.toolName}
          title={
            operation ? `${operation.method} ${operation.path}` : part.toolName
          }
        />
        {stamp && (
          <p className="-mt-1 px-3 pb-2 text-xs text-muted-foreground">{stampText(stamp)}</p>
        )}
        <ToolContent>
          {operation?.summary && (
            <p className="text-sm text-muted-foreground">{operation.summary}</p>
          )}
          <ToolInput input={part.input} />
          {operation && (
            <ParamDocs input={part.input} params={operation.params} />
          )}
          <ToolOutput
            output={part.state === 'output-available' ? part.output : undefined}
            errorText={errorText}
          />
        </ToolContent>
      </Tool>

      <Confirmation approval={approval} state={part.state}>
        <ConfirmationTitle>
          <ConfirmationRequest>
            {approval?.requestReason ??
              (stamp
                ? `This call changes data in ${stampText(stamp)}. Run it?`
                : 'This call changes data in your workspace. Run it?')}
          </ConfirmationRequest>
          <ConfirmationAccepted>You approved this change.</ConfirmationAccepted>
          <ConfirmationRejected>You denied this change.</ConfirmationRejected>
        </ConfirmationTitle>
        <ConfirmationActions>
          <ConfirmationAction
            variant="outline"
            disabled={!!blocked}
            onClick={() => approval && onApprovalResponse(approval.id, false)}
          >
            Deny
          </ConfirmationAction>
          {onApproveAll && (
            <ConfirmationAction
              variant="outline"
              title="Approve this and every later request in this session without asking"
              onClick={onApproveAll}
            >
              Approve all
            </ConfirmationAction>
          )}
          <ConfirmationAction
            disabled={!!blocked}
            onClick={() => approval && onApprovalResponse(approval.id, true)}
          >
            Approve
          </ConfirmationAction>
        </ConfirmationActions>
      </Confirmation>
    </div>
  )
}
