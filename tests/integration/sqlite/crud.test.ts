import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { bootSqliteApp } from './helpers.js';
import type { BootResult } from '@rangka/core';

describe('SQLite CRUD operations', () => {
  let result: BootResult;

  beforeAll(async () => {
    result = await bootSqliteApp();
  });

  afterAll(async () => {
    await result.db?.destroy();
  });

  it('creates a record with app-generated UUID', async () => {
    const record = await result.frameworkContext!.models.create('core.user', {
      email: 'test@example.com',
      full_name: 'Test User',
      password_hash: 'hashed',
      enabled: 1,
    });

    expect(record.id).toBeDefined();
    expect(typeof record.id).toBe('string');
    expect((record.id as string).length).toBe(36);
    expect(record.email).toBe('test@example.com');
  });

  it('gets a record by id', async () => {
    const created = await result.frameworkContext!.models.create('core.user', {
      email: 'get@example.com',
      full_name: 'Get User',
      password_hash: 'hashed',
      enabled: 1,
    });

    const fetched = await result.frameworkContext!.models.get('core.user', created.id as string);
    expect(fetched).toBeDefined();
    expect(fetched!.email).toBe('get@example.com');
  });

  it('updates a record', async () => {
    const created = await result.frameworkContext!.models.create('core.user', {
      email: 'update@example.com',
      full_name: 'Before Update',
      password_hash: 'hashed',
      enabled: 1,
    });

    const updated = await result.frameworkContext!.models.update(
      'core.user',
      created.id as string,
      { full_name: 'After Update' },
    );

    expect(updated.full_name).toBe('After Update');
  });

  it('deletes a record', async () => {
    const created = await result.frameworkContext!.models.create('core.user', {
      email: 'delete@example.com',
      full_name: 'Delete Me',
      password_hash: 'hashed',
      enabled: 1,
    });

    await result.frameworkContext!.models.delete('core.user', created.id as string);

    const fetched = await result.frameworkContext!.models.get('core.user', created.id as string);
    expect(fetched).toBeNull();
  });

  it('creates many records in bulk', async () => {
    const records = await result.frameworkContext!.models.createMany('core.user', [
      { email: 'bulk1@example.com', full_name: 'Bulk 1', password_hash: 'h', enabled: 1 },
      { email: 'bulk2@example.com', full_name: 'Bulk 2', password_hash: 'h', enabled: 1 },
      { email: 'bulk3@example.com', full_name: 'Bulk 3', password_hash: 'h', enabled: 1 },
    ]);

    expect(records).toHaveLength(3);
    expect(records[0].email).toBe('bulk1@example.com');
    expect(records[2].email).toBe('bulk3@example.com');
  });
});
