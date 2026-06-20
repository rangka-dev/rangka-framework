import { describe, it, expect } from 'vitest';
import { DiffEngine } from '../diff-engine.js';
import type { DesiredState, ActualState } from '../types.js';

describe('DiffEngine', () => {
  const engine = new DiffEngine();

  it('produces CREATE TABLE for new tables', () => {
    const desired: DesiredState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            {
              name: 'id',
              type: 'UUID',
              nullable: false,
              primaryKey: true,
              defaultValue: 'gen_random_uuid()',
            },
            { name: 'title', type: 'VARCHAR(255)', nullable: true },
          ],
          foreignKeys: [],
          checkConstraints: [],
          indexes: [],
        },
      ],
    };
    const actual: ActualState = { tables: [] };

    const ops = engine.diff(desired, actual);
    expect(ops).toHaveLength(1);
    expect(ops[0].type).toBe('CREATE_TABLE');
    expect(ops[0].sql).toContain('CREATE TABLE "sales__invoice"');
    expect(ops[0].sql).toContain('"id" UUID');
    expect(ops[0].sql).toContain('"title" VARCHAR(255)');
    expect(ops[0].destructive).toBe(false);
  });

  it('produces ADD COLUMN for new columns on existing tables', () => {
    const desired: DesiredState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
            { name: 'title', type: 'VARCHAR(255)', nullable: true },
            { name: 'amount', type: 'DECIMAL(18,6)', nullable: true },
          ],
          foreignKeys: [],
          checkConstraints: [],
          indexes: [],
        },
      ],
    };
    const actual: ActualState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, defaultValue: null },
            { name: 'title', type: 'VARCHAR(255)', nullable: true, defaultValue: null },
          ],
          foreignKeys: [],
          indexes: [],
          checkConstraints: [],
        },
      ],
    };

    const ops = engine.diff(desired, actual);
    const addCol = ops.find((op) => op.type === 'ADD_COLUMN');
    expect(addCol).toBeDefined();
    expect(addCol!.sql).toContain('ADD COLUMN "amount" DECIMAL(18,6)');
  });

  it('produces ALTER COLUMN TYPE for type changes', () => {
    const desired: DesiredState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
            { name: 'notes', type: 'TEXT', nullable: true },
          ],
          foreignKeys: [],
          checkConstraints: [],
          indexes: [],
        },
      ],
    };
    const actual: ActualState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, defaultValue: null },
            { name: 'notes', type: 'VARCHAR(255)', nullable: true, defaultValue: null },
          ],
          foreignKeys: [],
          indexes: [],
          checkConstraints: [],
        },
      ],
    };

    const ops = engine.diff(desired, actual);
    const alter = ops.find((op) => op.type === 'ALTER_COLUMN_TYPE');
    expect(alter).toBeDefined();
    expect(alter!.sql).toContain('ALTER COLUMN "notes" TYPE TEXT');
  });

  it('produces CREATE INDEX for new indexes', () => {
    const desired: DesiredState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
            { name: 'customer', type: 'UUID', nullable: true },
          ],
          foreignKeys: [],
          checkConstraints: [],
          indexes: [
            {
              name: 'idx_sales__invoice_customer',
              table: 'sales__invoice',
              columns: ['customer'],
              unique: false,
            },
          ],
        },
      ],
    };
    const actual: ActualState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, defaultValue: null },
            { name: 'customer', type: 'UUID', nullable: true, defaultValue: null },
          ],
          foreignKeys: [],
          indexes: [],
          checkConstraints: [],
        },
      ],
    };

    const ops = engine.diff(desired, actual);
    const idx = ops.find((op) => op.type === 'CREATE_INDEX');
    expect(idx).toBeDefined();
    expect(idx!.sql).toContain('CREATE INDEX "idx_sales__invoice_customer"');
  });

  it('produces unique CREATE INDEX', () => {
    const desired: DesiredState = {
      tables: [
        {
          name: 'core__user',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
            { name: 'email', type: 'VARCHAR(255)', nullable: false },
          ],
          foreignKeys: [],
          checkConstraints: [],
          indexes: [
            {
              name: 'uidx_core__user_email',
              table: 'core__user',
              columns: ['email'],
              unique: true,
            },
          ],
        },
      ],
    };
    const actual: ActualState = { tables: [] };

    const ops = engine.diff(desired, actual);
    const idx = ops.find((op) => op.type === 'CREATE_INDEX');
    expect(idx).toBeDefined();
    expect(idx!.sql).toContain('CREATE UNIQUE INDEX');
  });

  it('produces ADD_FOREIGN_KEY for new FKs', () => {
    const desired: DesiredState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
            { name: 'customer', type: 'UUID', nullable: true },
          ],
          foreignKeys: [
            {
              name: 'fk_sales__invoice_customer',
              column: 'customer',
              referencedTable: 'sales__customer',
              referencedColumn: 'id',
            },
          ],
          checkConstraints: [],
          indexes: [],
        },
      ],
    };
    const actual: ActualState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, defaultValue: null },
            { name: 'customer', type: 'UUID', nullable: true, defaultValue: null },
          ],
          foreignKeys: [],
          indexes: [],
          checkConstraints: [],
        },
      ],
    };

    const ops = engine.diff(desired, actual);
    const fk = ops.find((op) => op.type === 'ADD_FOREIGN_KEY');
    expect(fk).toBeDefined();
    expect(fk!.sql).toContain('REFERENCES "sales__customer"');
  });

  it('warns on orphaned columns without dropping', () => {
    const desired: DesiredState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [{ name: 'id', type: 'UUID', nullable: false, primaryKey: true }],
          foreignKeys: [],
          checkConstraints: [],
          indexes: [],
        },
      ],
    };
    const actual: ActualState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, defaultValue: null },
            { name: 'old_field', type: 'VARCHAR(255)', nullable: true, defaultValue: null },
          ],
          foreignKeys: [],
          indexes: [],
          checkConstraints: [],
        },
      ],
    };

    const ops = engine.diff(desired, actual);
    const drop = ops.find((op) => op.type === 'DROP_COLUMN');
    expect(drop).toBeDefined();
    expect(drop!.destructive).toBe(true);
    expect(drop!.sql).toContain('WARNING');
  });

  it('warns on orphaned tables without dropping', () => {
    const desired: DesiredState = { tables: [] };
    const actual: ActualState = {
      tables: [
        {
          name: 'old_table',
          columns: [{ name: 'id', type: 'UUID', nullable: false, defaultValue: null }],
          foreignKeys: [],
          indexes: [],
          checkConstraints: [],
        },
      ],
    };

    const ops = engine.diff(desired, actual);
    const drop = ops.find((op) => op.type === 'DROP_TABLE');
    expect(drop).toBeDefined();
    expect(drop!.destructive).toBe(true);
  });

  it('produces empty operations when states match', () => {
    const desired: DesiredState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
            { name: 'title', type: 'VARCHAR(255)', nullable: true },
          ],
          foreignKeys: [],
          checkConstraints: [],
          indexes: [],
        },
      ],
    };
    const actual: ActualState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, defaultValue: null },
            { name: 'title', type: 'VARCHAR(255)', nullable: true, defaultValue: null },
          ],
          foreignKeys: [],
          indexes: [],
          checkConstraints: [],
        },
      ],
    };

    const ops = engine.diff(desired, actual);
    expect(ops).toHaveLength(0);
  });

  it('topologically sorts operations: CREATE TABLE before ADD_FOREIGN_KEY', () => {
    const desired: DesiredState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
            { name: 'customer', type: 'UUID', nullable: true },
          ],
          foreignKeys: [
            {
              name: 'fk_sales__invoice_customer',
              column: 'customer',
              referencedTable: 'sales__customer',
              referencedColumn: 'id',
            },
          ],
          checkConstraints: [],
          indexes: [],
        },
        {
          name: 'sales__customer',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
            { name: 'name', type: 'VARCHAR(255)', nullable: false },
          ],
          foreignKeys: [],
          checkConstraints: [],
          indexes: [],
        },
      ],
    };
    const actual: ActualState = { tables: [] };

    const ops = engine.diff(desired, actual);
    const createIdx = ops.findIndex((op) => op.type === 'CREATE_TABLE');
    const fkIdx = ops.findIndex((op) => op.type === 'ADD_FOREIGN_KEY');
    expect(createIdx).toBeLessThan(fkIdx);
  });

  it('puts destructive operations last', () => {
    const desired: DesiredState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
            { name: 'new_col', type: 'TEXT', nullable: true },
          ],
          foreignKeys: [],
          checkConstraints: [],
          indexes: [],
        },
      ],
    };
    const actual: ActualState = {
      tables: [
        {
          name: 'sales__invoice',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, defaultValue: null },
            { name: 'old_col', type: 'TEXT', nullable: true, defaultValue: null },
          ],
          foreignKeys: [],
          indexes: [],
          checkConstraints: [],
        },
      ],
    };

    const ops = engine.diff(desired, actual);
    const addIdx = ops.findIndex((op) => op.type === 'ADD_COLUMN');
    const dropIdx = ops.findIndex((op) => op.type === 'DROP_COLUMN');
    expect(addIdx).toBeLessThan(dropIdx);
  });

  describe('CHECK constraints', () => {
    it('includes CHECK constraints in CREATE TABLE SQL', () => {
      const desired: DesiredState = {
        tables: [
          {
            name: 'sales__invoice',
            columns: [
              { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
              { name: 'status', type: 'VARCHAR(255)', nullable: false },
            ],
            foreignKeys: [],
            checkConstraints: [
              {
                name: 'chk_sales__invoice_status',
                column: 'status',
                expression: "status IN ('Draft', 'Submitted', 'Paid')",
              },
            ],
            indexes: [],
          },
        ],
      };
      const actual: ActualState = { tables: [] };

      const ops = engine.diff(desired, actual);
      const createOp = ops.find((op) => op.type === 'CREATE_TABLE');
      expect(createOp).toBeDefined();
      expect(createOp!.sql).toContain('CONSTRAINT "chk_sales__invoice_status"');
      expect(createOp!.sql).toContain("CHECK (status IN ('Draft', 'Submitted', 'Paid'))");
    });

    it('produces ADD_CHECK_CONSTRAINT for new constraints on existing tables', () => {
      const desired: DesiredState = {
        tables: [
          {
            name: 'sales__invoice',
            columns: [
              { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
              { name: 'status', type: 'VARCHAR(255)', nullable: false },
            ],
            foreignKeys: [],
            checkConstraints: [
              {
                name: 'chk_sales__invoice_status',
                column: 'status',
                expression: "status IN ('Draft', 'Submitted', 'Paid')",
              },
            ],
            indexes: [],
          },
        ],
      };
      const actual: ActualState = {
        tables: [
          {
            name: 'sales__invoice',
            columns: [
              { name: 'id', type: 'UUID', nullable: false, defaultValue: null },
              { name: 'status', type: 'VARCHAR(255)', nullable: false, defaultValue: null },
            ],
            foreignKeys: [],
            indexes: [],
            checkConstraints: [],
          },
        ],
      };

      const ops = engine.diff(desired, actual);
      const checkOp = ops.find((op) => op.type === 'ADD_CHECK_CONSTRAINT');
      expect(checkOp).toBeDefined();
      expect(checkOp!.sql).toContain('ADD CONSTRAINT "chk_sales__invoice_status"');
      expect(checkOp!.sql).toContain("CHECK (status IN ('Draft', 'Submitted', 'Paid'))");
      expect(checkOp!.destructive).toBe(false);
    });

    it('does not produce ADD_CHECK_CONSTRAINT when constraint already exists', () => {
      const desired: DesiredState = {
        tables: [
          {
            name: 'sales__invoice',
            columns: [
              { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
              { name: 'status', type: 'VARCHAR(255)', nullable: false },
            ],
            foreignKeys: [],
            checkConstraints: [
              {
                name: 'chk_sales__invoice_status',
                column: 'status',
                expression: "status IN ('Draft', 'Submitted', 'Paid')",
              },
            ],
            indexes: [],
          },
        ],
      };
      const actual: ActualState = {
        tables: [
          {
            name: 'sales__invoice',
            columns: [
              { name: 'id', type: 'UUID', nullable: false, defaultValue: null },
              { name: 'status', type: 'VARCHAR(255)', nullable: false, defaultValue: null },
            ],
            foreignKeys: [],
            indexes: [],
            checkConstraints: [
              {
                name: 'chk_sales__invoice_status',
                column: 'status',
                expression: "status IN ('Draft', 'Submitted', 'Paid')",
              },
            ],
          },
        ],
      };

      const ops = engine.diff(desired, actual);
      const checkOp = ops.find((op) => op.type === 'ADD_CHECK_CONSTRAINT');
      expect(checkOp).toBeUndefined();
    });

    it('sorts ADD_CHECK_CONSTRAINT after ADD_FOREIGN_KEY', () => {
      const desired: DesiredState = {
        tables: [
          {
            name: 'sales__invoice',
            columns: [
              { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
              { name: 'status', type: 'VARCHAR(255)', nullable: false },
              { name: 'customer', type: 'UUID', nullable: true },
            ],
            foreignKeys: [
              {
                name: 'fk_sales__invoice_customer',
                column: 'customer',
                referencedTable: 'sales__customer',
                referencedColumn: 'id',
              },
            ],
            checkConstraints: [
              {
                name: 'chk_sales__invoice_status',
                column: 'status',
                expression: "status IN ('Draft', 'Submitted', 'Paid')",
              },
            ],
            indexes: [],
          },
        ],
      };
      const actual: ActualState = {
        tables: [
          {
            name: 'sales__invoice',
            columns: [
              { name: 'id', type: 'UUID', nullable: false, defaultValue: null },
              { name: 'status', type: 'VARCHAR(255)', nullable: false, defaultValue: null },
              { name: 'customer', type: 'UUID', nullable: true, defaultValue: null },
            ],
            foreignKeys: [],
            indexes: [],
            checkConstraints: [],
          },
        ],
      };

      const ops = engine.diff(desired, actual);
      const fkIdx = ops.findIndex((op) => op.type === 'ADD_FOREIGN_KEY');
      const checkIdx = ops.findIndex((op) => op.type === 'ADD_CHECK_CONSTRAINT');
      expect(fkIdx).toBeGreaterThanOrEqual(0);
      expect(checkIdx).toBeGreaterThanOrEqual(0);
      expect(fkIdx).toBeLessThan(checkIdx);
    });
  });

  describe('partial indexes', () => {
    it('produces CREATE INDEX with WHERE clause for partial indexes', () => {
      const desired: DesiredState = {
        tables: [
          {
            name: 'rangka_jobs',
            columns: [
              { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
              { name: 'unique_key', type: 'TEXT', nullable: true },
              { name: 'state', type: 'TEXT', nullable: false },
            ],
            foreignKeys: [],
            checkConstraints: [],
            indexes: [
              {
                name: 'idx_rangka_jobs_unique_key_active',
                table: 'rangka_jobs',
                columns: ['unique_key'],
                unique: true,
                where: "state IN ('created', 'active')",
              },
            ],
          },
        ],
      };
      const actual: ActualState = { tables: [] };

      const ops = engine.diff(desired, actual);
      const indexOp = ops.find((op) => op.type === 'CREATE_INDEX');
      expect(indexOp).toBeDefined();
      expect(indexOp!.sql).toContain('CREATE UNIQUE INDEX');
      expect(indexOp!.sql).toContain('"unique_key"');
      expect(indexOp!.sql).toContain("WHERE state IN ('created', 'active')");
    });

    it('produces CREATE INDEX without WHERE clause for regular indexes', () => {
      const desired: DesiredState = {
        tables: [
          {
            name: 'test_table',
            columns: [
              { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
              { name: 'name', type: 'TEXT', nullable: false },
            ],
            foreignKeys: [],
            checkConstraints: [],
            indexes: [
              {
                name: 'idx_test_name',
                table: 'test_table',
                columns: ['name'],
                unique: false,
              },
            ],
          },
        ],
      };
      const actual: ActualState = { tables: [] };

      const ops = engine.diff(desired, actual);
      const indexOp = ops.find((op) => op.type === 'CREATE_INDEX');
      expect(indexOp).toBeDefined();
      expect(indexOp!.sql).toBe('CREATE INDEX "idx_test_name" ON "test_table" ("name")');
      expect(indexOp!.sql).not.toContain('WHERE');
    });
  });
});
