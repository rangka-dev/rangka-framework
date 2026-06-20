import React from 'react';
import type { WidgetProps } from '../types.js';
import { useWidgetContext } from '../hooks/useWidgetContext.js';
import { WidgetContextProvider } from '../hooks/useWidgetContext.js';
import { buildRowContext } from '../context/builder.js';

export function RepeatWidget({ props, bind: bindProp, children }: WidgetProps) {
  const ctx = useWidgetContext();

  const layout = (props.layout as string) ?? 'list';
  const columns = (props.columns as number) ?? 3;
  const gap = (props.gap as string) ?? 'md';

  // Determine source records:
  // 1. If bind.value is an array (from bind.field on parent record), use that
  // 2. Otherwise, read records from parent context (data widget in collection mode)
  let records: Record<string, unknown>[] = [];

  if (Array.isArray(bindProp.value)) {
    records = bindProp.value as Record<string, unknown>[];
  } else if (ctx.records) {
    records = ctx.records;
  }

  const gapMap: Record<string, string> = { sm: '8px', md: '16px', lg: '24px' };

  const containerStyle: React.CSSProperties =
    layout === 'grid'
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: gapMap[gap] ?? gapMap.md,
        }
      : {
          display: 'flex',
          flexDirection: 'column',
          gap: gapMap[gap] ?? gapMap.md,
        };

  return (
    <div style={containerStyle} data-widget="repeat" data-layout={layout}>
      {records.map((record, index) => {
        const rowCtx = buildRowContext(record, index, ctx);
        return (
          <WidgetContextProvider key={(record.id as string) ?? index} value={rowCtx}>
            <div data-repeat-index={index}>{children}</div>
          </WidgetContextProvider>
        );
      })}
    </div>
  );
}

RepeatWidget.widgetMeta = {
  name: 'repeat',
  label: 'Repeat',
  category: 'data' as const,
  schema: {
    layout: { type: 'enum' as const, options: ['list', 'grid'], default: 'list' },
    columns: { type: 'number' as const, default: 3 },
    gap: { type: 'enum' as const, options: ['sm', 'md', 'lg'], default: 'md' },
  },
  binding: 'field' as const,
  triggers: [],
  container: true,
};
