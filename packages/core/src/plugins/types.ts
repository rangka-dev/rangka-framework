/* eslint-disable @typescript-eslint/no-explicit-any */

export type AdapterCapability =
  | 'read'
  | 'list'
  | 'filter'
  | 'sort'
  | 'create'
  | 'update'
  | 'delete';

export interface FilterExpression {
  field: string;
  operator: string;
  value: unknown;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  sort?: { field: string; direction: 'asc' | 'desc' };
  filters?: FilterExpression[];
}

export interface ListResult {
  data: Record<string, unknown>[];
  total?: number;
  hasMore?: boolean;
}

export interface DataAdapter {
  get(model: string, id: string): Promise<Record<string, unknown> | null>;
  list?(model: string, query: ListQuery): Promise<ListResult>;
  create?(model: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  update?(
    model: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  delete?(model: string, id: string): Promise<void>;
  filter?(model: string, filters: FilterExpression[]): Promise<ListResult>;
  batchGet?(model: string, ids: string[]): Promise<Record<string, unknown>[]>;
}

export type PluginLifecycleEvent =
  | 'beforeBoot'
  | 'afterBoot'
  | 'beforeRequest'
  | 'afterRequest'
  | 'beforeShutdown';

export interface PluginConfigField {
  type: string;
  required?: boolean;
  default?: unknown;
}

export interface PluginProvides {
  adapters?: Array<{ name: string; capabilities: AdapterCapability[] }>;
}

export interface PluginBootContext {
  config: Record<string, unknown>;
  adapters: Record<string, { implement(impl: DataAdapter): void }>;
  on(event: PluginLifecycleEvent, handler: (...args: any[]) => Promise<void>): void;
}

export interface PluginDefinition {
  name: string;
  version: string;
  config?: Record<string, PluginConfigField>;
  provides?: PluginProvides;
  boot(ctx: PluginBootContext): void | Promise<void>;
}

export type LifecycleHandler = (...args: any[]) => Promise<void>;
