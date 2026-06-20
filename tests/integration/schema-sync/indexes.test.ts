import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'kysely';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('schema-sync: indexes', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  async function getIndexes(table: string) {
    const { rows } = await sql<{ indexname: string; indexdef: string }>`
      SELECT indexname, indexdef FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = ${table}
    `.execute(bootResult.db!.kysely);
    return rows;
  }

  it('creates unique index on customer.email', async () => {
    const indexes = await getIndexes('sales__customer');
    const emailIdx = indexes.find(
      (i) => i.indexname.includes('email') && i.indexdef.includes('UNIQUE'),
    );
    expect(emailIdx).toBeDefined();
  });

  it('creates composite index on invoice (customer, posting_date)', async () => {
    const indexes = await getIndexes('sales__invoice');
    const compositeIdx = indexes.find((i) => i.indexname.includes('customer_posting_date'));
    expect(compositeIdx).toBeDefined();
    expect(compositeIdx!.indexdef).toContain('customer');
    expect(compositeIdx!.indexdef).toContain('posting_date');
  });

  it('creates non-unique index on invoice.status', async () => {
    const indexes = await getIndexes('sales__invoice');
    const statusIdx = indexes.find((i) => i.indexname.includes('status'));
    expect(statusIdx).toBeDefined();
    expect(statusIdx!.indexdef).not.toContain('UNIQUE');
  });

  it('creates unique index on warehouse.code', async () => {
    const indexes = await getIndexes('inventory__warehouse');
    const codeIdx = indexes.find(
      (i) => i.indexname.includes('code') && i.indexdef.includes('UNIQUE'),
    );
    expect(codeIdx).toBeDefined();
  });

  it('creates unique index on item.barcode', async () => {
    const indexes = await getIndexes('inventory__item');
    const barcodeIdx = indexes.find(
      (i) => i.indexname.includes('barcode') && i.indexdef.includes('UNIQUE'),
    );
    expect(barcodeIdx).toBeDefined();
  });

  it('creates composite index on stock_entry (warehouse, item)', async () => {
    const indexes = await getIndexes('inventory__stock_entry');
    const compIdx = indexes.find((i) => i.indexname.includes('warehouse_item'));
    expect(compIdx).toBeDefined();
  });

  it('creates unique index on department.name', async () => {
    const indexes = await getIndexes('hr__department');
    const nameIdx = indexes.find(
      (i) => i.indexname.includes('name') && i.indexdef.includes('UNIQUE'),
    );
    expect(nameIdx).toBeDefined();
  });

  it('creates unique index on account.account_number', async () => {
    const indexes = await getIndexes('accounting__account');
    const numIdx = indexes.find(
      (i) => i.indexname.includes('account_number') && i.indexdef.includes('UNIQUE'),
    );
    expect(numIdx).toBeDefined();
  });

  it('creates index on leave_request (start_date, end_date)', async () => {
    const indexes = await getIndexes('hr__leave_request');
    const dateIdx = indexes.find((i) => i.indexname.includes('start_date_end_date'));
    expect(dateIdx).toBeDefined();
  });

  it('creates multiple indexes on project.task (project, assigned_to, status, priority)', async () => {
    const indexes = await getIndexes('project__task');
    const projectIdx = indexes.find(
      (i) => i.indexname.includes('project') && !i.indexname.includes('assigned'),
    );
    const assignIdx = indexes.find((i) => i.indexname.includes('assigned_to'));
    const statusIdx = indexes.find((i) => i.indexname.includes('status'));
    const priorityIdx = indexes.find((i) => i.indexname.includes('priority'));
    expect(projectIdx).toBeDefined();
    expect(assignIdx).toBeDefined();
    expect(statusIdx).toBeDefined();
    expect(priorityIdx).toBeDefined();
  });
});
