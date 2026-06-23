export interface FilterOperators {
  eq?: unknown;
  neq?: unknown;
  gt?: unknown;
  gte?: unknown;
  lt?: unknown;
  lte?: unknown;
  in?: unknown[];
  notIn?: unknown[];
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  is?: null | 'not_null';
  between?: [unknown, unknown];
}

export type FilterValue = unknown | FilterOperators;

export interface FilterExpression {
  $or?: FilterExpression[];
  [field: string]: FilterValue | FilterExpression[] | undefined;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryResult {
  data: Record<string, unknown>[];
  total?: number;
  hasMore?: boolean;
}

export interface QueryResultWithMeta {
  data: Record<string, unknown>[];
  meta: PaginationMeta;
}

import type { RequestContext } from '../auth/types.js';
import type { AggregateSpec, AggregateResult, GroupedAggregateResult } from '@rangka/shared';

export interface TranslatedFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface OrFilter {
  operator: '$or';
  branches: TranslatedFilter[][];
}

export type AppliedFilter = TranslatedFilter | OrFilter;

export type IncludeSpec = string | { relation: string; nested?: IncludeSpec[] };

export interface QueryState {
  filters: AppliedFilter[];
  sorts: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limitVal?: number;
  offsetVal?: number;
  pageVal?: number;
  fieldNames: string[];
  includes: IncludeSpec[];
  unscopedFlag: boolean;
  includeArchivedFlag: boolean;
  auth?: RequestContext;
  searchTerm?: string;
  searchFields?: string[];
  groupByFields?: string[];
  aggregateSpec?: AggregateSpec;
}

export type { AggregateSpec, AggregateResult, GroupedAggregateResult };

export interface ModelOps {
  find(state: QueryState): Promise<QueryResult>;
  findWithMeta(state: QueryState): Promise<QueryResultWithMeta>;
  findOne(state: QueryState): Promise<Record<string, unknown> | null>;
  count(state: QueryState): Promise<number>;
  get(id: string): Promise<Record<string, unknown> | null>;
  create(data: Record<string, unknown>, auth?: RequestContext): Promise<Record<string, unknown>>;
  update(
    id: string,
    data: Record<string, unknown>,
    auth?: RequestContext,
  ): Promise<Record<string, unknown>>;
  delete(id: string, auth?: RequestContext): Promise<Record<string, unknown>>;
  createMany(
    data: Record<string, unknown>[],
    auth?: RequestContext,
  ): Promise<Record<string, unknown>[]>;
  aggregate(state: QueryState): Promise<AggregateResult | GroupedAggregateResult>;
  updateAll(state: QueryState, data: Record<string, unknown>): Promise<{ count: number }>;
  deleteAll(state: QueryState): Promise<{ count: number }>;
  withTransaction?(trx: unknown): ModelOps;
  compile?(state: QueryState): unknown;
  compileCount?(state: QueryState): unknown;
}

export interface IncludeResolver {
  resolve(
    records: Record<string, unknown>[],
    includes: IncludeSpec[],
    sourceModel: string,
  ): Promise<void>;
}

export interface ModelQuery {
  filter(conditions: FilterExpression): ModelQuery;
  filterRaw(filters: TranslatedFilter[]): ModelQuery;
  sort(field: string, direction?: 'asc' | 'desc'): ModelQuery;
  limit(count: number): ModelQuery;
  offset(count: number): ModelQuery;
  page(num: number): ModelQuery;
  include(relation: string | IncludeSpec): ModelQuery;
  fields(fieldNames: string[]): ModelQuery;
  search(term: string, fields?: string[]): ModelQuery;
  groupBy(field: string | string[]): ModelQuery;
  unscoped(): ModelQuery;
  includeArchived(): ModelQuery;
  withAuth(auth: import('../auth/types.js').RequestContext): ModelQuery;
  exec(): Promise<QueryResult>;
  execWithMeta(): Promise<QueryResultWithMeta>;
  first(): Promise<Record<string, unknown> | null>;
  count(): Promise<number>;
  aggregate(spec: AggregateSpec): Promise<AggregateResult | GroupedAggregateResult>;
  updateAll(data: Record<string, unknown>): Promise<{ count: number }>;
  deleteAll(): Promise<{ count: number }>;
}

export interface ModelAccess {
  get(model: string, id: string): Promise<Record<string, unknown> | null>;
  query(model: string): ModelQuery;
  create(model: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  update(
    model: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  delete(model: string, id: string): Promise<Record<string, unknown>>;
  createMany(model: string, data: Record<string, unknown>[]): Promise<Record<string, unknown>[]>;
  transaction<T>(fn: (tx: ModelAccess) => Promise<T>): Promise<T>;
}

export interface ModelAccessOptions {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  db: {
    selectFrom(table: string): any;
    insertInto(table: string): any;
    updateTable(table: string): any;
    deleteFrom(table: string): any;
    transaction?: any;
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
  registry: import('../schema/registry.js').SchemaRegistry;
  hookRegistry?: import('../hooks/registry.js').HookRegistry;
  auth?: import('../auth/types.js').RequestContext;
  serviceRegistry?: import('../services/registry.js').ServiceRegistry;
  eventBus?: import('../events/bus.js').EventBus;
  config?: Record<string, unknown>;
  adapterRegistry?: import('../plugins/adapter-registry.js').AdapterRegistry;
  externalModelFields?: Record<
    string,
    Record<string, import('../external-model/types.js').ExternalFieldConfig>
  >;
  adapterCapabilities?: Record<string, import('../plugins/types.js').AdapterCapability[]>;
  dialect?: import('../db/client.js').Dialect;
}
