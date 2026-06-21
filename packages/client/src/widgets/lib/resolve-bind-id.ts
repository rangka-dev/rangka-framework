import type { WidgetContext } from '../context/types.js';
import { flattenContext } from '../context/types.js';
import { parse, evaluate } from '../expression/index.js';

export function resolveBindId(
  id: string | undefined,
  ctx: WidgetContext,
  routeParams: Record<string, string>,
  state?: Record<string, unknown>,
): string | undefined {
  if (!id) return undefined;

  const merged = buildMergedContext(ctx, routeParams, state);

  if (id.includes('{{')) {
    const trimmed = id.trim();
    if (
      trimmed.startsWith('{{') &&
      trimmed.endsWith('}}') &&
      !trimmed.slice(2, -2).includes('{{')
    ) {
      const ast = parse(trimmed);
      const result = evaluate(ast, merged);
      return result != null ? String(result) : undefined;
    }
    return id.replace(/\{\{(.+?)\}\}/g, (_m, expr: string) => {
      const ast = parse(expr.trim());
      return String(evaluate(ast, merged) ?? '');
    });
  }

  if (id.includes('$')) {
    const ast = parse(id);
    const result = evaluate(ast, merged);
    return result != null ? String(result) : undefined;
  }

  return id;
}

function buildMergedContext(
  ctx: WidgetContext,
  routeParams: Record<string, string>,
  state?: Record<string, unknown>,
): Record<string, unknown> {
  const flat = flattenContext(ctx);
  const merged: Record<string, unknown> = { ...flat, $route: routeParams };
  if (state) {
    merged['$state'] = state;
  }
  return merged;
}
