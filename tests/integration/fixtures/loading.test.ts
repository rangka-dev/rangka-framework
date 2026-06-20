import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import type { BootResult } from '@rangka/core';

let bootResult: BootResult;

describe('fixtures: loading', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp();
  });

  afterAll(async () => {
    if (bootResult.db) await bootResult.db.destroy();
  });

  it('fixture registry is initialized', () => {
    expect(bootResult.fixtureRegistry).toBeDefined();
  });

  it('fixture registry has customer fixtures registered', () => {
    const all = bootResult.fixtureRegistry.getAll();
    const customerFixture = all.find((f) => f.model === 'sales.customer');
    expect(customerFixture).toBeDefined();
  });

  it('fixture registry has category fixtures registered', () => {
    const all = bootResult.fixtureRegistry.getAll();
    const catFixture = all.find((f) => f.model === 'inventory.category');
    expect(catFixture).toBeDefined();
  });

  it('fixture registry has warehouse fixtures registered', () => {
    const all = bootResult.fixtureRegistry.getAll();
    const whFixture = all.find((f) => f.model === 'inventory.warehouse');
    expect(whFixture).toBeDefined();
  });

  it('fixture registry has item fixtures registered', () => {
    const all = bootResult.fixtureRegistry.getAll();
    const itemFixture = all.find((f) => f.model === 'inventory.item');
    expect(itemFixture).toBeDefined();
  });

  it('item fixtures depend on category fixtures', () => {
    const all = bootResult.fixtureRegistry.getAll();
    const itemFixture = all.find((f) => f.model === 'inventory.item');
    expect(itemFixture).toBeDefined();
    expect(itemFixture!.definition.depends).toContain('inventory.category');
  });

  it('customer fixture has correct record count', () => {
    const all = bootResult.fixtureRegistry.getAll();
    const customerFixture = all.find((f) => f.model === 'sales.customer');
    expect(customerFixture).toBeDefined();
    expect(customerFixture!.definition.records.length).toBe(3);
  });

  it('category fixture includes hierarchical records', () => {
    const all = bootResult.fixtureRegistry.getAll();
    const catFixture = all.find((f) => f.model === 'inventory.category');
    expect(catFixture).toBeDefined();
    expect(catFixture!.definition.records.length).toBe(4);
    const computers = catFixture!.definition.records.find((r) => r.name === 'Computers');
    expect(computers).toBeDefined();
    expect(computers!.parent).toEqual({ ref: 'inventory.category', key: 'Electronics' });
  });
});
