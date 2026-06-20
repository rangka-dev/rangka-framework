import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { SchemaRegistry } from '../schema/registry.js';
import type { DdlOperation } from './types.js';
import { SchemaToDesired } from './desired-state.js';
import { DiffEngine } from './diff-engine.js';
import { introspect } from './introspect.js';

export interface AutoSyncOptions {
  allowDestructive?: boolean;
}

export interface AutoSyncResult {
  applied: DdlOperation[];
  warnings: DdlOperation[];
}

/**
 * Compares the desired schema (from the registry) against the actual database state
 * and applies any DDL operations needed to bring the database in sync.
 */
export async function autoSync(
  registry: SchemaRegistry,
  db: Kysely<unknown>,
  options: AutoSyncOptions = {},
): Promise<AutoSyncResult> {
  const desired = new SchemaToDesired().convert(registry);
  const actual = await introspect(db);
  const operations = new DiffEngine().diff(desired, actual);

  if (operations.length === 0) {
    console.log(`[rangka:sync] Schema is up to date`);
    return { applied: [], warnings: [] };
  }

  const applied: DdlOperation[] = [];
  const warnings: DdlOperation[] = [];

  for (const op of operations) {
    if (op.destructive) {
      await handleDestructiveOp(op, options, applied, warnings, db);
    } else {
      await applyOperation(op, db);
      applied.push(op);
    }
  }

  if (applied.length > 0) {
    console.log(`[rangka:sync] Applied ${applied.length} operation(s):`);
    for (const op of applied) {
      console.log(`  ${formatOperation(op)}`);
    }
  }

  if (warnings.length > 0) {
    console.warn(`[rangka:sync] ${warnings.length} skipped (destructive):`);
    for (const op of warnings) {
      console.warn(`  ${formatOperation(op)}`);
    }
  }

  return { applied, warnings };
}

/** Apply a non-destructive DDL operation. */
async function applyOperation(op: DdlOperation, db: Kysely<unknown>): Promise<void> {
  await sql.raw(op.sql).execute(db);
}

/**
 * Handle a destructive operation: apply it if allowed, otherwise log a warning.
 */
async function handleDestructiveOp(
  op: DdlOperation,
  options: AutoSyncOptions,
  applied: DdlOperation[],
  warnings: DdlOperation[],
  db: Kysely<unknown>,
): Promise<void> {
  if (options.allowDestructive) {
    const ddlSql = generateDestructiveSql(op);
    await sql.raw(ddlSql).execute(db);
    applied.push(op);
  } else {
    warnings.push(op);
  }
}

function formatOperation(op: DdlOperation): string {
  switch (op.type) {
    case 'CREATE_TABLE':
      return `+ table ${op.table}`;
    case 'ADD_COLUMN':
      return `+ column ${op.table}.${extractColumnFromSql(op.sql)}`;
    case 'ALTER_COLUMN_TYPE':
      return `~ column type ${op.table}.${extractColumnFromSql(op.sql)}`;
    case 'CREATE_INDEX':
      return `+ index on ${op.table}`;
    case 'ADD_FOREIGN_KEY':
      return `+ foreign key on ${op.table}`;
    case 'ADD_CHECK_CONSTRAINT':
      return `+ check constraint on ${op.table}`;
    case 'DROP_TABLE':
      return `- table ${op.table} (orphaned)`;
    case 'DROP_COLUMN':
      return `- column ${op.detail ?? op.table} (orphaned)`;
    default:
      return `${op.type} on ${op.table}`;
  }
}

function extractColumnFromSql(s: string): string {
  const match = s.match(/COLUMN "([^"]+)"/i) ?? s.match(/COLUMN\s+(\S+)/i);
  return match ? match[1] : 'unknown';
}

/** Generate the raw SQL for a destructive operation (DROP COLUMN / DROP TABLE). */
function generateDestructiveSql(op: DdlOperation): string {
  switch (op.type) {
    case 'DROP_COLUMN': {
      const match = op.detail?.match(/Orphaned column: (.+)\.(.+)/);
      if (match) return `ALTER TABLE "${match[1]}" DROP COLUMN "${match[2]}"`;
      return op.sql;
    }
    case 'DROP_TABLE': {
      const match = op.detail?.match(/Orphaned table: (.+)/);
      if (match) return `DROP TABLE "${match[1]}"`;
      return op.sql;
    }
    default:
      return op.sql;
  }
}
