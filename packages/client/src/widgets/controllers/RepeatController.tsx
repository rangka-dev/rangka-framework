import type { WidgetProps } from '../types.js';
import { useWidgetContext, WidgetContextProvider } from '../hooks/useWidgetContext.js';
import { buildRowContext } from '../context/builder.js';
import { WidgetRenderer } from '../renderer/WidgetRenderer.js';

export function RepeatController({ bind: bindProp, childNodes }: WidgetProps) {
  const ctx = useWidgetContext();

  let records: Record<string, unknown>[] = [];

  if (Array.isArray(bindProp.value)) {
    records = bindProp.value as Record<string, unknown>[];
  } else if (ctx.records) {
    records = ctx.records;
  }

  if (!childNodes || childNodes.length === 0) return null;

  return (
    <>
      {records.map((record, index) => {
        const rowCtx = buildRowContext(record, index, ctx);
        return (
          <WidgetContextProvider key={(record.id as string) ?? index} value={rowCtx}>
            {childNodes.map((child, i) => (
              <WidgetRenderer key={child.id ?? i} node={child} />
            ))}
          </WidgetContextProvider>
        );
      })}
    </>
  );
}
