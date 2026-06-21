import React, { useState, useEffect } from 'react';
import { ensureWidget } from '../loader.js';
import { getWidget } from '../registry.js';
import { WidgetErrorBoundary } from './WidgetErrorBoundary.js';
import type { WidgetProps } from '../types.js';

interface LazyWidgetProps extends WidgetProps {
  name: string;
}

export function LazyWidget({ name, ...widgetProps }: LazyWidgetProps) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    ensureWidget(name).then((ok) => {
      if (!cancelled) setState(ok ? 'ready' : 'error');
    });
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (state === 'loading') {
    return <div data-widget-loading={name} className="animate-pulse h-8 rounded bg-muted" />;
  }

  if (state === 'error') {
    return <div data-widget-error={`Failed to load: ${name}`} />;
  }

  const entry = getWidget(name);
  if (!entry) {
    return <div data-widget-error={`Widget not found: ${name}`} />;
  }

  const Component = entry.component;
  return (
    <WidgetErrorBoundary name={name}>
      <Component {...widgetProps} />
    </WidgetErrorBoundary>
  );
}
