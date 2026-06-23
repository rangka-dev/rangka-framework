import type { SchemaRegistry } from '../schema/registry.js';
import type { ResolvedModel } from '../schema/types.js';
import type { RequestContext } from '../auth/types.js';
import type { AggregateResult, AggregateSpec, GroupedAggregateResult } from '@rangka/shared';
import type {
  AppliedFilter,
  FilterExpression,
  IncludeResolver,
  IncludeSpec,
  ModelOps,
  ModelQuery,
  QueryResult,
  QueryResultWithMeta,
  QueryState,
} from './types.js';
import { translateFilters } from './filter-translator.js';

export type { QueryState } from './types.js';

export class ModelQueryBuilder implements ModelQuery {
  private readonly ops: ModelOps;
  private readonly model: ResolvedModel;
  private readonly registry: SchemaRegistry;
  private readonly includeResolver?: IncludeResolver;
  private readonly state: QueryState;

  constructor(
    ops: ModelOps,
    model: ResolvedModel,
    registry: SchemaRegistry,
    includeResolver?: IncludeResolver,
    state?: QueryState,
  ) {
    this.ops = ops;
    this.model = model;
    this.registry = registry;
    this.includeResolver = includeResolver;
    this.state = state ?? {
      filters: [],
      sorts: [],
      fieldNames: [],
      includes: [],
      unscopedFlag: false,
      includeArchivedFlag: false,
    };
  }

  private clone(patch: Partial<QueryState>): ModelQueryBuilder {
    return new ModelQueryBuilder(this.ops, this.model, this.registry, this.includeResolver, {
      ...this.state,
      ...patch,
    });
  }

  filter(conditions: FilterExpression): ModelQueryBuilder {
    const translated = translateFilters(conditions);
    return this.clone({ filters: [...this.state.filters, ...translated] });
  }

  filterRaw(filters: AppliedFilter[]): ModelQueryBuilder {
    return this.clone({ filters: [...this.state.filters, ...filters] });
  }

  sort(field: string, direction: 'asc' | 'desc' = 'asc'): ModelQueryBuilder {
    return this.clone({ sorts: [...this.state.sorts, { field, direction }] });
  }

  limit(count: number): ModelQueryBuilder {
    return this.clone({ limitVal: count });
  }

  offset(count: number): ModelQueryBuilder {
    return this.clone({ offsetVal: count });
  }

  page(num: number): ModelQueryBuilder {
    return this.clone({ pageVal: num });
  }

  include(relation: string | IncludeSpec): ModelQueryBuilder {
    const spec: IncludeSpec = relation;
    const key = typeof spec === 'string' ? spec : spec.relation;
    if (this.state.includes.some((i) => (typeof i === 'string' ? i : i.relation) === key))
      return this;
    return this.clone({ includes: [...this.state.includes, spec] });
  }

  fields(fieldNames: string[]): ModelQueryBuilder {
    return this.clone({ fieldNames });
  }

  unscoped(): ModelQueryBuilder {
    return this.clone({ unscopedFlag: true });
  }

  includeArchived(): ModelQueryBuilder {
    return this.clone({ includeArchivedFlag: true });
  }

  search(term: string, fields?: string[]): ModelQueryBuilder {
    if (!term) return this;
    const searchFields =
      fields ??
      this.model.fields
        .filter((f) => (f.config as { searchable?: boolean }).searchable)
        .map((f) => f.name);
    if (searchFields.length === 0) return this;
    return this.clone({ searchTerm: term, searchFields });
  }

  withAuth(auth: RequestContext): ModelQueryBuilder {
    return this.clone({ auth });
  }

  groupBy(field: string | string[]): ModelQueryBuilder {
    const fields = Array.isArray(field) ? field : [field];
    return this.clone({ groupByFields: fields });
  }

  isUnscoped(): boolean {
    return this.state.unscopedFlag;
  }

  getIncludes(): IncludeSpec[] {
    return this.state.includes;
  }

  compile(): unknown {
    return this.ops.compile?.(this.state) ?? this.state;
  }

  compileCount(): unknown {
    return this.ops.compileCount?.(this.state) ?? this.state;
  }

  async exec(): Promise<QueryResult> {
    const result = await this.ops.find(this.state);
    if (this.state.includes.length > 0 && this.includeResolver) {
      await this.includeResolver.resolve(
        result.data,
        this.state.includes,
        this.model.qualifiedName,
      );
    }
    return result;
  }

  async execWithMeta(): Promise<QueryResultWithMeta> {
    const result = await this.ops.findWithMeta(this.state);
    if (this.state.includes.length > 0 && this.includeResolver) {
      await this.includeResolver.resolve(
        result.data,
        this.state.includes,
        this.model.qualifiedName,
      );
    }
    return result;
  }

  async first(): Promise<Record<string, unknown> | null> {
    const result = await this.ops.findOne(this.state);
    if (result && this.state.includes.length > 0 && this.includeResolver) {
      await this.includeResolver.resolve([result], this.state.includes, this.model.qualifiedName);
    }
    return result;
  }

  async count(): Promise<number> {
    return this.ops.count(this.state);
  }

  async aggregate(spec: AggregateSpec): Promise<AggregateResult | GroupedAggregateResult> {
    return this.ops.aggregate(this.clone({ aggregateSpec: spec }).state);
  }

  async updateAll(data: Record<string, unknown>): Promise<{ count: number }> {
    return this.ops.updateAll(this.state, data);
  }

  async deleteAll(): Promise<{ count: number }> {
    return this.ops.deleteAll(this.state);
  }
}
