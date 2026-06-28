import React from 'react';
import type { WidgetNode } from '@rangka/shared';
import type { WidgetProps } from '../types.js';
import { useModelRecord } from '../data/useModelRecord.js';
import { useModelQuery } from '../data/useModelQuery.js';
import { useWidgetContext, WidgetContextProvider } from '../hooks/useWidgetContext.js';
import { WidgetRenderer } from '../renderer/WidgetRenderer.js';
import { useActionHandlers } from '../shell/useActionHandlers.js';
import { useModelMeta } from '../../data/useModelMeta.js';
import type { WidgetContext } from '../context/types.js';
import type { FieldMeta } from '../binding/resolver.js';

export function DataController({ bind, props, on, childNodes }: WidgetProps) {
  const ctx = useWidgetContext();
  const modelName = ctx.model;
  const id = bind.id ?? undefined;
  const pageSize = props.pageSize as number | undefined;

  if (!modelName) return null;

  if (id) {
    return <DataRecordMode model={modelName} id={id} on={on} childNodes={childNodes} />;
  }

  return <DataListMode model={modelName} pageSize={pageSize} on={on} childNodes={childNodes} />;
}

function DataRecordMode({
  model,
  id,
  on,
  childNodes,
}: {
  model: string;
  id: string;
  on: Record<string, (...args: unknown[]) => void>;
  childNodes?: WidgetNode[];
}) {
  const parentCtx = useWidgetContext();
  const { data, isLoading, error } = useModelRecord({ model, id });

  React.useEffect(() => {
    if (error) on.error?.({ message: error.message });
  }, [error, on]);

  React.useEffect(() => {
    if (data) on.load?.({ record: data });
  }, [data, on]);

  if (isLoading || !data) return null;

  const ctx: WidgetContext = {
    record: data,
    model,
    mode: 'view',
    parent: parentCtx,
  };

  return (
    <WidgetContextProvider value={ctx}>
      <DataChildren childNodes={childNodes} />
    </WidgetContextProvider>
  );
}

function DataListMode({
  model,
  pageSize,
  on,
  childNodes,
}: {
  model: string;
  pageSize?: number;
  on: Record<string, (...args: unknown[]) => void>;
  childNodes?: WidgetNode[];
}) {
  const parentCtx = useWidgetContext();
  const { data, isLoading, error } = useModelQuery({
    model,
    pageSize: pageSize ?? 20,
  });

  React.useEffect(() => {
    if (error) on.error?.({ message: error.message });
  }, [error, on]);

  React.useEffect(() => {
    if (data && data.length > 0) on.load?.({ records: data });
  }, [data, on]);

  if (isLoading) return null;

  const ctx: WidgetContext = {
    record: data?.[0] ?? {},
    records: data ?? [],
    model,
    mode: 'view',
    parent: parentCtx,
  };

  return (
    <WidgetContextProvider value={ctx}>
      <DataChildren childNodes={childNodes} />
    </WidgetContextProvider>
  );
}

function DataChildren({ childNodes }: { childNodes?: WidgetNode[] }) {
  const handlers = useActionHandlers();
  const ctx = useWidgetContext();
  const { modelMeta } = useModelMeta(ctx.model);

  const fieldMeta = React.useMemo<Record<string, FieldMeta> | undefined>(() => {
    if (!modelMeta) return undefined;
    const map: Record<string, FieldMeta> = {};
    for (const f of modelMeta.fields) {
      map[f.name] = {
        type: f.type,
        label: f.label ?? f.name,
        required: !!f.required,
        readOnly: false,
        options: f.options as unknown[] | undefined,
      };
    }
    return map;
  }, [modelMeta]);

  if (!childNodes || childNodes.length === 0) return null;

  return (
    <>
      {childNodes.map((child, i) => (
        <WidgetRenderer
          key={child.id ?? i}
          node={child}
          handlers={handlers}
          fieldMeta={fieldMeta}
        />
      ))}
    </>
  );
}
