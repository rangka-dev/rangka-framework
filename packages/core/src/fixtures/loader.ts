import { createHash } from 'crypto';
import type { FixtureDefinition, FixtureLoadResult, FixtureRef } from './types.js';

// --- Hashing ---

/** Produces a short deterministic hash of a record for change detection. */
function computeHash(record: Record<string, unknown>): string {
  const sortedKeys = Object.keys(record).sort();
  const json = JSON.stringify(record, sortedKeys);
  return createHash('sha256').update(json).digest('hex').slice(0, 16);
}

// --- Reference resolution ---

/** Type guard: checks whether a field value is a cross-model reference. */
function isRef(value: unknown): value is FixtureRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ref' in value &&
    'key' in value &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (value as any).ref === 'string' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (value as any).key === 'string'
  );
}

/**
 * Infers the lookup field name for a reference when none is explicitly provided.
 * E.g. model "tenant.role" -> lookup field "role_code".
 */
function inferLookupField(model: string): string {
  const segments = model.split('.');
  const modelName = segments[segments.length - 1];
  return `${modelName}_code`;
}

/**
 * Parses a reference key string into its lookup field and value.
 *
 * Format: "field:value" uses the explicit field, otherwise the field is
 * inferred from the referenced model name.
 */
function parseRefKey(
  refKey: string,
  refModel: string,
): { lookupField: string; lookupValue: string } {
  if (refKey.includes(':')) {
    const [lookupField, lookupValue] = refKey.split(':');
    return { lookupField, lookupValue };
  }
  return { lookupField: inferLookupField(refModel), lookupValue: refKey };
}

/**
 * Resolves all FixtureRef values in a record into actual foreign-key IDs
 * by querying the database for the referenced rows.
 */
async function resolveRefs(
  record: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
): Promise<Record<string, unknown>> {
  const resolved = { ...record };

  for (const [field, value] of Object.entries(resolved)) {
    if (!isRef(value)) continue;

    const tableName = value.ref.replace('.', '_');
    const { lookupField, lookupValue } = parseRefKey(value.key, value.ref);

    const rows = await db
      .selectFrom(tableName)
      .select('id')
      .where(lookupField, '=', lookupValue)
      .execute();

    resolved[field] = rows.length > 0 ? rows[0].id : null;
  }

  return resolved;
}

// --- Core loader ---

/**
 * Converts a model name (e.g. "tenant.user") into its database table name.
 */
function toTableName(model: string): string {
  return model.replace('.', '_');
}

/**
 * Inserts or updates a single fixture record depending on whether it already
 * exists and whether it has changed since the last load.
 */
async function upsertFixtureRecord(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  tableName: string,
  definition: FixtureDefinition,
  record: Record<string, unknown>,
  options: { force?: boolean },
): Promise<'inserted' | 'skipped'> {
  const keyValue = record[definition.key] as string;
  const fixtureHash = computeHash(record);

  const existingRows = await db
    .selectFrom(tableName)
    .selectAll()
    .where(definition.key, '=', keyValue)
    .execute();

  // New record: insert it.
  if (existingRows.length === 0) {
    const resolved = await resolveRefs(record, db);
    await db
      .insertInto(tableName)
      .values({
        ...resolved,
        _fixture_source: definition.model,
        _fixture_hash: fixtureHash,
      })
      .execute();
    return 'inserted';
  }

  // Force mode: always overwrite.
  if (options.force) {
    const resolved = await resolveRefs(record, db);
    await db
      .updateTable(tableName)
      .set({
        ...resolved,
        _fixture_source: definition.model,
        _fixture_hash: fixtureHash,
      })
      .where(definition.key, '=', keyValue)
      .execute();
    return 'inserted';
  }

  // Existing record: update only if the fixture hash has changed.
  const existingHash = existingRows[0]._fixture_hash;
  const hasChanged = existingHash && existingHash !== fixtureHash;

  if (!hasChanged) {
    return 'skipped';
  }

  const resolved = await resolveRefs(record, db);
  await db
    .updateTable(tableName)
    .set({
      ...resolved,
      _fixture_hash: fixtureHash,
    })
    .where(definition.key, '=', keyValue)
    .execute();
  return 'inserted';
}

/**
 * Loads an array of fixture definitions into the database.
 *
 * Each record is inserted if new, updated if its content hash changed,
 * or skipped if unchanged. Pass `options.force` to always overwrite.
 */
export async function loadFixtures(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  definitions: FixtureDefinition[],
  options?: { force?: boolean },
): Promise<FixtureLoadResult> {
  let inserted = 0;
  let skipped = 0;
  let total = 0;

  for (const definition of definitions) {
    const tableName = toTableName(definition.model);

    for (const record of definition.records) {
      total++;
      const result = await upsertFixtureRecord(db, tableName, definition, record, options ?? {});

      if (result === 'inserted') {
        inserted++;
      } else {
        skipped++;
      }
    }
  }

  return { inserted, skipped, total };
}
