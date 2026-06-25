import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type {
  ActualState,
  ActualTable,
  ActualColumn,
  ActualForeignKey,
  ActualIndex,
  ActualCheckConstraint,
} from '../types.js';

/**
 * Introspects the current SQLite database schema using PRAGMAs and sqlite_master.
 * Returns the same ActualState interface as the PostgreSQL introspection.
 */
export async function introspectSqlite(db: Kysely<unknown>): Promise<ActualState> {
  const tables = await introspectTables(db);
  return { tables };
}

async function introspectTables(db: Kysely<unknown>): Promise<ActualTable[]> {
  const { rows: tableRows } = await sql<{ name: string }>`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  `.execute(db);

  const tables: ActualTable[] = [];

  for (const row of tableRows) {
    const columns = await introspectColumns(db, row.name);
    const foreignKeys = await introspectForeignKeys(db, row.name);
    const indexes = await introspectIndexes(db, row.name);
    const checkConstraints = await introspectCheckConstraints(db, row.name);

    tables.push({
      name: row.name,
      columns,
      foreignKeys,
      indexes,
      checkConstraints,
    });
  }

  return tables;
}

interface PragmaColumnRow {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

async function introspectColumns(db: Kysely<unknown>, tableName: string): Promise<ActualColumn[]> {
  const { rows } =
    await sql<PragmaColumnRow>`PRAGMA table_info(${sql.raw(`"${tableName}"`)})`.execute(db);

  return rows.map((row) => ({
    name: row.name,
    type: normalizeType(row.type),
    nullable: row.notnull === 0 && row.pk === 0,
    defaultValue: normalizeDefault(row.dflt_value),
  }));
}

interface PragmaForeignKeyRow {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
}

async function introspectForeignKeys(
  db: Kysely<unknown>,
  tableName: string,
): Promise<ActualForeignKey[]> {
  const { rows } =
    await sql<PragmaForeignKeyRow>`PRAGMA foreign_key_list(${sql.raw(`"${tableName}"`)})`.execute(
      db,
    );

  return rows.map((row) => ({
    name: `fk_${tableName}_${row.from}`,
    column: row.from,
    referencedTable: row.table,
    referencedColumn: row.to,
  }));
}

interface PragmaIndexListRow {
  seq: number;
  name: string;
  unique: number;
  origin: string;
}

interface PragmaIndexInfoRow {
  seqno: number;
  cid: number;
  name: string;
}

async function introspectIndexes(db: Kysely<unknown>, tableName: string): Promise<ActualIndex[]> {
  const { rows: indexList } =
    await sql<PragmaIndexListRow>`PRAGMA index_list(${sql.raw(`"${tableName}"`)})`.execute(db);

  const indexes: ActualIndex[] = [];

  for (const idx of indexList) {
    // Skip auto-generated indexes (primary keys, autoindex)
    if (idx.origin === 'pk') continue;

    const { rows: indexInfo } =
      await sql<PragmaIndexInfoRow>`PRAGMA index_info(${sql.raw(`"${idx.name}"`)})`.execute(db);

    indexes.push({
      name: idx.name,
      columns: indexInfo.map((row) => row.name),
      unique: idx.unique === 1,
    });
  }

  return indexes;
}

async function introspectCheckConstraints(
  db: Kysely<unknown>,
  tableName: string,
): Promise<ActualCheckConstraint[]> {
  // SQLite stores CHECK constraints in the CREATE TABLE SQL.
  // Parse them from sqlite_master.
  const { rows } = await sql<{ sql: string | null }>`
    SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ${tableName}
  `.execute(db);

  if (!rows[0]?.sql) return [];

  return parseCheckConstraints(rows[0].sql, tableName);
}

function parseCheckConstraints(createSql: string, tableName: string): ActualCheckConstraint[] {
  const constraints: ActualCheckConstraint[] = [];

  // Match CONSTRAINT "name" CHECK (expression) patterns
  const namedPattern = /CONSTRAINT\s+"([^"]+)"\s+CHECK\s*\(([^)]+)\)/gi;
  let match: RegExpExecArray | null;

  while ((match = namedPattern.exec(createSql)) !== null) {
    const name = match[1];
    const expression = match[2].trim();
    const column = extractColumnFromCheck(expression);
    constraints.push({ name, column, expression });
  }

  // Match inline CHECK (expression) without CONSTRAINT keyword
  const inlinePattern = /(?<!CONSTRAINT\s+"[^"]+"\s+)CHECK\s*\(([^)]+)\)/gi;
  while ((match = inlinePattern.exec(createSql)) !== null) {
    const expression = match[1].trim();
    // Skip if this was already captured by the named pattern
    if (constraints.some((c) => c.expression === expression)) continue;
    const column = extractColumnFromCheck(expression);
    const name = `chk_${tableName}_${column}`;
    constraints.push({ name, column, expression });
  }

  return constraints;
}

function normalizeType(rawType: string): string {
  const upper = rawType.toUpperCase().trim();
  if (!upper) return 'TEXT';
  return upper;
}

function normalizeDefault(rawDefault: string | null): string | null {
  if (rawDefault === null) return null;
  return rawDefault;
}

function extractColumnFromCheck(expression: string): string {
  const match = expression.match(/^\(?(\w+)/);
  return match ? match[1] : '';
}
