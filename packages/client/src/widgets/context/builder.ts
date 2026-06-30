import type { WidgetNode } from '@rangka/shared';
import type { WidgetContext } from './types.js';

const LAYOUT_WIDGETS = new Set(['group', 'section', 'divider', 'spacer']);

export function buildContext(node: WidgetNode, parentContext: WidgetContext): WidgetContext {
  if (node.source) {
    const isRecordMode = Boolean(node.source.id);
    if (isRecordMode) {
      return {
        record: {},
        model: node.source.model,
        mode: parentContext.mode,
        parent: parentContext,
        __columns: node.children,
        sourceFilters: node.source.filters,
        sourceLimit: node.source.limit,
      };
    } else {
      return {
        record: {},
        records: parentContext.records ?? [],
        model: node.source.model,
        mode: parentContext.mode,
        parent: parentContext,
        __columns: node.children,
        sourceFilters: node.source.filters,
        sourceLimit: node.source.limit,
      };
    }
  }

  if (LAYOUT_WIDGETS.has(node.type)) {
    return parentContext;
  }

  return parentContext;
}

export function buildRowContext(
  row: Record<string, unknown>,
  index: number,
  tableContext: WidgetContext,
): WidgetContext {
  return {
    record: row,
    model: tableContext.model,
    mode: tableContext.mode,
    index,
    parent: tableContext.parent,
  };
}

export function createRootContext(
  record: Record<string, unknown>,
  model: string,
  mode: 'create' | 'record' = 'record',
): WidgetContext {
  return {
    record,
    model,
    mode,
  };
}

export function resolveContextValue(path: string, context: WidgetContext): unknown {
  const parts = path.split('.');

  if (parts[0] === '$parent') {
    if (!context.parent) return undefined;
    return resolveContextValue(parts.slice(1).join('.'), context.parent);
  }

  if (parts[0] === '$root') {
    let root = context;
    while (root.parent) root = root.parent;
    return resolveContextValue(parts.slice(1).join('.'), root);
  }

  if (parts[0] === '$row') {
    return resolveFromRecord(parts.slice(1), context.record);
  }

  return resolveFromRecord(parts, context.record);
}

function resolveFromRecord(parts: string[], record: Record<string, unknown>): unknown {
  let current: unknown = record;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
