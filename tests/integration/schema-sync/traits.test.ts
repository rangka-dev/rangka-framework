import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'kysely';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('schema-sync: traits', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  async function getColumns(table: string) {
    const { rows } = await sql<{ column_name: string; data_type: string; is_nullable: string }>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table}
      ORDER BY ordinal_position
    `.execute(bootResult.db!.kysely);
    return rows;
  }

  it('timestamped trait adds created_at TIMESTAMPTZ', async () => {
    const cols = await getColumns('sales__invoice');
    const col = cols.find((c) => c.column_name === 'created_at');
    expect(col).toBeDefined();
    expect(col!.data_type).toBe('timestamp with time zone');
  });

  it('timestamped trait adds updated_at TIMESTAMPTZ', async () => {
    const cols = await getColumns('sales__invoice');
    const col = cols.find((c) => c.column_name === 'updated_at');
    expect(col).toBeDefined();
    expect(col!.data_type).toBe('timestamp with time zone');
  });

  it('timestamped trait adds created_by UUID (nullable)', async () => {
    const cols = await getColumns('sales__invoice');
    const col = cols.find((c) => c.column_name === 'created_by');
    expect(col).toBeDefined();
    expect(col!.data_type).toBe('uuid');
    expect(col!.is_nullable).toBe('YES');
  });

  it('timestamped trait adds updated_by UUID (nullable)', async () => {
    const cols = await getColumns('sales__invoice');
    const col = cols.find((c) => c.column_name === 'updated_by');
    expect(col).toBeDefined();
    expect(col!.data_type).toBe('uuid');
    expect(col!.is_nullable).toBe('YES');
  });

  it('timestamped trait applies to all models with the trait', async () => {
    const tables = ['hr__employee', 'project__project', 'project__task', 'hr__leave_request'];
    for (const table of tables) {
      const cols = await getColumns(table);
      const createdAt = cols.find((c) => c.column_name === 'created_at');
      const updatedAt = cols.find((c) => c.column_name === 'updated_at');
      expect(createdAt, `${table} missing created_at`).toBeDefined();
      expect(updatedAt, `${table} missing updated_at`).toBeDefined();
    }
  });

  it('model without timestamped trait does NOT get created_at/updated_at', async () => {
    const cols = await getColumns('inventory__warehouse');
    const createdAt = cols.find((c) => c.column_name === 'created_at');
    const updatedAt = cols.find((c) => c.column_name === 'updated_at');
    expect(createdAt).toBeUndefined();
    expect(updatedAt).toBeUndefined();
  });

  it('timestamped trait creates FK from created_by to core__user', async () => {
    const { rows } = await sql<{ column_name: string; referenced_table: string }>`
      SELECT kcu.column_name, ccu.table_name AS referenced_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'sales__invoice'
        AND kcu.column_name = 'created_by'
        AND tc.table_schema = 'public'
    `.execute(bootResult.db!.kysely);
    expect(rows.length).toBe(1);
    expect(rows[0].referenced_table).toBe('core__user');
  });
});
