import React from 'react';
import type { WidgetNode } from '@rangka/shared';
import type { WidgetProps } from '../types.js';
import { useModelRecord } from '../data/useModelRecord.js';
import { useModelQuery } from '../data/useModelQuery.js';
import { useWidgetContext, WidgetContextProvider } from '../hooks/useWidgetContext.js';
import { WidgetRenderer } from '../renderer/WidgetRenderer.js';
import type { WidgetContext } from '../context/types.js';

export function DataWidget({ bind, props, on, childNodes }: WidgetProps) {
  const ctx = useWidgetContext();
  const modelName = ctx.model;
  const id = bind.id ?? undefined;
  const pageSize = props.pageSize as number | undefined;
  const placeholder = props.placeholder as string | undefined;

  if (!modelName) return null;

  if (id) {
    return (
      <DataRecordMode
        model={modelName}
        id={id}
        placeholder={placeholder}
        on={on}
        childNodes={childNodes}
      />
    );
  }

  return (
    <DataListMode
      model={modelName}
      pageSize={pageSize}
      placeholder={placeholder}
      on={on}
      childNodes={childNodes}
    />
  );
}

function DataRecordMode({
  model,
  id,
  placeholder,
  on,
  childNodes,
}: {
  model: string;
  id: string;
  placeholder?: string;
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

  if (isLoading) {
    if (placeholder)
      return (
        <div data-rangka-widget="data" data-state="loading">
          {placeholder}
        </div>
      );
    return null;
  }

  if (!data) {
    if (placeholder)
      return (
        <div data-rangka-widget="data" data-state="empty">
          {placeholder}
        </div>
      );
    return null;
  }

  const ctx: WidgetContext = {
    record: data,
    model,
    mode: 'view',
    parent: parentCtx,
  };

  return (
    <WidgetContextProvider value={ctx}>
      <div data-rangka-widget="data">
        <DataChildren childNodes={childNodes} />
      </div>
    </WidgetContextProvider>
  );
}

function DataListMode({
  model,
  pageSize,
  placeholder,
  on,
  childNodes,
}: {
  model: string;
  pageSize?: number;
  placeholder?: string;
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

  if (isLoading) {
    if (placeholder)
      return (
        <div data-rangka-widget="data" data-state="loading">
          {placeholder}
        </div>
      );
    return null;
  }

  if (!data || data.length === 0) {
    if (placeholder)
      return (
        <div data-rangka-widget="data" data-state="empty">
          {placeholder}
        </div>
      );
    return null;
  }

  const ctx: WidgetContext = {
    record: data[0],
    records: data,
    model,
    mode: 'view',
    parent: parentCtx,
  };

  return (
    <WidgetContextProvider value={ctx}>
      <div data-rangka-widget="data">
        <DataChildren childNodes={childNodes} />
      </div>
    </WidgetContextProvider>
  );
}

function DataChildren({ childNodes }: { childNodes?: WidgetNode[] }) {
  if (!childNodes || childNodes.length === 0) return null;

  return (
    <>
      {childNodes.map((child, i) => (
        <WidgetRenderer key={child.id ?? i} node={child} />
      ))}
    </>
  );
}

DataWidget.widgetMeta = {
  name: 'data',
  label: 'Data',
  category: 'data' as const,
  schema: {
    placeholder: { type: 'string' as const },
    pageSize: { type: 'number' as const },
  },
  binding: 'none' as const,
  triggers: ['load', 'error'],
  container: true,
};
