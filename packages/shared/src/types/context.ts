import type { SchemaRegistryInterface } from './schema-registry.js';
import type { ContextAuth } from './auth.js';

export interface JobOptions {
  delay?: number;
  unique?: boolean;
  uniqueKey?: string;
}

export interface ServiceInstance {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [method: string]: (...args: any[]) => any;
}

export interface ModelQueryInterface {
  filter(conditions: Record<string, unknown>): ModelQueryInterface;
  sort(field: string, direction?: 'asc' | 'desc'): ModelQueryInterface;
  limit(count: number): ModelQueryInterface;
  offset(count: number): ModelQueryInterface;
  page(num: number): ModelQueryInterface;
  include(relation: string): ModelQueryInterface;
  fields(fieldNames: string[]): ModelQueryInterface;
  unscoped(): ModelQueryInterface;
  includeArchived(): ModelQueryInterface;
  exec(): Promise<{ data: Record<string, unknown>[]; total?: number; hasMore?: boolean }>;
  execWithMeta(): Promise<{
    data: Record<string, unknown>[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>;
  first(): Promise<Record<string, unknown> | null>;
  count(): Promise<number>;
}

export interface ModelAccessInterface {
  get(model: string, id: string): Promise<Record<string, unknown> | null>;
  query(model: string): ModelQueryInterface;
  create(model: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  update(
    model: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  delete(model: string, id: string): Promise<Record<string, unknown>>;
}

export interface FrameworkContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
  schema: SchemaRegistryInterface;
  scope: unknown;
  models: ModelAccessInterface;
  events: {
    emit: (event: string, payload: unknown) => Promise<void>;
    on: (event: string, handler: (payload: unknown) => Promise<void>) => void;
  };
  auth: ContextAuth;
  config: Record<string, unknown>;
  service: (name: string) => ServiceInstance;
  enqueue: (job: string, data: unknown, opts?: JobOptions) => Promise<void>;
  notify: (channel: string, message: unknown) => void;
  email: {
    send: (template: string, options: Record<string, unknown>) => Promise<void>;
  };
}
