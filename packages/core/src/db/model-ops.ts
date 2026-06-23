/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql, type Kysely } from 'kysely';
import type { ResolvedModel } from '../schema/types.js';
import type { SchemaRegistry } from '../schema/registry.js';
import type { RequestContext } from '../auth/types.js';
import type { ModelOps, QueryState, QueryResult, QueryResultWithMeta } from '../model-api/types.js';
import type { AggregateSpec, AggregateResult, GroupedAggregateResult } from '@rangka/shared';
import { applyModelFilters, applySearchFilter } from './filter-applier.js';
import { applyScopeEnforcement } from './scope-enforcer.js';
import { modelToTableName } from './field-mapper.js';
import { toCount } from '../helpers/coerce.js';
import { NotFoundError } from '../errors.js';

interface DbLike {
  selectFrom(table: string): any;
  insertInto(table: string): any;
  updateTable(table: string): any;
  deleteFrom(table: string): any;
}

function toFieldArray(val: string | string[] | undefined): string[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function extractAggValues(row: any, spec: AggregateSpec): AggregateResult {
  const result: AggregateResult = {};
  if (spec.count !== undefined) result.count = Number(row.__count ?? 0);
  const sumFields = toFieldArray(spec.sum as string | string[] | undefined);
  const avgFields = toFieldArray(spec.avg as string | string[] | undefined);
  const minFields = toFieldArray(spec.min as string | string[] | undefined);
  const maxFields = toFieldArray(spec.max as string | string[] | undefined);
  if (sumFields.length > 0) {
    result.sum = {};
    for (const f of sumFields) result.sum[f] = Number(row[`__sum__${f}`] ?? 0);
  }
  if (avgFields.length > 0) {
    result.avg = {};
    for (const f of avgFields) result.avg[f] = Number(row[`__avg__${f}`] ?? 0);
  }
  if (minFields.length > 0) {
    result.min = {};
    for (const f of minFields) result.min[f] = row[`__min__${f}`];
  }
  if (maxFields.length > 0) {
    result.max = {};
    for (const f of maxFields) result.max[f] = row[`__max__${f}`];
  }
  return result;
}

export interface KyselyModelOpsConfig {
  db: Kysely<any> | DbLike;
  model: ResolvedModel;
  registry: SchemaRegistry;
  auth?: RequestContext;
  tableName?: string;
}

export class KyselyModelOps implements ModelOps {
  private readonly db: DbLike;
  private readonly model: ResolvedModel;
  private readonly registry: SchemaRegistry;
  private readonly defaultAuth?: RequestContext;
  private readonly tableName: string;

  constructor(config: KyselyModelOpsConfig) {
    this.db = config.db as DbLike;
    this.model = config.model;
    this.registry = config.registry;
    this.defaultAuth = config.auth;
    this.tableName = config.tableName ?? config.model.qualifiedName;
  }

  async find(state: QueryState): Promise<QueryResult> {
    let query = this.buildBaseQuery(state);
    query = this.applySelect(query, state);
    query = this.applySorts(query, state);
    query = this.applyPagination(query, state);
    const data = await query.execute();
    return { data: data as Record<string, unknown>[] };
  }

  async findWithMeta(state: QueryState): Promise<QueryResultWithMeta> {
    const limit = state.limitVal ?? 25;
    const page = state.pageVal ?? 1;
    const offset = state.offsetVal ?? (page - 1) * limit;

    let countQuery = this.buildBaseQuery(state);
    countQuery = countQuery.select(sql`count(*)`.as('count'));
    const countResult = await countQuery.executeTakeFirst();
    const total = toCount(countResult);
    const totalPages = Math.ceil(total / limit);

    let query = this.buildBaseQuery(state);
    query = this.applySelect(query, state);
    query = this.applySorts(query, state);
    query = query.limit(limit).offset(offset);
    const data = await query.execute();

    return {
      data: data as Record<string, unknown>[],
      meta: { total, page, limit, totalPages },
    };
  }

  async findOne(state: QueryState): Promise<Record<string, unknown> | null> {
    let query = this.buildBaseQuery(state);
    query = this.applySelect(query, state);
    query = this.applySorts(query, state);
    query = query.limit(1);
    const result = await query.executeTakeFirst();
    return (result as Record<string, unknown>) ?? null;
  }

  async count(state: QueryState): Promise<number> {
    let query = this.buildBaseQuery(state);
    query = query.select(sql`count(*)`.as('count'));
    const result = await query.executeTakeFirst();
    return toCount(result);
  }

  async get(id: string): Promise<Record<string, unknown> | null> {
    let query = this.db.selectFrom(this.tableName).selectAll().where('id', '=', id);
    if (this.model.traits.includes('soft_delete')) {
      query = query.where('archived_at', 'is', null);
    }
    const result = await query.executeTakeFirst();
    return (result as Record<string, unknown>) ?? null;
  }

  async create(
    data: Record<string, unknown>,
    _auth?: RequestContext,
  ): Promise<Record<string, unknown>> {
    await this.assignSequenceValues(data);

    const record = await this.db
      .insertInto(this.tableName)
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();

    return record as Record<string, unknown>;
  }

  async update(
    id: string,
    data: Record<string, unknown>,
    _auth?: RequestContext,
  ): Promise<Record<string, unknown>> {
    await this.getOrThrow(id);

    const record = await this.db
      .updateTable(this.tableName)
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return record as Record<string, unknown>;
  }

  async delete(id: string, _auth?: RequestContext): Promise<Record<string, unknown>> {
    const record = await this.getOrThrow(id);

    await this.cascadeDeleteChildren(id);

    if (this.model.traits.includes('soft_delete')) {
      await this.db
        .updateTable(this.tableName)
        .set({ archived_at: new Date().toISOString() })
        .where('id', '=', id)
        .execute();
    } else {
      await this.db.deleteFrom(this.tableName).where('id', '=', id).execute();
    }

    return record;
  }

  async createMany(
    data: Record<string, unknown>[],
    _auth?: RequestContext,
  ): Promise<Record<string, unknown>[]> {
    if (data.length === 0) return [];
    const rows = [...data];
    for (const row of rows) {
      await this.assignSequenceValues(row);
    }
    const records = await this.db.insertInto(this.tableName).values(rows).returningAll().execute();
    return records as Record<string, unknown>[];
  }

  async aggregate(state: QueryState): Promise<AggregateResult | GroupedAggregateResult> {
    const spec = state.aggregateSpec;
    if (!spec) throw new Error('aggregate() called without aggregateSpec on QueryState');

    const groupByFields = state.groupByFields ?? [];
    const baseQuery: any = this.buildBaseQuery(state);

    // Build the list of select expressions
    const selects: any[] = [...groupByFields];
    if (spec.count !== undefined) {
      const countField = spec.count === true ? sql`count(*)` : sql.raw(`count(${spec.count})`);
      selects.push(countField.as('__count'));
    }
    for (const field of toFieldArray(spec.sum))
      selects.push(sql.raw(`sum(${field})`).as(`__sum__${field}`));
    for (const field of toFieldArray(spec.avg))
      selects.push(sql.raw(`avg(${field})`).as(`__avg__${field}`));
    for (const field of toFieldArray(spec.min))
      selects.push(sql.raw(`min(${field})`).as(`__min__${field}`));
    for (const field of toFieldArray(spec.max))
      selects.push(sql.raw(`max(${field})`).as(`__max__${field}`));

    let query = baseQuery.select(selects);
    for (const g of groupByFields) query = query.groupBy(g);

    if (groupByFields.length > 0) {
      const rows: any[] = await query.execute();
      return {
        groups: rows.map((row) => {
          const key: Record<string, unknown> = {};
          for (const g of groupByFields) key[g] = row[g];
          return { key, ...extractAggValues(row, spec) };
        }),
      } as GroupedAggregateResult;
    }

    const row: any = await query.executeTakeFirst();
    return row ? extractAggValues(row, spec) : {};
  }

  async updateAll(state: QueryState, data: Record<string, unknown>): Promise<{ count: number }> {
    let query: any = this.db.updateTable(this.tableName).set(data);

    if (this.model.traits.includes('soft_delete') && !state.includeArchivedFlag) {
      query = query.where('archived_at', 'is', null);
    }
    query = applyModelFilters(query, state.filters);
    if (state.searchTerm && state.searchFields && state.searchFields.length > 0) {
      query = applySearchFilter(query, state.searchTerm, state.searchFields);
    }
    if (!state.unscopedFlag && state.auth) {
      query = applyScopeEnforcement(query, state.auth, { model: this.model, checkOwnership: true });
    }

    const result = await query.executeTakeFirst();
    return { count: Number(result?.numUpdatedRows ?? 0) };
  }

  async deleteAll(state: QueryState): Promise<{ count: number }> {
    if (this.model.traits.includes('soft_delete') && !state.includeArchivedFlag) {
      return this.updateAll(state, { archived_at: new Date().toISOString() });
    }

    let query: any = this.db.deleteFrom(this.tableName);
    query = applyModelFilters(query, state.filters);
    if (state.searchTerm && state.searchFields && state.searchFields.length > 0) {
      query = applySearchFilter(query, state.searchTerm, state.searchFields);
    }
    if (!state.unscopedFlag && state.auth) {
      query = applyScopeEnforcement(query, state.auth, { model: this.model, checkOwnership: true });
    }

    const result = await query.executeTakeFirst();
    return { count: Number(result?.numDeletedRows ?? 0) };
  }

  withTransaction(trx: unknown): ModelOps {
    return new KyselyModelOps({
      db: trx as DbLike,
      model: this.model,
      registry: this.registry,
      auth: this.defaultAuth,
      tableName: modelToTableName(this.model.qualifiedName),
    });
  }

  compile(state: QueryState): unknown {
    let query = this.buildBaseQuery(state);
    query = this.applySelect(query, state);
    query = this.applySorts(query, state);
    query = this.applyPagination(query, state);
    return query.compile();
  }

  compileCount(state: QueryState): unknown {
    let query = this.buildBaseQuery(state);
    query = query.select(sql`count(*)`.as('count'));
    return query.compile();
  }

  private buildBaseQuery(state: QueryState) {
    let query = this.db.selectFrom(this.tableName);

    if (this.model.traits.includes('soft_delete') && !state.includeArchivedFlag) {
      query = query.where('archived_at', 'is', null);
    }

    query = applyModelFilters(query, state.filters);

    if (state.searchTerm && state.searchFields && state.searchFields.length > 0) {
      query = applySearchFilter(query, state.searchTerm, state.searchFields);
    }

    if (!state.unscopedFlag && state.auth) {
      query = applyScopeEnforcement(query, state.auth, {
        model: this.model,
        checkOwnership: true,
      });
    }

    return query;
  }

  private applySelect(query: any, state: QueryState) {
    return state.fieldNames.length > 0 ? query.select(state.fieldNames) : query.selectAll();
  }

  private applySorts(query: any, state: QueryState) {
    for (const { field, direction } of state.sorts) {
      query = query.orderBy(field, direction);
    }
    return query;
  }

  private applyPagination(query: any, state: QueryState) {
    if (state.limitVal !== undefined) {
      query = query.limit(state.limitVal);
    }
    if (state.offsetVal !== undefined) {
      query = query.offset(state.offsetVal);
    } else if (state.pageVal !== undefined) {
      const limit = state.limitVal ?? 25;
      const offset = (state.pageVal - 1) * limit;
      if (state.limitVal === undefined) query = query.limit(limit);
      query = query.offset(offset);
    }
    return query;
  }

  private async assignSequenceValues(data: Record<string, unknown>): Promise<void> {
    const sequenceFields = this.model.fields.filter(
      (f) => f.config.type === 'sequence' && !data[f.name],
    );
    if (sequenceFields.length === 0) return;

    for (const field of sequenceFields) {
      const config = field.config as { prefix?: string; digits?: number };
      const result = await (this.db as any)
        .insertInto('naming_sequence')
        .values({ model: this.model.qualifiedName, field: field.name, next_val: 1 })
        .onConflict((oc: any) =>
          oc
            .columns(['model', 'field'])
            .doUpdateSet({ next_val: sql`naming_sequence.next_val + 1` }),
        )
        .returning('next_val')
        .executeTakeFirstOrThrow();

      const num = String(result.next_val);
      const padded = config.digits ? num.padStart(config.digits, '0') : num;
      data[field.name] = (config.prefix ?? '') + padded;
    }
  }

  private async cascadeDeleteChildren(parentId: string): Promise<void> {
    const childrenFields = this.model.fields.filter((f) => f.config.type === 'children');
    if (childrenFields.length === 0) return;

    for (const field of childrenFields) {
      const config = field.config as { model: string; foreignKey: string };
      const qualifiedChild = config.model.includes('.')
        ? config.model
        : `${this.model.module}.${config.model}`;
      const childTable = modelToTableName(qualifiedChild);
      const childModel = this.registry.getModel(qualifiedChild);
      const isSoftDelete = childModel?.traits.includes('soft_delete');

      if (isSoftDelete) {
        await (this.db as any)
          .updateTable(childTable)
          .set({ archived_at: new Date().toISOString() })
          .where(config.foreignKey, '=', parentId)
          .execute();
      } else {
        await (this.db as any)
          .deleteFrom(childTable)
          .where(config.foreignKey, '=', parentId)
          .execute();
      }
    }
  }

  private async getOrThrow(id: string): Promise<Record<string, unknown>> {
    const record = await this.get(id);
    if (!record) throw new NotFoundError(`Record not found: ${id}`);
    return record;
  }
}
