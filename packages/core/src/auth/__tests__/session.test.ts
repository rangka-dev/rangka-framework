import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionRegistry } from '../permission-registry.js';
import { createAuthHook, createSessionHandler, generateToken } from '../session.js';
import { hashPassword } from '../password.js';
import { createTestServer } from '../../__tests__/helpers.js';

function createMockDb(data: { users: any[]; sessions: any[]; userRoles: any[]; roles: any[] }) {
  return {
    selectFrom(table: string) {
      return {
        selectAll() {
          return this;
        },
        select(..._args: any[]) {
          return this;
        },
        where(field: string, op: string, value: any) {
          const store =
            table === 'core.session'
              ? data.sessions
              : table === 'core.user'
                ? data.users
                : table === 'core.user_role'
                  ? data.userRoles
                  : data.roles;

          const filtered = store.filter((r: any) => {
            if (op === '=') return r[field] === value;
            if (op === 'in') return value.includes(r[field]);
            return false;
          });
          return {
            executeTakeFirst: async () => filtered[0] ?? undefined,
            execute: async () => filtered,
            where(f2: string, o2: string, v2: any) {
              const f = filtered.filter((r: any) => {
                if (o2 === '=') return r[f2] === v2;
                if (o2 === 'in') return v2.includes(r[f2]);
                return false;
              });
              return { executeTakeFirst: async () => f[0], execute: async () => f };
            },
          };
        },
        executeTakeFirst: async () => undefined,
        execute: async () => [],
      };
    },
    insertInto(_table: string) {
      return {
        values(vals: any) {
          return {
            returningAll() {
              return { executeTakeFirstOrThrow: async () => ({ id: 'new-id', ...vals }) };
            },
            execute: async () => {},
          };
        },
      };
    },
    deleteFrom(_table: string) {
      return {
        where() {
          return { execute: async () => {} };
        },
      };
    },
  } as any;
}

describe('session auth hook', () => {
  let permissionRegistry: PermissionRegistry;

  beforeEach(() => {
    permissionRegistry = new PermissionRegistry();
    permissionRegistry.registerRoles({ Admin: { label: 'Admin', models: {} } }, 'core');
  });

  it('returns 401 for missing Authorization header', async () => {
    const db = createMockDb({ users: [], sessions: [], userRoles: [], roles: [] });
    const server = createTestServer();
    server.get('/test', {
      onRequest: createAuthHook(db, permissionRegistry),
      handler: async () => ({ ok: true }),
    });

    const res = await server.inject({ method: 'GET', url: '/test' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for invalid token', async () => {
    const db = createMockDb({ users: [], sessions: [], userRoles: [], roles: [] });
    const server = createTestServer();
    server.get('/test', {
      onRequest: createAuthHook(db, permissionRegistry),
      handler: async () => ({ ok: true }),
    });

    const res = await server.inject({
      method: 'GET',
      url: '/test',
      headers: { authorization: 'Bearer invalid-token' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for expired token', async () => {
    const expired = new Date(Date.now() - 1000).toISOString();
    const db = createMockDb({
      users: [{ id: 'u1', email: 'a@b.com', enabled: true }],
      sessions: [{ id: 's1', token: 'tok', user_id: 'u1', expires_at: expired }],
      userRoles: [],
      roles: [],
    });
    const server = createTestServer();
    server.get('/test', {
      onRequest: createAuthHook(db, permissionRegistry),
      handler: async () => ({ ok: true }),
    });

    const res = await server.inject({
      method: 'GET',
      url: '/test',
      headers: { authorization: 'Bearer tok' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.message).toContain('expired');
  });

  it('authenticates valid token and attaches context', async () => {
    const future = new Date(Date.now() + 60000).toISOString();
    const db = createMockDb({
      users: [{ id: 'u1', email: 'a@b.com', full_name: 'Test', enabled: true, password_hash: 'x' }],
      sessions: [{ id: 's1', token: 'valid-tok', user_id: 'u1', expires_at: future }],
      userRoles: [{ user_id: 'u1', role_id: 'r1' }],
      roles: [{ id: 'r1', name: 'Admin' }],
    });
    const server = createTestServer();
    server.get('/test', {
      onRequest: createAuthHook(db, permissionRegistry),
      handler: async (request) => {
        const ctx = (request as any).authContext;
        return { email: ctx.user.email };
      },
    });

    const res = await server.inject({
      method: 'GET',
      url: '/test',
      headers: { authorization: 'Bearer valid-tok' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().email).toBe('a@b.com');
  });
});

describe('session create endpoint', () => {
  it('returns 401 for invalid credentials', async () => {
    const db = createMockDb({ users: [], sessions: [], userRoles: [], roles: [] });
    const server = createTestServer();
    server.post('/api/core/session', createSessionHandler(db));

    const res = await server.inject({
      method: 'POST',
      url: '/api/core/session',
      payload: { email: 'bad@test.com', password: 'wrong' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for missing fields', async () => {
    const db = createMockDb({ users: [], sessions: [], userRoles: [], roles: [] });
    const server = createTestServer();
    server.post('/api/core/session', createSessionHandler(db));

    const res = await server.inject({
      method: 'POST',
      url: '/api/core/session',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('creates session for valid credentials', async () => {
    const pw = hashPassword('secret');
    const db = createMockDb({
      users: [
        { id: 'u1', email: 'user@test.com', full_name: 'User', enabled: true, password_hash: pw },
      ],
      sessions: [],
      userRoles: [],
      roles: [],
    });
    const server = createTestServer();
    server.post('/api/core/session', createSessionHandler(db));

    const res = await server.inject({
      method: 'POST',
      url: '/api/core/session',
      payload: { email: 'user@test.com', password: 'secret' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.token).toBeDefined();
  });
});

describe('generateToken', () => {
  it('generates a 64-character hex string', () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });
});
