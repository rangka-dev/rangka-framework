import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { WidgetProps } from '../types.js';
import { usePageState } from '../hooks/usePageState.js';

const sizeMap = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-3xl',
};

export function ModalWidget({ props, children }: WidgetProps) {
  const title = (props.title as string) ?? '';
  const size = (props.size as 'sm' | 'md' | 'lg') ?? 'md';
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
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className={sizeMap[size]} showCloseButton={closable}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}

ModalWidget.widgetMeta = {
  name: 'modal',
  label: 'Modal',
  category: 'layout' as const,
  schema: {
    size: { type: 'enum' as const, options: ['sm', 'md', 'lg'], default: 'md' },
    title: { type: 'string' as const },
    closable: { type: 'boolean' as const, default: true },
  },
  binding: 'none' as const,
  triggers: [],
  container: true,
};
