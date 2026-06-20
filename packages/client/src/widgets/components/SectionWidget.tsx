import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import type { SpacingToken } from '@rangka/shared';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import type { WidgetProps } from '../types.js';

const paddingMap: Record<SpacingToken, string> = {
  none: 'p-0',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
  '2xl': 'p-12',
};

export function SectionWidget({ props, children }: WidgetProps) {
  const label = (props.label as string) ?? '';
  const collapsible = (props.collapsible as boolean) ?? false;
  const defaultCollapsed = (props.defaultCollapsed as boolean) ?? false;
  const padding = (props.padding as SpacingToken) ?? 'md';
  const icon = props.icon as string | undefined;

  const [open, setOpen] = useState(!defaultCollapsed);

  if (!collapsible) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2 border-b border-border pb-2 mb-3">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <h3 className="text-sm font-medium">{label}</h3>
        </div>
        <div className={cn(paddingMap[padding])}>{children}</div>
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex flex-col">
        <CollapsibleTrigger className="flex items-center gap-2 border-b border-border pb-2 mb-3 cursor-pointer hover:text-foreground/80">
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-150',
              open && 'rotate-90',
            )}
          />
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <h3 className="text-sm font-medium">{label}</h3>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className={cn(paddingMap[padding])}>{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

SectionWidget.widgetMeta = {
  name: 'section',
  label: 'Section',
  category: 'layout' as const,
  schema: {
    label: { type: 'string' as const, required: true },
    collapsible: { type: 'boolean' as const, default: false },
    defaultCollapsed: { type: 'boolean' as const, default: false },
    padding: {
      type: 'enum' as const,
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      default: 'md',
    },
    icon: { type: 'string' as const },
  },
  binding: 'none' as const,
  triggers: [],
  container: true,
};
