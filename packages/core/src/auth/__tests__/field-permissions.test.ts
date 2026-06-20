import { describe, it, expect } from 'vitest';
import {
  createFieldWriteGuard,
  createFieldStripHook,
  resolveFieldPermissions,
} from '../field-permissions.js';
import { createTestServer } from '../../__tests__/helpers.js';
import type { ResolvedModel } from '../../schema/types.js';

const mockModel: ResolvedModel = {
  qualifiedName: 'sales.invoice',
  app: 'sales',
  module: 'sales',
  name: 'invoice',
  auditLog: false,
  traits: [],
  fields: [
    { name: 'id', config: { type: 'string' } as any, provenance: { source: 'base' } },
    { name: 'total', config: { type: 'decimal' } as any, provenance: { source: 'base' } },
    { name: 'cost_price', config: { type: 'decimal' } as any, provenance: { source: 'base' } },
    { name: 'discount_limit', config: { type: 'decimal' } as any, provenance: { source: 'base' } },
  ],
  indexes: [],
};

describe('field permissions', () => {
  describe('resolveFieldPermissions', () => {
    it('identifies hidden fields (read: false)', () => {
      const result = resolveFieldPermissions(mockModel, {
        'sales.invoice': {
          read: true,
          fieldPermissions: {
            cost_price: { read: false },
          },
        },
      });
      expect(result.hidden.has('cost_price')).toBe(true);
      expect(result.readOnly.has('cost_price')).toBe(false);
    });

    it('identifies read-only fields (write: false, read: true)', () => {
      const result = resolveFieldPermissions(mockModel, {
        'sales.invoice': {
          read: true,
          fieldPermissions: {
            discount_limit: { read: true, write: false },
          },
        },
      });
      expect(result.readOnly.has('discount_limit')).toBe(true);
      expect(result.hidden.has('discount_limit')).toBe(false);
    });

    it('returns empty sets when no field permissions defined', () => {
      const result = resolveFieldPermissions(mockModel, {
        'sales.invoice': { read: true },
      });
      expect(result.hidden.size).toBe(0);
      expect(result.readOnly.size).toBe(0);
    });
  });

  describe('field write hook', () => {
    it('rejects writes to read-only fields with 403', async () => {
      const server = createTestServer();

      server.addHook('onRequest', async (request) => {
        (request as any).authContext = {
          permissions: {
            models: {
              'sales.invoice': {
                read: true,
                write: true,
                fieldPermissions: { discount_limit: { read: true, write: false } },
              },
            },
            scopes: [],
            version: 1,
          },
        };
      });

      server.put('/test', {
        preHandler: createFieldWriteGuard(mockModel),
        handler: async () => ({ ok: true }),
      });

      const res = await server.inject({
        method: 'PUT',
        url: '/test',
        payload: { discount_limit: 50, total: 100 },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().error.details.fields).toContain('discount_limit');
    });

    it('allows writes when field is not in body', async () => {
      const server = createTestServer();

      server.addHook('onRequest', async (request) => {
        (request as any).authContext = {
          permissions: {
            models: {
              'sales.invoice': {
                read: true,
                write: true,
                fieldPermissions: { discount_limit: { read: true, write: false } },
              },
            },
            scopes: [],
            version: 1,
          },
        };
      });

      server.put('/test', {
        preHandler: createFieldWriteGuard(mockModel),
        handler: async () => ({ ok: true }),
      });

      const res = await server.inject({
        method: 'PUT',
        url: '/test',
        payload: { total: 100 },
      });
      expect(res.statusCode).toBe(200);
    });

    it('ignores GET requests', async () => {
      const server = createTestServer();

      server.addHook('onRequest', async (request) => {
        (request as any).authContext = {
          permissions: {
            models: {
              'sales.invoice': {
                read: true,
                fieldPermissions: { cost_price: { read: false } },
              },
            },
            scopes: [],
            version: 1,
          },
        };
      });

      server.get('/test', {
        preHandler: createFieldWriteGuard(mockModel),
        handler: async () => ({ ok: true }),
      });

      const res = await server.inject({ method: 'GET', url: '/test' });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('field strip hook', () => {
    it('strips hidden fields from response', async () => {
      const server = createTestServer();

      server.addHook('onRequest', async (request) => {
        (request as any).authContext = {
          permissions: {
            models: {
              'sales.invoice': {
                read: true,
                fieldPermissions: { cost_price: { read: false } },
              },
            },
            scopes: [],
            version: 1,
          },
        };
      });

      server.get('/test', {
        handler: async () => ({ data: { id: '1', total: 100, cost_price: 50 } }),
        onSend: createFieldStripHook(mockModel) as any,
      });

      const res = await server.inject({ method: 'GET', url: '/test' });
      const body = res.json();
      expect(body.data.cost_price).toBeUndefined();
      expect(body.data.total).toBe(100);
    });

    it('strips hidden fields from list responses', async () => {
      const server = createTestServer();

      server.addHook('onRequest', async (request) => {
        (request as any).authContext = {
          permissions: {
            models: {
              'sales.invoice': {
                read: true,
                fieldPermissions: { cost_price: { read: false } },
              },
            },
            scopes: [],
            version: 1,
          },
        };
      });

      server.get('/test', {
        handler: async () => ({
          data: [
            { id: '1', total: 100, cost_price: 50 },
            { id: '2', total: 200, cost_price: 75 },
          ],
        }),
        onSend: createFieldStripHook(mockModel) as any,
      });

      const res = await server.inject({ method: 'GET', url: '/test' });
      const body = res.json();
      expect(body.data[0].cost_price).toBeUndefined();
      expect(body.data[1].cost_price).toBeUndefined();
      expect(body.data[0].total).toBe(100);
    });

    it('passes through when no field restrictions', async () => {
      const server = createTestServer();

      server.addHook('onRequest', async (request) => {
        (request as any).authContext = {
          permissions: {
            models: { 'sales.invoice': { read: true } },
            scopes: [],
            version: 1,
          },
        };
      });

      server.get('/test', {
        handler: async () => ({ data: { id: '1', total: 100, cost_price: 50 } }),
        onSend: createFieldStripHook(mockModel) as any,
      });

      const res = await server.inject({ method: 'GET', url: '/test' });
      const body = res.json();
      expect(body.data.cost_price).toBe(50);
    });
  });
});
