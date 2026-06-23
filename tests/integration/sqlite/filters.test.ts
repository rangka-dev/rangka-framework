import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { bootSqliteApp } from './helpers.js';
import type { BootResult } from '@rangka/core';

describe('SQLite filters', () => {
  let result: BootResult;

  beforeAll(async () => {
    result = await bootSqliteApp();

    // Seed test data
    await result.frameworkContext!.models.createMany('core.user', [
      { email: 'alice@example.com', full_name: 'Alice Smith', password_hash: 'h', enabled: 1 },
      { email: 'bob@example.com', full_name: 'Bob Jones', password_hash: 'h', enabled: 1 },
      { email: 'charlie@example.com', full_name: 'Charlie Brown', password_hash: 'h', enabled: 1 },
    ]);
  });

  afterAll(async () => {
    await result.db?.destroy();
  });

  it('filters with eq operator', async () => {
    const records = await result
      .frameworkContext!.models.query('core.user')
      .filter({ email: 'alice@example.com' })
      .exec();

    expect(records.data).toHaveLength(1);
    expect(records.data[0].full_name).toBe('Alice Smith');
  });

  it('filters with contains (case-insensitive LIKE)', async () => {
    const records = await result
      .frameworkContext!.models.query('core.user')
      .filter({ full_name: { contains: 'smith' } })
      .exec();

    expect(records.data).toHaveLength(1);
    expect(records.data[0].full_name).toBe('Alice Smith');
  });

  it('filters with startsWith', async () => {
    const records = await result
      .frameworkContext!.models.query('core.user')
      .filter({ full_name: { startsWith: 'Bob' } })
      .exec();

    expect(records.data).toHaveLength(1);
    expect(records.data[0].email).toBe('bob@example.com');
  });

  it('filters with in operator', async () => {
    const records = await result
      .frameworkContext!.models.query('core.user')
      .filter({ email: { in: ['alice@example.com', 'bob@example.com'] } })
      .exec();

    expect(records.data).toHaveLength(2);
  });

  it('filters with neq operator', async () => {
    const records = await result
      .frameworkContext!.models.query('core.user')
      .filter({ email: { neq: 'alice@example.com' } })
      .exec();

    expect(records.data.length).toBeGreaterThanOrEqual(2);
    expect(records.data.every((r) => r.email !== 'alice@example.com')).toBe(true);
  });

  it('filters with endsWith', async () => {
    const records = await result
      .frameworkContext!.models.query('core.user')
      .filter({ full_name: { endsWith: 'Brown' } })
      .exec();

    expect(records.data).toHaveLength(1);
    expect(records.data[0].full_name).toBe('Charlie Brown');
  });
});
