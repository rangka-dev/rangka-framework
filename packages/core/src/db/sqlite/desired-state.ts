import type { SchemaRegistry } from '../../schema/registry.js';
import type { DesiredState, TableDefinition } from '../types.js';
import { SchemaToDesired } from '../desired-state.js';
import { mapTableToSqlite } from './field-mapper.js';

/**
 * Builds the desired state for SQLite by converting the PostgreSQL-oriented
 * desired state into SQLite-compatible types.
 */
export function buildSqliteDesiredState(registry: SchemaRegistry): DesiredState {
  const pgDesired = new SchemaToDesired().convert(registry, 'sqlite');

  const tables: TableDefinition[] = pgDesired.tables.map(mapTableToSqlite);

  return { tables };
}
