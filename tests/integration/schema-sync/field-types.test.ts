import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'kysely';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('schema-sync: field types', () => {
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
    const { rows } = await sql<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }>`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table}
      ORDER BY ordinal_position
    `.execute(bootResult.db!.kysely);
    return rows;
  }

  it('creates UUID primary key for every table', async () => {
    const cols = await getColumns('sales__customer');
    const idCol = cols.find((c) => c.column_name === 'id');
    expect(idCol).toBeDefined();
    expect(idCol!.data_type).toBe('uuid');
    expect(idCol!.is_nullable).toBe('NO');
  });

  it('maps string field to VARCHAR', async () => {
    const cols = await getColumns('sales__customer');
    const nameCol = cols.find((c) => c.column_name === 'name');
    expect(nameCol).toBeDefined();
    expect(nameCol!.data_type).toBe('character varying');
    expect(nameCol!.is_nullable).toBe('NO');
  });

  it('maps text field to TEXT', async () => {
    const cols = await getColumns('sales__customer');
    const notesCol = cols.find((c) => c.column_name === 'notes');
    expect(notesCol).toBeDefined();
    expect(notesCol!.data_type).toBe('text');
    expect(notesCol!.is_nullable).toBe('YES');
  });

  it('maps int field to INTEGER', async () => {
    const cols = await getColumns('sales__invoice_item');
    const qtyCol = cols.find((c) => c.column_name === 'qty');
    expect(qtyCol).toBeDefined();
    expect(qtyCol!.data_type).toBe('integer');
    expect(qtyCol!.is_nullable).toBe('NO');
  });

  it('maps decimal field to NUMERIC with precision/scale', async () => {
    const cols = await getColumns('sales__invoice_item');
    const rateCol = cols.find((c) => c.column_name === 'rate');
    expect(rateCol).toBeDefined();
    expect(rateCol!.data_type).toBe('numeric');
  });

  it('maps boolean field to BOOLEAN', async () => {
    const cols = await getColumns('sales__customer');
    const activeCol = cols.find((c) => c.column_name === 'is_active');
    expect(activeCol).toBeDefined();
    expect(activeCol!.data_type).toBe('boolean');
  });

  it('maps date field to DATE', async () => {
    const cols = await getColumns('sales__invoice');
    const dateCol = cols.find((c) => c.column_name === 'posting_date');
    expect(dateCol).toBeDefined();
    expect(dateCol!.data_type).toBe('date');
  });

  it('maps datetime field to TIMESTAMPTZ', async () => {
    const cols = await getColumns('inventory__stock_entry');
    const dateCol = cols.find((c) => c.column_name === 'posting_date');
    expect(dateCol).toBeDefined();
    expect(dateCol!.data_type).toBe('timestamp with time zone');
  });

  it('maps enum field to VARCHAR', async () => {
    const cols = await getColumns('sales__invoice');
    const statusCol = cols.find((c) => c.column_name === 'status');
    expect(statusCol).toBeDefined();
    expect(statusCol!.data_type).toBe('character varying');
  });

  it('maps json field to JSONB', async () => {
    const cols = await getColumns('sales__customer');
    const metaCol = cols.find((c) => c.column_name === 'metadata');
    expect(metaCol).toBeDefined();
    expect(metaCol!.data_type).toBe('jsonb');
  });

  it('maps link field to UUID foreign key', async () => {
    const cols = await getColumns('sales__invoice');
    const custCol = cols.find((c) => c.column_name === 'customer');
    expect(custCol).toBeDefined();
    expect(custCol!.data_type).toBe('uuid');
  });

  it('maps money field to two DECIMAL columns (amount + base)', async () => {
    const cols = await getColumns('sales__invoice');
    const totalCol = cols.find((c) => c.column_name === 'grand_total');
    const baseCol = cols.find((c) => c.column_name === 'grand_total_base');
    expect(totalCol).toBeDefined();
    expect(totalCol!.data_type).toBe('numeric');
    expect(baseCol).toBeDefined();
    expect(baseCol!.data_type).toBe('numeric');
  });

  it('maps sequence field to VARCHAR', async () => {
    const cols = await getColumns('sales__invoice');
    const seqCol = cols.find((c) => c.column_name === 'invoice_number');
    expect(seqCol).toBeDefined();
    expect(seqCol!.data_type).toBe('character varying');
    expect(seqCol!.is_nullable).toBe('YES');
  });

  it('maps dynamicLink to two columns (discriminator + UUID)', async () => {
    const cols = await getColumns('sales__payment');
    const typeCol = cols.find((c) => c.column_name === 'reference_type');
    const refCol = cols.find((c) => c.column_name === 'reference');
    expect(typeCol).toBeDefined();
    expect(typeCol!.data_type).toBe('character varying');
    expect(refCol).toBeDefined();
    expect(refCol!.data_type).toBe('uuid');
  });

  it('maps attachment field to JSONB', async () => {
    const cols = await getColumns('sales__customer');
    const logoCol = cols.find((c) => c.column_name === 'logo');
    expect(logoCol).toBeDefined();
    expect(logoCol!.data_type).toBe('jsonb');
  });

  it('maps attachments field to JSONB', async () => {
    const cols = await getColumns('sales__invoice');
    const attCol = cols.find((c) => c.column_name === 'attachments');
    expect(attCol).toBeDefined();
    expect(attCol!.data_type).toBe('jsonb');
  });

  it('maps code field to TEXT', async () => {
    const cols = await getColumns('project__task');
    const notesCol = cols.find((c) => c.column_name === 'notes');
    expect(notesCol).toBeDefined();
    expect(notesCol!.data_type).toBe('text');
  });

  it('maps tree (materialized_path) to parent UUID + path + depth', async () => {
    const cols = await getColumns('inventory__category');
    const parentCol = cols.find((c) => c.column_name === 'parent');
    const pathCol = cols.find((c) => c.column_name === 'path');
    const depthCol = cols.find((c) => c.column_name === 'depth');
    expect(parentCol).toBeDefined();
    expect(parentCol!.data_type).toBe('uuid');
    expect(pathCol).toBeDefined();
    expect(pathCol!.data_type).toBe('text');
    expect(depthCol).toBeDefined();
    expect(depthCol!.data_type).toBe('integer');
  });

  it('maps tree (nested_set) to parent UUID + lft + rgt', async () => {
    const cols = await getColumns('hr__department');
    const parentCol = cols.find((c) => c.column_name === 'parent');
    const lftCol = cols.find((c) => c.column_name === 'lft');
    const rgtCol = cols.find((c) => c.column_name === 'rgt');
    expect(parentCol).toBeDefined();
    expect(parentCol!.data_type).toBe('uuid');
    expect(lftCol).toBeDefined();
    expect(lftCol!.data_type).toBe('integer');
    expect(rgtCol).toBeDefined();
    expect(rgtCol!.data_type).toBe('integer');
  });

  it('maps tree (closure_table) to parent UUID + creates closure table', async () => {
    const cols = await getColumns('accounting__account');
    const parentCol = cols.find((c) => c.column_name === 'parent');
    expect(parentCol).toBeDefined();
    expect(parentCol!.data_type).toBe('uuid');

    const { rows: tables } = await sql<{ table_name: string }>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'accounting__account_closure'
    `.execute(bootResult.db!.kysely);
    expect(tables.length).toBe(1);
  });

  it('computed field with stored: true is registered in the model', () => {
    const model = bootResult.registry.getModel('sales.invoice_item');
    expect(model).toBeDefined();
    const amountField = model!.fields.find((f) => f.name === 'amount');
    expect(amountField).toBeDefined();
    expect(amountField!.config.type).toBe('computed');
  });
});
