import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;
let api: ApiClient;

describe('FrameworkContext: real usage across hooks, services, and direct access', () => {
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

  describe('ctx.db (raw Kysely)', () => {
    it('can run a raw SELECT query', async () => {
      const ctx = bootResult.frameworkContext!;
      const rows = await ctx.db.selectFrom('core__user').selectAll().execute();
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBeGreaterThan(0);
    });

    it('can run raw INSERT and SELECT back', async () => {
      const ctx = bootResult.frameworkContext!;
      await ctx.db
        .insertInto('hr__department')
        .values({ id: '11111111-1111-1111-1111-111111111111', name: 'ctx-db-test' })
        .execute();

      const row = await ctx.db
        .selectFrom('hr__department')
        .selectAll()
        .where('id', '=', '11111111-1111-1111-1111-111111111111')
        .executeTakeFirst();

      expect(row).toBeDefined();
      expect((row as any).name).toBe('ctx-db-test');
    });
  });

  describe('ctx.models (high-level API)', () => {
    it('can create and get a record', async () => {
      const ctx = bootResult.frameworkContext!;
      const dept = await ctx.models.create('hr.department', { name: 'models-test-dept' });
      expect(dept.id).toBeDefined();

      const fetched = await ctx.models.get('hr.department', dept.id as string);
      expect(fetched).not.toBeNull();
      expect(fetched!.name).toBe('models-test-dept');
    });

    it('can query with filters', async () => {
      const ctx = bootResult.frameworkContext!;
      await ctx.models.create('hr.department', { name: 'query-filter-dept' });

      const result = await ctx.models
        .query('hr.department')
        .filter({ name: 'query-filter-dept' })
        .exec();

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].name).toBe('query-filter-dept');
    });

    it('can update a record', async () => {
      const ctx = bootResult.frameworkContext!;
      const dept = await ctx.models.create('hr.department', { name: 'update-me' });
      const updated = await ctx.models.update('hr.department', dept.id as string, {
        name: 'updated-name',
      });
      expect(updated.name).toBe('updated-name');
    });

    it('can delete a record', async () => {
      const ctx = bootResult.frameworkContext!;
      const dept = await ctx.models.create('hr.department', { name: 'delete-me' });
      await ctx.models.delete('hr.department', dept.id as string);
      const gone = await ctx.models.get('hr.department', dept.id as string);
      expect(gone).toBeNull();
    });
  });

  describe('ctx.schema', () => {
    it('can resolve model metadata', () => {
      const ctx = bootResult.frameworkContext!;
      const models = ctx.schema.getAllModels();
      expect(models.length).toBeGreaterThan(0);

      const invoice = models.find((m: any) => m.qualifiedName === 'sales.invoice');
      expect(invoice).toBeDefined();
      expect(invoice!.fields.length).toBeGreaterThan(0);
    });
  });

  describe('ctx.service', () => {
    it('resolves a registered service', () => {
      const ctx = bootResult.frameworkContext!;
      const leaveSvc = ctx.service('hr.leave_service') as any;
      expect(leaveSvc).toBeDefined();
      expect(leaveSvc.getBalance).toBeTypeOf('function');
    });

    it('service can use ctx.db for queries', async () => {
      // Register a test service that uses ctx.db
      bootResult.serviceRegistry.register({
        name: 'test.db_service',
        factory: (ctx: any) => ({
          async countUsers() {
            const result = await ctx.db
              .selectFrom('core__user')
              .select(ctx.db.fn.count('id').as('count'))
              .executeTakeFirst();
            return Number(result?.count ?? 0);
          },
        }),
      });

      const ctx = bootResult.frameworkContext!;
      const svc = ctx.service('test.db_service') as any;
      const count = await svc.countUsers();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('ctx.enqueue', () => {
    it('can enqueue a job row into the database', async () => {
      const ctx = bootResult.frameworkContext!;
      await ctx.enqueue('test.dummy_job', { message: 'hello' });

      const job = await ctx.db
        .selectFrom('rangka_jobs')
        .selectAll()
        .where('name', '=', 'test.dummy_job')
        .executeTakeFirst();

      expect(job).toBeDefined();
      expect((job as any).name).toBe('test.dummy_job');
    });
  });

  describe('ctx.events', () => {
    it('emit resolves without error', async () => {
      const ctx = bootResult.frameworkContext!;
      await expect(ctx.events.emit('test.event', { foo: 'bar' })).resolves.toBeUndefined();
    });

    it('on registers a listener without error', () => {
      const ctx = bootResult.frameworkContext!;
      expect(() => ctx.events.on('test.listener', async () => {})).not.toThrow();
    });
  });

  describe('ctx.config', () => {
    it('is an object', () => {
      const ctx = bootResult.frameworkContext!;
      expect(typeof ctx.config).toBe('object');
    });
  });

  describe('ctx.auth (system-level, no user)', () => {
    it('has null user and empty roles at framework level', () => {
      const ctx = bootResult.frameworkContext!;
      expect(ctx.auth.user).toBeNull();
      expect(ctx.auth.roles).toEqual([]);
    });
  });

  describe('hooks receive working ctx (via API)', () => {
    it('hooks can use ctx during save', async () => {
      // The accounting.journal_entry hook uses beforeSave — if ctx is broken the create will fail
      const entry = await api.post('/api/accounting/journal_entry', {
        posting_date: '2025-06-01',
        memo: 'Hook ctx test',
      });
      // beforeSave sets is_posted = false
      expect(entry.status).toBe(201);
      expect(entry.data.is_posted).toBe(false);
    });
  });
});
