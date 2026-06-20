import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'kysely';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('schema-sync: relationships', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  async function getForeignKeys(table: string) {
    const { rows } = await sql<{
      constraint_name: string;
      column_name: string;
      referenced_table: string;
      referenced_column: string;
    }>`
      SELECT tc.constraint_name, kcu.column_name,
             ccu.table_name AS referenced_table, ccu.column_name AS referenced_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = ${table}
        AND tc.table_schema = 'public'
    `.execute(bootResult.db!.kysely);
    return rows;
  }

  it('creates FK from invoice to customer (same module link)', async () => {
    const fks = await getForeignKeys('sales__invoice');
    const custFk = fks.find((fk) => fk.column_name === 'customer');
    expect(custFk).toBeDefined();
    expect(custFk!.referenced_table).toBe('sales__customer');
    expect(custFk!.referenced_column).toBe('id');
  });

  it('creates FK from invoice_item to invoice (children/parent)', async () => {
    const fks = await getForeignKeys('sales__invoice_item');
    const invoiceFk = fks.find((fk) => fk.column_name === 'invoice');
    expect(invoiceFk).toBeDefined();
    expect(invoiceFk!.referenced_table).toBe('sales__invoice');
  });

  it('creates FK from invoice_item to inventory.item (cross-module link)', async () => {
    const fks = await getForeignKeys('sales__invoice_item');
    const itemFk = fks.find((fk) => fk.column_name === 'item');
    expect(itemFk).toBeDefined();
    expect(itemFk!.referenced_table).toBe('inventory__item');
    expect(itemFk!.referenced_column).toBe('id');
  });

  it('creates FK from project to hr.employee (cross-module manager link)', async () => {
    const fks = await getForeignKeys('project__project');
    const mgrFk = fks.find((fk) => fk.column_name === 'manager');
    expect(mgrFk).toBeDefined();
    expect(mgrFk!.referenced_table).toBe('hr__employee');
  });

  it('creates FK from task to hr.employee (cross-module assigned_to)', async () => {
    const fks = await getForeignKeys('project__task');
    const assignFk = fks.find((fk) => fk.column_name === 'assigned_to');
    expect(assignFk).toBeDefined();
    expect(assignFk!.referenced_table).toBe('hr__employee');
  });

  it('creates FK from timesheet to both project.task and hr.employee', async () => {
    const fks = await getForeignKeys('project__timesheet');
    const taskFk = fks.find((fk) => fk.column_name === 'task');
    const empFk = fks.find((fk) => fk.column_name === 'employee');
    expect(taskFk).toBeDefined();
    expect(taskFk!.referenced_table).toBe('project__task');
    expect(empFk).toBeDefined();
    expect(empFk!.referenced_table).toBe('hr__employee');
  });

  it('creates self-referential FK for tree fields (category.parent)', async () => {
    const fks = await getForeignKeys('inventory__category');
    const parentFk = fks.find((fk) => fk.column_name === 'parent');
    expect(parentFk).toBeDefined();
    expect(parentFk!.referenced_table).toBe('inventory__category');
    expect(parentFk!.referenced_column).toBe('id');
  });

  it('creates self-referential FK for nested_set tree (department.parent)', async () => {
    const fks = await getForeignKeys('hr__department');
    const parentFk = fks.find((fk) => fk.column_name === 'parent');
    expect(parentFk).toBeDefined();
    expect(parentFk!.referenced_table).toBe('hr__department');
  });

  it('creates closure table with ancestor/descendant FKs', async () => {
    const fks = await getForeignKeys('accounting__account_closure');
    const ancestorFk = fks.find((fk) => fk.column_name === 'ancestor_id');
    const descendantFk = fks.find((fk) => fk.column_name === 'descendant_id');
    expect(ancestorFk).toBeDefined();
    expect(ancestorFk!.referenced_table).toBe('accounting__account');
    expect(descendantFk).toBeDefined();
    expect(descendantFk!.referenced_table).toBe('accounting__account');
  });

  it('creates FK from journal_entry_item to accounting.account', async () => {
    const fks = await getForeignKeys('accounting__journal_entry_item');
    const accFk = fks.find((fk) => fk.column_name === 'account');
    expect(accFk).toBeDefined();
    expect(accFk!.referenced_table).toBe('accounting__account');
  });

  it('dynamicLink does NOT create FK (polymorphic reference)', async () => {
    const fks = await getForeignKeys('sales__payment');
    const refFk = fks.find((fk) => fk.column_name === 'reference');
    expect(refFk).toBeUndefined();
  });
});
