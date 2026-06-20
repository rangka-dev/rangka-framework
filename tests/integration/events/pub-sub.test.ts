import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('events: pub-sub', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('event bus is initialized', () => {
    expect(bootResult.eventBus).toBeDefined();
  });

  it('can subscribe and emit events synchronously', async () => {
    let received: unknown = null;
    bootResult.eventBus.on('test.event', async (payload) => {
      received = payload;
    });
    await bootResult.eventBus.emit('test.event', { message: 'hello' }, { sync: true });
    expect(received).toEqual({ message: 'hello' });
  });

  it('multiple listeners receive the same event', async () => {
    const results: string[] = [];
    bootResult.eventBus.on('multi.event', async () => {
      results.push('a');
    });
    bootResult.eventBus.on('multi.event', async () => {
      results.push('b');
    });
    await bootResult.eventBus.emit('multi.event', {}, { sync: true });
    expect(results).toContain('a');
    expect(results).toContain('b');
  });

  it('unrelated events do not fire listeners', async () => {
    let called = false;
    bootResult.eventBus.on('specific.event', async () => {
      called = true;
    });
    await bootResult.eventBus.emit('other.event', {}, { sync: true });
    expect(called).toBe(false);
  });

  it('hasListeners returns true for registered events', () => {
    bootResult.eventBus.on('check.event', async () => {});
    expect(bootResult.eventBus.hasListeners('check.event')).toBe(true);
  });

  it('hasListeners returns false for unregistered events', () => {
    expect(bootResult.eventBus.hasListeners('never.registered')).toBe(false);
  });
});
