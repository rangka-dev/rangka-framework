import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { WidgetProps } from '../types.js';

export function CheckboxWidget({ props, bind, on }: WidgetProps) {
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly ?? false;
  const error = bind.error;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={(bind.value as boolean) ?? false}
          onCheckedChange={(checked) => {
            bind.setValue?.(checked);
            on.change?.(checked);
          }}
          disabled={disabled}
        />
        {label && <span className="text-sm text-foreground">{label}</span>}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

CheckboxWidget.widgetMeta = {
  name: 'checkbox',
  label: 'Checkbox',
  category: 'input' as const,
  schema: {
    label: { type: 'string' as const },
    disabled: { type: 'boolean' as const, default: false },
  },
  binding: 'field' as const,
  triggers: ['change'],
  container: false,
};
