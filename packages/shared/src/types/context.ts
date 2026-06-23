import type { SchemaRegistryInterface } from './schema-registry.js';
import type { ContextAuth } from './auth.js';
import type { Kysely } from 'kysely';
import type {
  FilterExpression,
  AggregateSpec,
  AggregateResult,
  GroupedAggregateResult,
  QueryResult,
  QueryResultWithMeta,
} from './model-api.js';

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
  filter(conditions: FilterExpression): ModelQueryInterface;
  search(term: string, fields?: string[]): ModelQueryInterface;
  sort(field: string, direction?: 'asc' | 'desc'): ModelQueryInterface;
  limit(count: number): ModelQueryInterface;
  offset(count: number): ModelQueryInterface;
  page(num: number): ModelQueryInterface;
  fields(fieldNames: string[]): ModelQueryInterface;
  include(relation: string): ModelQueryInterface;
  unscoped(): ModelQueryInterface;
  includeArchived(): ModelQueryInterface;
  groupBy(field: string): ModelQueryInterface;
  groupBy(fields: string[]): ModelQueryInterface;

  exec(): Promise<QueryResult>;
  execWithMeta(): Promise<QueryResultWithMeta>;
  first(): Promise<Record<string, unknown> | null>;
  count(): Promise<number>;
  aggregate(spec: AggregateSpec): Promise<AggregateResult | GroupedAggregateResult>;

  updateAll(data: Record<string, unknown>): Promise<{ count: number }>;
  deleteAll(): Promise<{ count: number }>;
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
  createMany(model: string, data: Record<string, unknown>[]): Promise<Record<string, unknown>[]>;
  transaction<T>(fn: (tx: ModelAccessInterface) => Promise<T>): Promise<T>;
}

export interface FrameworkContext {
  db: Kysely<unknown>;
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
