import { describe, it, expect } from 'vitest';
import {
  Kysely,
  DummyDriver,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from 'kysely';
import { applyScopeEnforcement, stripHiddenFields, enforceReadOnly } from '../scope-enforcer.js';
import type { ResolvedModel } from '../../schema/types.js';
import type { RequestContext, ScopeFilter } from '../../auth/types.js';

function createTestDb() {
  return new Kysely<any>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: (db: any) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });
}

function makeModel(qualifiedName: string, traits: string[] = []): ResolvedModel {
  return {
    qualifiedName,
    app: 'test',
    name: qualifiedName.split('.')[1],
    auditLog: false,
    traits,
    fields: [
      { name: 'id', config: { type: 'uuid' }, provenance: { source: 'base' } },
      { name: 'name', config: { type: 'string' }, provenance: { source: 'base' } },
      { name: 'secret_field', config: { type: 'string' }, provenance: { source: 'base' } },
      { name: 'tenant_id', config: { type: 'uuid' }, provenance: { source: 'base' } },
      {
        name: 'created_by',
        config: { type: 'uuid' },
        provenance: { source: 'trait', trait: 'timestamped' },
      },
    ],
    indexes: [],
  } as ResolvedModel;
}

describe('applyScopeEnforcement', () => {
  const db = createTestDb();

  it('adds scope filter WHERE clauses to query', () => {
    const scopeFilters: ScopeFilter[] = [{ field: 'tenant_id', operator: 'eq', value: 'tenant-1' }];
    const auth: RequestContext = { scopeFilters };

    let query = db.selectFrom('sales__Order').selectAll();
    query = applyScopeEnforcement(query, auth);
    const compiled = query.compile();

    expect(compiled.sql).toContain('"tenant_id" = $1');
    expect(compiled.parameters).toEqual(['tenant-1']);
  });

  it('adds multiple scope filters as AND conditions', () => {
    const scopeFilters: ScopeFilter[] = [
      { field: 'tenant_id', operator: 'eq', value: 'tenant-1' },
      { field: 'branch_id', operator: 'eq', value: 'branch-1' },
    ];
    const auth: RequestContext = { scopeFilters };

    let query = db.selectFrom('sales__Order').selectAll();
    query = applyScopeEnforcement(query, auth);
    const compiled = query.compile();

    expect(compiled.sql).toContain('"tenant_id" = $1');
    expect(compiled.sql).toContain('"branch_id" = $2');
    expect(compiled.parameters).toEqual(['tenant-1', 'branch-1']);
  });

  it('handles "in" operator for scope filters', () => {
    const scopeFilters: ScopeFilter[] = [
      { field: 'tenant_id', operator: 'in', value: ['t-1', 't-2'] },
    ];
    const auth: RequestContext = { scopeFilters };

    let query = db.selectFrom('sales__Order').selectAll();
    query = applyScopeEnforcement(query, auth);
    const compiled = query.compile();

    expect(compiled.sql).toContain('"tenant_id" in ($1, $2)');
    expect(compiled.parameters).toEqual(['t-1', 't-2']);
  });

  it('does nothing when no scope filters exist', () => {
    const auth: RequestContext = {};

    let query = db.selectFrom('sales__Order').selectAll();
    query = applyScopeEnforcement(query, auth);
    const compiled = query.compile();

    expect(compiled.sql).not.toContain('where');
  });

  it('does nothing when scopeFilters is empty array', () => {
    const auth: RequestContext = { scopeFilters: [] };

    let query = db.selectFrom('sales__Order').selectAll();
    query = applyScopeEnforcement(query, auth);
    const compiled = query.compile();

    expect(compiled.sql).not.toContain('where');
  });

  it('does nothing when auth is undefined', () => {
    let query = db.selectFrom('sales__Order').selectAll();
    query = applyScopeEnforcement(query, undefined);
    const compiled = query.compile();

    expect(compiled.sql).not.toContain('where');
  });

  it('adds owner-only filter when specified', () => {
    const auth: RequestContext = {
      user: { id: 'user-1', email: 'a@b.c', full_name: 'A', enabled: true, password_hash: '' },
      permissions: {
        models: {
          'sales.Order': { read: 'own', write: 'own', delete: 'own' },
        },
        pages: [],
        version: 1,
      },
    };

    const model = makeModel('sales.Order');
    let query = db.selectFrom('sales__Order').selectAll();
    query = applyScopeEnforcement(query, auth, { model, checkOwnership: true });
    const compiled = query.compile();

    expect(compiled.sql).toContain('"created_by" = $1');
    expect(compiled.parameters).toEqual(['user-1']);
  });

  it('does not add owner filter when permission is not "own"', () => {
    const auth: RequestContext = {
      user: { id: 'user-1', email: 'a@b.c', full_name: 'A', enabled: true, password_hash: '' },
      permissions: {
        models: {
          'sales.Order': { read: true, write: true, delete: true },
        },
        pages: [],
        version: 1,
      },
    };

    const model = makeModel('sales.Order');
    let query = db.selectFrom('sales__Order').selectAll();
    query = applyScopeEnforcement(query, auth, { model, checkOwnership: true });
    const compiled = query.compile();

    expect(compiled.sql).not.toContain('"created_by"');
  });

  it('does not add owner filter when model lacks created_by field', () => {
    const auth: RequestContext = {
      user: { id: 'user-1', email: 'a@b.c', full_name: 'A', enabled: true, password_hash: '' },
      permissions: {
        models: {
          'sales.Order': { read: 'own', write: 'own', delete: 'own' },
        },
        pages: [],
        version: 1,
      },
    };

    const modelWithoutCreatedBy = {
      qualifiedName: 'sales.Order',
      app: 'test',
      name: 'Order',
      auditLog: false,
      traits: [],
      fields: [{ name: 'id', config: { type: 'string' }, provenance: { source: 'base' } }],
      indexes: [],
    } as ResolvedModel;

    let query = db.selectFrom('sales__Order').selectAll();
    query = applyScopeEnforcement(query, auth, {
      model: modelWithoutCreatedBy,
      checkOwnership: true,
    });
    const compiled = query.compile();

    expect(compiled.sql).not.toContain('"created_by"');
  });
});

describe('stripHiddenFields', () => {
  it('removes hidden fields from a single record', () => {
    const record = { id: '1', name: 'Test', secret_field: 'secret' };
    const hidden = new Set(['secret_field']);
    const result = stripHiddenFields(record, hidden);
    expect(result).toEqual({ id: '1', name: 'Test' });
  });

  it('removes hidden fields from array of records', () => {
    const records = [
      { id: '1', name: 'A', secret_field: 'x' },
      { id: '2', name: 'B', secret_field: 'y' },
    ];
    const hidden = new Set(['secret_field']);
    const result = records.map((r) => stripHiddenFields(r, hidden));
    expect(result).toEqual([
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ]);
  });

  it('returns record unchanged when no fields are hidden', () => {
    const record = { id: '1', name: 'Test' };
    const hidden = new Set<string>();
    const result = stripHiddenFields(record, hidden);
    expect(result).toEqual(record);
  });

  it('returns empty object when all fields are hidden', () => {
    const record = { id: '1', name: 'Test' };
    const hidden = new Set(['id', 'name']);
    const result = stripHiddenFields(record, hidden);
    expect(result).toEqual({});
  });

  it('handles record with nested objects (does not strip nested)', () => {
    const record = { id: '1', meta: { secret_field: 'x' }, secret_field: 'top' };
    const hidden = new Set(['secret_field']);
    const result = stripHiddenFields(record, hidden);
    expect(result).toEqual({ id: '1', meta: { secret_field: 'x' } });
  });
});

describe('enforceReadOnly', () => {
  it('throws when writing to a read-only field', () => {
    const readOnly = new Set(['status']);
    const data = { status: 'active', name: 'Test' };
    expect(() => enforceReadOnly(data, readOnly)).toThrow(/read-only.*status/i);
  });

  it('does not throw when writing to non-read-only fields', () => {
    const readOnly = new Set(['status']);
    const data = { name: 'Test', email: 'a@b.c' };
    expect(() => enforceReadOnly(data, readOnly)).not.toThrow();
  });

  it('does not throw when readOnly set is empty', () => {
    const readOnly = new Set<string>();
    const data = { status: 'active', name: 'Test' };
    expect(() => enforceReadOnly(data, readOnly)).not.toThrow();
  });

  it('reports all violated fields in the error', () => {
    const readOnly = new Set(['status', 'level']);
    const data = { status: 'active', level: 5, name: 'Test' };
    expect(() => enforceReadOnly(data, readOnly)).toThrow(/status.*level|level.*status/);
  });

  it('ignores undefined values (not actually writing)', () => {
    const readOnly = new Set(['status']);
    const data = { status: undefined, name: 'Test' };
    expect(() => enforceReadOnly(data, readOnly)).not.toThrow();
  });
});
