export interface WidgetSource {
  model: string;
  id?: string;
}

export interface WidgetNode {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  bind?: WidgetBinding;
  source?: WidgetSource;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
  children?: WidgetNode[];
}

export interface WidgetBinding {
  field?: string;
  expression?: string;
  model?: { name: string; filters?: Record<string, unknown>; limit?: number };
  id?: string;
}

export interface Condition {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'notIn' | 'empty' | 'notEmpty' | 'gt' | 'lt' | 'gte' | 'lte';
  value?: unknown;
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
  | FormResetAction;

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

export interface WidgetDefinitionMeta {
  name: string;
  label: string;
  category: 'input' | 'display' | 'layout' | 'action' | 'data';
  schema: Record<string, WidgetPropSchema>;
  binding: 'none' | 'field' | 'expression' | 'record' | 'model';
  triggers: string[];
  container: boolean;
  accepts?: string[];
}

export interface WidgetPropSchema {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array';
  required?: boolean;
  default?: unknown;
  options?: string[];
}
