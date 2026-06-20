import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('services: FrameworkContext injection', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('ctx.db is available and can query', async () => {
    const ctx = bootResult.frameworkContext!;
    expect(ctx.db).toBeDefined();
    const result = await ctx.db.selectFrom('core__user').selectAll().limit(1).execute();
    expect(Array.isArray(result)).toBe(true);
  });

  it('ctx.schema is available and has models', () => {
    const ctx = bootResult.frameworkContext!;
    expect(ctx.schema).toBeDefined();
    expect(ctx.schema.getAllModels().length).toBeGreaterThan(0);
  });

  it('ctx.auth has user and roles fields', () => {
    const ctx = bootResult.frameworkContext!;
    expect(ctx.auth).toBeDefined();
    expect(ctx.auth).toHaveProperty('user');
    expect(ctx.auth).toHaveProperty('roles');
  });

  it('ctx.scope is available', () => {
    const ctx = bootResult.frameworkContext!;
    expect('scope' in ctx).toBe(true);
  });

  it('ctx.config is available', () => {
    const ctx = bootResult.frameworkContext!;
    expect(ctx.config).toBeDefined();
    expect(typeof ctx.config).toBe('object');
  });

  it('ctx.models can query records', async () => {
    const ctx = bootResult.frameworkContext!;
    expect(ctx.models).toBeDefined();
    const result = await ctx.models.query('core.user').exec();
    expect(result).toHaveProperty('data');
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('ctx.service resolves registered services', () => {
    const ctx = bootResult.frameworkContext!;
    expect(ctx.service).toBeTypeOf('function');
    const svc = ctx.service('sales.invoice_service');
    expect(svc).toBeDefined();
  });

  it('ctx.enqueue is a callable function', () => {
    const ctx = bootResult.frameworkContext!;
    expect(ctx.enqueue).toBeTypeOf('function');
  });

  it('ctx.events has emit and on', () => {
    const ctx = bootResult.frameworkContext!;
    expect(ctx.events).toBeDefined();
    expect(ctx.events.emit).toBeTypeOf('function');
    expect(ctx.events.on).toBeTypeOf('function');
  });

  it('ctx.notify is a callable function', () => {
    const ctx = bootResult.frameworkContext!;
    expect(ctx.notify).toBeTypeOf('function');
  });

  it('ctx.email.send is a callable function', () => {
    const ctx = bootResult.frameworkContext!;
    expect(ctx.email).toBeDefined();
    expect(ctx.email.send).toBeTypeOf('function');
  });

  it('service factory receives full context with models', () => {
    const registry = bootResult.serviceRegistry;
    registry.register({
      name: 'test.context_check',
      factory: (ctx: any) => ({
        hasModels: () => ctx.models !== undefined,
        hasAuth: () => ctx.auth !== undefined,
        hasScope: () => 'scope' in ctx,
        hasConfig: () => ctx.config !== undefined,
        hasEnqueue: () => typeof ctx.enqueue === 'function',
        hasEvents: () => ctx.events !== undefined,
        hasService: () => typeof ctx.service === 'function',
      }),
    });

    const svc = bootResult.frameworkContext!.service('test.context_check') as any;
    expect(svc.hasModels()).toBe(true);
    expect(svc.hasAuth()).toBe(true);
    expect(svc.hasScope()).toBe(true);
    expect(svc.hasConfig()).toBe(true);
    expect(svc.hasEnqueue()).toBe(true);
    expect(svc.hasEvents()).toBe(true);
    expect(svc.hasService()).toBe(true);
  });
});
