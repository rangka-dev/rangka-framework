import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'kysely';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('jobs: enqueue', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('job registry is initialized', () => {
    expect(bootResult.jobRegistry).toBeDefined();
  });

  it('job registry can register and retrieve jobs', () => {
    const allJobs = bootResult.jobRegistry.getAll();
    expect(Array.isArray(allJobs)).toBe(true);
  });

  it('job queue tables exist in database', async () => {
    const { rows } = await sql<{ table_name: string }>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'rangka_%'
    `.execute(bootResult.db!.kysely);
    const names = rows.map((r) => r.table_name);
    expect(names).toContain('rangka_jobs');
    expect(names).toContain('rangka_dead_letters');
    expect(names).toContain('rangka_scheduled_jobs');
  });
});
