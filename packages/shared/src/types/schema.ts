import type { FieldConfig } from './field.js';

export type Trait = 'ledger' | 'timestamped' | 'soft_delete';

export type NamingConfig = string;

export interface IndexConfig {
  fields: string[];
  unique?: boolean;
}

export type ScopeConfig = string | { name: string; field: string };

export interface ModelConfig {
  name: string;
  label?: string;
  naming?: NamingConfig;
  scope?: ScopeConfig;
  auditLog?: boolean;
  crud?: boolean;
  fields: Record<string, FieldConfig>;
  indexes?: IndexConfig[];
  traits?: Trait[];
}

/** @deprecated Use ModelConfig instead */
export type SchemaConfig = ModelConfig;
