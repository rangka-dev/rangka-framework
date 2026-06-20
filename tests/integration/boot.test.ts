import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from './helpers/db.js';
import { bootFixtureApp } from './helpers/boot.js';
import type { BootResult } from '@rangka/core';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

let db: Kysely<unknown>;
let bootResult: BootResult;

describe('boot integration', () => {
  beforeAll(async () => {
    db = createTestDb();
    await resetDatabase(db);
    await db.destroy();

    bootResult = await bootFixtureApp();
  });

  afterAll(async () => {
    if (bootResult.db) {
      await bootResult.db.destroy();
    }
  });

  it('resolves schema registry with expected models', () => {
    const models = bootResult.registry.getAllModels();
    const names = models.map((m) => m.qualifiedName);
    expect(names).toContain('sales.customer');
    expect(names).toContain('sales.invoice');
  });

  it('creates tables in Postgres via auto-sync', async () => {
    const { rows } = await sql<{ table_name: string }>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `.execute(bootResult.db!.kysely);

    const tableNames = rows.map((r) => r.table_name);
    expect(tableNames).toContain('sales__customer');
    expect(tableNames).toContain('sales__invoice');
  });

  it('creates correct columns for customer table', async () => {
    const { rows } = await sql<{ column_name: string; data_type: string }>`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sales__customer'
      ORDER BY ordinal_position
    `.execute(bootResult.db!.kysely);

    const colNames = rows.map((r) => r.column_name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('name');
    expect(colNames).toContain('email');
  });

  it('creates correct columns for invoice table', async () => {
    const { rows } = await sql<{ column_name: string }>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sales__invoice'
      ORDER BY ordinal_position
    `.execute(bootResult.db!.kysely);

    const colNames = rows.map((r) => r.column_name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('invoice_number');
    expect(colNames).toContain('customer');
    expect(colNames).toContain('posting_date');
    expect(colNames).toContain('grand_total');
    expect(colNames).toContain('status');
  });

  it('creates foreign key from invoice to customer', async () => {
    const { rows } = await sql<{ constraint_name: string }>`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'sales__invoice'
        AND tc.table_schema = 'public'
    `.execute(bootResult.db!.kysely);

    expect(rows.length).toBeGreaterThan(0);
  });

  it('registers hooks for invoice', () => {
    const chain = bootResult.hookRegistry.getChain('sales.invoice');
    expect(chain).toBeDefined();
    expect(chain!.entries.length).toBeGreaterThan(0);
  });
});
