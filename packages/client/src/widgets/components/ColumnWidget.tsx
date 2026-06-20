import React from 'react';
import type { WidgetProps } from '../types.js';

export function ColumnWidget({ children }: WidgetProps) {
  return <>{children}</>;
}

ColumnWidget.widgetMeta = {
  name: 'column',
  label: 'Column',
  category: 'layout' as const,
  schema: {
    label: { type: 'string' as const, required: true },
    width: { type: 'string' as const },
    align: { type: 'enum' as const, options: ['left', 'center', 'right'], default: 'left' },
    sortable: { type: 'boolean' as const },
    filterable: { type: 'boolean' as const },
  },
  binding: 'none' as const,
  triggers: [],
  container: true,
};
