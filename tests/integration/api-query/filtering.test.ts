import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-query: filtering', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp({ server: true });
    await bootResult.server!.listen({ port: 0 });
    api = new ApiClient(bootResult);
    await api.login();

    await api.post('/api/sales/customer', {
      name: 'Alice Corp',
      email: 'alice@filter.com',
      is_active: true,
      credit_limit: 10000,
    });
    await api.post('/api/sales/customer', {
      name: 'Bob Inc',
      email: 'bob@filter.com',
      is_active: true,
      credit_limit: 50000,
    });
    await api.post('/api/sales/customer', {
      name: 'Charlie LLC',
      email: 'charlie@filter.com',
      is_active: false,
      credit_limit: 25000,
    });
    await api.post('/api/sales/customer', {
      name: 'Dave Co',
      email: 'dave@filter.com',
      is_active: true,
      credit_limit: 75000,
    });
    await api.post('/api/sales/customer', {
      name: 'Eve Ltd',
      email: 'eve@filter.com',
      is_active: false,
      credit_limit: 5000,
      notes: null,
    });
  });

  afterAll(async () => {
    if (bootResult.server) await bootResult.server.close();
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('filters by eq operator (string)', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[name][eq]=Alice Corp');
    const body = await res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].name).toBe('Alice Corp');
  });

  it('filters by eq operator (boolean)', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[is_active][eq]=false');
    const body = await res.json();
    expect(body.data.length).toBe(2);
    for (const record of body.data) {
      expect(record.is_active).toBe(false);
    }
  });

  it('filters by neq operator', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[name][neq]=Alice Corp');
    const body = await res.json();
    expect(body.data.length).toBe(4);
    expect(body.data.every((r: Record<string, unknown>) => r.name !== 'Alice Corp')).toBe(true);
  });

  it('filters by gt operator (numeric)', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[credit_limit][gt]=25000');
    const body = await res.json();
    expect(body.data.length).toBe(2);
    for (const record of body.data) {
      expect(Number(record.credit_limit)).toBeGreaterThan(25000);
    }
  });

  it('filters by gte operator (numeric)', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[credit_limit][gte]=25000');
    const body = await res.json();
    expect(body.data.length).toBe(3);
  });

  it('filters by lt operator (numeric)', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[credit_limit][lt]=25000');
    const body = await res.json();
    expect(body.data.length).toBe(2);
    for (const record of body.data) {
      expect(Number(record.credit_limit)).toBeLessThan(25000);
    }
  });

  it('filters by lte operator (numeric)', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[credit_limit][lte]=25000');
    const body = await res.json();
    expect(body.data.length).toBe(3);
  });

  it('filters by like operator (string pattern)', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[name][like]=%Corp');
    const body = await res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].name).toContain('Corp');
  });

  it('filters by in operator (multiple values)', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[name][in]=Alice Corp,Bob Inc');
    const body = await res.json();
    expect(body.data.length).toBe(2);
    const names = body.data.map((r: Record<string, unknown>) => r.name);
    expect(names).toContain('Alice Corp');
    expect(names).toContain('Bob Inc');
  });

  it('filters by isnull operator (true)', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[notes][isnull]=true');
    const body = await res.json();
    for (const record of body.data) {
      expect(record.notes).toBeNull();
    }
  });

  it('filters by isnull operator (false)', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[notes][isnull]=false');
    const body = await res.json();
    for (const record of body.data) {
      expect(record.notes).not.toBeNull();
    }
  });

  it('combines multiple filters (AND logic)', async () => {
    const res = await api.getRaw(
      '/api/sales/customer?filter[is_active][eq]=true&filter[credit_limit][gte]=50000',
    );
    const body = await res.json();
    expect(body.data.length).toBe(2);
    for (const record of body.data) {
      expect(record.is_active).toBe(true);
      expect(Number(record.credit_limit)).toBeGreaterThanOrEqual(50000);
    }
  });

  it('returns empty array when no records match filter', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[name][eq]=NonexistentCorp');
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
  });
});
