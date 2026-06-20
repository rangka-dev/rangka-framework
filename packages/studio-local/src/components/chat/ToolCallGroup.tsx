import { useState } from 'react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ToolCallBlock } from './ToolCallBlock';
import { TextShimmer } from './TextShimmer';

type ToolCall = {
  name: string;
  input: Record<string, unknown>;
  output: string;
};

type ToolCallGroupProps = {
  toolCalls: ToolCall[];
  isWorking: boolean;
};

export function ToolCallGroup({ toolCalls, isWorking }: ToolCallGroupProps) {
  const [expanded, setExpanded] = useState(false);

  if (toolCalls.length === 0) return null;

  if (isWorking) {
    const lastTool = toolCalls[toolCalls.length - 1];
    const lastToolCompleted = lastTool.output !== '';
    const completed = lastToolCompleted ? toolCalls : toolCalls.slice(0, -1);
    const current = lastToolCompleted ? null : lastTool;

    return (
      <div className="space-y-2">
        {completed.length > 0 && (
          <CompletedGroup toolCalls={completed} expanded={expanded} onToggle={setExpanded} />
        )}
        {current && <ActiveToolCall toolCall={current} />}
      </div>
    );
  }

  return <CompletedGroup toolCalls={toolCalls} expanded={expanded} onToggle={setExpanded} />;
}

const toolLabels: Record<string, string> = {
  read: 'Reading file',
  write: 'Writing file',
  edit: 'Editing file',
  grep: 'Searching code',
  find: 'Finding files',
  ls: 'Browsing folder',
  introspect_models: 'Looking at your models',
  introspect_pages: 'Checking your pages',
  introspect_services: 'Reviewing services',
  introspect_navigation: 'Mapping navigation',
  list_widget_types: 'Checking available widgets',
  reload_preview: 'Refreshing preview',
  apply_changes: 'Applying changes',
  sync_schema: 'Syncing schema',
};

function getFriendlyLabel(toolCall: ToolCall): string {
  return toolLabels[toolCall.name] ?? toolCall.name.replace(/_/g, ' ');
}

function ActiveToolCall({ toolCall }: { toolCall: ToolCall }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-xs">
      <TextShimmer>{getFriendlyLabel(toolCall)}</TextShimmer>
    </div>
  );
}

function CompletedGroup({
  toolCalls,
  expanded,
  onToggle,
}: {
  toolCalls: ToolCall[];
  expanded: boolean;
  onToggle: (v: boolean) => void;
}) {
  const summary = buildSummary(toolCalls);

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground">
        <CheckCircle2 className="size-3 text-emerald-500/70" />
        <span className="flex-1 text-left">{summary}</span>
        <ChevronRight
          className={cn(
            'size-3 opacity-0 transition-all group-hover:opacity-100',
            expanded && 'rotate-90',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-5 mt-1 space-y-1 border-l border-border pl-3">
          {toolCalls.map((toolCall, i) => (
            <ToolCallBlock
              key={i}
              toolName={toolCall.name}
              input={JSON.stringify(toolCall.input, null, 2)}
              output={toolCall.output}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function buildSummary(toolCalls: ToolCall[]): string {
  if (toolCalls.length === 1) {
    return getFriendlyLabel(toolCalls[0]);
  }

  const labels = new Map<string, number>();
  for (const tc of toolCalls) {
    const label = getFriendlyLabel(tc);
    labels.set(label, (labels.get(label) ?? 0) + 1);
  }

  const parts: string[] = [];
  for (const [label, count] of labels) {
    parts.push(count > 1 ? `${label} (x${count})` : label);
  }

  return parts.join(', ');
}
