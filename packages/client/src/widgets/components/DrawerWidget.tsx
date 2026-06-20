import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { WidgetProps } from '../types.js';
import { usePageState } from '../hooks/usePageState.js';

const sizeMap = {
  sm: 'w-80',
  md: 'w-[28rem]',
  lg: 'w-[40rem]',
};

export function DrawerWidget({ props, children }: WidgetProps) {
  const title = (props.title as string) ?? '';
  const size = (props.width as 'sm' | 'md' | 'lg') ?? 'md';
  const closable = (props.closable as boolean) ?? true;
  const visibleField = props._visibleField as string | undefined;
  const state = usePageState();

  const handleOpenChange = (open: boolean) => {
    if (!open && closable && visibleField && visibleField.startsWith('$state.')) {
      const key = visibleField.slice(7);
      state.set(key, false);
    }
  };

  return (
    <Sheet open={true} onOpenChange={handleOpenChange}>
      <SheetContent className={sizeMap[size]} side="right">
        {title && (
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
        )}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

DrawerWidget.widgetMeta = {
  name: 'drawer',
  label: 'Drawer',
  category: 'layout' as const,
  schema: {
    width: { type: 'enum' as const, options: ['sm', 'md', 'lg'], default: 'md' },
    title: { type: 'string' as const },
    closable: { type: 'boolean' as const, default: true },
  },
  binding: 'none' as const,
  triggers: [],
  container: true,
};
