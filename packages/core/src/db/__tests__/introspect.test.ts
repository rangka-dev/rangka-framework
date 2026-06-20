import { describe, it, expect, vi } from 'vitest';
import { introspect } from '../introspect.js';

function createMockDb(responses: any[][]) {
  let callCount = 0;
  const mockExecutor = {
    transformQuery: vi.fn().mockImplementation((node: any) => node),
    compileQuery: vi.fn().mockImplementation(() => ({ sql: '', parameters: [] })),
    executeQuery: vi.fn().mockImplementation(() => {
      const rows = responses[callCount] ?? [];
      callCount++;
      return Promise.resolve({ rows });
    }),
  };

  return {
    getExecutor: () => mockExecutor,
  } as any;
}

describe('introspect', () => {
  it('returns empty state for database with no tables', async () => {
    const mockDb = createMockDb([[]]);

    const result = await introspect(mockDb);
    expect(result.tables).toHaveLength(0);
  });

  it('returns table with columns when tables exist', async () => {
    const tableRows = [{ table_name: 'sales__invoice' }];
    const columnRows = [
      {
        column_name: 'id',
        data_type: 'uuid',
        is_nullable: 'NO',
        column_default: 'gen_random_uuid()',
        character_maximum_length: null,
        numeric_precision: null,
        numeric_scale: null,
        udt_name: 'uuid',
      },
      {
        column_name: 'title',
        data_type: 'character varying',
        is_nullable: 'YES',
        column_default: null,
        character_maximum_length: 255,
        numeric_precision: null,
        numeric_scale: null,
        udt_name: 'varchar',
      },
    ];
    const fkRows: any[] = [];
    const indexRows: any[] = [];
    const checkRows: any[] = [];

    const mockDb = createMockDb([tableRows, columnRows, fkRows, indexRows, checkRows]);

    const result = await introspect(mockDb);
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].name).toBe('sales__invoice');
    expect(result.tables[0].columns).toHaveLength(2);
    expect(result.tables[0].columns[0].name).toBe('id');
    expect(result.tables[0].columns[0].type).toBe('UUID');
    expect(result.tables[0].columns[0].nullable).toBe(false);
    expect(result.tables[0].columns[1].name).toBe('title');
    expect(result.tables[0].columns[1].type).toBe('VARCHAR(255)');
    expect(result.tables[0].columns[1].nullable).toBe(true);
  });
});
