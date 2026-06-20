import React from 'react';
import type { WidgetProps } from '../types.js';

export function ImageWidget({ props, bind }: WidgetProps) {
  const src = (bind.value as string) ?? (props.src as string) ?? '';
  const alt = (props.alt as string) ?? '';
  const width = props.width as string | undefined;
  const height = props.height as string | undefined;

  if (!src) return null;

  return <img src={src} alt={alt} style={{ width, height }} className="max-w-full rounded-sm" />;
}

ImageWidget.widgetMeta = {
  name: 'image',
  label: 'Image',
  category: 'display' as const,
  schema: {
    src: { type: 'string' as const },
    alt: { type: 'string' as const },
    width: { type: 'string' as const },
    height: { type: 'string' as const },
  },
  binding: 'field' as const,
  triggers: [],
  container: false,
};
