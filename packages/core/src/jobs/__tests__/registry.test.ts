import { describe, it, expect } from 'vitest';
import { JobRegistry } from '../registry.js';

describe('JobRegistry', () => {
  const validHandler = async () => {};

  it('registers a valid job', () => {
    const registry = new JobRegistry();
    registry.register('send_email', {
      handler: validHandler,
      concurrency: 5,
      retries: 3,
      backoff: 'exponential',
    });

    expect(registry.has('send_email')).toBe(true);
    const job = registry.get('send_email');
    expect(job?.name).toBe('send_email');
    expect(job?.config.concurrency).toBe(5);
  });

  it('throws on duplicate name', () => {
    const registry = new JobRegistry();
    registry.register('job1', { handler: validHandler });

    expect(() => registry.register('job1', { handler: validHandler })).toThrow(
      'Job "job1" is already registered',
    );
  });

  it('throws on invalid concurrency', () => {
    const registry = new JobRegistry();

    expect(() => registry.register('bad', { handler: validHandler, concurrency: 0 })).toThrow(
      'Concurrency must be a positive integer',
    );

    expect(() => registry.register('bad2', { handler: validHandler, concurrency: -1 })).toThrow(
      'Concurrency must be a positive integer',
    );

    expect(() => registry.register('bad3', { handler: validHandler, concurrency: 1.5 })).toThrow(
      'Concurrency must be a positive integer',
    );
  });

  it('throws on invalid retries', () => {
    const registry = new JobRegistry();

    expect(() => registry.register('bad', { handler: validHandler, retries: -1 })).toThrow(
      'Retries must be a non-negative integer',
    );
  });

  it('throws on invalid backoff', () => {
    const registry = new JobRegistry();

    expect(() =>
      registry.register('bad', { handler: validHandler, backoff: 'unknown' as any }),
    ).toThrow('Backoff must be one of');
  });

  it('throws on invalid cron schedule', () => {
    const registry = new JobRegistry();

    expect(() => registry.register('bad', { handler: validHandler, schedule: '* * *' })).toThrow(
      'Schedule must be a valid 5-field cron expression',
    );
  });

  it('accepts valid cron schedule', () => {
    const registry = new JobRegistry();
    registry.register('daily', { handler: validHandler, schedule: '0 2 * * *' });

    expect(registry.has('daily')).toBe(true);
  });

  it('throws on missing handler', () => {
    const registry = new JobRegistry();

    expect(() => registry.register('bad', { handler: null as any })).toThrow(
      'Job handler must be a function',
    );
  });

  it('getAll returns all registered jobs', () => {
    const registry = new JobRegistry();
    registry.register('a', { handler: validHandler });
    registry.register('b', { handler: validHandler });

    expect(registry.getAll()).toHaveLength(2);
  });

  it('getScheduled returns only jobs with a schedule', () => {
    const registry = new JobRegistry();
    registry.register('a', { handler: validHandler });
    registry.register('b', { handler: validHandler, schedule: '0 * * * *' });

    const scheduled = registry.getScheduled();
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].name).toBe('b');
  });
});
