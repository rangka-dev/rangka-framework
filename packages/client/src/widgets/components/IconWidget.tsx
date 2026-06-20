import React from 'react';
import { Icon } from '@/components/Icon';
import type { WidgetProps } from '../types.js';

export function IconWidget({ props, on }: WidgetProps) {
  const name = (props.name as string) ?? 'circle';
  const size = props.size as number | undefined;
  const color = props.color as string | undefined;

  return (
    <span onClick={on.click} className={on.click ? 'cursor-pointer' : undefined}>
      <Icon name={name} size={size} color={color} />
    </span>
  );
}

IconWidget.widgetMeta = {
  name: 'icon',
  label: 'Icon',
  category: 'display' as const,
  schema: {
    name: { type: 'string' as const, required: true },
    size: { type: 'number' as const, default: 14 },
    color: { type: 'string' as const },
  },
  binding: 'none' as const,
  triggers: ['click'],
  container: false,
};
