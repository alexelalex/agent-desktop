import { XIcon } from 'lucide-react'
import { useState } from 'react'
import { TemplateIcon } from '@/components/TemplateStage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  makeVariable,
  suggestVariables,
  VARIABLE_NAME,
  variableNames,
  type Template,
} from '@/lib/templates'
import { useShell } from '@/lib/plugins'

/** Creates or edits a template; open while `template` is set. */
export function TemplateDialog(props: {
  template?: Template
  onSave: (template: Template) => void
  onClose: () => void
}) {
  const { template, onSave, onClose } = props
  return (
    <Dialog open={!!template} onOpenChange={open => !open && onClose()}>
      {template && (
        <DialogContent className="sm:max-w-2xl">
          <TemplateEditor
            key={template.id}
            template={template}
            onSave={onSave}
          />
        </DialogContent>
      )}
    </Dialog>
  )
}

const label = 'text-xs font-medium text-muted-foreground'

function TemplateEditor(props: {
  template: Template
  onSave: (template: Template) => void
}) {
  const { template, onSave } = props
  const canPlan = !!template.steps?.length
  // Steps stay in the draft while it's a prompt, so switching back keeps them.
  const [draft, setDraft] = useState(template)
  const [selection, setSelection] = useState('')
  const [pending, setPending] = useState<string>()
  const [name, setName] = useState('')

  const isPlan = draft.kind === 'plan'
  const effective = isPlan ? draft : { ...draft, steps: undefined }
  const names = variableNames(effective)
  const suggestions = suggestVariables(effective)

  const addVariable = () => {
    if (!pending) return
    setDraft(d => ({
      ...makeVariable(d, pending, name),
      examples: { ...d.examples, [name]: pending },
    }))
    setPending(undefined)
    setName('')
    setSelection('')
  }

  const setTargets = (id: string, targets: string[]) =>
    setDraft(d => ({
      ...d,
      steps: d.steps?.map(s => (s.id === id ? { ...s, targets } : s)),
    }))
  const removeStep = (id: string) =>
    setDraft(d => ({
      ...d,
      steps: d.steps
        ?.filter(s => s.id !== id)
        .map(s => ({
          ...s,
          dependsOn: s.dependsOn?.filter(dep => dep !== id),
        })),
    }))

  const save = () =>
    onSave({
      ...effective,
      name: draft.name.trim(),
      prompt: draft.prompt.trim(),
      examples: Object.fromEntries(
        Object.entries(draft.examples).filter(([n]) => names.includes(n)),
      ),
    })

  const valid =
    draft.name.trim() !== '' &&
    draft.prompt.trim() !== '' &&
    (!isPlan || !!draft.steps?.length)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Template</DialogTitle>
      </DialogHeader>

      <div className="-mx-4 flex max-h-[65vh] flex-col gap-4 overflow-y-auto px-4">
        <div className="flex items-end gap-2">
          <label className="flex flex-1 flex-col gap-1">
            <span className={label}>Name</span>
            <Input
              value={draft.name}
              onChange={e => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          {canPlan && (
            <ButtonGroup>
              {(['prompt', 'plan'] as const).map(kind => (
                <Button
                  key={kind}
                  variant={draft.kind === kind ? 'default' : 'outline'}
                  aria-pressed={draft.kind === kind}
                  onClick={() => setDraft({ ...draft, kind })}
                >
                  <TemplateIcon kind={kind} />
                  {kind === 'plan' ? 'Plan' : 'Prompt'}
                </Button>
              ))}
            </ButtonGroup>
          )}
        </div>

        <label className="flex flex-col gap-1">
          <span className={label}>Prompt</span>
          <Textarea
            value={draft.prompt}
            onChange={e => setDraft({ ...draft, prompt: e.target.value })}
            onSelect={e => {
              const el = e.currentTarget
              setSelection(
                el.value.slice(el.selectionStart, el.selectionEnd).trim(),
              )
            }}
          />
        </label>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className={label}>Variables</span>
            <Button
              size="xs"
              variant="outline"
              className="ml-auto"
              disabled={!selection}
              onClick={() => setPending(selection)}
            >
              Make variable from selection
            </Button>
          </div>
          {pending !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <span className="min-w-0 truncate">
                Replace <q className="font-mono">{pending}</q> with
              </span>
              <Input
                autoFocus
                className="w-40 font-mono"
                placeholder="name"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && VARIABLE_NAME.test(name))
                    addVariable()
                }}
              />
              <Button
                size="sm"
                disabled={!VARIABLE_NAME.test(name)}
                onClick={addVariable}
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPending(undefined)}
              >
                Cancel
              </Button>
            </div>
          )}
          {names.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {names.map(n => (
                <Badge key={n} variant="secondary" className="font-mono">
                  {`{{${n}}}`}
                  {draft.examples[n] && (
                    <span className="text-muted-foreground">
                      = {draft.examples[n]}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Select a value in the prompt, or type <code>{'{{name}}'}</code>{' '}
              where it should go.
            </p>
          )}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-xs text-muted-foreground">Suggested:</span>
              {suggestions.map(value => (
                <Badge
                  key={value}
                  variant="outline"
                  className="font-mono"
                  asChild
                >
                  <button type="button" onClick={() => setPending(value)}>
                    {value}
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {isPlan && (
          <div className="flex flex-col gap-2">
            <span className={label}>Plan</span>
            <ol className="flex flex-col gap-1">
              {draft.steps?.map(step => (
                <li key={step.id} className="flex items-center gap-1">
                  <Input
                    value={step.title}
                    onChange={e =>
                      setDraft({
                        ...draft,
                        steps: draft.steps?.map(s =>
                          s.id === step.id
                            ? { ...s, title: e.target.value }
                            : s,
                        ),
                      })
                    }
                  />
                  {step.assignee === 'subagent' && (
                    <Badge variant="secondary">subagent</Badge>
                  )}
                  {step.targets?.map(target => (
                    <Badge key={target} variant="outline" className="gap-1 font-mono">
                      {target}
                      <button
                        aria-label={`Remove target ${target}`}
                        onClick={() => setTargets(step.id, (step.targets ?? []).filter(t => t !== target))}
                      >
                        <XIcon className="size-3" />
                      </button>
                    </Badge>
                  ))}
                  {step.targets && (
                    <TargetPicker
                      taken={step.targets}
                      onPick={target => setTargets(step.id, [...(step.targets ?? []), target])}
                    />
                  )}
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Remove step"
                    onClick={() => removeStep(step.id)}
                  >
                    <XIcon />
                  </Button>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <DialogFooter showCloseButton>
        <Button disabled={!valid} onClick={save}>
          Save template
        </Button>
      </DialogFooter>
    </>
  )
}

/** Adds a plugin or group to a step's targets. */
function TargetPicker(props: { taken: string[]; onPick: (target: string) => void }) {
  const { mentionables } = useShell()
  const options = mentionables.filter(m => !props.taken.includes(m.id))
  if (options.length === 0) return null
  return (
    <Select value="" onValueChange={props.onPick}>
      <SelectTrigger size="sm" className="w-28" aria-label="Add target">
        <SelectValue placeholder="+ target" />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.id} value={option.id}>
            {option.kind === 'group' ? option.id : option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
