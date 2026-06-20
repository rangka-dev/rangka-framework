import { describe, it, expect } from 'vitest';
import { FixtureRegistry } from '../registry.js';
import { loadFixtures } from '../loader.js';
import type { FixtureDefinition } from '../types.js';

describe('FixtureRegistry', () => {
  it('registers and retrieves fixtures', () => {
    const registry = new FixtureRegistry();
    registry.register({
      model: 'accounting.account',
      key: 'account_code',
      records: [{ account_code: '1000', name: 'Assets' }],
    });
    expect(registry.getForModel('accounting.account')).toHaveLength(1);
  });

  it('rejects fixture with empty model', () => {
    const registry = new FixtureRegistry();
    expect(() => registry.register({ model: '', key: 'code', records: [{ code: '1' }] })).toThrow(
      'model must not be empty',
    );
  });

  it('rejects fixture with no records', () => {
    const registry = new FixtureRegistry();
    expect(() => registry.register({ model: 'x.y', key: 'code', records: [] })).toThrow(
      'at least one record',
    );
  });

  it('resolves dependency order', () => {
    const registry = new FixtureRegistry();
    registry.register({
      model: 'accounting.tax',
      key: 'name',
      depends: ['accounting.account'],
      records: [{ name: 'VAT' }],
    });
    registry.register({
      model: 'accounting.account',
      key: 'code',
      records: [{ code: '1000' }],
    });

    const order = registry.getLoadOrder();
    const models = order.map((f) => f.model);
    expect(models.indexOf('accounting.account')).toBeLessThan(models.indexOf('accounting.tax'));
  });

  it('filters by variant with fallback to default', () => {
    const registry = new FixtureRegistry();
    registry.register({
      model: 'accounting.account',
      key: 'code',
      records: [{ code: '1000', name: 'Default' }],
    });
    registry.register({
      model: 'accounting.account',
      key: 'code',
      variant: 'ID',
      records: [{ code: '1-1000', name: 'Indonesia' }],
    });
    registry.register({
      model: 'accounting.tax',
      key: 'name',
      records: [{ name: 'VAT' }],
    });

    const filtered = registry.getForVariant('ID');
    const models = filtered.map((f) => f.model);
    expect(models).toContain('accounting.account');
    expect(models).toContain('accounting.tax');
    // Should use ID variant for account
    const accountFixture = filtered.find((f) => f.model === 'accounting.account');
    expect(accountFixture?.records[0].name).toBe('Indonesia');
  });
});

describe('Fixture Loader', () => {
  function createMockDb() {
    const tables: Record<string, any[]> = {};

    const db: any = {
      selectFrom: (table: string) => {
        const rows = tables[table] ?? [];
        const filters: Array<{ col: string; val: any }> = [];
        const builder: any = {
          selectAll: () => builder,
          select: () => builder,
          where: (col: string, op: string, val: any) => {
            filters.push({ col, val });
            return builder;
          },
          execute: async () => {
            return rows.filter((r) => filters.every((f) => r[f.col] === f.val));
          },
        };
        return builder;
      },
      insertInto: (table: string) => ({
        values: (data: any) => ({
          execute: async () => {
            if (!tables[table]) tables[table] = [];
            tables[table].push({ id: `id-${tables[table].length + 1}`, ...data });
          },
        }),
      }),
      updateTable: (table: string) => ({
        set: (data: any) => ({
          where: (col: string, op: string, val: any) => ({
            execute: async () => {
              const rows = tables[table] ?? [];
              const row = rows.find((r) => r[col] === val);
              if (row) Object.assign(row, data);
            },
          }),
        }),
      }),
    };

    return { db, tables };
  }

  it('inserts new records', async () => {
    const { db, tables } = createMockDb();
    const defs: FixtureDefinition[] = [
      {
        model: 'accounting.account',
        key: 'account_code',
        records: [
          { account_code: '1000', name: 'Assets' },
          { account_code: '2000', name: 'Liabilities' },
        ],
      },
    ];

    const result = await loadFixtures(db, defs);
    expect(result.inserted).toBe(2);
    expect(result.skipped).toBe(0);
    expect(tables['accounting_account']).toHaveLength(2);
  });

  it('skips user-modified records (no fixture hash)', async () => {
    const { db, tables } = createMockDb();
    tables['accounting_account'] = [
      { account_code: '1000', name: 'User Modified', _fixture_hash: undefined },
    ];

    const defs: FixtureDefinition[] = [
      {
        model: 'accounting.account',
        key: 'account_code',
        records: [{ account_code: '1000', name: 'Assets' }],
      },
    ];

    const result = await loadFixtures(db, defs);
    expect(result.skipped).toBe(1);
    expect(tables['accounting_account'][0].name).toBe('User Modified');
  });

  it('force mode overwrites existing records', async () => {
    const { db, tables } = createMockDb();
    tables['accounting_account'] = [{ account_code: '1000', name: 'Old', _fixture_hash: null }];

    const defs: FixtureDefinition[] = [
      {
        model: 'accounting.account',
        key: 'account_code',
        records: [{ account_code: '1000', name: 'Updated' }],
      },
    ];

    const result = await loadFixtures(db, defs, { force: true });
    expect(result.inserted).toBe(1);
    expect(tables['accounting_account'][0].name).toBe('Updated');
  });

  it('resolves ref fields to record IDs', async () => {
    const { db, tables } = createMockDb();
    tables['accounting_account'] = [
      { id: 'acct-uuid', account_code: '2100', name: 'Tax Payable', _fixture_hash: 'x' },
    ];

    const defs: FixtureDefinition[] = [
      {
        model: 'accounting.tax',
        key: 'name',
        records: [
          {
            name: 'VAT 11%',
            rate: 11,
            account: { ref: 'accounting.account', key: '2100' },
          },
        ],
      },
    ];

    const result = await loadFixtures(db, defs);
    expect(result.inserted).toBe(1);
    expect(tables['accounting_tax'][0].account).toBe('acct-uuid');
  });
});
