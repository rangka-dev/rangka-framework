import type {
  ModelAccessInterface,
  ModelQueryInterface,
  FilterExpression,
  FilterOperators,
  AggregateSpec,
  AggregateResult,
  GroupedAggregateResult,
  QueryResult,
  QueryResultWithMeta,
} from '../types/index.js';
import { ModelNotFoundError } from '../types/model-api.js';

type Store = Map<string, Map<string, Record<string, unknown>>>;

interface ModelSchema {
  name: string;
  fields?: Record<string, { hidden?: boolean; readOnly?: boolean; searchable?: boolean }>;
  traits?: string[];
}

export interface InMemoryModelAccessOptions {
  models: ModelSchema[];
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function cloneRecord(record: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(record));
}

function matchesFilter(
  record: Record<string, unknown>,
  field: string,
  op: FilterOperators,
): boolean {
  const value = record[field];

  if ('eq' in op) return value === op.eq;
  if ('neq' in op) return value !== op.neq;
  if ('gt' in op) return (value as number) > (op.gt as number);
  if ('gte' in op) return (value as number) >= (op.gte as number);
  if ('lt' in op) return (value as number) < (op.lt as number);
  if ('lte' in op) return (value as number) <= (op.lte as number);
  if ('in' in op) return (op.in as unknown[]).includes(value);
  if ('notIn' in op) return !(op.notIn as unknown[]).includes(value);
  if ('contains' in op)
    return (
      typeof value === 'string' &&
      value.toLowerCase().includes((op.contains as string).toLowerCase())
    );
  if ('startsWith' in op)
    return (
      typeof value === 'string' &&
      value.toLowerCase().startsWith((op.startsWith as string).toLowerCase())
    );
  if ('endsWith' in op)
    return (
      typeof value === 'string' &&
      value.toLowerCase().endsWith((op.endsWith as string).toLowerCase())
    );
  if ('is' in op)
    return op.is === null
      ? value === null || value === undefined
      : value !== null && value !== undefined;
  if ('between' in op) {
    const [a, b] = op.between as [unknown, unknown];
    return (value as number) >= (a as number) && (value as number) <= (b as number);
  }
  return true;
}

function isOperatorObject(value: unknown): value is FilterOperators {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  const ops = new Set([
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'in',
    'notIn',
    'contains',
    'startsWith',
    'endsWith',
    'is',
    'between',
  ]);
  return keys.length > 0 && keys.every((k) => ops.has(k));
}

function matchesExpression(record: Record<string, unknown>, expr: FilterExpression): boolean {
  for (const [key, val] of Object.entries(expr)) {
    if (key === '$or') continue;
    if (val === undefined) continue;
    if (val === null) {
      if (record[key] !== null && record[key] !== undefined) return false;
      continue;
    }
    if (isOperatorObject(val)) {
      if (!matchesFilter(record, key, val as FilterOperators)) return false;
    } else {
      if (record[key] !== val) return false;
    }
  }

  if (expr.$or) {
    const orBranches = expr.$or as FilterExpression[];
    if (orBranches.length > 0) {
      const anyMatch = orBranches.some((branch) => matchesExpression(record, branch));
      if (!anyMatch) return false;
    }
  }

  return true;
}

class InMemoryQueryBuilder implements ModelQueryInterface {
  private records: Record<string, unknown>[];
  private table: Map<string, Record<string, unknown>>;
  private filterExprs: FilterExpression[] = [];
  private sortSpecs: Array<{ field: string; direction: 'asc' | 'desc' }> = [];
  private limitVal?: number;
  private offsetVal?: number;
  private pageVal?: number;
  private fieldNames: string[] = [];
  private searchTerm?: string;
  private searchFieldNames?: string[];
  private groupByFields?: string[];
  private schema: ModelSchema;

  constructor(
    records: Record<string, unknown>[],
    table: Map<string, Record<string, unknown>>,
    schema: ModelSchema,
  ) {
    this.records = records;
    this.table = table;
    this.schema = schema;
  }

  private clone(): InMemoryQueryBuilder {
    const qb = new InMemoryQueryBuilder(this.records, this.table, this.schema);
    qb.filterExprs = [...this.filterExprs];
    qb.sortSpecs = [...this.sortSpecs];
    qb.limitVal = this.limitVal;
    qb.offsetVal = this.offsetVal;
    qb.pageVal = this.pageVal;
    qb.fieldNames = [...this.fieldNames];
    qb.searchTerm = this.searchTerm;
    qb.searchFieldNames = this.searchFieldNames ? [...this.searchFieldNames] : undefined;
    qb.groupByFields = this.groupByFields ? [...this.groupByFields] : undefined;
    return qb;
  }

  filter(conditions: FilterExpression): ModelQueryInterface {
    const qb = this.clone();
    qb.filterExprs = [...this.filterExprs, conditions];
    return qb;
  }

  search(term: string, fields?: string[]): ModelQueryInterface {
    if (!term) return this;
    const qb = this.clone();
    qb.searchTerm = term;
    qb.searchFieldNames =
      fields ??
      Object.entries(this.schema.fields ?? {})
        .filter(([, cfg]) => cfg.searchable)
        .map(([name]) => name);
    return qb;
  }

  sort(field: string, direction: 'asc' | 'desc' = 'asc'): ModelQueryInterface {
    const qb = this.clone();
    qb.sortSpecs = [...this.sortSpecs, { field, direction }];
    return qb;
  }

  limit(count: number): ModelQueryInterface {
    const qb = this.clone();
    qb.limitVal = count;
    return qb;
  }

  offset(count: number): ModelQueryInterface {
    const qb = this.clone();
    qb.offsetVal = count;
    return qb;
  }

  page(num: number): ModelQueryInterface {
    const qb = this.clone();
    qb.pageVal = num;
    return qb;
  }

  fields(fieldNames: string[]): ModelQueryInterface {
    const qb = this.clone();
    qb.fieldNames = fieldNames;
    return qb;
  }

  include(_relation: string): ModelQueryInterface {
    return this;
  }

  unscoped(): ModelQueryInterface {
    return this;
  }

  includeArchived(): ModelQueryInterface {
    return this;
  }

  groupBy(field: string | string[]): ModelQueryInterface {
    const qb = this.clone();
    qb.groupByFields = Array.isArray(field) ? field : [field];
    return qb;
  }

  private applyFilters(): Record<string, unknown>[] {
    let results = [...this.records];

    for (const expr of this.filterExprs) {
      results = results.filter((r) => matchesExpression(r, expr));
    }

    if (this.searchTerm && this.searchFieldNames && this.searchFieldNames.length > 0) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter((r) =>
        this.searchFieldNames!.some((f) => {
          const val = r[f];
          return typeof val === 'string' && val.toLowerCase().includes(term);
        }),
      );
    }

    return results;
  }

  private applySorts(data: Record<string, unknown>[]): Record<string, unknown>[] {
    if (this.sortSpecs.length === 0) return data;
    return [...data].sort((a, b) => {
      for (const { field, direction } of this.sortSpecs) {
        const aVal = a[field] as string | number;
        const bVal = b[field] as string | number;
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  private applyPagination(data: Record<string, unknown>[]): Record<string, unknown>[] {
    const limit = this.limitVal ?? 25;
    const offset = this.offsetVal ?? (this.pageVal ? (this.pageVal - 1) * limit : 0);
    return data.slice(offset, offset + limit);
  }

  private applyFieldSelection(data: Record<string, unknown>[]): Record<string, unknown>[] {
    if (this.fieldNames.length === 0) return data;
    const fields = new Set([...this.fieldNames, 'id']);
    return data.map((r) => {
      const out: Record<string, unknown> = {};
      for (const f of fields) {
        if (f in r) out[f] = r[f];
      }
      return out;
    });
  }

  async exec(): Promise<QueryResult> {
    let data = this.applyFilters();
    data = this.applySorts(data);
    const total = data.length;
    data = this.applyPagination(data);
    data = this.applyFieldSelection(data);
    return { data: data.map(cloneRecord), total };
  }

  async execWithMeta(): Promise<QueryResultWithMeta> {
    let data = this.applyFilters();
    data = this.applySorts(data);
    const total = data.length;
    const limit = this.limitVal ?? 25;
    const page = this.pageVal ?? 1;
    data = this.applyPagination(data);
    data = this.applyFieldSelection(data);
    return {
      data: data.map(cloneRecord),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async first(): Promise<Record<string, unknown> | null> {
    let data = this.applyFilters();
    data = this.applySorts(data);
    if (data.length === 0) return null;
    let record = data[0];
    if (this.fieldNames.length > 0) {
      [record] = this.applyFieldSelection([record]);
    }
    return cloneRecord(record);
  }

  async count(): Promise<number> {
    return this.applyFilters().length;
  }

  async aggregate(spec: AggregateSpec): Promise<AggregateResult | GroupedAggregateResult> {
    const data = this.applyFilters();
    const groupByFields = this.groupByFields ?? [];

    function computeAgg(rows: Record<string, unknown>[]): AggregateResult {
      const result: AggregateResult = {};
      if (spec.count !== undefined) {
        result.count =
          spec.count === true
            ? rows.length
            : rows.filter((r) => r[spec.count as string] != null).length;
      }
      const sumFields = spec.sum ? (Array.isArray(spec.sum) ? spec.sum : [spec.sum]) : [];
      const avgFields = spec.avg ? (Array.isArray(spec.avg) ? spec.avg : [spec.avg]) : [];
      const minFields = spec.min ? (Array.isArray(spec.min) ? spec.min : [spec.min]) : [];
      const maxFields = spec.max ? (Array.isArray(spec.max) ? spec.max : [spec.max]) : [];

      if (sumFields.length > 0) {
        result.sum = {};
        for (const f of sumFields)
          (result.sum as Record<string, number>)[f] = rows.reduce(
            (acc, r) => acc + (Number(r[f]) || 0),
            0,
          );
      }
      if (avgFields.length > 0) {
        result.avg = {};
        for (const f of avgFields)
          (result.avg as Record<string, number>)[f] =
            rows.length > 0
              ? rows.reduce((acc, r) => acc + (Number(r[f]) || 0), 0) / rows.length
              : 0;
      }
      if (minFields.length > 0) {
        result.min = {};
        for (const f of minFields)
          (result.min as Record<string, unknown>)[f] = rows.reduce(
            (min: unknown, r) =>
              min === undefined || (r[f] as number) < (min as number) ? r[f] : min,
            undefined,
          );
      }
      if (maxFields.length > 0) {
        result.max = {};
        for (const f of maxFields)
          (result.max as Record<string, unknown>)[f] = rows.reduce(
            (max: unknown, r) =>
              max === undefined || (r[f] as number) > (max as number) ? r[f] : max,
            undefined,
          );
      }
      return result as AggregateResult;
    }

    if (groupByFields.length === 0) {
      return computeAgg(data);
    }

    const groups = new Map<string, Record<string, unknown>[]>();
    for (const row of data) {
      const key = groupByFields.map((f) => String(row[f])).join('||');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    const result: GroupedAggregateResult = { groups: [] };
    for (const [, rows] of groups) {
      const key: Record<string, unknown> = {};
      for (const f of groupByFields) key[f] = rows[0][f];
      const agg = computeAgg(rows);
      result.groups.push({ key, ...agg });
    }
    return result;
  }

  async updateAll(data: Record<string, unknown>): Promise<{ count: number }> {
    const matching = this.applyFilters();
    for (const record of matching) {
      const id = record.id as string;
      const stored = this.table.get(id);
      if (stored) Object.assign(stored, data);
    }
    return { count: matching.length };
  }

  async deleteAll(): Promise<{ count: number }> {
    const matching = this.applyFilters();
    for (const record of matching) {
      this.table.delete(record.id as string);
    }
    return { count: matching.length };
  }
}

export class InMemoryModelAccess implements ModelAccessInterface {
  private store: Store = new Map();
  private schemas: Map<string, ModelSchema> = new Map();

  constructor(opts?: InMemoryModelAccessOptions) {
    if (opts?.models) {
      for (const model of opts.models) {
        this.schemas.set(model.name, model);
        this.store.set(model.name, new Map());
      }
    }
  }

  private getTable(model: string): Map<string, Record<string, unknown>> {
    if (!this.store.has(model)) {
      this.store.set(model, new Map());
    }
    return this.store.get(model)!;
  }

  private getSchema(model: string): ModelSchema {
    return this.schemas.get(model) ?? { name: model };
  }

  async get(model: string, id: string): Promise<Record<string, unknown> | null> {
    const table = this.getTable(model);
    const record = table.get(id);
    return record ? cloneRecord(record) : null;
  }

  query(model: string): ModelQueryInterface {
    const table = this.getTable(model);
    const records = Array.from(table.values());
    return new InMemoryQueryBuilder(records, table, this.getSchema(model));
  }

  async create(model: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const table = this.getTable(model);
    const id = (data.id as string) ?? generateId();
    const record = { ...data, id };
    table.set(id, record);
    return cloneRecord(record);
  }

  async update(
    model: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const table = this.getTable(model);
    const existing = table.get(id);
    if (!existing) throw new ModelNotFoundError(model, id);
    const updated = { ...existing, ...data, id };
    table.set(id, updated);
    return cloneRecord(updated);
  }

  async delete(model: string, id: string): Promise<Record<string, unknown>> {
    const table = this.getTable(model);
    const existing = table.get(id);
    if (!existing) throw new ModelNotFoundError(model, id);
    table.delete(id);
    return cloneRecord(existing);
  }

  async createMany(
    model: string,
    data: Record<string, unknown>[],
  ): Promise<Record<string, unknown>[]> {
    const table = this.getTable(model);
    const records: Record<string, unknown>[] = [];
    const created: Array<{ id: string; record: Record<string, unknown> }> = [];

    try {
      for (const item of data) {
        const id = (item.id as string) ?? generateId();
        const record = { ...item, id };
        created.push({ id, record });
        table.set(id, record);
        records.push(cloneRecord(record));
      }
    } catch (err) {
      for (const { id } of created) table.delete(id);
      throw err;
    }

    return records;
  }

  async transaction<T>(fn: (tx: ModelAccessInterface) => Promise<T>): Promise<T> {
    const snapshot = new Map<string, Map<string, Record<string, unknown>>>();
    for (const [model, table] of this.store) {
      snapshot.set(
        model,
        new Map(Array.from(table.entries()).map(([k, v]) => [k, cloneRecord(v)])),
      );
    }

    try {
      return await fn(this);
    } catch (err) {
      this.store = snapshot;
      throw err;
    }
  }
}
