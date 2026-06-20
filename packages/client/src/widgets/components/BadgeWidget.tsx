import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { WidgetProps } from '../types.js';

const variantMap: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  solid: 'default',
  outline: 'outline',
  subtle: 'secondary',
};

export function BadgeWidget({ props, bind }: WidgetProps) {
  const label = props.label as string | undefined;
  const value = (bind.value as string) ?? '';
  const variant = variantMap[(props.variant as string) ?? 'subtle'] ?? 'secondary';

  return <Badge variant={variant}>{label || value}</Badge>;
}

BadgeWidget.widgetMeta = {
  name: 'badge',
  label: 'Badge',
  category: 'display' as const,
  schema: {
    variant: { type: 'enum' as const, options: ['solid', 'outline', 'subtle'], default: 'subtle' },
    color: {
      type: 'enum' as const,
      options: ['default', 'success', 'warning', 'error', 'info'],
      default: 'default',
    },
    colorMap: { type: 'object' as const },
  },
  binding: 'field' as const,
  triggers: [],
  container: false,
};
