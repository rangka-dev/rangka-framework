export interface ValidationConfig {
  format?: string;
  min?: number;
  max?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  message?: string;
}

export interface BaseFieldOptions {
  required?: boolean;
  label?: string;
  hidden?: boolean;
  readOnly?: boolean;
  searchable?: boolean;
  default?: unknown;
  validation?: ValidationConfig;
}

export interface StringFieldConfig extends BaseFieldOptions {
  type: 'string';
  maxLength?: number;
  default?: string;
}

export interface TextFieldConfig extends BaseFieldOptions {
  type: 'text';
  default?: string;
}

export interface IntFieldConfig extends BaseFieldOptions {
  type: 'int';
  default?: number;
}

export interface DecimalFieldConfig extends BaseFieldOptions {
  type: 'decimal';
  precision?: number;
  scale?: number;
  default?: number;
}

export interface BooleanFieldConfig extends BaseFieldOptions {
  type: 'boolean';
  default?: boolean;
}

export interface DateFieldConfig extends BaseFieldOptions {
  type: 'date';
  default?: string;
}

export interface DatetimeFieldConfig extends BaseFieldOptions {
  type: 'datetime';
  default?: string;
}

export interface EnumFieldConfig extends BaseFieldOptions {
  type: 'enum';
  options: readonly string[];
  default?: string;
}

export interface JsonFieldConfig extends BaseFieldOptions {
  type: 'json';
  default?: unknown;
}

export interface LinkFieldConfig extends BaseFieldOptions {
  type: 'link';
  model: string;
  nullable?: boolean;
}

export interface HasManyFieldConfig {
  type: 'hasMany';
  model: string;
  foreignKey: string;
}

export interface ChildrenFieldConfig {
  type: 'children';
  model: string;
  foreignKey: string;
  fields?: Record<string, FieldConfig>;
}

export interface ManyToManyFieldConfig {
  type: 'manyToMany';
  model: string;
  through: string;
}

export interface DynamicLinkFieldConfig extends BaseFieldOptions {
  type: 'dynamicLink';
  modelField: string;
}

export interface MoneyFieldConfig extends BaseFieldOptions {
  type: 'money';
}

export interface CodeFieldConfig extends BaseFieldOptions {
  type: 'code';
  language: 'expression';
}

export interface TreeFieldConfig extends BaseFieldOptions {
  type: 'tree';
  parentField: string;
  strategy: 'materialized_path' | 'nested_set' | 'closure_table';
}

export interface SequenceFieldConfig {
  type: 'sequence';
  prefix?: string;
  digits?: number;
}

export interface AttachmentFieldConfig extends BaseFieldOptions {
  type: 'attachment';
  accept?: string[];
  maxSize?: string;
}

export interface AttachmentsFieldConfig extends BaseFieldOptions {
  type: 'attachments';
  accept?: string[];
  maxSize?: string;
  maxCount?: number;
}

import type { FrameworkContext } from './context.js';

export interface ComputedFieldConfig {
  type: 'computed';
  depends: string[];
  compute: (doc: Record<string, unknown>, ctx?: FrameworkContext) => unknown | Promise<unknown>;
}

export type FieldConfig =
  | StringFieldConfig
  | TextFieldConfig
  | IntFieldConfig
  | DecimalFieldConfig
  | BooleanFieldConfig
  | DateFieldConfig
  | DatetimeFieldConfig
  | EnumFieldConfig
  | JsonFieldConfig
  | LinkFieldConfig
  | HasManyFieldConfig
  | ChildrenFieldConfig
  | ManyToManyFieldConfig
  | DynamicLinkFieldConfig
  | MoneyFieldConfig
  | CodeFieldConfig
  | TreeFieldConfig
  | SequenceFieldConfig
  | AttachmentFieldConfig
  | AttachmentsFieldConfig
  | ComputedFieldConfig;
