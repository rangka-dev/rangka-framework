import type { ComponentType, ReactNode } from 'react';

export type FieldType =
  | 'string'
  | 'int'
  | 'decimal'
  | 'money'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'enum'
  | 'link'
  | 'many-to-many'
  | 'attachment'
  | 'attachments'
  | 'json'
  | 'text';

export interface WidgetBindMeta {
  type: FieldType;
  label: string;
  required: boolean;
  readOnly: boolean;
  options?: Array<{ value: string; label: string }>;
}

export interface WidgetBind {
  value: unknown;
  setValue?: (val: unknown) => void;
  meta?: WidgetBindMeta;
  error?: string;
  id?: string;
}

export interface WidgetContext {
  record: Record<string, unknown>;
  model: string;
  mode: 'view' | 'edit';
  index?: number;
}

export interface WidgetNode {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  children?: WidgetNode[];
}

export interface WidgetComponentProps {
  props: Record<string, unknown>;
  bind: WidgetBind;
  on: Record<string, (...args: unknown[]) => void>;
  context: WidgetContext;
  childNodes?: WidgetNode[];
  children?: ReactNode;
}

export type WidgetComponent = ComponentType<WidgetComponentProps>;

export type WidgetRegistry = Record<string, WidgetComponent>;
