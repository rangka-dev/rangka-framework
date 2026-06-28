export type {
  Condition,
  WidgetBinding,
  WidgetSource,
  WidgetDefinitionMeta,
  WidgetPropSchema,
} from '../validation/schemas/widget.js';

export type { BuiltinWidgetType, WidgetType } from '../validation/schemas/widget-props/index.js';

import type { Condition, WidgetBinding, WidgetSource } from '../validation/schemas/widget.js';
import type { WidgetType } from '../validation/schemas/widget-props/index.js';

// WidgetNode and WidgetAction must remain authored interfaces because
// the recursive z.lazy() schema uses z.ZodType (untyped) to break circular inference.

export interface WidgetNode {
  id?: string;
  type: WidgetType;
  props?: Record<string, unknown>;
  bind?: WidgetBinding;
  source?: WidgetSource;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
  children?: WidgetNode[];
}

export type WidgetAction =
  | SetValueAction
  | ClearValueAction
  | SetValuesAction
  | FetchOptionsAction
  | RefreshSourceAction
  | ServiceAction
  | ValidateAction
  | ModelCreateAction
  | ModelUpdateAction
  | ModelDeleteAction
  | ModelFetchAction
  | ModelListAction
  | NavigateAction
  | FocusAction
  | AddRowAction
  | RemoveRowAction
  | DuplicateRowAction
  | SequenceAction
  | ConditionalAction
  | FormSubmitAction
  | FormResetAction
  | ToastAction;

export interface SetValueAction {
  type: 'setValue';
  field: string;
  value: unknown;
}

export interface ClearValueAction {
  type: 'clearValue';
  field: string;
}

export interface SetValuesAction {
  type: 'setValues';
  values: Record<string, unknown>;
}

export interface FetchOptionsAction {
  type: 'fetchOptions';
  field: string;
  depends: string[];
}

export interface RefreshSourceAction {
  type: 'refreshSource';
}

export interface ServiceAction {
  type: 'service';
  name: string;
  params?: Record<string, unknown>;
  context?: string;
  onSuccess?: WidgetAction;
  onError?: WidgetAction;
}

export interface ValidateAction {
  type: 'validate';
  fields?: string[];
}

export interface ModelCreateAction {
  type: 'model.create';
  model: string;
  data: Record<string, unknown>;
}

export interface ModelUpdateAction {
  type: 'model.update';
  model?: string;
  id?: string;
  data: Record<string, unknown>;
}

export interface ModelDeleteAction {
  type: 'model.delete';
  model?: string;
  id?: string;
}

export interface ModelFetchAction {
  type: 'model.fetch';
  model: string;
  id: string;
  into: string;
}

export interface ModelListAction {
  type: 'model.list';
  model: string;
  filters?: Record<string, unknown>;
  into: string;
}

export interface NavigateAction {
  type: 'navigate';
  path: string;
}

export interface FocusAction {
  type: 'focus';
  field: string;
}

export interface AddRowAction {
  type: 'addRow';
  field: string;
}

export interface RemoveRowAction {
  type: 'removeRow';
  field: string;
}

export interface DuplicateRowAction {
  type: 'duplicateRow';
  field: string;
}

export interface SequenceAction {
  type: 'sequence';
  actions: WidgetAction[];
}

export interface ConditionalAction {
  type: 'conditional';
  condition: Condition;
  then: WidgetAction;
  else?: WidgetAction;
}

export interface FormSubmitAction {
  type: 'form.submit';
}

export interface FormResetAction {
  type: 'form.reset';
}

export interface ToastAction {
  type: 'toast';
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}
