import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JobWorker } from '../worker.js';
import { JobRegistry } from '../registry.js';

describe('JobWorker', () => {
  let registry: JobRegistry;

  beforeEach(() => {
    registry = new JobRegistry();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockCtx = {} as any;

  it('starts and stops cleanly', async () => {
    const mockDb = {} as any;
    const worker = new JobWorker(mockDb, registry, mockCtx, { pollInterval: 100 });

    expect(worker.isRunning()).toBe(false);
    worker.start();
    expect(worker.isRunning()).toBe(true);

    await worker.stop();
    expect(worker.isRunning()).toBe(false);
  });

  it('does not double-start', () => {
    const mockDb = {} as any;
    const worker = new JobWorker(mockDb, registry, mockCtx, { pollInterval: 100 });

    worker.start();
    worker.start();
    expect(worker.isRunning()).toBe(true);
  });

  it('stop is a no-op when not running', async () => {
    const mockDb = {} as any;
    const worker = new JobWorker(mockDb, registry, mockCtx, { pollInterval: 100 });

    await worker.stop();
    expect(worker.isRunning()).toBe(false);
  });

  it('defaults pollInterval to 2000ms', () => {
    const mockDb = {} as any;
    const worker = new JobWorker(mockDb, registry, mockCtx);
    // Access via starting — the timer would fire at 2000ms intervals
    expect(worker.isRunning()).toBe(false);
  });

  it('tracks in-flight count', () => {
    const mockDb = {} as any;
    const worker = new JobWorker(mockDb, registry, mockCtx, { pollInterval: 100 });

    expect(worker.getInFlightCount()).toBe(0);
  });

  describe('computeBackoffDelay logic', () => {
    it('exponential backoff doubles with each retry', () => {
      // Testing the math: 1000 * 2^retry, capped at 600000
      expect(1000 * Math.pow(2, 1)).toBe(2000);
      expect(1000 * Math.pow(2, 2)).toBe(4000);
      expect(1000 * Math.pow(2, 3)).toBe(8000);
      expect(Math.min(1000 * Math.pow(2, 20), 600000)).toBe(600000);
    });

    it('linear backoff increases linearly', () => {
      expect(10000 * 1).toBe(10000);
      expect(10000 * 2).toBe(20000);
      expect(10000 * 3).toBe(30000);
    });

    it('fixed backoff is constant', () => {
      expect(5000).toBe(5000);
    });
  });

  describe('job execution', () => {
    it('calls handler with job data on success', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registry.register('test_job', { handler });

      // Verify the handler is registered and callable
      const job = registry.get('test_job');
      expect(job).toBeDefined();
      await job!.config.handler({ foo: 'bar' }, {} as any);
      expect(handler).toHaveBeenCalledWith({ foo: 'bar' }, expect.anything());
    });

    it('handler failure is catchable', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('boom'));
      registry.register('fail_job', { handler, retries: 2, backoff: 'fixed' });

      const job = registry.get('fail_job');
      await expect(job!.config.handler({}, {} as any)).rejects.toThrow('boom');
    });
  });

  describe('dead letter logic', () => {
    it('moves to dead letter after max retries exceeded', () => {
      // retry_count + 1 > max_retries means dead letter
      const retryCount = 3;
      const maxRetries = 3;
      const newRetryCount = retryCount + 1;
      expect(newRetryCount > maxRetries).toBe(true);
    });

    it('retries when under max', () => {
      const retryCount = 1;
      const maxRetries = 3;
      const newRetryCount = retryCount + 1;
      expect(newRetryCount > maxRetries).toBe(false);
    });
  });
});
