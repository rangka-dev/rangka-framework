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
}

export type FilterValue = unknown | FilterOperators;

export type FilterExpression = Record<string, FilterValue>;

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

export interface TranslatedFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface QueryState {
  filters: TranslatedFilter[];
  sorts: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limitVal?: number;
  offsetVal?: number;
  pageVal?: number;
  fieldNames: string[];
  includes: string[];
  unscopedFlag: boolean;
  includeArchivedFlag: boolean;
  auth?: RequestContext;
  searchTerm?: string;
  searchFields?: string[];
}

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
  withTransaction?(trx: unknown): ModelOps;
  compile?(state: QueryState): unknown;
  compileCount?(state: QueryState): unknown;
}

export interface IncludeResolver {
  resolve(
    records: Record<string, unknown>[],
    includes: string[],
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
  include(relation: string): ModelQuery;
  fields(fieldNames: string[]): ModelQuery;
  search(term: string, fields: string[]): ModelQuery;
  unscoped(): ModelQuery;
  includeArchived(): ModelQuery;
  withAuth(auth: import('../auth/types.js').RequestContext): ModelQuery;
  exec(): Promise<QueryResult>;
  execWithMeta(): Promise<QueryResultWithMeta>;
  first(): Promise<Record<string, unknown> | null>;
  count(): Promise<number>;
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
}

export interface ModelAccessOptions {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  db: {
    selectFrom(table: string): any;
    insertInto(table: string): any;
    updateTable(table: string): any;
    deleteFrom(table: string): any;
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
}
