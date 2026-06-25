import type { ColumnDefinition, TableDefinition } from '../types.js';

/**
 * Maps PostgreSQL-oriented column types to SQLite-compatible equivalents.
 * Used by the SQLite desired-state builder to generate valid DDL.
 */
export function mapColumnTypeToSqlite(pgType: string): string {
  const upper = pgType.toUpperCase();

  if (upper === 'UUID') return 'TEXT';
  if (upper === 'BOOLEAN') return 'INTEGER';
  if (upper === 'JSONB' || upper === 'JSON') return 'TEXT';
  if (upper === 'TEXT') return 'TEXT';
  if (upper === 'DATE') return 'TEXT';
  if (upper === 'TIMESTAMPTZ' || upper === 'TIMESTAMP') return 'TEXT';
  if (upper === 'INTEGER' || upper === 'BIGINT' || upper === 'SMALLINT') return 'INTEGER';
  if (upper === 'DOUBLE PRECISION') return 'REAL';
  if (upper.startsWith('VARCHAR')) return 'TEXT';
  if (upper.startsWith('CHAR')) return 'TEXT';
  if (upper.startsWith('DECIMAL') || upper.startsWith('NUMERIC')) return 'REAL';
  if (upper === 'REAL') return 'REAL';
  if (upper === 'INTERVAL') return 'TEXT';

  return 'TEXT';
}

/**
 * Convert a table definition's column types from PostgreSQL to SQLite.
 * Also strips PostgreSQL-specific defaults like gen_random_uuid() and NOW().
 */
export function mapTableToSqlite(table: TableDefinition): TableDefinition {
  return {
    ...table,
    columns: table.columns.map(mapColumnToSqlite),
  };
}

function mapColumnToSqlite(col: ColumnDefinition): ColumnDefinition {
  const sqliteType = mapColumnTypeToSqlite(col.type);
  let defaultValue = col.defaultValue;

  // Strip PostgreSQL-specific defaults
  if (defaultValue === 'gen_random_uuid()') defaultValue = undefined;
  if (defaultValue === 'NOW()') defaultValue = undefined;
  // Convert interval defaults to plain text
  if (defaultValue?.startsWith("'") && col.type.toUpperCase() === 'INTERVAL') {
    defaultValue = undefined;
  }

  return {
    ...col,
    type: sqliteType,
    defaultValue,
  };
}
