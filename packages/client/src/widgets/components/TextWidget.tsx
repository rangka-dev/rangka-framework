import React from 'react';
import type { WidgetProps } from '../types.js';

export function TextWidget({ props, bind }: WidgetProps) {
  const style = props.style as string | undefined;
  const align = props.align as string | undefined;
  const value = bind.value ?? props.content ?? '';

  const classMap: Record<string, string> = {
    heading: 'text-lg font-semibold',
    body: 'text-sm',
    caption: 'text-xs text-muted-foreground',
    bold: 'text-sm font-medium',
    muted: 'text-sm text-muted-foreground',
  };

  const alignMap: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const classes = [classMap[style ?? 'body'] ?? classMap.body, align ? alignMap[align] : '']
    .filter(Boolean)
    .join(' ');

  return <p className={classes}>{String(value)}</p>;
}

TextWidget.widgetMeta = {
  name: 'text',
  label: 'Text',
  category: 'display' as const,
  schema: {
    style: {
      type: 'enum' as const,
      options: ['heading', 'body', 'caption', 'bold'],
      default: 'body',
    },
  },
  binding: 'field' as const,
  triggers: [],
  container: false,
};
