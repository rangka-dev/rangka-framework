import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { bootSqliteApp } from './helpers.js';
import type { BootResult } from '@rangka/core';

describe('SQLite disabled features', () => {
  let result: BootResult;

  beforeAll(async () => {
    result = await bootSqliteApp();
  });

  afterAll(async () => {
    await result.db?.destroy();
  });

  it('does not start job worker', () => {
    expect(result.jobWorker).toBeUndefined();
  });

  it('does not start schedule manager', () => {
    expect(result.scheduleManager).toBeUndefined();
  });

  it('event bus dispatches synchronously', async () => {
    const calls: string[] = [];

    result.eventBus.on('test.sync', async () => {
      calls.push('handled');
    });

    await result.eventBus.emit('test.sync', { value: 1 });

    // On SQLite, events dispatch synchronously so the handler should have run
    expect(calls).toEqual(['handled']);
  });

  it('event bus dialect is sqlite', () => {
    expect(result.eventBus.dialect).toBe('sqlite');
  });
});
