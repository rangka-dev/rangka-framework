import type {
  DesiredState,
  ActualState,
  DdlOperation,
  TableDefinition,
  ActualTable,
  ColumnDefinition,
  ActualColumn,
  IndexDefinition,
  ActualIndex,
  ForeignKeyDefinition,
  ActualForeignKey,
  CheckConstraintDefinition,
  ActualCheckConstraint,
} from './types.js';

/**
 * Compares a desired schema state against the actual database state and
 * produces a sorted list of DDL operations needed to reconcile the two.
 */
export class DiffEngine {
  // --- Public API ---

  /** Compute the full set of DDL operations to bring `actual` in line with `desired`. */
  diff(desired: DesiredState, actual: ActualState): DdlOperation[] {
    const operations: DdlOperation[] = [];
    const actualTablesByName = new Map(actual.tables.map((t) => [t.name, t]));

    // Generate operations for each desired table (create or update)
    for (const desiredTable of desired.tables) {
      const existingTable = actualTablesByName.get(desiredTable.name);
      if (!existingTable) {
        operations.push(...this.buildNewTableOperations(desiredTable));
      } else {
        operations.push(...this.diffTable(desiredTable, existingTable));
      }
    }

    // Flag tables that exist in the database but not in the schema
    for (const existingTable of actual.tables) {
      const stillDesired = desired.tables.find((t) => t.name === existingTable.name);
      if (!stillDesired) {
        operations.push(this.warnOrphanedTable(existingTable.name));
      }
    }

    return this.sortByDependencyOrder(operations);
  }

  // --- Table creation ---

  /** Build all operations needed to create a brand new table (table + indexes + foreign keys + check constraints). */
  private buildNewTableOperations(table: TableDefinition): DdlOperation[] {
    return [
      this.buildCreateTableOp(table),
      ...table.indexes.map((idx) => this.buildCreateIndexOp(idx)),
      ...table.foreignKeys.map((fk) => this.buildAddForeignKeyOp(table.name, fk)),
    ];
  }

  /** Generate the CREATE TABLE DDL for a table definition. */
  private buildCreateTableOp(table: TableDefinition): DdlOperation {
    const columnClauses = table.columns.map((col) => this.columnToSql(col));

    const primaryKeyColumn = table.columns.find((c) => c.primaryKey);
    if (primaryKeyColumn) {
      columnClauses.push(`PRIMARY KEY (${primaryKeyColumn.name})`);
    }

    for (const chk of table.checkConstraints) {
      columnClauses.push(`CONSTRAINT "${chk.name}" CHECK (${chk.expression})`);
    }

    const sql = `CREATE TABLE "${table.name}" (\n  ${columnClauses.join(',\n  ')}\n)`;
    return {
      type: 'CREATE_TABLE',
      table: table.name,
      sql,
      destructive: false,
    };
  }

  // --- Table diffing (existing table vs desired) ---

  /** Compare an existing table against its desired definition and produce update operations. */
  private diffTable(desired: TableDefinition, actual: ActualTable): DdlOperation[] {
    const operations: DdlOperation[] = [];

    operations.push(...this.diffColumns(desired.name, desired.columns, actual.columns));
    operations.push(...this.diffIndexes(desired.name, desired.indexes, actual.indexes));
    operations.push(...this.diffForeignKeys(desired.name, desired.foreignKeys, actual.foreignKeys));
    operations.push(
      ...this.diffCheckConstraints(desired.name, desired.checkConstraints, actual.checkConstraints),
    );

    return operations;
  }

  /** Detect added columns, type changes, and orphaned columns. */
  private diffColumns(
    tableName: string,
    desiredColumns: ColumnDefinition[],
    actualColumns: ActualColumn[],
  ): DdlOperation[] {
    const operations: DdlOperation[] = [];
    const actualColumnsByName = new Map(actualColumns.map((c) => [c.name, c]));
    const desiredColumnNames = new Set(desiredColumns.map((c) => c.name));

    for (const desiredCol of desiredColumns) {
      const existingCol = actualColumnsByName.get(desiredCol.name);
      if (!existingCol) {
        operations.push(this.buildAddColumnOp(tableName, desiredCol));
      } else if (this.hasColumnTypeChanged(desiredCol, existingCol)) {
        operations.push(this.buildAlterColumnTypeOp(tableName, desiredCol));
      }
    }

    // Flag columns that exist in the DB but are no longer in the schema
    for (const existingCol of actualColumns) {
      if (!desiredColumnNames.has(existingCol.name)) {
        operations.push(this.warnOrphanedColumn(tableName, existingCol.name));
      }
    }

    return operations;
  }

  /** Detect indexes that need to be created. */
  private diffIndexes(
    tableName: string,
    desiredIndexes: IndexDefinition[],
    actualIndexes: ActualIndex[],
  ): DdlOperation[] {
    const existingIndexNames = new Set(actualIndexes.map((i) => i.name));

    return desiredIndexes
      .filter((idx) => !existingIndexNames.has(idx.name))
      .map((idx) => this.buildCreateIndexOp(idx));
  }

  /** Detect foreign keys that need to be added. */
  private diffForeignKeys(
    tableName: string,
    desiredForeignKeys: ForeignKeyDefinition[],
    actualForeignKeys: ActualForeignKey[],
  ): DdlOperation[] {
    const existingFkNames = new Set(actualForeignKeys.map((fk) => fk.name));

    return desiredForeignKeys
      .filter((fk) => !existingFkNames.has(fk.name))
      .map((fk) => this.buildAddForeignKeyOp(tableName, fk));
  }

  /** Detect CHECK constraints that need to be added. */
  private diffCheckConstraints(
    tableName: string,
    desiredConstraints: CheckConstraintDefinition[],
    actualConstraints: ActualCheckConstraint[],
  ): DdlOperation[] {
    const existingNames = new Set(actualConstraints.map((c) => c.name));

    return desiredConstraints
      .filter((chk) => !existingNames.has(chk.name))
      .map((chk) => this.buildAddCheckConstraintOp(tableName, chk));
  }

  // --- DDL operation builders ---

  /** Generate an ADD COLUMN operation. */
  private buildAddColumnOp(tableName: string, col: ColumnDefinition): DdlOperation {
    const colSql = this.columnToSql(col);
    const sql = `ALTER TABLE "${tableName}" ADD COLUMN ${colSql}`;
    return { type: 'ADD_COLUMN', table: tableName, sql, destructive: false };
  }

  /** Generate an ALTER COLUMN TYPE operation. */
  private buildAlterColumnTypeOp(tableName: string, col: ColumnDefinition): DdlOperation {
    const sql = `ALTER TABLE "${tableName}" ALTER COLUMN "${col.name}" TYPE ${col.type}`;
    return { type: 'ALTER_COLUMN_TYPE', table: tableName, sql, destructive: false };
  }

  /** Generate a CREATE INDEX operation. */
  private buildCreateIndexOp(idx: IndexDefinition): DdlOperation {
    const uniquePrefix = idx.unique ? 'UNIQUE ' : '';
    const quotedColumns = idx.columns.map((c) => `"${c}"`).join(', ');
    const whereClause = idx.where ? ` WHERE ${idx.where}` : '';
    const sql = `CREATE ${uniquePrefix}INDEX "${idx.name}" ON "${idx.table}" (${quotedColumns})${whereClause}`;
    return { type: 'CREATE_INDEX', table: idx.table, sql, destructive: false };
  }

  /** Generate an ADD FOREIGN KEY constraint operation. */
  private buildAddForeignKeyOp(tableName: string, fk: ForeignKeyDefinition): DdlOperation {
    const sql = `ALTER TABLE "${tableName}" ADD CONSTRAINT "${fk.name}" FOREIGN KEY ("${fk.column}") REFERENCES "${fk.referencedTable}" ("${fk.referencedColumn}")`;
    return { type: 'ADD_FOREIGN_KEY', table: tableName, sql, destructive: false };
  }

  /** Generate an ADD CHECK CONSTRAINT operation. */
  private buildAddCheckConstraintOp(
    tableName: string,
    chk: CheckConstraintDefinition,
  ): DdlOperation {
    const sql = `ALTER TABLE "${tableName}" ADD CONSTRAINT "${chk.name}" CHECK (${chk.expression})`;
    return { type: 'ADD_CHECK_CONSTRAINT', table: tableName, sql, destructive: false };
  }

  // --- Orphan warnings (destructive markers) ---

  /** Produce a warning operation for a table that exists in the DB but not in the schema. */
  private warnOrphanedTable(tableName: string): DdlOperation {
    return {
      type: 'DROP_TABLE',
      table: tableName,
      sql: `-- WARNING: Table "${tableName}" exists in database but not in schema (not dropped without --allow-destructive)`,
      destructive: true,
      detail: `Orphaned table: ${tableName}`,
    };
  }

  /** Produce a warning operation for a column that exists in the DB but not in the schema. */
  private warnOrphanedColumn(tableName: string, columnName: string): DdlOperation {
    return {
      type: 'DROP_COLUMN',
      table: tableName,
      sql: `-- WARNING: Column "${tableName}"."${columnName}" exists in database but not in schema (not dropped without --allow-destructive)`,
      destructive: true,
      detail: `Orphaned column: ${tableName}.${columnName}`,
    };
  }

  // --- SQL helpers ---

  /** Convert a column definition to its SQL fragment (e.g. `"name" TEXT NOT NULL DEFAULT 'x'`). */
  private columnToSql(col: ColumnDefinition): string {
    let sql = `"${col.name}" ${col.type}`;
    if (!col.nullable && !col.primaryKey) sql += ' NOT NULL';
    if (col.defaultValue !== undefined) sql += ` DEFAULT ${col.defaultValue}`;
    return sql;
  }

  /** Check whether the column type has changed (case-insensitive comparison). */
  private hasColumnTypeChanged(desired: ColumnDefinition, actual: ActualColumn): boolean {
    return desired.type.toUpperCase() !== actual.type.toUpperCase();
  }

  // --- Operation ordering ---

  /**
   * Sort operations so they execute in a safe dependency order:
   * 1. CREATE TABLE (tables must exist before columns/indexes reference them)
   * 2. ADD COLUMN
   * 3. ALTER COLUMN TYPE
   * 4. CREATE INDEX (columns must exist first)
   * 5. ADD FOREIGN KEY (referenced tables must exist first)
   * 6. ADD CHECK CONSTRAINT (columns must exist first)
   * 7. Destructive operations (always last, require explicit opt-in)
   */
  private sortByDependencyOrder(operations: DdlOperation[]): DdlOperation[] {
    const createTables: DdlOperation[] = [];
    const addColumns: DdlOperation[] = [];
    const alterColumns: DdlOperation[] = [];
    const createIndexes: DdlOperation[] = [];
    const addForeignKeys: DdlOperation[] = [];
    const addCheckConstraints: DdlOperation[] = [];
    const destructive: DdlOperation[] = [];

    for (const op of operations) {
      if (op.destructive) {
        destructive.push(op);
      } else {
        switch (op.type) {
          case 'CREATE_TABLE':
            createTables.push(op);
            break;
          case 'ADD_COLUMN':
            addColumns.push(op);
            break;
          case 'ALTER_COLUMN_TYPE':
            alterColumns.push(op);
            break;
          case 'CREATE_INDEX':
            createIndexes.push(op);
            break;
          case 'ADD_FOREIGN_KEY':
            addForeignKeys.push(op);
            break;
          case 'ADD_CHECK_CONSTRAINT':
            addCheckConstraints.push(op);
            break;
          default:
            addColumns.push(op);
        }
      }
    }

    return [
      ...createTables,
      ...addColumns,
      ...alterColumns,
      ...createIndexes,
      ...addForeignKeys,
      ...addCheckConstraints,
      ...destructive,
    ];
  }
}
