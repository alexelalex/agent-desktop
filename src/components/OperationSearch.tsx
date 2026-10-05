import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { searchOperations, type SpecOperation } from '@/lib/spec'
import { cn } from '@/lib/utils'

/** `/ops` results: the spec operations the assistant can call as tools. */
export function OperationSearch(props: {
  query: string
  operations: Map<string, SpecOperation>
  onClose: () => void
}) {
  const results = searchOperations(props.operations, props.query)
  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between gap-4 py-1 pr-1 pl-3 text-sm">
        <span>
          <span className="font-medium">Operations</span>{' '}
          <span className="text-muted-foreground">
            {results.length} matching “{props.query}”
          </span>
        </span>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Close"
          onClick={props.onClose}
        >
          <XIcon />
        </Button>
      </div>
      {results.length > 0 && (
        <ul className="max-h-64 overflow-y-auto border-t px-3 py-2 text-sm">
          {results.map(([id, op]) => (
            <li key={id} className="flex gap-3 py-1">
              <code
                className={cn(
                  'shrink-0 text-xs leading-5',
                  op.method !== 'GET' && 'text-yellow-600',
                )}
                title={op.method !== 'GET' ? 'Asks for your approval' : undefined}
              >
                {op.method} {op.path}
              </code>
              <span className="truncate text-muted-foreground">{op.summary}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
