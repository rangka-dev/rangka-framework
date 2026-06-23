import type {
  ModelOps,
  QueryState,
  QueryResult,
  QueryResultWithMeta,
  TranslatedFilter,
  AppliedFilter,
} from '../model-api/types.js';
import type { RequestContext } from '../auth/types.js';
import type { DataAdapter, AdapterCapability } from '../plugins/types.js';
import type { ExternalFieldConfig } from './types.js';
import type { AggregateResult, GroupedAggregateResult } from '@rangka/shared';
import { UnsupportedOperationError } from '@rangka/shared';
import { ExternalQueryExecutor } from './query-executor.js';
import { ExternalMutationExecutor, CapabilityNotSupportedError } from './mutation-executor.js';

export { CapabilityNotSupportedError };

function toTranslatedFilters(filters: AppliedFilter[]): TranslatedFilter[] {
  return filters.filter((f): f is TranslatedFilter => f.operator !== '$or');
}

export interface ExternalModelOpsConfig {
  adapter: DataAdapter;
  adapterName: string;
  modelName: string;
  fields: Record<string, ExternalFieldConfig>;
  capabilities: AdapterCapability[];
}

export class ExternalModelOps implements ModelOps {
  private readonly queryExecutor: ExternalQueryExecutor;
  private readonly mutationExecutor: ExternalMutationExecutor;
  private readonly modelName: string;

  constructor(config: ExternalModelOpsConfig) {
    this.modelName = config.modelName;
    this.queryExecutor = new ExternalQueryExecutor({
      adapter: config.adapter,
      modelName: config.modelName,
      fields: config.fields,
      capabilities: config.capabilities,
    });
    this.mutationExecutor = new ExternalMutationExecutor({
      adapter: config.adapter,
      adapterName: config.adapterName,
      modelName: config.modelName,
      fields: config.fields,
      capabilities: config.capabilities,
    });
  }

  async find(state: QueryState): Promise<QueryResult> {
    const result = await this.queryExecutor.execList({
      filters: toTranslatedFilters(state.filters),
      sorts: state.sorts,
      fieldNames: state.fieldNames,
      limitVal: state.limitVal,
      offsetVal: state.offsetVal,
      pageVal: state.pageVal,
    });
    return { data: result.data, total: result.total, hasMore: result.hasMore };
  }

  async findWithMeta(state: QueryState): Promise<QueryResultWithMeta> {
    const limit = state.limitVal ?? 25;
    const page = state.pageVal ?? 1;
    const result = await this.queryExecutor.execList({
      filters: toTranslatedFilters(state.filters),
      sorts: state.sorts,
      fieldNames: state.fieldNames,
      limitVal: limit,
      pageVal: page,
    });
    const total = result.total ?? result.data.length;
    const totalPages = Math.ceil(total / limit);
    return { data: result.data, meta: { total, page, limit, totalPages } };
  }

  async findOne(state: QueryState): Promise<Record<string, unknown> | null> {
    const result = await this.queryExecutor.execList({
      filters: toTranslatedFilters(state.filters),
      sorts: state.sorts,
      fieldNames: state.fieldNames,
      limitVal: 1,
    });
    return result.data[0] ?? null;
  }

  async count(state: QueryState): Promise<number> {
    return this.queryExecutor.execCount({
      filters: toTranslatedFilters(state.filters),
      sorts: state.sorts,
      fieldNames: state.fieldNames,
    });
  }

  async get(id: string): Promise<Record<string, unknown> | null> {
    return this.queryExecutor.execGet(id);
  }

  async create(
    data: Record<string, unknown>,
    _auth?: RequestContext,
  ): Promise<Record<string, unknown>> {
    return this.mutationExecutor.create(data);
  }

  async update(
    id: string,
    data: Record<string, unknown>,
    _auth?: RequestContext,
  ): Promise<Record<string, unknown>> {
    return this.mutationExecutor.update(id, data);
  }

  async delete(id: string, _auth?: RequestContext): Promise<Record<string, unknown>> {
    const record = await this.get(id);
    if (!record) throw new Error(`Record not found: ${id}`);
    await this.mutationExecutor.delete(id);
    return record;
  }

  async createMany(
    _data: Record<string, unknown>[],
    _auth?: RequestContext,
  ): Promise<Record<string, unknown>[]> {
    throw new UnsupportedOperationError(
      this.modelName,
      'createMany',
      'not supported on external models',
    );
  }

  async aggregate(_state: QueryState): Promise<AggregateResult | GroupedAggregateResult> {
    throw new UnsupportedOperationError(
      this.modelName,
      'aggregate',
      'not supported on external models',
    );
  }

  async updateAll(_state: QueryState, _data: Record<string, unknown>): Promise<{ count: number }> {
    throw new UnsupportedOperationError(
      this.modelName,
      'updateAll',
      'not supported on external models',
    );
  }

  async deleteAll(_state: QueryState): Promise<{ count: number }> {
    throw new UnsupportedOperationError(
      this.modelName,
      'deleteAll',
      'not supported on external models',
    );
  }
}
