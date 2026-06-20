import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('services: resolution', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('service registry has sales.invoice_service registered', () => {
    expect(bootResult.serviceRegistry.has('sales.invoice_service')).toBe(true);
  });

  it('service registry has hr.leave_service registered', () => {
    expect(bootResult.serviceRegistry.has('hr.leave_service')).toBe(true);
  });

  it('service registry has project.timesheet_service registered', () => {
    expect(bootResult.serviceRegistry.has('project.timesheet_service')).toBe(true);
  });

  it('service registry detects all services without circular deps', () => {
    expect(() => bootResult.serviceRegistry.detectCircularDependencies()).not.toThrow();
  });

  it('all registered services are discoverable', () => {
    const names = ['sales.invoice_service', 'hr.leave_service', 'project.timesheet_service'];
    for (const name of names) {
      expect(bootResult.serviceRegistry.has(name), `${name} should be registered`).toBe(true);
    }
  });
});
