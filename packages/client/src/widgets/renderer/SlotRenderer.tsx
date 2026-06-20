import React, { useMemo } from 'react';
import type { WidgetNode } from '@rangka/shared';
import type { ActionHandlers } from '../action/dispatcher.js';
import { WidgetContextProvider } from '../hooks/useWidgetContext.js';
import { PageStateProvider } from '../hooks/usePageState.js';
import { StateStore } from '../state/store.js';
import type { WidgetContext } from '../context/types.js';
import { createRootContext } from '../context/builder.js';
import { WidgetRenderer } from './WidgetRenderer.js';
import type { FieldMeta } from '../binding/resolver.js';

export interface SlotRendererProps {
  nodes: WidgetNode[];
  context?: WidgetContext;
  state?: StateStore;
  handlers?: ActionHandlers;
  fieldMeta?: Record<string, FieldMeta>;
  setValue?: (field: string, val: unknown) => void;
}

export function SlotRenderer({
  nodes,
  context,
  state,
  handlers = {},
  fieldMeta,
  setValue,
}: SlotRendererProps) {
  const ctx = context ?? createRootContext({}, '', 'view');
  const store = useMemo(() => state ?? new StateStore(), [state]);

  return (
    <PageStateProvider value={store}>
      <WidgetContextProvider value={ctx}>
        {nodes.map((node, index) => (
          <WidgetRenderer
            key={node.id ?? index}
            node={node}
            handlers={handlers}
            fieldMeta={fieldMeta}
            setValue={setValue}
          />
        ))}
      </WidgetContextProvider>
    </PageStateProvider>
  );
}
