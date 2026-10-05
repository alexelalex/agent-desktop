import type { ChatStatus } from 'ai'
import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react'
import {
  PromptInput,
  PromptInputBody,
  PromptInputCommand,
  PromptInputCommandItem,
  PromptInputCommandList,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputController,
} from '@/components/ai-elements/prompt-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { parseCommand, type SlashCommand } from '@/lib/commands'
import type { Mentionable } from '@/lib/mentions'

interface ComposerProps {
  /** The commands that can run now. */
  commands: SlashCommand[]
  /** Returns why the text wasn't sent, if it wasn't. */
  onSubmit: (text: string) => string | undefined
  /** While true, only `commands` can be submitted. */
  locked: boolean
  /** Nothing can be typed or sent, e.g. while the orchestrator is signed out. */
  disabled?: boolean
  placeholder: string
  status: ChatStatus
  onStop: () => void
  /** Replaces the input's text each time a new object is passed. */
  draft?: { text: string }
  /** The user typed in the input. */
  onEdit?: () => void
  /** Shown left of the submit button. */
  tools?: ReactNode
  /** What `@` offers: plugins and groups. */
  mentionables?: Mentionable[]
}

/** The prompt input, with a slash command menu. */
export function Composer(props: ComposerProps) {
  return (
    <PromptInputProvider>
      <ComposerInput {...props} />
    </PromptInputProvider>
  )
}

function ComposerInput(props: ComposerProps) {
  const {
    commands,
    onSubmit,
    locked,
    placeholder,
    status,
    onStop,
    draft,
    onEdit,
    disabled,
  } = props
  const { textInput } = usePromptInputController()
  const text = textInput.value
  const [notice, setNotice] = useState<string>()
  const [selected, setSelected] = useState('')
  const [dismissedAt, setDismissedAt] = useState<string>()

  const { setInput } = textInput
  useEffect(() => {
    if (!draft) return
    setInput(draft.text)
    setNotice(undefined)
  }, [draft, setInput])

  // The menu is open while the text is a bare `/name` that matches a command,
  // or ends in an `@name` that matches a plugin or group.
  const query = /^\/(\S*)$/.exec(text)?.[1]?.toLowerCase()
  const mention = /(?:^|\s)@([\w-]*)$/.exec(text)?.[1]?.toLowerCase()
  const mentionable = (props.mentionables ?? []).map(m => ({
    ...m,
    name: m.id.replace(/^@/, '').toLowerCase(),
  }))
  // A mention typed in full needs no menu, so Enter sends.
  const mentionMatches =
    mention === undefined || mentionable.some(m => m.name === mention)
      ? []
      : mentionable.filter(m => m.name.startsWith(mention))
  const matches: SlashCommand[] =
    mentionMatches.length > 0
      ? mentionMatches.map(m => ({
          name: m.kind === 'group' ? m.id.slice(1) : m.id,
          description: m.kind === 'group' ? 'Group' : m.label,
        }))
      : query === undefined
        ? []
        : commands.filter(c => c.name.startsWith(query))
  const mentioning = mentionMatches.length > 0
  const active = matches.find(c => c.name === selected) ?? matches[0]
  const open = matches.length > 0 && dismissedAt !== text

  const parsed = parseCommand(text)
  const allowed =
    !disabled &&
    (!locked || (parsed !== undefined && commands.includes(parsed.command)))

  const submit = (line: string) => {
    const problem = onSubmit(line)
    setNotice(problem)
    return problem
  }

  const pick = (command: SlashCommand) => {
    if (mentioning) {
      return textInput.setInput(text.replace(/@[\w-]*$/, `@${command.name} `))
    }
    if (command.args) return textInput.setInput(`/${command.name} `)
    textInput.clear()
    submit(`/${command.name}`)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open || e.nativeEvent.isComposing) return
    const index = matches.indexOf(active)
    switch (e.key) {
      case 'ArrowDown':
        setSelected(matches[(index + 1) % matches.length].name)
        break
      case 'ArrowUp':
        setSelected(matches[(index - 1 + matches.length) % matches.length].name)
        break
      case 'Tab':
      case 'Enter':
        if (e.shiftKey) return
        pick(active)
        break
      case 'Escape':
        setDismissedAt(text)
        break
      default:
        return
    }
    e.preventDefault()
  }

  return (
    <div className="flex flex-col gap-2">
      {notice && (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      <div className="relative">
        {open && (
          <div className="absolute inset-x-0 bottom-full z-10 mb-2">
            <PromptInputCommand
              value={active.name}
              onValueChange={setSelected}
              shouldFilter={false}
              className="rounded-md border shadow-md"
            >
              <PromptInputCommandList>
                {matches.map(command => (
                  <PromptInputCommandItem
                    key={command.name}
                    value={command.name}
                    onMouseDown={e => e.preventDefault()}
                    onSelect={() => pick(command)}
                  >
                    <span className="font-mono">
                      {mentioning ? '@' : '/'}
                      {command.name}
                    </span>
                    {command.args && (
                      <span className="font-mono text-muted-foreground">
                        {command.args}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-right text-xs text-muted-foreground">
                      {command.description}
                    </span>
                  </PromptInputCommandItem>
                ))}
              </PromptInputCommandList>
            </PromptInputCommand>
          </div>
        )}
        <PromptInput
          onSubmit={({ text }) => {
            // PromptInput keeps the text when onSubmit throws.
            if (text.trim() && submit(text.trim())) throw new Error('Not sent')
          }}
        >
          <PromptInputBody>
            <PromptInputTextarea
              placeholder={placeholder}
              disabled={disabled}
              onChange={() => {
                setNotice(undefined)
                onEdit?.()
              }}
              onKeyDown={onKeyDown}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>{props.tools}</PromptInputTools>
            <PromptInputSubmit
              status={status}
              onStop={onStop}
              disabled={!allowed}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}
