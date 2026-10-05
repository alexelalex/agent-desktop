import { ArrowLeftIcon, FileCode2Icon, XIcon } from 'lucide-react';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import { MessageResponse } from '@/components/ai-elements/message';
import {
  actionKey,
  ActionRow,
  ActionsContext,
  ActionsTray,
  SelectionBar,
  type ActionsContextValue,
} from '@/components/TaskActions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AmendedBrief } from '@/components/Suggestions';
import {
  fencedBlockUnder,
  placeActions,
  resolveAnchor,
  splitAtHeadings,
  type ArtifactAction,
  type ClaudeCodeArtifact,
} from '@/lib/claude-code';
import { effectivePrompt } from '@/lib/dig';
import { actionTasks, selectable } from '@/lib/tasks';
import { cn } from '@/lib/utils';

const FLASH_MS = 1600;

export function McpArtifactPanel({
  artifact,
  focus,
  narrow,
  onClose,
  className,
  actions,
}: {
  artifact?: ClaudeCodeArtifact;
  /** An action to scroll to, once it's on the page. */
  focus?: { actionId: string; at: number };
  /** Shown in the chat's place rather than beside it. */
  narrow?: boolean;
  onClose: () => void;
  className?: string;
  /** Set when the artifact's actions can show: the session's tasks and how to launch. */
  actions?: ActionsContextValue;
}) {
  const placed = useMemo(() => artifact && placeActions(artifact), [artifact]);
  // A brief taken from under its heading shows what accepted suggestions changed in it,
  // keyed by its closing fence line.
  const suggestions = actions?.run?.claudeCode?.suggestions;
  const amended = useMemo(() => {
    const briefs = new Map<
      number,
      { open: number; action: ArtifactAction; agent: string; effective: ReturnType<typeof effectivePrompt> }
    >();
    if (artifact?.format !== 'markdown' || !actions) return briefs;
    for (const action of artifact.actions) {
      if (action.prompt !== undefined || !action.anchor || !('heading' in action.anchor)) continue;
      const resolved = resolveAnchor(artifact, action.anchor);
      if (!('placement' in resolved) || !('line' in resolved.placement)) continue;
      const block = fencedBlockUnder(artifact.content, resolved.placement.line);
      if (!block) continue;
      const mine = (suggestions ?? []).filter(
        (s) => s.artifactId === artifact.id && s.actionId === action.id,
      );
      const effective = effectivePrompt(block.content, mine);
      if (effective.applied.length + effective.unapplied.length === 0) continue;
      briefs.set(block.close, { open: block.open, action, agent: block.content, effective });
    }
    return briefs;
  }, [artifact, suggestions, !!actions]);
  const scroller = useRef<HTMLDivElement>(null);
  // Each pick scrolls once: the artifact may still be loading when it's made.
  const focused = useRef<number>(undefined);
  useEffect(() => {
    if (!focus || !artifact || focused.current === focus.at) return;
    const target = scroller.current?.querySelector<HTMLElement>(
      `[data-action="${CSS.escape(actionKey(artifact.id, focus.actionId))}"]`,
    );
    if (!target) return;
    focused.current = focus.at;
    target.scrollIntoView({ block: 'center' });
    target.dataset.flash = '';
    setTimeout(() => delete target.dataset.flash, FLASH_MS);
  }, [focus, artifact, placed]);
  if (!artifact || !placed) return null;
  const launchable = actions?.disabled
    ? []
    : artifact.actions
        .filter((a) => selectable(actionTasks(actions?.tasks ?? [], artifact.id, a.id)))
        .map((a) => a.id);
  // Cut after each anchored heading, and around each amended brief.
  const cuts = [
    ...new Set([
      ...placed.headings.keys(),
      ...[...amended].flatMap(([close, brief]) => [brief.open - 1, close]),
    ]),
  ].sort((a, b) => a - b);
  const chunks =
    artifact.format === 'markdown' && actions ? splitAtHeadings(artifact.content, cuts) : [];

  let tableData: { columns?: string[]; rows?: (string | number)[][] } | null = null;
  if (artifact.format === 'json_table') {
    try {
      tableData = JSON.parse(artifact.content);
    } catch {
      tableData = null;
    }
  }

  return (
    <aside
      aria-label="Claude Code Artifact"
      className={cn('flex min-h-0 min-w-0 flex-col bg-background', className)}
    >
      <header className="flex h-11 shrink-0 items-center gap-2 border-b px-4">
        {narrow && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeftIcon /> Chat
          </Button>
        )}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileCode2Icon className="size-4 shrink-0 text-muted-foreground" />
          <h2 className="text-sm font-semibold truncate">{artifact.title}</h2>
          <Badge variant="outline" className="text-[10px] uppercase font-mono py-0 px-1.5 h-4">
            {artifact.format}
          </Badge>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Close artifact"
          title="Close"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </header>

      <ActionsContext.Provider value={actions}>
      {actions && <SelectionBar launchable={launchable} />}
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        {actions?.notice && (
          <Alert variant="destructive">
            <AlertDescription>{actions.notice}</AlertDescription>
          </Alert>
        )}
        {artifact.format === 'markdown' && !actions && (
          <div className="prose dark:prose-invert max-w-none text-sm">
            <MessageResponse>{artifact.content}</MessageResponse>
          </div>
        )}
        {artifact.format === 'markdown' && actions && (
          <div className="prose dark:prose-invert max-w-none text-sm">
            {chunks.map((chunk, i) => {
              const brief = amended.get(cuts[i]);
              const anchoredHere = placed.headings.get(cuts[i]);
              return (
                <Fragment key={i}>
                  {brief ? (
                    <AmendedBrief
                      agent={brief.agent}
                      effective={brief.effective}
                      onReview={() => actions?.onReview(brief.action.id)}
                    />
                  ) : (
                    chunk.trim() && <MessageResponse>{chunk}</MessageResponse>
                  )}
                  {anchoredHere && <ActionRow className="not-prose mb-3" actions={anchoredHere} />}
                </Fragment>
              );
            })}
          </div>
        )}

        {artifact.format === 'mermaid' && (
          <div className="rounded-lg border bg-muted/20 p-4">
            <MessageResponse>
              {`\`\`\`mermaid\n${artifact.content}\n\`\`\``}
            </MessageResponse>
          </div>
        )}

        {artifact.format === 'json_table' && (
          <div className="overflow-x-auto rounded-lg border">
            {tableData && Array.isArray(tableData.rows) ? (
              <table className="w-full text-left text-xs border-collapse">
                {tableData.columns && (
                  <thead className="border-b bg-muted/40 font-semibold">
                    <tr>
                      {tableData.columns.map((col, idx) => (
                        <th key={idx} className="p-2.5 border-r last:border-r-0">
                          {col}
                        </th>
                      ))}
                      {actions && placed.rows.size > 0 && (
                        <th className="p-2.5">Actions</th>
                      )}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {tableData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b last:border-b-0 hover:bg-muted/20">
                      {Array.isArray(row) ? (
                        row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2.5 border-r last:border-r-0 font-mono">
                            {String(cell)}
                          </td>
                        ))
                      ) : (
                        <td className="p-2.5">{String(row)}</td>
                      )}
                      {actions && placed.rows.size > 0 && (
                        <td className="p-2.5" aria-label="Actions">
                          <ActionRow actions={placed.rows.get(rIdx) ?? []} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <pre className="p-4 text-xs font-mono overflow-auto">{artifact.content}</pre>
            )}
          </div>
        )}
        {actions && <ActionsTray actions={placed.tray} />}
      </div>
      </ActionsContext.Provider>
    </aside>
  );
}
