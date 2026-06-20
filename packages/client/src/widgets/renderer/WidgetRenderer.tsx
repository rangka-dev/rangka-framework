import React, { useMemo } from 'react';
import type { WidgetNode } from '@rangka/shared';
import type { ActionHandlers } from '../action/dispatcher.js';
import { getWidget } from '../registry.js';
import { useCondition } from '../hooks/useCondition.js';
import { useBind } from '../hooks/useBind.js';
import { useTriggerHandlers } from '../hooks/useAction.js';
import { useWidgetContext } from '../hooks/useWidgetContext.js';
import { WidgetContextProvider } from '../hooks/useWidgetContext.js';
import { buildContext } from '../context/builder.js';
import { flattenContext } from '../context/types.js';
import { parse, evaluate } from '../expression/index.js';
import { extractLayoutProps, hasLayoutProps, resolveLayoutClasses } from '../lib/layout-props.js';
import { useParams } from '../../router/hooks.js';
import type { FieldMeta } from '../binding/resolver.js';
import type { WidgetProps } from '../types.js';

function useRouteParams(): Record<string, string> {
  try {
    return useParams();
  } catch {
    return {};
  }
}

export interface WidgetRendererProps {
  node: WidgetNode;
  handlers?: ActionHandlers;
  fieldMeta?: Record<string, FieldMeta>;
  setValue?: (field: string, val: unknown) => void;
}

export function WidgetRenderer({ node, handlers = {}, fieldMeta, setValue }: WidgetRendererProps) {
  const visible = useCondition(node.visible);
  const parentCtx = useWidgetContext();
  const routeParams = useRouteParams();
  const binding = useBind(node.bind, fieldMeta, setValue);
  const triggerHandlers = useTriggerHandlers(node.on, handlers, node.bind?.field);

  const resolvedProps = useResolvedProps(node.props);

  const propsWithVisibleField = useMemo(() => {
    if (node.visible && !Array.isArray(node.visible) && node.visible.field) {
      return { ...resolvedProps, _visibleField: node.visible.field };
    }
    if (Array.isArray(node.visible) && node.visible.length === 1 && node.visible[0].field) {
      return { ...resolvedProps, _visibleField: node.visible[0].field };
    }
    return resolvedProps;
  }, [resolvedProps, node.visible]);

  const childContext = useMemo(() => buildContext(node, parentCtx), [node, parentCtx]);

  const { layoutProps, widgetProps: extractedWidgetProps } = useMemo(
    () => extractLayoutProps(propsWithVisibleField),
    [propsWithVisibleField],
  );
  const layoutClassName = useMemo(
    () => (hasLayoutProps(propsWithVisibleField) ? resolveLayoutClasses(layoutProps) : ''),
    [propsWithVisibleField, layoutProps],
  );

  if (!visible) return null;

  const widgetEntry = getWidget(node.type);

  if (!widgetEntry) {
    return <div data-widget-error={`Unknown widget: ${node.type}`} />;
  }

  const Component = widgetEntry.component;

  const widgetProps: WidgetProps = {
    props: extractedWidgetProps,
    bind: {
      value: binding?.value ?? null,
      setValue: binding?.setValue,
      meta: binding?.meta,
      error: binding?.error,
      id: resolveBindId(node.bind?.id, parentCtx, routeParams),
    },
    on: triggerHandlers,
    context: {
      record: parentCtx.record,
      model: parentCtx.model,
      mode: parentCtx.mode,
      index: parentCtx.index,
    },
    childNodes: node.children,
    children: node.children ? (
      <WidgetContextProvider value={childContext}>
        {node.children.map((child, i) => (
          <WidgetRenderer
            key={child.id ?? i}
            node={child}
            handlers={handlers}
            fieldMeta={fieldMeta}
            setValue={setValue}
          />
        ))}
      </WidgetContextProvider>
    ) : undefined,
  };

  const dataAttrs: Record<string, string | undefined> = {
    'data-rangka-widget': node.type,
    'data-rangka-id': node.id ?? undefined,
    'data-rangka-model': parentCtx.model || undefined,
    'data-rangka-field': node.bind?.field ?? undefined,
    'data-rangka-mode': parentCtx.mode,
  };

  let rendered: React.ReactNode;

  if (node.bind?.model || node.source) {
    rendered = (
      <WidgetContextProvider value={childContext}>
        <Component {...widgetProps} />
      </WidgetContextProvider>
    );
  } else {
    rendered = <Component {...widgetProps} />;
  }

  if (layoutClassName) {
    return (
      <div className={layoutClassName} {...dataAttrs}>
        {rendered}
      </div>
    );
  }

  return (
    <div className="contents" {...dataAttrs}>
      {rendered}
    </div>
  );
}

function useResolvedProps(props: Record<string, unknown> | undefined): Record<string, unknown> {
  const ctx = useWidgetContext();
  const routeParams = useRouteParams();
  return useMemo(() => {
    if (!props) return {};
    const resolved: Record<string, unknown> = {};
    const flat = flattenContext(ctx);
    const merged: Record<string, unknown> = { ...flat, $route: routeParams };
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'string' && value.includes('{{')) {
        const trimmed = value.trim();
        if (
          trimmed.startsWith('{{') &&
          trimmed.endsWith('}}') &&
          !trimmed.slice(2, -2).includes('{{')
        ) {
          const ast = parse(trimmed);
          resolved[key] = evaluate(ast, merged);
        } else {
          resolved[key] = value.replace(/\{\{(.+?)\}\}/g, (_m, expr: string) => {
            const ast = parse(expr.trim());
            return String(evaluate(ast, merged) ?? '');
          });
        }
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }, [props, ctx, routeParams]);
}

function resolveBindId(
  id: string | undefined,
  ctx: import('../context/types.js').WidgetContext,
  routeParams: Record<string, string>,
): string | undefined {
  if (!id) return undefined;
  if (!id.includes('{{')) return id;
  const flat = flattenContext(ctx);
  const merged: Record<string, unknown> = { ...flat, $route: routeParams };
  const trimmed = id.trim();
  if (trimmed.startsWith('{{') && trimmed.endsWith('}}') && !trimmed.slice(2, -2).includes('{{')) {
    const ast = parse(trimmed);
    const result = evaluate(ast, merged);
    return result != null ? String(result) : undefined;
  }
  return id.replace(/\{\{(.+?)\}\}/g, (_m, expr: string) => {
    const ast = parse(expr.trim());
    return String(evaluate(ast, merged) ?? '');
  });
}
