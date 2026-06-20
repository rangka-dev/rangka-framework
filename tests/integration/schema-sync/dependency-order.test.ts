import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'kysely';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('schema-sync: dependency order', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('all tables exist (proof that FK-safe order was applied)', async () => {
    const { rows } = await sql<{ table_name: string }>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `.execute(bootResult.db!.kysely);

    const tableNames = rows.map((r) => r.table_name);

    expect(tableNames).toContain('hr__employee');
    expect(tableNames).toContain('hr__department');
    expect(tableNames).toContain('project__project');
    expect(tableNames).toContain('project__task');
    expect(tableNames).toContain('project__timesheet');
  });

  it('cross-module FKs are valid (project.task → hr.employee)', async () => {
    const { rows } = await sql<{ constraint_name: string }>`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'project__task'
        AND ccu.table_name = 'hr__employee'
        AND tc.table_schema = 'public'
    `.execute(bootResult.db!.kysely);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('cross-module FKs are valid (project.timesheet → project.task + hr.employee)', async () => {
    const { rows } = await sql<{ constraint_name: string; referenced_table: string }>`
      SELECT tc.constraint_name, ccu.table_name AS referenced_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = tc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'project__timesheet'
        AND tc.table_schema = 'public'
    `.execute(bootResult.db!.kysely);

    const referencedTables = rows.map((r) => r.referenced_table);
    expect(referencedTables).toContain('project__task');
    expect(referencedTables).toContain('hr__employee');
  });

  it('naming_sequence table exists (sequence fields present)', async () => {
    const { rows } = await sql<{ table_name: string }>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'naming_sequence'
    `.execute(bootResult.db!.kysely);
    expect(rows.length).toBe(1);
  });

  it('job queue tables exist', async () => {
    const { rows } = await sql<{ table_name: string }>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'rangka_%'
    `.execute(bootResult.db!.kysely);
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});
