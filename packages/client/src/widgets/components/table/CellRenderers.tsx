import type { WidgetNode } from '@rangka/shared';
import type { WidgetContext } from '../../context/types.js';
import { getWidget } from '../../registry.js';
import { flattenContext } from '../../context/types.js';
import { parse, evaluate } from '../../expression/index.js';

export function ColumnChildRenderer({ node, rowCtx }: { node: WidgetNode; rowCtx: WidgetContext }) {
  const entry = getWidget(node.type);
  if (!entry) return <span data-widget-error={`Unknown: ${node.type}`} />;

  const Component = entry.component;
  const flat = flattenContext(rowCtx);
  const resolvedProps = resolveProps(node.props, flat);
  const bindResult = resolveBindValue(node, rowCtx);

  return (
    <Component
      props={resolvedProps}
      bind={{ value: bindResult, setValue: undefined, meta: undefined }}
      on={{}}
      context={{
        record: rowCtx.record,
        model: rowCtx.model,
        mode: rowCtx.mode,
        index: rowCtx.index,
      }}
    />
  );
}

export function CellValue({ col, row }: { col: WidgetNode; row: Record<string, unknown> }) {
  const field = col.bind?.field;
  if (!field) return null;
  const value = row[field];
  return <>{value != null ? String(value) : ''}</>;
}

function resolveProps(
  props: Record<string, unknown> | undefined,
  flat: Record<string, unknown>,
): Record<string, unknown> {
  if (!props) return {};
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string' && value.includes('{{')) {
      const trimmed = value.trim();
      if (
        trimmed.startsWith('{{') &&
        trimmed.endsWith('}}') &&
        !trimmed.slice(2, -2).includes('{{')
      ) {
        const ast = parse(trimmed);
        resolved[key] = evaluate(ast, flat);
      } else {
        resolved[key] = value.replace(/\{\{(.+?)\}\}/g, (_m, expr: string) => {
          const ast = parse(expr.trim());
          return String(evaluate(ast, flat) ?? '');
        });
      }
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

function resolveBindValue(node: WidgetNode, ctx: WidgetContext): unknown {
  if (!node.bind) return null;
  if (node.bind.field) {
    return ctx.record[node.bind.field] ?? null;
  }
  if (node.bind.expression) {
    const flat = flattenContext(ctx);
    const expr = node.bind.expression;
    const trimmed = expr.trim();
    if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
      const ast = parse(trimmed);
      return evaluate(ast, flat);
    }
    return expr;
  }
  return null;
}
