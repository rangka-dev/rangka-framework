import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('permissions: role CRUD restrictions', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('permission registry is initialized', () => {
    expect(bootResult.permissionRegistry).toBeDefined();
  });

  it('Administrator role has full access to all models', () => {
    const perms = bootResult.permissionRegistry.resolvePermissionsForRoles(['Administrator']);
    expect(perms).toBeDefined();
    expect(perms.models).toBeDefined();
    const models = Object.keys(perms.models);
    expect(models.length).toBeGreaterThan(0);
    for (const modelPerms of Object.values(perms.models)) {
      expect(modelPerms.read).toBe(true);
      expect(modelPerms.create).toBe(true);
      expect(modelPerms.write).toBe(true);
      expect(modelPerms.delete).toBe(true);
    }
  });

  it('Sales Manager role has correct permissions', () => {
    const perms = bootResult.permissionRegistry.resolvePermissionsForRoles(['Sales Manager']);
    expect(perms).toBeDefined();
    expect(perms.models['sales.customer']).toBeDefined();
    expect(perms.models['sales.customer'].create).toBe(true);
    expect(perms.models['sales.customer'].read).toBe(true);
    expect(perms.models['sales.customer'].write).toBe(true);
    expect(perms.models['sales.customer'].delete).toBe(true);
    // delete: false means it's not granted (undefined or false)
    expect(perms.models['sales.invoice'].delete).toBeFalsy();
    expect(perms.models['sales.payment'].delete).toBeFalsy();
  });

  it('Sales User role has owner-based write on customer', () => {
    const perms = bootResult.permissionRegistry.resolvePermissionsForRoles(['Sales User']);
    expect(perms).toBeDefined();
    expect(perms.models['sales.customer'].write).toBe('own');
    expect(perms.models['sales.customer'].delete).toBeFalsy();
  });

  it('HR Manager role has full access to HR models', () => {
    const perms = bootResult.permissionRegistry.resolvePermissionsForRoles(['HR Manager']);
    expect(perms).toBeDefined();
    expect(perms.models['hr.employee']).toEqual({
      create: true,
      read: true,
      write: true,
      delete: true,
    });
  });

  it('HR User role has limited access', () => {
    const perms = bootResult.permissionRegistry.resolvePermissionsForRoles(['HR User']);
    expect(perms).toBeDefined();
    expect(perms.models['hr.employee'].create).toBeFalsy();
    expect(perms.models['hr.employee'].write).toBeFalsy();
    expect(perms.models['hr.leave_request'].create).toBe(true);
    expect(perms.models['hr.leave_request'].read).toBe('own');
    expect(perms.models['hr.leave_request'].write).toBe('own');
  });

  it('all defined roles are retrievable', () => {
    const roleNames = ['Administrator', 'Sales Manager', 'Sales User', 'HR Manager', 'HR User'];
    for (const role of roleNames) {
      const registered = bootResult.permissionRegistry.getRole(role);
      expect(registered, `Role ${role} should exist`).toBeDefined();
    }
  });
});
