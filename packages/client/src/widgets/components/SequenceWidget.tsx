import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Field, FieldLabel } from '@/components/ui/field';
import type { WidgetProps } from '../types.js';

export function SequenceWidget({ props, bind }: WidgetProps) {
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const value = bind.value as string | null | undefined;

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex items-center h-7">
        <Badge variant="secondary" className="font-mono text-xs">
          {value || 'Auto'}
        </Badge>
      </div>
    </Field>
  );
}

SequenceWidget.widgetMeta = {
  name: 'sequence',
  label: 'Sequence',
  category: 'display' as const,
  schema: {
    label: { type: 'string' as const },
  },
  binding: 'field' as const,
  triggers: [],
  container: false,
};
