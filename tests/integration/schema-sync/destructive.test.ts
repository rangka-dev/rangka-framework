import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'kysely';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { autoSync } from '@rangka/core';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('schema-sync: destructive operations', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('without allowDestructive, orphaned columns produce warnings', async () => {
    await sql`ALTER TABLE "sales__customer" ADD COLUMN "to_drop_col" TEXT`.execute(
      bootResult.db!.kysely,
    );

    const result = await autoSync(bootResult.registry, bootResult.db!.kysely);
    const dropColWarnings = result.warnings.filter(
      (w) => w.type === 'DROP_COLUMN' && w.detail?.includes('to_drop_col'),
    );
    expect(dropColWarnings.length).toBe(1);

    // Column is NOT dropped (destructive ops are warnings only)
    const { rows } = await sql<{ column_name: string }>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sales__customer' AND column_name = 'to_drop_col'
    `.execute(bootResult.db!.kysely);
    expect(rows.length).toBe(1);
  });

  it('without allowDestructive, orphaned tables produce warnings', async () => {
    await sql`CREATE TABLE "orphan_test_table" (id UUID PRIMARY KEY)`.execute(
      bootResult.db!.kysely,
    );

    const result = await autoSync(bootResult.registry, bootResult.db!.kysely);
    const dropTableWarnings = result.warnings.filter(
      (w) => w.type === 'DROP_TABLE' && w.detail?.includes('orphan_test_table'),
    );
    expect(dropTableWarnings.length).toBe(1);

    // Table is NOT dropped
    const { rows } = await sql<{ table_name: string }>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'orphan_test_table'
    `.execute(bootResult.db!.kysely);
    expect(rows.length).toBe(1);
  });

  it('destructive operations are flagged with destructive: true', async () => {
    const result = await autoSync(bootResult.registry, bootResult.db!.kysely);
    for (const warning of result.warnings) {
      expect(warning.destructive).toBe(true);
    }
  });
});
