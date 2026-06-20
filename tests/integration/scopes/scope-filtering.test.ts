import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'node:path';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { getTestDatabaseConfig } from '../helpers/db.js';
import { ProjectScanner, boot, MemoryDiscoverySource } from '@rangka/core';
import type { BootResult } from '@rangka/core';

const SCOPE_APP_ROOT = path.resolve(__dirname, '../../fixtures/scope-app');

let bootResult: BootResult;
let adminToken: string;
let companyAId: string;
let companyBId: string;

async function bootScopeApp(): Promise<BootResult> {
  const scanner = new ProjectScanner(SCOPE_APP_ROOT);
  const { app } = await scanner.scan();
  const dbConfig = getTestDatabaseConfig();

  return boot({
    discoverySource: new MemoryDiscoverySource([]),
    apps: [app],
    database: {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
    },
    server: { port: 0 },
    worker: { enabled: false },
  });
}

function baseUrl(): string {
  const address = bootResult.server!.addresses()[0];
  return `http://localhost:${address.port}`;
}

async function apiRequest(
  method: string,
  urlPath: string,
  options?: { body?: any; token?: string; scope?: Record<string, string> },
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options?.token) headers['Authorization'] = `Bearer ${options.token}`;
  if (options?.scope) headers['X-Active-Scope'] = JSON.stringify(options.scope);

  const res = await fetch(`${baseUrl()}${urlPath}`, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const status = res.status;
  if (status === 204) return { status, body: null };
  const body = await res.json();
  return { status, body };
}

describe('scopes: integration tests', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();

    bootResult = await bootScopeApp();
    await bootResult.server!.listen({ port: 0 });

    // Login as admin
    const loginRes = await apiRequest('POST', '/api/core/session', {
      body: { email: 'system@rangka.local', password: 'admin' },
    });
    adminToken = loginRes.body.data?.token ?? loginRes.body.token;

    // Create two companies
    const companyA = await apiRequest('POST', '/api/tenant/company', {
      token: adminToken,
      body: { name: 'Company A' },
    });
    companyAId = companyA.body.data.id;

    const companyB = await apiRequest('POST', '/api/tenant/company', {
      token: adminToken,
      body: { name: 'Company B' },
    });
    companyBId = companyB.body.data.id;
  });

  afterAll(async () => {
    await bootResult.server?.close();
    await bootResult.db?.destroy();
  });

  describe('query filtering', () => {
    it('list endpoint only returns records matching active scope', async () => {
      // Create invoices in both companies
      await apiRequest('POST', '/api/sales/invoice', {
        token: adminToken,
        scope: { company: companyAId },
        body: { company: companyAId, total: 100, description: 'Invoice A1' },
      });
      await apiRequest('POST', '/api/sales/invoice', {
        token: adminToken,
        scope: { company: companyAId },
        body: { company: companyAId, total: 200, description: 'Invoice A2' },
      });
      await apiRequest('POST', '/api/sales/invoice', {
        token: adminToken,
        scope: { company: companyBId },
        body: { company: companyBId, total: 300, description: 'Invoice B1' },
      });

      // Query with company A scope
      const resA = await apiRequest('GET', '/api/sales/invoice', {
        token: adminToken,
        scope: { company: companyAId },
      });
      expect(resA.status).toBe(200);
      expect(resA.body.data).toHaveLength(2);
      expect(resA.body.data.every((r: any) => r.company === companyAId)).toBe(true);

      // Query with company B scope
      const resB = await apiRequest('GET', '/api/sales/invoice', {
        token: adminToken,
        scope: { company: companyBId },
      });
      expect(resB.status).toBe(200);
      expect(resB.body.data).toHaveLength(1);
      expect(resB.body.data[0].company).toBe(companyBId);
    });

    it('get endpoint returns 404 for record outside active scope', async () => {
      // Create an invoice in company A
      const created = await apiRequest('POST', '/api/sales/invoice', {
        token: adminToken,
        scope: { company: companyAId },
        body: { company: companyAId, total: 500, description: 'Scoped record' },
      });
      const invoiceId = created.body.data.id;

      // Try to get it with company B scope
      const res = await apiRequest('GET', `/api/sales/invoice/${invoiceId}`, {
        token: adminToken,
        scope: { company: companyBId },
      });
      expect(res.status).toBe(404);
    });

    it('unscoped model is not filtered', async () => {
      // Create a note (no scope)
      await apiRequest('POST', '/api/sales/note', {
        token: adminToken,
        scope: { company: companyAId },
        body: { title: 'Note 1' },
      });
      await apiRequest('POST', '/api/sales/note', {
        token: adminToken,
        scope: { company: companyBId },
        body: { title: 'Note 2' },
      });

      // Notes should return all regardless of scope header
      const res = await apiRequest('GET', '/api/sales/note', {
        token: adminToken,
        scope: { company: companyAId },
      });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('scope validation', () => {
    it('returns 400 when no scope value provided for scoped model', async () => {
      const res = await apiRequest('GET', '/api/sales/invoice', {
        token: adminToken,
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_SCOPE');
    });

    it('returns 400 when scope value does not exist', async () => {
      const res = await apiRequest('GET', '/api/sales/invoice', {
        token: adminToken,
        scope: { company: '00000000-0000-0000-0000-000000000000' },
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_SCOPE');
    });
  });

  describe('write guard', () => {
    it('auto-stamps scope value on create when not provided in body', async () => {
      const res = await apiRequest('POST', '/api/sales/invoice', {
        token: adminToken,
        scope: { company: companyAId },
        body: { total: 999, description: 'Auto-stamped' },
      });
      expect(res.status).toBe(201);
      expect(res.body.data.company).toBe(companyAId);
    });

    it('rejects create with different scope value in body', async () => {
      const res = await apiRequest('POST', '/api/sales/invoice', {
        token: adminToken,
        scope: { company: companyAId },
        body: { company: companyBId, total: 100, description: 'Cross-scope' },
      });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('SCOPE_VIOLATION');
    });

    it('rejects update that changes scope field', async () => {
      const created = await apiRequest('POST', '/api/sales/invoice', {
        token: adminToken,
        scope: { company: companyAId },
        body: { total: 100, description: 'Will try to move' },
      });
      const id = created.body.data.id;

      const res = await apiRequest('PUT', `/api/sales/invoice/${id}`, {
        token: adminToken,
        scope: { company: companyAId },
        body: { company: companyBId },
      });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('SCOPE_VIOLATION');
    });

    it('allows update without scope field in body', async () => {
      const created = await apiRequest('POST', '/api/sales/invoice', {
        token: adminToken,
        scope: { company: companyAId },
        body: { total: 100, description: 'Normal update' },
      });
      const id = created.body.data.id;

      const res = await apiRequest('PUT', `/api/sales/invoice/${id}`, {
        token: adminToken,
        scope: { company: companyAId },
        body: { description: 'Updated description' },
      });
      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated description');
    });
  });

  describe('delete within scope', () => {
    it('delete is scoped — cannot delete record outside active scope', async () => {
      const created = await apiRequest('POST', '/api/sales/invoice', {
        token: adminToken,
        scope: { company: companyAId },
        body: { total: 50, description: 'To delete' },
      });
      const id = created.body.data.id;

      // Try to delete from company B scope
      const res = await apiRequest('DELETE', `/api/sales/invoice/${id}`, {
        token: adminToken,
        scope: { company: companyBId },
      });
      expect(res.status).toBe(404);

      // Delete from correct scope works
      const res2 = await apiRequest('DELETE', `/api/sales/invoice/${id}`, {
        token: adminToken,
        scope: { company: companyAId },
      });
      expect(res2.status).toBe(204);
    });
  });
});
