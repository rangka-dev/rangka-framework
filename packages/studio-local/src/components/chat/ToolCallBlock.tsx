import { useState } from 'react';
import { ChevronRight, Wrench } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type ToolCallBlockProps = {
  toolName: string;
  input: string;
  output: string;
};

export function ToolCallBlock({ toolName, input, output }: ToolCallBlockProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50">
        <Wrench className="size-3.5" />
        <span className="flex-1 text-left font-medium">{toolName}</span>
        <ChevronRight className={cn('size-3.5 transition-transform', open && 'rotate-90')} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 space-y-2 rounded-md bg-muted p-3 font-mono text-xs">
          <div>
            <span className="text-muted-foreground">Input:</span>
            <pre className="mt-1 whitespace-pre-wrap">{input}</pre>
          </div>
          <div>
            <span className="text-muted-foreground">Output:</span>
            <pre className="mt-1 whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
