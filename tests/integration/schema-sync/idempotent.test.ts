import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'kysely';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { autoSync } from '@rangka/core';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('schema-sync: idempotent', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('first boot creates all tables', async () => {
    const { rows } = await sql<{ table_name: string }>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `.execute(bootResult.db!.kysely);

    const tableNames = rows.map((r) => r.table_name);
    expect(tableNames).toContain('sales__customer');
    expect(tableNames).toContain('sales__invoice');
    expect(tableNames).toContain('sales__invoice_item');
    expect(tableNames).toContain('sales__payment');
    expect(tableNames).toContain('sales__sales_tag');
    expect(tableNames).toContain('inventory__category');
    expect(tableNames).toContain('inventory__warehouse');
    expect(tableNames).toContain('inventory__item');
    expect(tableNames).toContain('inventory__stock_entry');
    expect(tableNames).toContain('hr__department');
    expect(tableNames).toContain('hr__employee');
    expect(tableNames).toContain('hr__leave_request');
    expect(tableNames).toContain('accounting__account');
    expect(tableNames).toContain('accounting__account_closure');
    expect(tableNames).toContain('accounting__journal_entry');
    expect(tableNames).toContain('accounting__journal_entry_item');
    expect(tableNames).toContain('project__project');
    expect(tableNames).toContain('project__task');
    expect(tableNames).toContain('project__timesheet');
    expect(tableNames).toContain('naming_sequence');
  });

  it('second autoSync produces zero non-destructive operations', async () => {
    const result = await autoSync(bootResult.registry, bootResult.db!.kysely);
    const nonDestructive = result.applied.filter((op) => !op.destructive);
    expect(nonDestructive).toHaveLength(0);
  });

  it('third autoSync is still idempotent', async () => {
    const result = await autoSync(bootResult.registry, bootResult.db!.kysely);
    const nonDestructive = result.applied.filter((op) => !op.destructive);
    expect(nonDestructive).toHaveLength(0);
  });
});
