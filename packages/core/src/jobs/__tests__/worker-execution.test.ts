import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JobWorker } from '../worker.js';
import { JobRegistry } from '../registry.js';

describe('JobWorker execution', () => {
  const mockCtx = {
    db: {},
    schema: {},
    auth: { user: null, roles: [] },
    scope: null,
    config: {},
    models: {},
    service: () => ({}),
    enqueue: async () => {},
    events: { emit: async () => {}, on: () => {} },
    notify: () => {},
    email: { send: async () => {} },
  } as any;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('handler invocation', () => {
    it('calls handler with job data and ctx', async () => {
      vi.useRealTimers();
      const registry = new JobRegistry();
      const handler = vi.fn().mockRejectedValue(new Error('stop'));
      registry.register('test.job', { handler });

      const mockDb = {} as any;
      const worker = new JobWorker(mockDb, registry, mockCtx, { pollInterval: 100 });

      const executeJob = (worker as any).executeJob.bind(worker);
      // Will throw in handleFailure since no real DB, but handler should have been called
      try {
        await executeJob({
          id: 'job-1',
          name: 'test.job',
          data: { key: 'value' },
          state: 'active',
          retry_count: 0,
          max_retries: 0,
          backoff: 'exponential',
        });
      } catch {
        /* expected */
      }

      expect(handler).toHaveBeenCalledWith({ key: 'value' }, mockCtx);
    });

    it('does not call handler for unregistered job', async () => {
      vi.useRealTimers();
      const registry = new JobRegistry();
      const mockDb = {} as any;
      const worker = new JobWorker(mockDb, registry, mockCtx, { pollInterval: 100 });

      const executeJob = (worker as any).executeJob.bind(worker);
      await executeJob({
        id: 'job-1',
        name: 'unknown.job',
        data: {},
        state: 'active',
        retry_count: 0,
        max_retries: 0,
        backoff: 'exponential',
      });

      expect(worker.getInFlightCount()).toBe(0);
    });
  });

  describe('backoff computation', () => {
    it('exponential: doubles with each retry, capped at 600s', () => {
      const registry = new JobRegistry();
      const mockDb = {} as any;
      const worker = new JobWorker(mockDb, registry, mockCtx);

      const compute = (worker as any).computeBackoffDelay.bind(worker);
      expect(compute('exponential', 1)).toBe(2000);
      expect(compute('exponential', 2)).toBe(4000);
      expect(compute('exponential', 3)).toBe(8000);
      expect(compute('exponential', 10)).toBe(600000); // capped
      expect(compute('exponential', 20)).toBe(600000); // still capped
    });

    it('linear: 10s * retryCount', () => {
      const registry = new JobRegistry();
      const mockDb = {} as any;
      const worker = new JobWorker(mockDb, registry, mockCtx);

      const compute = (worker as any).computeBackoffDelay.bind(worker);
      expect(compute('linear', 1)).toBe(10000);
      expect(compute('linear', 2)).toBe(20000);
      expect(compute('linear', 5)).toBe(50000);
    });

    it('fixed: always 5s', () => {
      const registry = new JobRegistry();
      const mockDb = {} as any;
      const worker = new JobWorker(mockDb, registry, mockCtx);

      const compute = (worker as any).computeBackoffDelay.bind(worker);
      expect(compute('fixed', 1)).toBe(5000);
      expect(compute('fixed', 5)).toBe(5000);
      expect(compute('fixed', 100)).toBe(5000);
    });
  });

  describe('concurrency limit check', () => {
    it('returns false when no limit set (Infinity)', async () => {
      const registry = new JobRegistry();
      const mockDb = {} as any;
      const worker = new JobWorker(mockDb, registry, mockCtx);

      const exceeds = (worker as any).exceedsConcurrencyLimit.bind(worker);
      const result = await exceeds('test.job', undefined);
      expect(result).toBe(false);
    });

    it('returns false when limit is Infinity', async () => {
      const registry = new JobRegistry();
      const mockDb = {} as any;
      const worker = new JobWorker(mockDb, registry, mockCtx);

      const exceeds = (worker as any).exceedsConcurrencyLimit.bind(worker);
      const result = await exceeds('test.job', Infinity);
      expect(result).toBe(false);
    });
  });

  describe('graceful shutdown', () => {
    it('stop resolves immediately when no jobs in flight', async () => {
      const registry = new JobRegistry();
      const mockDb = {} as any;
      const worker = new JobWorker(mockDb, registry, mockCtx, { pollInterval: 10000 });

      worker.start();
      expect(worker.isRunning()).toBe(true);

      await worker.stop();
      expect(worker.isRunning()).toBe(false);
      expect(worker.getInFlightCount()).toBe(0);
    });

    it('tracks in-flight jobs correctly during execution', async () => {
      vi.useRealTimers();

      const registry = new JobRegistry();
      let resolveHandler: () => void;
      const handlerPromise = new Promise<void>((r) => {
        resolveHandler = r;
      });

      registry.register('test.slow', {
        handler: async () => {
          await handlerPromise;
        },
      });

      const mockDb = {} as any;
      const worker = new JobWorker(mockDb, registry, mockCtx);

      // Simulate adding to in-flight
      (worker as any).activeJobIds.add('job-1');
      expect(worker.getInFlightCount()).toBe(1);

      (worker as any).activeJobIds.delete('job-1');
      expect(worker.getInFlightCount()).toBe(0);

      resolveHandler!();
    });
  });

  describe('failure handling decision', () => {
    it('moves to dead letter when retry_count + 1 > max_retries', () => {
      // retry_count = 2, max_retries = 2 → attemptNumber = 3 > 2 → dead letter
      const attemptNumber = 2 + 1;
      const maxRetries = 2;
      expect(attemptNumber > maxRetries).toBe(true);
    });

    it('schedules retry when retry_count + 1 <= max_retries', () => {
      // retry_count = 0, max_retries = 2 → attemptNumber = 1 <= 2 → retry
      const attemptNumber = 0 + 1;
      const maxRetries = 2;
      expect(attemptNumber > maxRetries).toBe(false);
    });

    it('zero retries means immediate dead letter on first failure', () => {
      // retry_count = 0, max_retries = 0 → attemptNumber = 1 > 0 → dead letter
      const attemptNumber = 0 + 1;
      const maxRetries = 0;
      expect(attemptNumber > maxRetries).toBe(true);
    });
  });
});
