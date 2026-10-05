import type { DynamicToolUIPart, UIMessage } from 'ai'
import { ChevronDownIcon, LoaderCircleIcon, WrenchIcon, XCircleIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const unfinished = (part: DynamicToolUIPart) =>
  part.state === 'input-streaming' || part.state === 'input-available'

/** "5× Read · 2× Bash", in the order each tool first ran. */
export function toolSummary(tools: DynamicToolUIPart[]): string {
  const counts = new Map<string, number>()
  for (const tool of tools) counts.set(tool.toolName, (counts.get(tool.toolName) ?? 0) + 1)
  return [...counts].map(([name, n]) => `${n}× ${name}`).join(' · ')
}

/** A run of tool calls and thinking between text, collapsed to a count per tool. */
export function ToolGroup(props: {
  parts: UIMessage['parts']
  /** False once the turn has ended, e.g. after Stop. */
  live: boolean
  children: ReactNode
}) {
  const { parts, live } = props
  const tools = parts.filter(part => part.type === 'dynamic-tool')
  const busy =
    live &&
    parts.some(
      part =>
        (part.type === 'dynamic-tool' && unfinished(part)) ||
        (part.type === 'reasoning' && part.state === 'streaming'),
    )
  const failed = tools.filter(
    tool => tool.state === 'output-error' || (!live && unfinished(tool)),
  ).length
  return (
    <Collapsible className="group/tools not-prose">
      <CollapsibleTrigger className="flex w-full items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        {busy ? (
          <LoaderCircleIcon className="size-4 shrink-0 animate-spin" />
        ) : (
          <WrenchIcon className="size-4 shrink-0" />
        )}
        <span className="truncate">{toolSummary(tools)}</span>
        {failed > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-destructive">
            <XCircleIcon className="size-3.5" />
            {failed} failed
          </span>
        )}
        <ChevronDownIcon className="size-4 shrink-0 transition-transform group-data-[state=open]/tools:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 flex flex-col gap-2">{props.children}</CollapsibleContent>
    </Collapsible>
  )
}
