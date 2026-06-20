import type { WidgetNode } from '@rangka/shared';

export interface WidgetContext {
  record: Record<string, unknown>;
  records?: Record<string, unknown>[];
  model: string;
  mode: 'view' | 'edit';
  index?: number;
  parent?: WidgetContext;
  __columns?: WidgetNode[];
}

export function getRootContext(ctx: WidgetContext): WidgetContext {
  let current = ctx;
  while (current.parent) {
    current = current.parent;
  }
  return current;
}

export function flattenContext(ctx: WidgetContext): Record<string, unknown> {
  return flattenContextInner(ctx, getRootContext(ctx));
}

function flattenContextInner(ctx: WidgetContext, root: WidgetContext): Record<string, unknown> {
  const result: Record<string, unknown> = { ...ctx.record };

  if (ctx.parent) {
    result['$parent'] = flattenContextInner(ctx.parent, root);
  }

  if (ctx !== root) {
    result['$root'] = flattenContextInner(root, root);
  }

  return result;
}
