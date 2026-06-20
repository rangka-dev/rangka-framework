import type { FieldConfig } from './field.js';
import type { HooksConfig } from './hooks.js';

export interface ActionConfig {
  label: string;
  icon?: string;
  position?: 'toolbar' | 'menu' | 'sidebar';
  visible?: (doc: Record<string, unknown>) => boolean;
  confirm?: string;
  handler: string;
}

export interface ExtensionLayoutConfig {
  cards?: Array<{ component: string; position: string }>;
  form?: {
    sections?: Array<{ label: string; fields: string[]; after?: string; columns?: number }>;
  };
}

export interface ExtensionConfig {
  fields?: Record<string, FieldConfig>;
  hooks?: HooksConfig;
  actions?: Record<string, ActionConfig>;
  layout?: ExtensionLayoutConfig;
}
