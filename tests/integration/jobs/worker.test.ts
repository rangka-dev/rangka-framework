import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql } from 'kysely';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { JobWorker } from '@rangka/core';
import { JobRegistry } from '@rangka/core';
import { enqueue } from '@rangka/core';
import { ScheduleManager } from '@rangka/core';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('jobs: worker integration', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp({ worker: { enabled: false } });
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  beforeEach(async () => {
    await sql`DELETE FROM rangka_dead_letters`.execute(bootResult.db!.kysely);
    await sql`DELETE FROM rangka_jobs`.execute(bootResult.db!.kysely);
  });

  describe('enqueue and execute', () => {
    it('enqueues a job and worker executes it to completion', async () => {
      const registry = new JobRegistry();
      let handlerCalled = false;
      let receivedData: unknown = null;

      registry.register('test.simple', {
        handler: async (data) => {
          handlerCalled = true;
          receivedData = data;
        },
      });

      const jobId = await enqueue(bootResult.db!.kysely, 'test.simple', { msg: 'hello' });
      expect(jobId).toBeDefined();

      const worker = new JobWorker(bootResult.db!.kysely, registry, bootResult.frameworkContext!, {
        pollInterval: 50,
      });
      worker.start();

      await new Promise((r) => setTimeout(r, 200));
      await worker.stop();

      expect(handlerCalled).toBe(true);
      expect(receivedData).toEqual({ msg: 'hello' });

      const job = await sql`SELECT * FROM rangka_jobs WHERE id = ${jobId}`.execute(
        bootResult.db!.kysely,
      );
      expect(job.rows[0].state).toBe('completed');
      expect(job.rows[0].completed_at).not.toBeNull();
    });

    it('handler receives working FrameworkContext', async () => {
      const registry = new JobRegistry();
      let ctxWorks = false;

      registry.register('test.ctx_check', {
        handler: async (_data, ctx) => {
          const rows = await ctx.db.selectFrom('core__user').selectAll().limit(1).execute();
          ctxWorks = Array.isArray(rows) && rows.length > 0;
        },
      });

      await enqueue(bootResult.db!.kysely, 'test.ctx_check', {});

      const worker = new JobWorker(bootResult.db!.kysely, registry, bootResult.frameworkContext!, {
        pollInterval: 50,
      });
      worker.start();
      await new Promise((r) => setTimeout(r, 200));
      await worker.stop();

      expect(ctxWorks).toBe(true);
    });
  });

  describe('retry on failure', () => {
    it('retries a failed job with incremented retry_count', async () => {
      const registry = new JobRegistry();
      let callCount = 0;

      registry.register('test.retry', {
        retries: 2,
        backoff: 'fixed',
        handler: async () => {
          callCount++;
          if (callCount <= 1) throw new Error('transient failure');
        },
      });

      const jobId = await enqueue(
        bootResult.db!.kysely,
        'test.retry',
        {},
        { retries: 2, backoff: 'fixed' },
      );

      // First poll: job fails, gets rescheduled
      const worker = new JobWorker(bootResult.db!.kysely, registry, bootResult.frameworkContext!, {
        pollInterval: 50,
      });
      worker.start();
      await new Promise((r) => setTimeout(r, 200));
      await worker.stop();

      const job = await sql`SELECT * FROM rangka_jobs WHERE id = ${jobId}`.execute(
        bootResult.db!.kysely,
      );
      const row = job.rows[0] as any;

      // After first failure: retry_count=1, state=created (waiting for start_after)
      expect(row.retry_count).toBe(1);
      expect(row.state).toBe('created');
      expect(row.error).toBe('transient failure');
    });

    it('succeeds on second attempt after initial failure', async () => {
      const registry = new JobRegistry();
      let callCount = 0;

      registry.register('test.retry_succeed', {
        retries: 3,
        backoff: 'fixed',
        handler: async () => {
          callCount++;
          if (callCount === 1) throw new Error('first try fail');
        },
      });

      // Enqueue with no delay so retry is immediate
      const jobId = await enqueue(
        bootResult.db!.kysely,
        'test.retry_succeed',
        {},
        { retries: 3, backoff: 'fixed' },
      );

      // First poll: fails
      const worker = new JobWorker(bootResult.db!.kysely, registry, bootResult.frameworkContext!, {
        pollInterval: 50,
      });
      worker.start();
      await new Promise((r) => setTimeout(r, 150));
      await worker.stop();

      // Clear start_after so retry is picked up immediately
      await sql`UPDATE rangka_jobs SET start_after = NULL WHERE id = ${jobId}`.execute(
        bootResult.db!.kysely,
      );

      // Second poll: succeeds
      worker.start();
      await new Promise((r) => setTimeout(r, 150));
      await worker.stop();

      const job = await sql`SELECT * FROM rangka_jobs WHERE id = ${jobId}`.execute(
        bootResult.db!.kysely,
      );
      expect((job.rows[0] as any).state).toBe('completed');
      expect(callCount).toBe(2);
    });
  });

  describe('dead letter after max retries', () => {
    it('moves job to dead_letters when retries exhausted', async () => {
      const registry = new JobRegistry();

      registry.register('test.dead', {
        retries: 0,
        handler: async () => {
          throw new Error('always fails');
        },
      });

      const jobId = await enqueue(bootResult.db!.kysely, 'test.dead', { x: 1 }, { retries: 0 });

      const worker = new JobWorker(bootResult.db!.kysely, registry, bootResult.frameworkContext!, {
        pollInterval: 50,
      });
      worker.start();
      await new Promise((r) => setTimeout(r, 200));
      await worker.stop();

      // Job should be failed
      const job = await sql`SELECT * FROM rangka_jobs WHERE id = ${jobId}`.execute(
        bootResult.db!.kysely,
      );
      expect((job.rows[0] as any).state).toBe('failed');

      // Dead letter should exist
      const dl = await sql`SELECT * FROM rangka_dead_letters WHERE job_id = ${jobId}`.execute(
        bootResult.db!.kysely,
      );
      expect(dl.rows.length).toBe(1);
      expect((dl.rows[0] as any).name).toBe('test.dead');
      expect((dl.rows[0] as any).error).toBe('always fails');
    });
  });

  describe('unique job deduplication', () => {
    it('prevents duplicate enqueue for unique jobs', async () => {
      const id1 = await enqueue(bootResult.db!.kysely, 'test.unique', { a: 1 }, { unique: true });
      const id2 = await enqueue(bootResult.db!.kysely, 'test.unique', { a: 2 }, { unique: true });

      // Should return same ID (second insert was skipped)
      expect(id2).toBe(id1);

      const jobs = await sql`SELECT * FROM rangka_jobs WHERE name = 'test.unique'`.execute(
        bootResult.db!.kysely,
      );
      expect(jobs.rows.length).toBe(1);
    });

    it('allows enqueue after previous unique job completes', async () => {
      await enqueue(bootResult.db!.kysely, 'test.unique2', {}, { unique: true });

      // Mark it completed
      await sql`UPDATE rangka_jobs SET state = 'completed' WHERE name = 'test.unique2'`.execute(
        bootResult.db!.kysely,
      );

      // Should now allow a new one
      const id2 = await enqueue(bootResult.db!.kysely, 'test.unique2', {}, { unique: true });
      const jobs =
        await sql`SELECT * FROM rangka_jobs WHERE name = 'test.unique2' AND state = 'created'`.execute(
          bootResult.db!.kysely,
        );
      expect(jobs.rows.length).toBe(1);
      expect((jobs.rows[0] as any).id).toBe(id2);
    });
  });

  describe('delay / start_after', () => {
    it('does not claim a job before its start_after time', async () => {
      const registry = new JobRegistry();
      let handlerCalled = false;

      registry.register('test.delayed', {
        handler: async () => {
          handlerCalled = true;
        },
      });

      // Enqueue with 10s delay (won't fire during test)
      await enqueue(bootResult.db!.kysely, 'test.delayed', {}, { delay: 10000 });

      const worker = new JobWorker(bootResult.db!.kysely, registry, bootResult.frameworkContext!, {
        pollInterval: 50,
      });
      worker.start();
      await new Promise((r) => setTimeout(r, 200));
      await worker.stop();

      expect(handlerCalled).toBe(false);
    });

    it('claims a job after start_after has passed', async () => {
      const registry = new JobRegistry();
      let handlerCalled = false;

      registry.register('test.delayed_ready', {
        handler: async () => {
          handlerCalled = true;
        },
      });

      // Enqueue with start_after in the past
      await sql`
        INSERT INTO rangka_jobs (name, data, state, max_retries, backoff, start_after)
        VALUES ('test.delayed_ready', 'null'::jsonb, 'created', 0, 'exponential', NOW() - INTERVAL '1 second')
      `.execute(bootResult.db!.kysely);

      const worker = new JobWorker(bootResult.db!.kysely, registry, bootResult.frameworkContext!, {
        pollInterval: 50,
      });
      worker.start();
      await new Promise((r) => setTimeout(r, 200));
      await worker.stop();

      expect(handlerCalled).toBe(true);
    });
  });

  describe('concurrency limit', () => {
    it('respects concurrency limit per job type', async () => {
      const registry = new JobRegistry();
      let concurrent = 0;
      let maxConcurrent = 0;

      registry.register('test.concurrent', {
        concurrency: 1,
        handler: async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise((r) => setTimeout(r, 100));
          concurrent--;
        },
      });

      // Enqueue 3 jobs
      await enqueue(bootResult.db!.kysely, 'test.concurrent', { i: 1 });
      await enqueue(bootResult.db!.kysely, 'test.concurrent', { i: 2 });
      await enqueue(bootResult.db!.kysely, 'test.concurrent', { i: 3 });

      const worker = new JobWorker(bootResult.db!.kysely, registry, bootResult.frameworkContext!, {
        pollInterval: 50,
      });
      worker.start();
      await new Promise((r) => setTimeout(r, 600));
      await worker.stop();

      expect(maxConcurrent).toBe(1);
    });
  });

  describe('schedule sync', () => {
    it('syncs scheduled jobs to the database', async () => {
      const registry = new JobRegistry();
      registry.register('test.cron', {
        schedule: '0 2 * * *',
        handler: async () => {},
      });

      const scheduler = new ScheduleManager(bootResult.db!.kysely, registry);
      await scheduler.syncSchedules();

      const rows = await sql`SELECT * FROM rangka_scheduled_jobs WHERE name = 'test.cron'`.execute(
        bootResult.db!.kysely,
      );
      expect(rows.rows.length).toBe(1);
      expect((rows.rows[0] as any).cron).toBe('0 2 * * *');
      expect((rows.rows[0] as any).next_run_at).not.toBeNull();
    });
  });
});
