import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'kysely';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { autoSync } from '@rangka/core';
import type { BootResult, ResolvedField } from '@rangka/core';

let bootResult: BootResult;

describe('schema-sync: incremental changes', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('adding a new field to a model only produces ADD_COLUMN', async () => {
    const model = bootResult.registry.getModel('sales.customer');
    expect(model).toBeDefined();

    const fakeField = {
      name: 'website',
      config: { type: 'string' as const, required: false, maxLength: 255 },
    };
    (model!.fields as ResolvedField[]).push(fakeField);

    const result = await autoSync(bootResult.registry, bootResult.db!.kysely);
    const addColOps = result.applied.filter((op) => op.type === 'ADD_COLUMN');
    expect(addColOps.length).toBeGreaterThanOrEqual(1);
    const websiteOp = addColOps.find((op) => op.sql.includes('website'));
    expect(websiteOp).toBeDefined();

    const { rows } = await sql<{ column_name: string }>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sales__customer' AND column_name = 'website'
    `.execute(bootResult.db!.kysely);
    expect(rows.length).toBe(1);

    (model!.fields as ResolvedField[]).pop();
  });

  it('subsequent sync after incremental add is idempotent again', async () => {
    const result = await autoSync(bootResult.registry, bootResult.db!.kysely);
    const nonDestructive = result.applied.filter((op) => !op.destructive);
    expect(nonDestructive).toHaveLength(0);
  });
});
