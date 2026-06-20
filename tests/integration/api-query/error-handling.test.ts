import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('api-query: error handling', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp({ server: true });
    await bootResult.server!.listen({ port: 0 });
    api = new ApiClient(bootResult);
    await api.login();
  });

  afterAll(async () => {
    if (bootResult.server) await bootResult.server.close();
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('rejects filter on unknown field', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[nonexistent][eq]=foo');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain('nonexistent');
  });

  it('rejects unknown filter operator', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[name][regex]=foo');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain('regex');
  });

  it('rejects comparison operator on string field', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[name][gt]=a');
    expect(res.status).toBe(400);
  });

  it('rejects like operator on numeric field', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[credit_limit][like]=50');
    expect(res.status).toBe(400);
  });

  it('rejects sort on unknown field', async () => {
    const res = await api.getRaw('/api/sales/customer?sort=fake_field');
    expect(res.status).toBe(400);
  });

  it('rejects unknown field in field selection', async () => {
    const res = await api.getRaw('/api/sales/customer?fields=name,unknown_field');
    expect(res.status).toBe(400);
  });

  it('rejects include depth exceeding limit', async () => {
    const res = await api.getRaw('/api/sales/invoice?include=customer.orders.items');
    expect(res.status).toBe(400);
  });

  it('rejects include of unknown relation', async () => {
    const res = await api.getRaw('/api/sales/invoice?include=nonexistent_relation');
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent model endpoint', async () => {
    const res = await api.getRaw('/api/sales/nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns proper error structure', async () => {
    const res = await api.getRaw('/api/sales/customer?filter[fake][eq]=x');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBeDefined();
    expect(body.error.message).toBeDefined();
  });
});
