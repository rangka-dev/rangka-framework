import type {
  WidgetAction,
  SetValueAction,
  ClearValueAction,
  SetValuesAction,
  FetchOptionsAction,
  RefreshSourceAction,
  ServiceAction,
  ValidateAction,
  ModelCreateAction,
  ModelUpdateAction,
  ModelDeleteAction,
  ModelFetchAction,
  ModelListAction,
  NavigateAction,
  FocusAction,
  AddRowAction,
  RemoveRowAction,
  DuplicateRowAction,
  SequenceAction,
  ConditionalAction,
  FormSubmitAction,
  FormResetAction,
} from './types/widget.js';
import type { Condition } from './validation/schemas/widget.js';

/**
 * Factory for creating typed widget actions.
 *
 * Use as a function for any action type, or use named helpers for built-in types.
 *
 * @example
 * ```ts
 * action('navigate', { path: '/home' })
 * action.navigate('/home')
 * action.service('sales.submit', { id: '$id' })
 * action.sequence([action.submit(), action.navigate('/list')])
 * ```
 */
export const action = Object.assign(
  function action(type: string, params?: Record<string, unknown>): WidgetAction {
    return { type, ...params } as WidgetAction;
  },
  {
    setValue(field: string, value: unknown): SetValueAction {
      return { type: 'setValue', field, value };
    },

    clearValue(field: string): ClearValueAction {
      return { type: 'clearValue', field };
    },

    setValues(values: Record<string, unknown>): SetValuesAction {
      return { type: 'setValues', values };
    },

    fetchOptions(field: string, depends: string[]): FetchOptionsAction {
      return { type: 'fetchOptions', field, depends };
    },

    refreshSource(): RefreshSourceAction {
      return { type: 'refreshSource' };
    },

    service(name: string, params?: Record<string, unknown>): ServiceAction {
      const a: ServiceAction = { type: 'service', name };
      if (params) a.params = params;
      return a;
    },

    validate(fields?: string[]): ValidateAction {
      const a: ValidateAction = { type: 'validate' };
      if (fields) a.fields = fields;
      return a;
    },

    modelCreate(model: string, data: Record<string, unknown>): ModelCreateAction {
      return { type: 'model.create', model, data };
    },

    modelUpdate(
      data: Record<string, unknown>,
      opts?: { model?: string; id?: string },
    ): ModelUpdateAction {
      const a: ModelUpdateAction = { type: 'model.update', data };
      if (opts?.model) a.model = opts.model;
      if (opts?.id) a.id = opts.id;
      return a;
    },

    modelDelete(opts?: { model?: string; id?: string }): ModelDeleteAction {
      const a: ModelDeleteAction = { type: 'model.delete' };
      if (opts?.model) a.model = opts.model;
      if (opts?.id) a.id = opts.id;
      return a;
    },

    modelFetch(model: string, id: string, into: string): ModelFetchAction {
      return { type: 'model.fetch', model, id, into };
    },

    modelList(model: string, into: string, filters?: Record<string, unknown>): ModelListAction {
      const a: ModelListAction = { type: 'model.list', model, into };
      if (filters) a.filters = filters;
      return a;
    },

    navigate(path: string): NavigateAction {
      return { type: 'navigate', path };
    },

    focus(field: string): FocusAction {
      return { type: 'focus', field };
    },

    addRow(field: string): AddRowAction {
      return { type: 'addRow', field };
    },

    removeRow(field: string): RemoveRowAction {
      return { type: 'removeRow', field };
    },

    duplicateRow(field: string): DuplicateRowAction {
      return { type: 'duplicateRow', field };
    },

    sequence(actions: WidgetAction[]): SequenceAction {
      return { type: 'sequence', actions };
    },

    conditional(
      condition: Condition,
      then: WidgetAction,
      otherwise?: WidgetAction,
    ): ConditionalAction {
      const a: ConditionalAction = { type: 'conditional', condition, then };
      if (otherwise) a.else = otherwise;
      return a;
    },

    submit(): FormSubmitAction {
      return { type: 'form.submit' };
    },

    reset(): FormResetAction {
      return { type: 'form.reset' };
    },
  },
);
