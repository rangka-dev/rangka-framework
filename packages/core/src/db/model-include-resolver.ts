/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from 'kysely';
import type { SchemaRegistry } from '../schema/registry.js';
import type { ModelRelationship } from '../schema/types.js';
import { modelToTableName } from './field-mapper.js';
import type { AdapterRegistry } from '../plugins/adapter-registry.js';
import type { ExternalFieldConfig } from '../external-model/types.js';
import { mapAdapterResponse } from '../external-model/field-mapper.js';
import { evaluateComputedFields } from '../external-model/computed-fields.js';

export type IncludeSpec = string | { relation: string; nested?: IncludeSpec[] };

export interface IncludeResolverOptions {
  adapterRegistry?: AdapterRegistry;
  externalModelFields?: Record<string, Record<string, ExternalFieldConfig>>;
}

function normalizeSpec(spec: IncludeSpec): { relation: string; nested: IncludeSpec[] } {
  if (typeof spec === 'string') return { relation: spec, nested: [] };
  return { relation: spec.relation, nested: spec.nested ?? [] };
}

export async function resolveModelIncludes(
  records: Record<string, unknown>[],
  includes: IncludeSpec[],
  registry: SchemaRegistry,
  db: Kysely<any>,
  sourceModel: string,
  options?: IncludeResolverOptions,
): Promise<void> {
  if (records.length === 0) return;

  const relationships = registry.getRelationshipsForModel(sourceModel);

  for (const spec of includes) {
    const { relation, nested } = normalizeSpec(spec);
    const rel = relationships.find((r) => r.field === relation);
    if (!rel) continue;

    const targetModel = registry.getModel(rel.to);
    const isExternal = targetModel?.source != null;

    if (isExternal && options?.adapterRegistry) {
      switch (rel.type) {
        case 'link':
          await resolveExternalLink(
            records,
            rel,
            targetModel!.source!,
            targetModel!.qualifiedName,
            options,
          );
          break;
        case 'hasMany':
        case 'children':
          await resolveExternalHasMany(
            records,
            rel,
            targetModel!.source!,
            targetModel!.qualifiedName,
            options,
          );
          break;
      }
    } else {
      switch (rel.type) {
        case 'link':
          await resolveLink(records, rel, db);
          break;
        case 'hasMany':
        case 'children':
          await resolveHasMany(records, rel, db);
          break;
        case 'manyToMany':
          await resolveManyToMany(records, rel, db);
          break;
        case 'dynamicLink':
          await resolveDynamicLink(records, rel, db);
          break;
      }
    }

    if (nested.length > 0) {
      const childRecords = records
        .map((r) => r[rel.field])
        .flat()
        .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object');

      if (childRecords.length > 0) {
        await resolveModelIncludes(childRecords, nested, registry, db, rel.to, options);
      }
    }
  }
}

async function resolveLink(
  records: Record<string, unknown>[],
  rel: ModelRelationship,
  db: Kysely<any>,
): Promise<void> {
  const ids = [
    ...new Set(
      records
        .map((r) => r[rel.field])
        .filter((id): id is string => id != null && typeof id === 'string'),
    ),
  ];

  if (ids.length === 0) {
    for (const record of records) {
      if (record[rel.field] == null) record[rel.field] = null;
    }
    return;
  }

  const table = modelToTableName(rel.to);
  const related = await db.selectFrom(table).selectAll().where('id', 'in', ids).execute();

  const map = new Map<string, Record<string, unknown>>();
  for (const row of related) {
    map.set((row as any).id, row as Record<string, unknown>);
  }

  for (const record of records) {
    const id = record[rel.field] as string | null;
    record[rel.field] = id ? (map.get(id) ?? null) : null;
  }
}

async function resolveHasMany(
  records: Record<string, unknown>[],
  rel: ModelRelationship,
  db: Kysely<any>,
): Promise<void> {
  const parentIds = records.map((r) => r.id as string).filter(Boolean);
  if (parentIds.length === 0) return;

  const table = modelToTableName(rel.to);
  const foreignKey = rel.foreignKey!;

  const related = await db
    .selectFrom(table)
    .selectAll()
    .where(foreignKey, 'in', parentIds)
    .execute();

  const grouped = new Map<string, Record<string, unknown>[]>();
  for (const row of related as any[]) {
    const fkValue = row[foreignKey] as string;
    const list = grouped.get(fkValue) ?? [];
    list.push(row);
    grouped.set(fkValue, list);
  }

  for (const record of records) {
    record[rel.field] = grouped.get(record.id as string) ?? [];
  }
}

async function resolveManyToMany(
  records: Record<string, unknown>[],
  rel: ModelRelationship,
  db: Kysely<any>,
): Promise<void> {
  const parentIds = records.map((r) => r.id as string).filter(Boolean);
  if (parentIds.length === 0) return;

  const targetTable = modelToTableName(rel.to);
  const junctionTable = modelToTableName(rel.through!);

  const sourceModelName = rel.from.split('.').pop()!;
  const targetModelName = rel.to.split('.').pop()!;
  const sourceFk = `${sourceModelName}_id`;
  const targetFk = `${targetModelName}_id`;

  const related = await db
    .selectFrom(targetTable)
    .selectAll(targetTable)
    .select(`${junctionTable}.${sourceFk} as _source_fk`)
    .innerJoin(junctionTable, `${junctionTable}.${targetFk}`, `${targetTable}.id`)
    .where(`${junctionTable}.${sourceFk}`, 'in', parentIds)
    .execute();

  const grouped = new Map<string, Record<string, unknown>[]>();
  for (const row of related as any[]) {
    const fkValue = row._source_fk as string;
    const clean = { ...row };
    delete clean._source_fk;
    const list = grouped.get(fkValue) ?? [];
    list.push(clean);
    grouped.set(fkValue, list);
  }

  for (const record of records) {
    record[rel.field] = grouped.get(record.id as string) ?? [];
  }
}

async function resolveDynamicLink(
  records: Record<string, unknown>[],
  rel: ModelRelationship,
  db: Kysely<any>,
): Promise<void> {
  const modelField = rel.modelField!;

  const groups = new Map<string, { records: Record<string, unknown>[]; ids: string[] }>();
  for (const record of records) {
    const targetModel = record[modelField] as string | null;
    const id = record[rel.field] as string | null;
    if (!targetModel || !id) {
      record[rel.field] = null;
      continue;
    }
    const group = groups.get(targetModel) ?? { records: [], ids: [] };
    group.records.push(record);
    group.ids.push(id);
    groups.set(targetModel, group);
  }

  for (const [targetModel, group] of groups) {
    const table = modelToTableName(targetModel);
    const uniqueIds = [...new Set(group.ids)];

    const related = await db.selectFrom(table).selectAll().where('id', 'in', uniqueIds).execute();

    const map = new Map<string, Record<string, unknown>>();
    for (const row of related as any[]) {
      map.set(row.id, row);
    }

    for (const record of group.records) {
      const id = record[rel.field] as string;
      record[rel.field] = map.get(id) ?? null;
    }
  }
}

async function resolveExternalLink(
  records: Record<string, unknown>[],
  rel: ModelRelationship,
  adapterSource: string,
  qualifiedName: string,
  options: IncludeResolverOptions,
): Promise<void> {
  const ids = [
    ...new Set(
      records
        .map((r) => r[rel.field])
        .filter((id): id is string => id != null && typeof id === 'string'),
    ),
  ];

  if (ids.length === 0) {
    for (const record of records) {
      if (record[rel.field] == null) record[rel.field] = null;
    }
    return;
  }

  const adapter = options.adapterRegistry!.get(adapterSource);
  const fields = options.externalModelFields?.[qualifiedName] ?? {};

  let related: Record<string, unknown>[];
  if (adapter.batchGet) {
    related = await adapter.batchGet(qualifiedName, ids);
  } else {
    const results = await Promise.all(ids.map((id) => adapter.get(qualifiedName, id)));
    related = results.filter((r): r is Record<string, unknown> => r != null);
  }

  const mapped = related.map((raw) => {
    const m = mapAdapterResponse(raw, fields);
    return evaluateComputedFields(m, fields);
  });

  const map = new Map<string, Record<string, unknown>>();
  for (const row of mapped) {
    if (row.id != null) map.set(row.id as string, row);
  }

  for (const record of records) {
    const id = record[rel.field] as string | null;
    record[rel.field] = id ? (map.get(id) ?? null) : null;
  }
}

async function resolveExternalHasMany(
  records: Record<string, unknown>[],
  rel: ModelRelationship,
  adapterSource: string,
  qualifiedName: string,
  options: IncludeResolverOptions,
): Promise<void> {
  const parentIds = records.map((r) => r.id as string).filter(Boolean);
  if (parentIds.length === 0) return;

  const adapter = options.adapterRegistry!.get(adapterSource);
  const fields = options.externalModelFields?.[qualifiedName] ?? {};
  const foreignKey = rel.foreignKey!;

  let allRelated: Record<string, unknown>[] = [];

  if (adapter.list) {
    const result = await adapter.list(qualifiedName, {
      filters: [{ field: foreignKey, operator: 'in', value: parentIds }],
    });
    allRelated = result.data;
  }

  const mapped = allRelated.map((raw) => {
    const m = mapAdapterResponse(raw, fields);
    return evaluateComputedFields(m, fields);
  });

  const grouped = new Map<string, Record<string, unknown>[]>();
  for (const row of mapped) {
    const fkValue = row[foreignKey] as string;
    if (!fkValue) continue;
    const list = grouped.get(fkValue) ?? [];
    list.push(row);
    grouped.set(fkValue, list);
  }

  for (const record of records) {
    record[rel.field] = grouped.get(record.id as string) ?? [];
  }
}
