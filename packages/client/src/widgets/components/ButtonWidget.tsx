import React from 'react';
import { Button as UIButton } from '@/components/ui/button';
import type { WidgetProps } from '../types.js';

export function ButtonWidget({ props, on }: WidgetProps) {
  const variant = props.variant as string | undefined;
  const size = props.size as string | undefined;

  return (
    <UIButton
      variant={
        variant === 'primary'
          ? 'default'
          : (variant as 'default' | 'secondary' | 'ghost' | 'destructive' | undefined)
      }
      size={size === 'md' ? 'default' : (size as 'sm' | 'default' | 'lg' | undefined)}
      disabled={props.disabled as boolean | undefined}
      onClick={on.click}
    >
      {props.label as string}
    </UIButton>
  );
}

ButtonWidget.widgetMeta = {
  name: 'button',
  label: 'Button',
  category: 'action' as const,
  schema: {
    label: { type: 'string' as const, required: true },
    variant: {
      type: 'enum' as const,
      options: ['primary', 'secondary', 'ghost', 'destructive'],
      default: 'secondary',
    },
    size: { type: 'enum' as const, options: ['sm', 'md', 'lg'], default: 'md' },
    disabled: { type: 'boolean' as const, default: false },
    loading: { type: 'boolean' as const, default: false },
  },
  binding: 'none' as const,
  triggers: ['click'],
  container: false,
};
