import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'kysely';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { SchemaToDesired } from '@rangka/core';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('schema-sync: constraints', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('enforces NOT NULL on required string fields', async () => {
    const { rows } = await sql<{ column_name: string; is_nullable: string }>`
      SELECT column_name, is_nullable FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sales__customer'
        AND column_name IN ('name', 'email')
    `.execute(bootResult.db!.kysely);
    for (const row of rows) {
      expect(row.is_nullable).toBe('NO');
    }
  });

  it('enforces NOT NULL on required int fields', async () => {
    const { rows } = await sql<{ column_name: string; is_nullable: string }>`
      SELECT column_name, is_nullable FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sales__invoice_item'
        AND column_name = 'qty'
    `.execute(bootResult.db!.kysely);
    expect(rows[0].is_nullable).toBe('NO');
  });

  it('enforces NOT NULL on required decimal fields', async () => {
    const { rows } = await sql<{ column_name: string; is_nullable: string }>`
      SELECT column_name, is_nullable FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sales__invoice_item'
        AND column_name = 'rate'
    `.execute(bootResult.db!.kysely);
    expect(rows[0].is_nullable).toBe('NO');
  });

  it('allows NULL on optional fields', async () => {
    const { rows } = await sql<{ column_name: string; is_nullable: string }>`
      SELECT column_name, is_nullable FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sales__customer'
        AND column_name IN ('phone', 'notes', 'metadata', 'logo')
    `.execute(bootResult.db!.kysely);
    for (const row of rows) {
      expect(row.is_nullable).toBe('YES');
    }
  });

  it('required link fields are NOT NULL at DB level', async () => {
    const { rows } = await sql<{ column_name: string; is_nullable: string }>`
      SELECT column_name, is_nullable FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sales__invoice'
        AND column_name = 'customer'
    `.execute(bootResult.db!.kysely);
    expect(rows[0].is_nullable).toBe('NO');
  });

  it('enum fields stored as VARCHAR', async () => {
    const { rows } = await sql<{ column_name: string; data_type: string }>`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sales__invoice'
        AND column_name = 'status'
    `.execute(bootResult.db!.kysely);
    expect(rows[0].data_type).toBe('character varying');
  });

  it('desired state contains check constraints for enum fields', () => {
    const converter = new SchemaToDesired();
    const desired = converter.convert(bootResult.registry);
    const invoiceTable = desired.tables.find((t) => t.name === 'sales__invoice');
    expect(invoiceTable).toBeDefined();
    expect(invoiceTable!.checkConstraints.length).toBeGreaterThan(0);
    const statusConstraint = invoiceTable!.checkConstraints.find((c) => c.column === 'status');
    expect(statusConstraint).toBeDefined();
    expect(statusConstraint!.expression).toContain('Draft');
  });

  it('desired state contains check constraints for all enum models', () => {
    const converter = new SchemaToDesired();
    const desired = converter.convert(bootResult.registry);

    const paymentTable = desired.tables.find((t) => t.name === 'sales__payment');
    const methodChk = paymentTable?.checkConstraints.find((c) => c.column === 'method');
    expect(methodChk).toBeDefined();
    expect(methodChk!.expression).toContain('Cash');

    const itemTable = desired.tables.find((t) => t.name === 'inventory__item');
    const unitChk = itemTable?.checkConstraints.find((c) => c.column === 'unit');
    expect(unitChk).toBeDefined();
    expect(unitChk!.expression).toContain('Piece');
  });
});
