import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KyselyModelOps } from '../model-ops.js';
import type { ResolvedModel } from '../../schema/types.js';
import type { SchemaRegistry } from '../../schema/registry.js';

function createMockDb() {
  const returningFn = vi.fn();
  const executeTakeFirstOrThrowFn = vi.fn();
  const onConflictDoUpdateSetFn = vi.fn();
  const onConflictColumnsFn = vi.fn();
  const onConflictFn = vi.fn();
  const valuesFn = vi.fn();
  const returningAllFn = vi.fn();
  const insertIntoFn = vi.fn();

  executeTakeFirstOrThrowFn.mockResolvedValue({ next_val: 1 });
  returningFn.mockReturnValue({ executeTakeFirstOrThrow: executeTakeFirstOrThrowFn });
  onConflictDoUpdateSetFn.mockReturnValue({ returning: returningFn });
  onConflictColumnsFn.mockReturnValue({ doUpdateSet: onConflictDoUpdateSetFn });
  onConflictFn.mockImplementation((cb: any) => {
    const oc = { columns: onConflictColumnsFn };
    return cb(oc);
  });
  valuesFn.mockReturnValue({ onConflict: onConflictFn });

  const insertReturningAllExecute = vi.fn().mockResolvedValue({ id: 'abc', name: 'INV-00001' });
  returningAllFn.mockReturnValue({ executeTakeFirstOrThrow: insertReturningAllExecute });

  insertIntoFn.mockImplementation((table: string) => {
    if (table === 'rangka_naming_sequence') {
      return { values: valuesFn };
    }
    return {
      values: vi.fn().mockReturnValue({ returningAll: returningAllFn }),
    };
  });

  return {
    db: {
      insertInto: insertIntoFn,
      selectFrom: vi.fn(),
      updateTable: vi.fn(),
      deleteFrom: vi.fn(),
    },
    insertIntoFn,
    executeTakeFirstOrThrowFn,
    valuesFn,
    insertReturningAllExecute,
  };
}

function createModel(fields: ResolvedModel['fields']): ResolvedModel {
  return {
    qualifiedName: 'sales.invoice',
    app: 'sales',
    module: 'sales',
    name: 'invoice',
    auditLog: false,
    traits: [],
    fields,
    indexes: [],
  };
}

const mockRegistry = { getModel: vi.fn() } as unknown as SchemaRegistry;

describe('KyselyModelOps sequence field', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assigns sequence value on create when field is empty', async () => {
    const { db, insertReturningAllExecute } = createMockDb();
    insertReturningAllExecute.mockResolvedValue({ id: 'abc', invoice_number: 'INV-00001' });

    const model = createModel([
      {
        name: 'invoice_number',
        config: { type: 'sequence', prefix: 'INV-', digits: 5 },
        provenance: { source: 'base' },
      },
    ]);

    const ops = new KyselyModelOps({ db, model, registry: mockRegistry });
    const data: Record<string, unknown> = { customer: 'cust-1' };
    await ops.create(data);

    expect(data.invoice_number).toBe('INV-00001');
  });

  it('does not override sequence value if already provided', async () => {
    const { db, insertIntoFn } = createMockDb();

    const model = createModel([
      {
        name: 'invoice_number',
        config: { type: 'sequence', prefix: 'INV-', digits: 5 },
        provenance: { source: 'base' },
      },
    ]);

    const ops = new KyselyModelOps({ db, model, registry: mockRegistry });
    const data: Record<string, unknown> = { invoice_number: 'CUSTOM-001', customer: 'cust-1' };
    await ops.create(data);

    expect(data.invoice_number).toBe('CUSTOM-001');
    const namingCalls = insertIntoFn.mock.calls.filter(
      (c: any) => c[0] === 'rangka_naming_sequence',
    );
    expect(namingCalls).toHaveLength(0);
  });

  it('formats sequence without prefix when prefix is omitted', async () => {
    const { db, executeTakeFirstOrThrowFn } = createMockDb();
    executeTakeFirstOrThrowFn.mockResolvedValue({ next_val: 42 });

    const model = createModel([
      {
        name: 'code',
        config: { type: 'sequence', digits: 4 },
        provenance: { source: 'base' },
      },
    ]);

    const ops = new KyselyModelOps({ db, model, registry: mockRegistry });
    const data: Record<string, unknown> = {};
    await ops.create(data);

    expect(data.code).toBe('0042');
  });

  it('formats sequence without padding when digits is omitted', async () => {
    const { db, executeTakeFirstOrThrowFn } = createMockDb();
    executeTakeFirstOrThrowFn.mockResolvedValue({ next_val: 7 });

    const model = createModel([
      {
        name: 'ref',
        config: { type: 'sequence', prefix: 'REF-' },
        provenance: { source: 'base' },
      },
    ]);

    const ops = new KyselyModelOps({ db, model, registry: mockRegistry });
    const data: Record<string, unknown> = {};
    await ops.create(data);

    expect(data.ref).toBe('REF-7');
  });

  it('handles multiple sequence fields on the same model', async () => {
    const { db, executeTakeFirstOrThrowFn } = createMockDb();
    let callCount = 0;
    executeTakeFirstOrThrowFn.mockImplementation(() => {
      callCount++;
      return Promise.resolve({ next_val: callCount });
    });

    const model = createModel([
      {
        name: 'invoice_number',
        config: { type: 'sequence', prefix: 'INV-', digits: 5 },
        provenance: { source: 'base' },
      },
      {
        name: 'receipt_number',
        config: { type: 'sequence', prefix: 'REC-', digits: 3 },
        provenance: { source: 'base' },
      },
    ]);

    const ops = new KyselyModelOps({ db, model, registry: mockRegistry });
    const data: Record<string, unknown> = {};
    await ops.create(data);

    expect(data.invoice_number).toBe('INV-00001');
    expect(data.receipt_number).toBe('REC-002');
  });

  it('skips sequence logic when model has no sequence fields', async () => {
    const { db, insertIntoFn } = createMockDb();

    const model = createModel([
      {
        name: 'title',
        config: { type: 'string' },
        provenance: { source: 'base' },
      },
    ]);

    const ops = new KyselyModelOps({ db, model, registry: mockRegistry });
    const data: Record<string, unknown> = { title: 'Test' };
    await ops.create(data);

    const namingCalls = insertIntoFn.mock.calls.filter(
      (c: any) => c[0] === 'rangka_naming_sequence',
    );
    expect(namingCalls).toHaveLength(0);
  });

  it('increments correctly for subsequent calls', async () => {
    const { db, executeTakeFirstOrThrowFn } = createMockDb();
    executeTakeFirstOrThrowFn
      .mockResolvedValueOnce({ next_val: 1 })
      .mockResolvedValueOnce({ next_val: 2 });

    const model = createModel([
      {
        name: 'order_number',
        config: { type: 'sequence', prefix: 'ORD-', digits: 6 },
        provenance: { source: 'base' },
      },
    ]);

    const ops = new KyselyModelOps({ db, model, registry: mockRegistry });

    const data1: Record<string, unknown> = {};
    await ops.create(data1);
    expect(data1.order_number).toBe('ORD-000001');

    const data2: Record<string, unknown> = {};
    await ops.create(data2);
    expect(data2.order_number).toBe('ORD-000002');
  });
});
