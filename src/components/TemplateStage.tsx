import type { UIMessage } from 'ai'
import {
  ListTodoIcon,
  MessageSquareTextIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'
import { Fragment, useId } from 'react'
import { TodoList } from '@/components/TodoPanel'
import { Button } from '@/components/ui/button'
import { useShell } from '@/lib/plugins'
import { Input } from '@/components/ui/input'
import type { SpecOperation } from '@/lib/spec'
import {
  fill,
  fillSteps,
  goalOf,
  planDrift,
  recordedPlan,
  templatePlanOf,
  variableNames,
  type Template,
} from '@/lib/templates'
import { cn } from '@/lib/utils'

export function TemplateIcon(props: {
  kind: Template['kind']
  className?: string
}) {
  const Icon = props.kind === 'plan' ? ListTodoIcon : MessageSquareTextIcon
  return (
    <Icon
      className={cn('size-4 shrink-0 text-muted-foreground', props.className)}
    />
  )
}

/** A template picked in the sidebar, pinned above the prompt input until it's sent. */
export function TemplateStage(props: {
  template: Template
  values: Record<string, string>
  onValuesChange: (values: Record<string, string>) => void
  operations?: Map<string, SpecOperation>
  /** Plan kind: sends the plan, to wait for /go or to run now. */
  onLoad: (run: boolean) => void
  onClose: () => void
}) {
  const { template, values, onValuesChange, operations, onLoad, onClose } =
    props
  const { blocked } = useShell()
  const id = useId()
  const names = variableNames(template)
  const missing = names.filter(name => !values[name]?.trim())

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-2 py-1 pr-1 pl-3 text-sm">
        <TemplateIcon kind={template.kind} />
        <span className="truncate font-medium">{template.name}</span>
        <span className="text-muted-foreground">template</span>
        <Button
          size="icon-sm"
          variant="ghost"
          className="ml-auto"
          aria-label="Close template"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
      <div className="flex max-h-80 flex-col gap-3 overflow-y-auto border-t px-3 py-3">
        {names.length > 0 ? (
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
            {names.map((name, i) => (
              <Fragment key={name}>
                <label
                  htmlFor={`${id}-${name}`}
                  className="font-mono text-xs text-muted-foreground"
                >
                  {name}
                </label>
                <Input
                  id={`${id}-${name}`}
                  autoFocus={i === 0}
                  value={values[name] ?? ''}
                  placeholder={template.examples[name] ?? name}
                  onChange={e =>
                    onValuesChange({ ...values, [name]: e.target.value })
                  }
                />
              </Fragment>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            This template has no variables.
          </p>
        )}
        {template.kind === 'plan' && template.steps && (
          <>
            <p className="text-sm">
              <span className="text-muted-foreground">Goal: </span>
              {goalOf(fill(template.prompt, values))}
            </p>
            <TodoList
              steps={fillSteps(template.steps, values)}
              operations={operations}
              live={false}
            />
          </>
        )}
      </div>
      {template.kind === 'plan' && (
        <div className="flex items-center gap-2 border-t px-3 py-2">
          <span className="min-w-0 flex-1 text-xs text-muted-foreground">
            {missing.length > 0
              ? `Fill in ${missing.join(', ')}.`
              : 'The assistant records this plan, then waits for /go or runs it.'}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={missing.length > 0 || !!blocked}
            onClick={() => onLoad(false)}
          >
            Load plan
          </Button>
          <Button
            size="sm"
            disabled={missing.length > 0 || !!blocked}
            onClick={() => onLoad(true)}
          >
            Run
          </Button>
        </div>
      )}
    </div>
  )
}

/** Heads a user message that loaded a plan template; nothing for other messages. */
export function TemplateNote(props: {
  messages: UIMessage[]
  index: number
  /** A turn is streaming. */
  live: boolean
}) {
  const { messages, index, live } = props
  const template = templatePlanOf(messages[index])
  if (!template) return null
  const recorded = recordedPlan(messages, index)
  const settled =
    !live || messages.slice(index + 1).some(m => m.role === 'user')
  const drift = recorded ? planDrift(template.steps, recorded) : []
  const problem = recorded
    ? drift.length > 0 && 'The assistant recorded a different plan:'
    : settled && "The assistant didn't record this plan."

  return (
    <div className="space-y-1 text-xs text-muted-foreground">
      <p className="flex items-center gap-1">
        <ListTodoIcon className="size-3.5" />
        {template.name} · {template.run ? 'run' : 'load'} plan
      </p>
      {problem && (
        <div className="text-yellow-600">
          <p className="flex items-center gap-1">
            <TriangleAlertIcon className="size-3.5" />
            {problem}
          </p>
          <ul className="list-disc pl-5">
            {drift.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
