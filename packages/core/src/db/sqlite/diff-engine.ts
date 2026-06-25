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
} from '../types.js';

/**
 * SQLite-specific diff engine. Handles the limited ALTER TABLE support
 * by using table recreation when needed.
 */
export class SqliteDiffEngine {
  diff(desired: DesiredState, actual: ActualState): DdlOperation[] {
    const operations: DdlOperation[] = [];
    const actualTablesByName = new Map(actual.tables.map((t) => [t.name, t]));

    for (const desiredTable of desired.tables) {
      const existingTable = actualTablesByName.get(desiredTable.name);
      if (!existingTable) {
        operations.push(...this.buildNewTableOperations(desiredTable));
      } else {
        operations.push(...this.diffTable(desiredTable, existingTable));
      }
    }

    for (const existingTable of actual.tables) {
      const stillDesired = desired.tables.find((t) => t.name === existingTable.name);
      if (!stillDesired) {
        operations.push(this.warnOrphanedTable(existingTable.name));
      }
    }

    return this.sortByDependencyOrder(operations);
  }

  private buildNewTableOperations(table: TableDefinition): DdlOperation[] {
    return [
      this.buildCreateTableOp(table),
      ...table.indexes.map((idx) => this.buildCreateIndexOp(idx)),
    ];
  }

  private buildCreateTableOp(table: TableDefinition): DdlOperation {
    const columnClauses = table.columns.map((col) => this.columnToSql(col));

    const primaryKeyColumn = table.columns.find((c) => c.primaryKey);
    if (primaryKeyColumn) {
      columnClauses.push(`PRIMARY KEY ("${primaryKeyColumn.name}")`);
    }

    // Foreign keys are inline in SQLite CREATE TABLE
    for (const fk of table.foreignKeys) {
      columnClauses.push(
        `FOREIGN KEY ("${fk.column}") REFERENCES "${fk.referencedTable}" ("${fk.referencedColumn}")`,
      );
    }

    for (const chk of table.checkConstraints) {
      columnClauses.push(`CONSTRAINT "${chk.name}" CHECK (${chk.expression})`);
    }

    const ddl = `CREATE TABLE "${table.name}" (\n  ${columnClauses.join(',\n  ')}\n)`;
    return { type: 'CREATE_TABLE', table: table.name, sql: ddl, destructive: false };
  }

  private diffTable(desired: TableDefinition, actual: ActualTable): DdlOperation[] {
    const operations: DdlOperation[] = [];

    const columnOps = this.diffColumns(desired, actual);
    operations.push(...columnOps);

    operations.push(...this.diffIndexes(desired.name, desired.indexes, actual.indexes));

    return operations;
  }

  private diffColumns(desired: TableDefinition, actual: ActualTable): DdlOperation[] {
    const operations: DdlOperation[] = [];
    const actualColumnsByName = new Map(actual.columns.map((c) => [c.name, c]));
    const desiredColumnNames = new Set(desired.columns.map((c) => c.name));

    let needsRecreation = false;
    const newColumns: ColumnDefinition[] = [];

    for (const desiredCol of desired.columns) {
      const existingCol = actualColumnsByName.get(desiredCol.name);
      if (!existingCol) {
        // New column: if it's NOT NULL without a default, we need table recreation
        if (
          !desiredCol.nullable &&
          desiredCol.defaultValue === undefined &&
          !desiredCol.primaryKey
        ) {
          needsRecreation = true;
        } else {
          newColumns.push(desiredCol);
        }
      } else if (this.hasColumnTypeChanged(desiredCol, existingCol)) {
        needsRecreation = true;
      }
    }

    // Check for foreign key or check constraint changes that require recreation
    const actualFkCols = new Set(actual.foreignKeys.map((fk) => fk.column));
    for (const fk of desired.foreignKeys) {
      if (!actualFkCols.has(fk.column)) {
        needsRecreation = true;
        break;
      }
    }

    if (needsRecreation) {
      operations.push(this.buildRecreateTableOp(desired));
    } else {
      for (const col of newColumns) {
        operations.push(this.buildAddColumnOp(desired.name, col));
      }
    }

    // Flag orphaned columns
    for (const existingCol of actual.columns) {
      if (!desiredColumnNames.has(existingCol.name)) {
        operations.push(this.warnOrphanedColumn(desired.name, existingCol.name));
      }
    }

    return operations;
  }

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

  /**
   * Recreate table using SQLite's recommended pattern:
   * 1. CREATE TABLE _new_tablename with desired schema
   * 2. INSERT INTO _new_tablename SELECT shared columns FROM tablename
   * 3. DROP TABLE tablename
   * 4. ALTER TABLE _new_tablename RENAME TO tablename
   */
  private buildRecreateTableOp(desired: TableDefinition): DdlOperation {
    const tempName = `_new_${desired.name}`;
    const columnClauses = desired.columns.map((col) => this.columnToSql(col));

    const primaryKeyColumn = desired.columns.find((c) => c.primaryKey);
    if (primaryKeyColumn) {
      columnClauses.push(`PRIMARY KEY ("${primaryKeyColumn.name}")`);
    }

    for (const fk of desired.foreignKeys) {
      columnClauses.push(
        `FOREIGN KEY ("${fk.column}") REFERENCES "${fk.referencedTable}" ("${fk.referencedColumn}")`,
      );
    }

    for (const chk of desired.checkConstraints) {
      columnClauses.push(`CONSTRAINT "${chk.name}" CHECK (${chk.expression})`);
    }

    const sharedColumns = desired.columns.map((c) => `"${c.name}"`).join(', ');

    const statements = [
      `CREATE TABLE "${tempName}" (\n  ${columnClauses.join(',\n  ')}\n)`,
      `INSERT OR IGNORE INTO "${tempName}" (${sharedColumns}) SELECT ${sharedColumns} FROM "${desired.name}"`,
      `DROP TABLE "${desired.name}"`,
      `ALTER TABLE "${tempName}" RENAME TO "${desired.name}"`,
    ];

    const sql = statements.join(';\n');
    return { type: 'CREATE_TABLE', table: desired.name, sql, destructive: false };
  }

  private buildAddColumnOp(tableName: string, col: ColumnDefinition): DdlOperation {
    const colSql = this.columnToSql(col);
    const ddl = `ALTER TABLE "${tableName}" ADD COLUMN ${colSql}`;
    return { type: 'ADD_COLUMN', table: tableName, sql: ddl, destructive: false };
  }

  private buildCreateIndexOp(idx: IndexDefinition): DdlOperation {
    const uniquePrefix = idx.unique ? 'UNIQUE ' : '';
    const quotedColumns = idx.columns.map((c) => `"${c}"`).join(', ');
    const ddl = `CREATE ${uniquePrefix}INDEX "${idx.name}" ON "${idx.table}" (${quotedColumns})`;
    return { type: 'CREATE_INDEX', table: idx.table, sql: ddl, destructive: false };
  }

  private warnOrphanedTable(tableName: string): DdlOperation {
    return {
      type: 'DROP_TABLE',
      table: tableName,
      sql: `-- WARNING: Table "${tableName}" exists in database but not in schema`,
      destructive: true,
      detail: `Orphaned table: ${tableName}`,
    };
  }

  private warnOrphanedColumn(tableName: string, columnName: string): DdlOperation {
    return {
      type: 'DROP_COLUMN',
      table: tableName,
      sql: `-- WARNING: Column "${tableName}"."${columnName}" exists in database but not in schema`,
      destructive: true,
      detail: `Orphaned column: ${tableName}.${columnName}`,
    };
  }

  private columnToSql(col: ColumnDefinition): string {
    let ddl = `"${col.name}" ${col.type}`;
    if (!col.nullable && !col.primaryKey) ddl += ' NOT NULL';
    if (col.defaultValue !== undefined) ddl += ` DEFAULT ${col.defaultValue}`;
    return ddl;
  }

  private hasColumnTypeChanged(desired: ColumnDefinition, actual: ActualColumn): boolean {
    return desired.type.toUpperCase() !== actual.type.toUpperCase();
  }

  private sortByDependencyOrder(operations: DdlOperation[]): DdlOperation[] {
    const createTables: DdlOperation[] = [];
    const addColumns: DdlOperation[] = [];
    const createIndexes: DdlOperation[] = [];
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
          case 'CREATE_INDEX':
            createIndexes.push(op);
            break;
          default:
            addColumns.push(op);
        }
      }
    }

    return [...createTables, ...addColumns, ...createIndexes, ...destructive];
  }
}
