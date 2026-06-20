import { describe, it, expect, beforeEach } from 'vitest';
import { recordAudit, getAuditHistory } from '../record.js';

function createMockDb() {
  const rows: any[] = [];
  let idCounter = 1;

  const db: any = {
    insertInto: (_table: string) => ({
      values: (data: any) => ({
        returningAll: () => ({
          execute: async () => {
            const row = {
              id: `audit-${idCounter++}`,
              ...data,
              changes: typeof data.changes === 'string' ? JSON.parse(data.changes) : data.changes,
              timestamp: new Date(),
            };
            rows.push(row);
            return [row];
          },
        }),
      }),
    }),
    selectFrom: (_table: string) => {
      const filters: Array<{ col: string; val: any }> = [];
      const builder: any = {
        selectAll: () => builder,
        where: (col: string, op: string, val: any) => {
          filters.push({ col, val });
          return builder;
        },
        orderBy: () => builder,
        execute: async () => {
          return rows.filter((r) => filters.every((f) => r[f.col] === f.val));
        },
      };
      return builder;
    },
  };

  return { db, rows };
}

describe('Audit Log', () => {
  let db: any;

  beforeEach(() => {
    const mock = createMockDb();
    db = mock.db;
  });

  it('records audit on create with all fields as changes', async () => {
    const result = await recordAudit(db, {
      model: 'sales.invoice',
      documentId: 'inv-1',
      action: 'create',
      userId: 'user-1',
      before: null,
      after: { name: 'INV-001', amount: 1000 },
    });

    expect(result).not.toBeNull();
    expect(result!.action).toBe('create');
    expect(result!.changes.name).toEqual({ from: null, to: 'INV-001' });
    expect(result!.changes.amount).toEqual({ from: null, to: 1000 });
  });

  it('records audit on update with only changed fields', async () => {
    const result = await recordAudit(db, {
      model: 'sales.invoice',
      documentId: 'inv-1',
      action: 'update',
      userId: 'user-1',
      before: { name: 'INV-001', amount: 1000, status: 'draft' },
      after: { name: 'INV-001', amount: 2000, status: 'draft' },
    });

    expect(result).not.toBeNull();
    expect(result!.changes.amount).toEqual({ from: 1000, to: 2000 });
    expect(result!.changes.name).toBeUndefined();
  });

  it('returns null for update with no actual changes', async () => {
    const result = await recordAudit(db, {
      model: 'sales.invoice',
      documentId: 'inv-1',
      action: 'update',
      userId: 'user-1',
      before: { name: 'INV-001', amount: 1000 },
      after: { name: 'INV-001', amount: 1000 },
    });

    expect(result).toBeNull();
  });

  it('records audit on delete with all fields removed', async () => {
    const result = await recordAudit(db, {
      model: 'sales.invoice',
      documentId: 'inv-1',
      action: 'delete',
      userId: 'user-1',
      before: { name: 'INV-001', amount: 1000 },
      after: null,
    });

    expect(result).not.toBeNull();
    expect(result!.changes.name).toEqual({ from: 'INV-001', to: null });
  });

  it('ignores internal timestamp fields in diff', async () => {
    const result = await recordAudit(db, {
      model: 'sales.invoice',
      documentId: 'inv-1',
      action: 'update',
      userId: 'user-1',
      before: { name: 'INV-001', updated_at: '2024-01-01' },
      after: { name: 'INV-001', updated_at: '2024-01-02' },
    });

    expect(result).toBeNull();
  });

  it('retrieves audit history for a document', async () => {
    await recordAudit(db, {
      model: 'sales.invoice',
      documentId: 'inv-1',
      action: 'create',
      before: null,
      after: { name: 'INV-001' },
    });

    await recordAudit(db, {
      model: 'sales.invoice',
      documentId: 'inv-1',
      action: 'submit',
      before: { status: 'draft' },
      after: { status: 'submitted' },
    });

    const history = await getAuditHistory(db, 'sales.invoice', 'inv-1');
    expect(history).toHaveLength(2);
  });
});
