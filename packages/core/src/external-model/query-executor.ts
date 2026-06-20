import type { DataAdapter, ListQuery } from '../plugins/types.js';
import type { ExternalFieldConfig } from './types.js';
import type { TranslatedFilter } from '../model-api/filter-translator.js';
import { mapAdapterResponse } from './field-mapper.js';
import { evaluateComputedFields } from './computed-fields.js';
import {
  applyInMemoryFilters,
  applyInMemorySort,
  applyInMemoryPagination,
} from './in-memory-ops.js';
import type { AdapterCapability } from '../plugins/types.js';

export interface ExternalQueryOptions {
  adapter: DataAdapter;
  modelName: string;
  fields: Record<string, ExternalFieldConfig>;
  capabilities: AdapterCapability[];
}

export interface ExternalQueryState {
  filters: TranslatedFilter[];
  sorts: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limitVal?: number;
  offsetVal?: number;
  pageVal?: number;
  fieldNames: string[];
}

export class ExternalQueryExecutor {
  private readonly adapter: DataAdapter;
  private readonly modelName: string;
  private readonly fields: Record<string, ExternalFieldConfig>;
  private readonly capabilities: Set<AdapterCapability>;

  constructor(options: ExternalQueryOptions) {
    this.adapter = options.adapter;
    this.modelName = options.modelName;
    this.fields = options.fields;
    this.capabilities = new Set(options.capabilities);
  }

  async execGet(id: string): Promise<Record<string, unknown> | null> {
    const raw = await this.adapter.get(this.modelName, id);
    if (!raw) return null;
    return this.transformRecord(raw);
  }

  async execList(
    state: ExternalQueryState,
  ): Promise<{ data: Record<string, unknown>[]; total?: number; hasMore?: boolean }> {
    const limit = state.limitVal ?? 25;
    const page = state.pageVal ?? 1;

    if (this.capabilities.has('list')) {
      const query: ListQuery = { pageSize: limit, page };

      if (state.filters.length > 0 && this.capabilities.has('filter')) {
        query.filters = state.filters.map((f) => ({
          field: f.field,
          operator: f.operator,
          value: f.value,
        }));
      }

      if (state.sorts.length > 0 && this.capabilities.has('sort')) {
        query.sort = state.sorts[0];
      }

      const result = await this.adapter.list!(this.modelName, query);
      let data = result.data.map((r) => this.transformRecord(r));

      if (state.filters.length > 0 && !this.capabilities.has('filter')) {
        data = applyInMemoryFilters(data, state.filters);
      }

      if (state.sorts.length > 0 && !this.capabilities.has('sort')) {
        data = applyInMemorySort(data, state.sorts);
      }

      if (!this.capabilities.has('filter') || !this.capabilities.has('sort')) {
        data = applyInMemoryPagination(data, limit, 0);
      }

      return { data, total: result.total, hasMore: result.hasMore };
    }

    // Fallback: no list capability, fetch all via repeated get (not practical for real use)
    return { data: [], total: 0 };
  }

  async execCount(state: ExternalQueryState): Promise<number> {
    const result = await this.execList(state);
    return result.total ?? result.data.length;
  }

  private transformRecord(raw: Record<string, unknown>): Record<string, unknown> {
    const mapped = mapAdapterResponse(raw, this.fields);
    return evaluateComputedFields(mapped, this.fields);
  }
}
