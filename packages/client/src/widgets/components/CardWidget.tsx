import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { WidgetRenderer } from '../renderer/WidgetRenderer.js';
import { SurfaceProvider } from '../hooks/useSurfaceContext.js';
import type { WidgetNode } from '@rangka/shared';
import type { WidgetProps } from '../types.js';

export function CardWidget({ props, children }: WidgetProps) {
  const title = props.title as string | undefined;
  const description = props.description as string | undefined;
  const size = (props.size as 'default' | 'sm') ?? 'default';
  const actions = props.actions as WidgetNode[] | undefined;
  const footer = props.footer as WidgetNode[] | undefined;

  return (
    <Card size={size}>
      {(title || description || actions) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {actions && actions.length > 0 && (
            <CardAction>
              <div className="flex items-center gap-2">
                {actions.map((node, i) => (
                  <WidgetRenderer key={node.id ?? i} node={node} />
                ))}
              </div>
            </CardAction>
          )}
        </CardHeader>
      )}
      <CardContent>
        <SurfaceProvider value="card">{children}</SurfaceProvider>
      </CardContent>
      {footer && footer.length > 0 && (
        <CardFooter>
          {footer.map((node, i) => (
            <WidgetRenderer key={node.id ?? i} node={node} />
          ))}
        </CardFooter>
      )}
    </Card>
  );
}

CardWidget.widgetMeta = {
  name: 'card',
  label: 'Card',
  category: 'layout' as const,
  schema: {
    title: { type: 'string' as const },
    description: { type: 'string' as const },
    size: { type: 'enum' as const, options: ['default', 'sm'], default: 'default' },
    actions: { type: 'array' as const },
    footer: { type: 'array' as const },
  },
  binding: 'none' as const,
  triggers: [],
  container: true,
};
