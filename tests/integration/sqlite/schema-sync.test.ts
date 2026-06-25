import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { bootSqliteApp } from './helpers.js';
import type { BootResult } from '@rangka/core';

describe('SQLite schema sync', () => {
  let result: BootResult;

  beforeAll(async () => {
    result = await bootSqliteApp();
  });

  afterAll(async () => {
    await result.db?.destroy();
  });

  it('creates tables during boot', async () => {
    const { rows } = await import('kysely').then(({ sql }) =>
      sql<{
        name: string;
      }>`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`.execute(
        result.db!.kysely,
      ),
    );

    const tableNames = rows.map((r) => r.name);
    expect(tableNames).toContain('core__user');
    expect(tableNames).toContain('core__role');
  });

  it('does not create job tables', async () => {
    const { rows } = await import('kysely').then(({ sql }) =>
      sql<{
        name: string;
      }>`SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'rangka_%'`.execute(
        result.db!.kysely,
      ),
    );

    const tableNames = rows.map((r) => r.name);
    expect(tableNames).not.toContain('rangka_jobs');
    expect(tableNames).not.toContain('rangka_dead_letters');
    expect(tableNames).not.toContain('rangka_scheduled_jobs');
  });

  it('creates indexes', async () => {
    const { rows } = await import('kysely').then(({ sql }) =>
      sql<{ name: string }>`SELECT name FROM sqlite_master WHERE type='index'`.execute(
        result.db!.kysely,
      ),
    );

    const indexNames = rows.map((r) => r.name);
    expect(indexNames.length).toBeGreaterThan(0);
  });

  it('uses TEXT type for UUID columns', async () => {
    const { rows } = await import('kysely').then(({ sql }) =>
      sql<{ name: string; type: string }>`PRAGMA table_info("core__user")`.execute(
        result.db!.kysely,
      ),
    );

    const idCol = rows.find((r) => r.name === 'id');
    expect(idCol).toBeDefined();
    expect(idCol!.type).toBe('TEXT');
  });

  it('uses INTEGER type for boolean columns', async () => {
    const { rows } = await import('kysely').then(({ sql }) =>
      sql<{ name: string; type: string }>`PRAGMA table_info("core__user")`.execute(
        result.db!.kysely,
      ),
    );

    const activeCol = rows.find((r) => r.name === 'is_active');
    if (activeCol) {
      expect(activeCol.type).toBe('INTEGER');
    }
  });
});
