import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KyselyModelOps } from '../model-ops.js';
import type { ResolvedModel } from '../../schema/types.js';
import type { SchemaRegistry } from '../../schema/registry.js';

function createMockDb() {
  const executeFn = vi.fn().mockResolvedValue([]);
  const executeTakeFirstFn = vi.fn();
  const whereFn = vi.fn().mockReturnValue({ execute: executeFn });
  const setFn = vi.fn().mockReturnValue({ where: whereFn });
  const deleteWhereFn = vi.fn().mockReturnValue({ execute: executeFn });

  const selectWhereFn = vi.fn();
  const selectAllFn = vi.fn();

  selectWhereFn.mockImplementation(() => ({
    executeTakeFirst: executeTakeFirstFn,
    where: selectWhereFn,
  }));
  selectAllFn.mockReturnValue({ where: selectWhereFn });

  const db = {
    selectFrom: vi.fn().mockReturnValue({ selectAll: selectAllFn }),
    insertInto: vi.fn(),
    updateTable: vi.fn().mockReturnValue({ set: setFn }),
    deleteFrom: vi.fn().mockReturnValue({ where: deleteWhereFn }),
  };

  return { db, executeFn, executeTakeFirstFn, setFn, whereFn, deleteWhereFn };
}

function createParentModel(
  traits: string[] = [],
  childrenFields: ResolvedModel['fields'] = [],
): ResolvedModel {
  return {
    qualifiedName: 'sales.invoice',
    app: 'sales',
    module: 'sales',
    name: 'invoice',
    auditLog: false,
    traits,
    fields: [
      { name: 'id', config: { type: 'string' }, provenance: { source: 'base' } },
      { name: 'customer', config: { type: 'string' }, provenance: { source: 'base' } },
      ...childrenFields,
    ],
    indexes: [],
  };
}

describe('KyselyModelOps cascade delete children', () => {
  let mockRegistry: SchemaRegistry;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegistry = {
      getModel: vi.fn().mockReturnValue(null),
    } as unknown as SchemaRegistry;
  });

  it('hard deletes children when parent is hard deleted', async () => {
    const { db, executeTakeFirstFn, deleteWhereFn } = createMockDb();
    executeTakeFirstFn.mockResolvedValue({ id: 'inv-1', customer: 'cust-1' });

    const model = createParentModel(
      [],
      [
        {
          name: 'items',
          config: { type: 'children', model: 'sales.invoice_item', foreignKey: 'invoice_id' },
          provenance: { source: 'base' },
        },
      ],
    );

    const ops = new KyselyModelOps({ db, model, registry: mockRegistry });
    await ops.delete('inv-1');

    expect(db.deleteFrom).toHaveBeenCalledWith('sales__invoice_item');
    expect(deleteWhereFn).toHaveBeenCalledWith('invoice_id', '=', 'inv-1');
  });

  it('soft deletes children when child model has soft_delete trait', async () => {
    const { db, executeTakeFirstFn, setFn, whereFn } = createMockDb();
    executeTakeFirstFn.mockResolvedValue({ id: 'inv-1', customer: 'cust-1' });

    (mockRegistry.getModel as any).mockImplementation((name: string) => {
      if (name === 'sales.invoice_item') {
        return { traits: ['soft_delete'] };
      }
      return null;
    });

    const model = createParentModel(
      [],
      [
        {
          name: 'items',
          config: { type: 'children', model: 'sales.invoice_item', foreignKey: 'invoice_id' },
          provenance: { source: 'base' },
        },
      ],
    );

    const ops = new KyselyModelOps({ db, model, registry: mockRegistry });
    await ops.delete('inv-1');

    expect(db.updateTable).toHaveBeenCalledWith('sales__invoice_item');
    expect(setFn).toHaveBeenCalledWith({ archived_at: expect.any(String) });
    expect(whereFn).toHaveBeenCalledWith('invoice_id', '=', 'inv-1');
  });

  it('cascades to multiple children fields', async () => {
    const { db, executeTakeFirstFn, deleteWhereFn } = createMockDb();
    executeTakeFirstFn.mockResolvedValue({ id: 'inv-1' });

    const model = createParentModel(
      [],
      [
        {
          name: 'items',
          config: { type: 'children', model: 'sales.invoice_item', foreignKey: 'invoice_id' },
          provenance: { source: 'base' },
        },
        {
          name: 'taxes',
          config: { type: 'children', model: 'sales.invoice_tax', foreignKey: 'invoice_id' },
          provenance: { source: 'base' },
        },
      ],
    );

    const ops = new KyselyModelOps({ db, model, registry: mockRegistry });
    await ops.delete('inv-1');

    expect(db.deleteFrom).toHaveBeenCalledWith('sales__invoice_item');
    expect(db.deleteFrom).toHaveBeenCalledWith('sales__invoice_tax');
    expect(deleteWhereFn).toHaveBeenCalledTimes(3); // 2 children + 1 parent
  });

  it('does not cascade when model has no children fields', async () => {
    const { db, executeTakeFirstFn, deleteWhereFn } = createMockDb();
    executeTakeFirstFn.mockResolvedValue({ id: 'inv-1' });

    const model = createParentModel();

    const ops = new KyselyModelOps({ db, model, registry: mockRegistry });
    await ops.delete('inv-1');

    expect(db.deleteFrom).toHaveBeenCalledTimes(1); // only parent
    expect(deleteWhereFn).toHaveBeenCalledWith('id', '=', 'inv-1');
  });

  it('soft deletes parent and hard deletes children when only parent has soft_delete', async () => {
    const { db, executeTakeFirstFn, setFn, whereFn, deleteWhereFn } = createMockDb();
    executeTakeFirstFn.mockResolvedValue({ id: 'inv-1' });

    const model = createParentModel(
      ['soft_delete'],
      [
        {
          name: 'items',
          config: { type: 'children', model: 'sales.invoice_item', foreignKey: 'invoice_id' },
          provenance: { source: 'base' },
        },
      ],
    );

    const ops = new KyselyModelOps({ db, model, registry: mockRegistry });
    await ops.delete('inv-1');

    // Children hard deleted
    expect(db.deleteFrom).toHaveBeenCalledWith('sales__invoice_item');
    expect(deleteWhereFn).toHaveBeenCalledWith('invoice_id', '=', 'inv-1');

    // Parent soft deleted
    expect(db.updateTable).toHaveBeenCalledWith('sales.invoice');
    expect(setFn).toHaveBeenCalledWith({ archived_at: expect.any(String) });
    expect(whereFn).toHaveBeenCalledWith('id', '=', 'inv-1');
  });
});
