import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { WidgetNode } from '@rangka/shared';
import { SlotRenderer } from '../renderer/SlotRenderer.js';
import { createRootContext } from '../context/builder.js';
import { useActionHandlers } from './useActionHandlers.js';
import { usePageState } from '../hooks/usePageState.js';
import type { UseActionHandlersOptions } from './useActionHandlers.js';
import type { FieldMeta } from '../binding/resolver.js';

export interface WidgetSlotRendererProps {
  nodes: WidgetNode[];
  record?: Record<string, unknown>;
  model?: string;
  mode?: 'view' | 'edit';
  fieldMeta?: Record<string, FieldMeta>;
  sourceQueryKey?: unknown[];
  onRecordChange?: (record: Record<string, unknown>) => void;
}

export function WidgetSlotRenderer({
  nodes,
  record: initialRecord,
  model,
  mode = 'view',
  fieldMeta,
  sourceQueryKey,
  onRecordChange,
}: WidgetSlotRendererProps) {
  const [record, setRecord] = useState<Record<string, unknown>>(initialRecord ?? {});
  const recordRef = useRef(record);
  recordRef.current = record;
  const state = usePageState();

  const handlerOptions: UseActionHandlersOptions = useMemo(
    () => ({ model, sourceQueryKey }),
    [model, sourceQueryKey],
  );
  const actionHandlers = useActionHandlers(handlerOptions);

  const setValue = useCallback(
    (field: string, value: unknown) => {
      const next = { ...recordRef.current, [field]: value };
      recordRef.current = next;
      setRecord(next);
      onRecordChange?.(next);
    },
    [onRecordChange],
  );

  const handlersWithRecord = useMemo(
    () => ({
      ...actionHandlers,
      setRecordValue: setValue,
    }),
    [actionHandlers, setValue],
  );

  const context = useMemo(
    () => createRootContext(record, model ?? '', mode),
    [record, model, mode],
  );

  return (
    <SlotRenderer
      nodes={nodes}
      context={context}
      state={state}
      handlers={handlersWithRecord}
      fieldMeta={fieldMeta}
      setValue={setValue}
    />
  );
}
