import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { bootSqliteApp } from './helpers.js';
import type { BootResult } from '@rangka/core';

describe('SQLite transactions', () => {
  let result: BootResult;

  beforeAll(async () => {
    result = await bootSqliteApp();
  });

  afterAll(async () => {
    await result.db?.destroy();
  });

  it('commits a successful transaction', async () => {
    await result.db!.transaction(async (trx) => {
      await trx
        .insertInto('core__user' as never)
        .values({
          id: '00000000-0000-0000-0000-000000000001',
          email: 'trx-commit@example.com',
          full_name: 'TRX Commit',
          password_hash: 'h',
          enabled: 1,
        } as never)
        .execute();
    });

    const record = await result.frameworkContext!.models.get(
      'core.user',
      '00000000-0000-0000-0000-000000000001',
    );
    expect(record).toBeDefined();
    expect(record!.email).toBe('trx-commit@example.com');
  });

  it('rolls back a failed transaction', async () => {
    try {
      await result.db!.transaction(async (trx) => {
        await trx
          .insertInto('core__user' as never)
          .values({
            id: '00000000-0000-0000-0000-000000000002',
            email: 'trx-rollback@example.com',
            full_name: 'TRX Rollback',
            password_hash: 'h',
            enabled: 1,
          } as never)
          .execute();

        throw new Error('Intentional rollback');
      });
    } catch {
      // Expected
    }

    const record = await result.frameworkContext!.models.get(
      'core.user',
      '00000000-0000-0000-0000-000000000002',
    );
    expect(record).toBeNull();
  });
});
