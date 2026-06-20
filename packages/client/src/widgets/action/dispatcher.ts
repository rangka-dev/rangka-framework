import type { WidgetAction } from '@rangka/shared';
import type { WidgetContext } from '../context/types.js';
import type { StateStore } from '../state/store.js';
import { parse, evaluate } from '../expression/index.js';
import { flattenContext } from '../context/types.js';

export interface ActionContext {
  widgetContext: WidgetContext;
  state: StateStore;
  response?: Record<string, unknown>;
  selected?: Record<string, unknown>;
}

export interface ActionHandlers {
  navigate?: (path: string) => void;
  service?: (name: string, params: Record<string, unknown>) => Promise<Record<string, unknown>>;
  refreshSource?: () => void;
  focus?: (field: string) => void;
  fetchOptions?: (field: string, depends: string[]) => void;
  validate?: (fields?: string[]) => Promise<boolean>;
  modelCreate?: (model: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>;
  modelUpdate?: (
    model: string,
    id: string,
    data: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  modelDelete?: (model: string, id: string) => Promise<void>;
  modelFetch?: (model: string, id: string) => Promise<Record<string, unknown>>;
  modelList?: (
    model: string,
    filters?: Record<string, unknown>,
  ) => Promise<Record<string, unknown>[]>;
  setRecordValue?: (field: string, value: unknown) => void;
  addRow?: (field: string) => void;
  removeRow?: (field: string) => void;
  duplicateRow?: (field: string) => void;
  formSubmit?: () => Promise<void>;
  formReset?: () => void;
}

export async function dispatch(
  action: WidgetAction,
  actionCtx: ActionContext,
  handlers: ActionHandlers,
): Promise<void> {
  switch (action.type) {
    case 'setValue':
      return handleSetValue(action.field, action.value, actionCtx, handlers);
    case 'clearValue':
      return handleSetValue(action.field, null, actionCtx, handlers);
    case 'setValues':
      return handleSetValues(action.values, actionCtx, handlers);
    case 'navigate':
      return handleNavigate(action.path, actionCtx, handlers);
    case 'service':
      return handleService(action, actionCtx, handlers);
    case 'refreshSource':
      handlers.refreshSource?.();
      return;
    case 'focus':
      handlers.focus?.(action.field);
      return;
    case 'fetchOptions':
      handlers.fetchOptions?.(action.field, action.depends);
      return;
    case 'validate':
      await handlers.validate?.(action.fields);
      return;
    case 'model.create':
      return handleModelCreate(action, actionCtx, handlers);
    case 'model.update':
      return handleModelUpdate(action, actionCtx, handlers);
    case 'model.delete':
      return handleModelDelete(action, actionCtx, handlers);
    case 'model.fetch':
      return handleModelFetch(action, actionCtx, handlers);
    case 'model.list':
      return handleModelList(action, actionCtx, handlers);
    case 'addRow':
      handlers.addRow?.(action.field);
      return;
    case 'removeRow':
      handlers.removeRow?.(action.field);
      return;
    case 'duplicateRow':
      handlers.duplicateRow?.(action.field);
      return;
    case 'form.submit':
      await handlers.formSubmit?.();
      return;
    case 'form.reset':
      handlers.formReset?.();
      return;
    case 'sequence':
      return handleSequence(action.actions, actionCtx, handlers);
    case 'conditional':
      return handleConditional(action, actionCtx, handlers);
  }
}

function handleSetValue(
  field: string,
  value: unknown,
  actionCtx: ActionContext,
  handlers: ActionHandlers,
): void {
  const resolved = resolveExpressionValue(value, actionCtx);

  if (field.startsWith('$state.')) {
    const key = field.slice(7);
    actionCtx.state.set(key, resolved);
  } else if (
    field.startsWith('$filter.') ||
    field.startsWith('$sort.') ||
    field.startsWith('$page.')
  ) {
    // Reactive query variables are stored with their full key (including prefix)
    actionCtx.state.set(field, resolved);
  } else if (field.startsWith('$parent.')) {
    const realField = field.slice(8);
    handlers.setRecordValue?.(realField, resolved);
  } else {
    actionCtx.widgetContext.record[field] = resolved;
    handlers.setRecordValue?.(field, resolved);
  }
}

function handleSetValues(
  values: Record<string, unknown>,
  actionCtx: ActionContext,
  handlers: ActionHandlers,
): void {
  const stateUpdates: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(values)) {
    const resolved = resolveExpressionValue(value, actionCtx);
    if (field.startsWith('$state.')) {
      stateUpdates[field.slice(7)] = resolved;
    } else if (
      field.startsWith('$filter.') ||
      field.startsWith('$sort.') ||
      field.startsWith('$page.')
    ) {
      // Reactive query variables stored with full key
      stateUpdates[field] = resolved;
    } else {
      handlers.setRecordValue?.(field, resolved);
    }
  }

  if (Object.keys(stateUpdates).length > 0) {
    actionCtx.state.setMany(stateUpdates);
  }
}

function handleNavigate(path: string, actionCtx: ActionContext, handlers: ActionHandlers): void {
  const resolved = String(resolveExpressionValue(path, actionCtx) ?? path);
  handlers.navigate?.(resolved);
}

async function handleService(
  action: {
    type: 'service';
    name: string;
    params?: Record<string, unknown>;
    context?: string;
    onSuccess?: WidgetAction;
    onError?: WidgetAction;
  },
  actionCtx: ActionContext,
  handlers: ActionHandlers,
): Promise<void> {
  const params: Record<string, unknown> = {};
  if (action.params) {
    for (const [key, value] of Object.entries(action.params)) {
      params[key] = resolveExpressionValue(value, actionCtx);
    }
  }

  try {
    const response = await handlers.service?.(action.name, params);
    if (action.onSuccess) {
      const successCtx: ActionContext = {
        ...actionCtx,
        response: response ?? {},
      };
      await dispatch(action.onSuccess, successCtx, handlers);
    } else {
      handlers.refreshSource?.();
    }
  } catch (err) {
    if (action.onError) {
      const errorCtx: ActionContext = {
        ...actionCtx,
        response: err instanceof Error ? { message: err.message } : { message: String(err) },
      };
      await dispatch(action.onError, errorCtx, handlers);
    }
  }
}

async function handleModelCreate(
  action: { type: 'model.create'; model: string; data: Record<string, unknown> },
  actionCtx: ActionContext,
  handlers: ActionHandlers,
): Promise<void> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(action.data)) {
    data[key] = resolveExpressionValue(value, actionCtx);
  }
  await handlers.modelCreate?.(action.model, data);
}

async function handleModelUpdate(
  action: { type: 'model.update'; model?: string; id?: string; data: Record<string, unknown> },
  actionCtx: ActionContext,
  handlers: ActionHandlers,
): Promise<void> {
  const model = action.model ?? actionCtx.widgetContext.model;
  const id = action.id
    ? String(resolveExpressionValue(action.id, actionCtx))
    : String(actionCtx.widgetContext.record['id'] ?? '');
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(action.data)) {
    data[key] = resolveExpressionValue(value, actionCtx);
  }
  await handlers.modelUpdate?.(model, id, data);
}

async function handleModelDelete(
  action: { type: 'model.delete'; model?: string; id?: string },
  actionCtx: ActionContext,
  handlers: ActionHandlers,
): Promise<void> {
  const model = action.model ?? actionCtx.widgetContext.model;
  const id = action.id
    ? String(resolveExpressionValue(action.id, actionCtx))
    : String(actionCtx.widgetContext.record['id'] ?? '');
  await handlers.modelDelete?.(model, id);
}

async function handleModelFetch(
  action: { type: 'model.fetch'; model: string; id: string; into: string },
  actionCtx: ActionContext,
  handlers: ActionHandlers,
): Promise<void> {
  const id = String(resolveExpressionValue(action.id, actionCtx));
  const result = await handlers.modelFetch?.(action.model, id);
  if (result && action.into === '$record') {
    for (const [key, value] of Object.entries(result)) {
      handlers.setRecordValue?.(key, value);
    }
  }
}

async function handleModelList(
  action: { type: 'model.list'; model: string; filters?: Record<string, unknown>; into: string },
  actionCtx: ActionContext,
  handlers: ActionHandlers,
): Promise<void> {
  const filters: Record<string, unknown> = {};
  if (action.filters) {
    for (const [key, value] of Object.entries(action.filters)) {
      filters[key] = resolveExpressionValue(value, actionCtx);
    }
  }
  await handlers.modelList?.(action.model, filters);
}

async function handleSequence(
  actions: WidgetAction[],
  actionCtx: ActionContext,
  handlers: ActionHandlers,
): Promise<void> {
  for (const action of actions) {
    await dispatch(action, actionCtx, handlers);
  }
}

async function handleConditional(
  action: {
    type: 'conditional';
    condition: { field: string; operator: string; value?: unknown };
    then: WidgetAction;
    else?: WidgetAction;
  },
  actionCtx: ActionContext,
  handlers: ActionHandlers,
): Promise<void> {
  const { evaluateCondition } = await import('../condition/evaluator.js');
  const flat = flattenContext(actionCtx.widgetContext);
  const merged = {
    ...flat,
    $state: Object.fromEntries(actionCtx.state.keys().map((k) => [k, actionCtx.state.get(k)])),
  };
  const result = evaluateCondition(
    action.condition as Parameters<typeof evaluateCondition>[0],
    merged,
  );
  if (result) {
    await dispatch(action.then, actionCtx, handlers);
  } else if (action.else) {
    await dispatch(action.else, actionCtx, handlers);
  }
}

export function resolveExpressionValue(value: unknown, actionCtx: ActionContext): unknown {
  if (typeof value !== 'string') return value;
  if (!value.includes('{{')) return value;

  const flat = flattenContext(actionCtx.widgetContext);
  const merged: Record<string, unknown> = {
    ...flat,
    $state: Object.fromEntries(actionCtx.state.keys().map((k) => [k, actionCtx.state.get(k)])),
  };
  if (actionCtx.response) {
    merged['$response'] = actionCtx.response;
  }
  if (actionCtx.selected) {
    merged['$selected'] = actionCtx.selected;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('{{') && trimmed.endsWith('}}') && !trimmed.slice(2, -2).includes('{{')) {
    const ast = parse(trimmed);
    return evaluate(ast, merged);
  }

  return value.replace(/\{\{(.+?)\}\}/g, (_match, expr: string) => {
    const ast = parse(expr.trim());
    const result = evaluate(ast, merged);
    return String(result ?? '');
  });
}
