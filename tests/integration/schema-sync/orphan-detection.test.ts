import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'kysely';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { autoSync } from '@rangka/core';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('schema-sync: orphan detection', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('detects orphaned column as warning (not dropped)', async () => {
    await sql`ALTER TABLE "sales__customer" ADD COLUMN "legacy_field" TEXT`.execute(
      bootResult.db!.kysely,
    );

    const result = await autoSync(bootResult.registry, bootResult.db!.kysely);
    const dropColWarnings = result.warnings.filter(
      (w) => w.type === 'DROP_COLUMN' && w.detail?.includes('legacy_field'),
    );
    expect(dropColWarnings.length).toBe(1);

    const { rows } = await sql<{ column_name: string }>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sales__customer' AND column_name = 'legacy_field'
    `.execute(bootResult.db!.kysely);
    expect(rows.length).toBe(1);
  });

  it('detects orphaned table as warning (not dropped)', async () => {
    await sql`CREATE TABLE "legacy_table" (id UUID PRIMARY KEY)`.execute(bootResult.db!.kysely);

    const result = await autoSync(bootResult.registry, bootResult.db!.kysely);
    const dropTableWarnings = result.warnings.filter(
      (w) => w.type === 'DROP_TABLE' && w.detail?.includes('legacy_table'),
    );
    expect(dropTableWarnings.length).toBe(1);

    const { rows } = await sql<{ table_name: string }>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'legacy_table'
    `.execute(bootResult.db!.kysely);
    expect(rows.length).toBe(1);
  });
});
