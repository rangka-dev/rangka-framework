import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type {
  ActualState,
  ActualTable,
  ActualColumn,
  ActualForeignKey,
  ActualIndex,
  ActualCheckConstraint,
} from './types.js';

// ─── Public Entry Point ──────────────────────────────────────────────────────

/**
 * Introspects the current database schema by querying PostgreSQL system catalogs.
 * Returns the actual state of all public tables, columns, foreign keys, indexes,
 * and check constraints.
 */
export async function introspect(db: Kysely<unknown>): Promise<ActualState> {
  const tables = await introspectTables(db);
  return { tables };
}

// ─── Table Discovery ─────────────────────────────────────────────────────────

/** Fetches all base tables in the public schema and introspects each one. */
async function introspectTables(db: Kysely<unknown>): Promise<ActualTable[]> {
  const { rows: tableRows } = await sql<{ table_name: string }>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `.execute(db);

  const tables: ActualTable[] = [];

  for (const row of tableRows) {
    const columns = await introspectColumns(db, row.table_name);
    const foreignKeys = await introspectForeignKeys(db, row.table_name);
    const indexes = await introspectIndexes(db, row.table_name);
    const checkConstraints = await introspectCheckConstraints(db, row.table_name);

    tables.push({
      name: row.table_name,
      columns,
      foreignKeys,
      indexes,
      checkConstraints,
    });
  }

  return tables;
}

// ─── Column Introspection ────────────────────────────────────────────────────

interface ColumnRow {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
  udt_name: string;
}

/** Reads column metadata from information_schema for a given table. */
async function introspectColumns(db: Kysely<unknown>, tableName: string): Promise<ActualColumn[]> {
  const { rows: columnRows } = await sql<ColumnRow>`
    SELECT column_name, data_type, is_nullable, column_default,
           character_maximum_length, numeric_precision, numeric_scale, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName}
    ORDER BY ordinal_position
  `.execute(db);

  return columnRows.map((row) => ({
    name: row.column_name,
    type: normalizeType(row),
    nullable: row.is_nullable === 'YES',
    defaultValue: normalizeDefault(row.column_default),
  }));
}

// ─── Foreign Key Introspection ───────────────────────────────────────────────

interface ForeignKeyRow {
  name: string;
  column_name: string;
  referenced_table: string;
  referenced_column: string;
}

/** Reads foreign key relationships for a given table. */
async function introspectForeignKeys(
  db: Kysely<unknown>,
  tableName: string,
): Promise<ActualForeignKey[]> {
  const { rows: foreignKeyRows } = await sql<ForeignKeyRow>`
    SELECT tc.constraint_name AS name,
           kcu.column_name AS column_name,
           ccu.table_name AS referenced_table,
           ccu.column_name AS referenced_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = ${tableName}
      AND tc.table_schema = 'public'
  `.execute(db);

  return foreignKeyRows.map((row) => ({
    name: row.name,
    column: row.column_name,
    referencedTable: row.referenced_table,
    referencedColumn: row.referenced_column,
  }));
}

// ─── Index Introspection ─────────────────────────────────────────────────────

interface IndexRow {
  indexname: string;
  indexdef: string;
}

/** Reads non-primary-key indexes for a given table from pg_indexes. */
async function introspectIndexes(db: Kysely<unknown>, tableName: string): Promise<ActualIndex[]> {
  const { rows: indexRows } = await sql<IndexRow>`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = ${tableName}
  `.execute(db);

  // Filter out primary key indexes (they're implicit, not user-defined)
  return indexRows
    .filter((row) => !row.indexname.endsWith('_pkey'))
    .map((row) => ({
      name: row.indexname,
      columns: parseIndexColumns(row.indexdef),
      unique: row.indexdef.toUpperCase().includes('UNIQUE'),
    }));
}

// ─── Check Constraint Introspection ──────────────────────────────────────────

interface CheckConstraintRow {
  name: string;
  expression: string;
}

/** Reads check constraints for a given table, excluding NOT NULL constraints. */
async function introspectCheckConstraints(
  db: Kysely<unknown>,
  tableName: string,
): Promise<ActualCheckConstraint[]> {
  const { rows: constraintRows } = await sql<CheckConstraintRow>`
    SELECT tc.constraint_name AS name,
           cc.check_clause AS expression
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON cc.constraint_name = tc.constraint_name AND cc.constraint_schema = tc.constraint_schema
    WHERE tc.constraint_type = 'CHECK'
      AND tc.table_name = ${tableName}
      AND tc.table_schema = 'public'
  `.execute(db);

  // NOT NULL constraints show up as check constraints; filter them out
  return constraintRows
    .filter((row) => !row.name.endsWith('_not_null'))
    .map((row) => ({
      name: row.name,
      column: extractColumnFromCheck(row.expression),
      expression: row.expression,
    }));
}

// ─── Type Normalization Helpers ──────────────────────────────────────────────

/**
 * Converts a PostgreSQL data_type (from information_schema) into a canonical
 * uppercase SQL type string used for schema comparison.
 */
function normalizeType(row: ColumnRow): string {
  const dataType = row.data_type.toLowerCase();

  switch (dataType) {
    case 'character varying':
      return `VARCHAR(${row.character_maximum_length ?? 255})`;
    case 'character':
      return `CHAR(${row.character_maximum_length ?? 1})`;
    case 'integer':
      return 'INTEGER';
    case 'bigint':
      return 'BIGINT';
    case 'smallint':
      return 'SMALLINT';
    case 'numeric':
      return `DECIMAL(${row.numeric_precision ?? 18},${row.numeric_scale ?? 6})`;
    case 'boolean':
      return 'BOOLEAN';
    case 'text':
      return 'TEXT';
    case 'date':
      return 'DATE';
    case 'timestamp with time zone':
      return 'TIMESTAMPTZ';
    case 'timestamp without time zone':
      return 'TIMESTAMP';
    case 'jsonb':
      return 'JSONB';
    case 'json':
      return 'JSON';
    case 'uuid':
      return 'UUID';
    case 'user-defined':
      return row.udt_name.toUpperCase();
    default:
      return dataType.toUpperCase();
  }
}

/**
 * Cleans up a column_default value from information_schema:
 * - Strips sequence references (nextval) since auto-increment is handled separately
 * - Removes PostgreSQL type cast suffixes (e.g., 'value'::text -> 'value')
 * - Normalizes boolean literals to uppercase
 */
function normalizeDefault(rawDefault: string | null): string | null {
  if (rawDefault === null) return null;

  // Auto-increment columns use nextval(); treat them as having no explicit default
  if (rawDefault.startsWith('nextval(')) return null;

  // Strip type cast suffix: 'some_value'::character varying -> 'some_value'
  const castMatch = rawDefault.match(/^'([^']*)'::[\w\s]+$/);
  if (castMatch) return `'${castMatch[1]}'`;

  // Normalize boolean literals to uppercase for consistent comparison
  if (rawDefault === 'true') return 'TRUE';
  if (rawDefault === 'false') return 'FALSE';

  return rawDefault;
}

// ─── Index/Constraint Parsing Helpers ────────────────────────────────────────

/**
 * Extracts column names from a CREATE INDEX definition string.
 * Example: "CREATE INDEX idx ON tbl (col1, col2)" -> ["col1", "col2"]
 */
function parseIndexColumns(indexDefinition: string): string[] {
  const match = indexDefinition.match(/\(([^)]+)\)/);
  if (!match) return [];
  return match[1].split(',').map((col) => col.trim().replace(/"/g, ''));
}

/**
 * Extracts the first column name referenced in a CHECK constraint expression.
 * Example: "(age > 0)" -> "age"
 */
function extractColumnFromCheck(expression: string): string {
  const match = expression.match(/^\(?(\w+)/);
  return match ? match[1] : '';
}
