import { Kysely, PostgresDialect, SqliteDialect } from 'kysely';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import pg from 'pg';
import type { SchemaRegistry } from '../schema/registry.js';
import { modelToTableName } from './field-mapper.js';

export interface PostgresConfig {
  dialect?: 'postgres';
  host: string;
  port?: number;
  database: string;
  user: string;
  password: string;
  pool?: {
    min?: number;
    max?: number;
  };
}

export interface SqliteConfig {
  dialect: 'sqlite';
  path?: string;
}

export type DatabaseClientConfig = PostgresConfig | SqliteConfig;

export type Dialect = 'postgres' | 'sqlite';

function detectDialect(config: DatabaseClientConfig): Dialect {
  if ('host' in config && config.host) return 'postgres';
  return 'sqlite';
}

/**
 * Thin wrapper around Kysely that resolves qualified model names
 * (e.g. "sales.Invoice") to their underlying table names automatically.
 */
export class DatabaseClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly db: Kysely<any>;
  private readonly pool: pg.Pool | null = null;
  private readonly qualifiedNameToTable: Map<string, string>;
  private readonly _dialect: Dialect;

  constructor(config: DatabaseClientConfig, registry?: SchemaRegistry) {
    this._dialect = detectDialect(config);

    if (this._dialect === 'postgres') {
      const pgConfig = config as PostgresConfig;
      this.pool = this.createPool(pgConfig);
      this.db = new Kysely({ dialect: new PostgresDialect({ pool: this.pool }) });
    } else {
      const sqliteConfig = config as SqliteConfig;
      const Database = this.loadBetterSqlite3();
      const path = sqliteConfig.path ?? '.rangka/dev.db';
      mkdirSync(dirname(path), { recursive: true });
      const sqliteDb = new Database(path);
      this.configureSqlitePragmas(sqliteDb);
      this.db = new Kysely({ dialect: new SqliteDialect({ database: sqliteDb }) });
    }

    this.qualifiedNameToTable = this.buildTableNameMap(registry);
  }

  get dialect(): Dialect {
    return this._dialect;
  }

  /**
   * Verify the database connection is reachable.
   * Throws with actionable diagnostics if it cannot connect.
   */
  async verifyConnection(): Promise<void> {
    if (this._dialect === 'sqlite') {
      await this.db
        .selectFrom('sqlite_master' as never)
        .selectAll()
        .limit(0)
        .execute();
      return;
    }

    let client: pg.PoolClient | undefined;
    try {
      client = await this.pool!.connect();
      await client.query('SELECT 1');
    } catch (err: unknown) {
      const pgErr = err as { code?: string; message?: string };
      const detail = formatConnectionError(pgErr, this.pool!);
      throw new Error(`Database connection failed: ${detail}`, { cause: err });
    } finally {
      client?.release();
    }
  }

  // --- Query builders (resolve model name to table name automatically) ---

  selectFrom(model: string) {
    return this.db.selectFrom(this.resolveTable(model));
  }

  insertInto(model: string) {
    return this.db.insertInto(this.resolveTable(model));
  }

  updateTable(model: string) {
    return this.db.updateTable(this.resolveTable(model));
  }

  deleteFrom(model: string) {
    return this.db.deleteFrom(this.resolveTable(model));
  }

  /** Execute a callback within a database transaction. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async transaction<T>(callback: (trx: Kysely<any>) => Promise<T>): Promise<T> {
    return this.db.transaction().execute(callback);
  }

  /** Direct access to the underlying Kysely instance. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get kysely(): Kysely<any> {
    return this.db;
  }

  /** Close the connection pool and release resources. */
  async destroy(): Promise<void> {
    await this.db.destroy();
  }

  // --- Private helpers ---

  /** Maps a qualified model name to its table name, falling back to the raw input. */
  private resolveTable(nameOrQualified: string): string {
    return this.qualifiedNameToTable.get(nameOrQualified) ?? nameOrQualified;
  }

  /** Create the underlying pg connection pool. */
  private createPool(config: PostgresConfig): pg.Pool {
    return new pg.Pool({
      host: config.host,
      port: config.port ?? 5432,
      database: config.database,
      user: config.user,
      password: config.password,
      min: config.pool?.min ?? 2,
      max: config.pool?.max ?? 10,
    });
  }

  /** Load better-sqlite3 dynamically. Throws if not installed. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private loadBetterSqlite3(): any {
    try {
      const require = createRequire(import.meta.url);
      return require('better-sqlite3');
    } catch {
      throw new Error('SQLite support requires "better-sqlite3". Run: pnpm add better-sqlite3');
    }
  }

  /** Configure SQLite PRAGMAs for optimal dev usage. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private configureSqlitePragmas(db: any): void {
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    db.pragma('synchronous = NORMAL');
  }

  /** Pre-compute the mapping from qualified model names to SQL table names. */
  private buildTableNameMap(registry?: SchemaRegistry): Map<string, string> {
    const map = new Map<string, string>();
    if (registry) {
      for (const model of registry.getAllModels()) {
        map.set(model.qualifiedName, modelToTableName(model.qualifiedName));
      }
    }
    return map;
  }
}

function formatConnectionError(err: { code?: string; message?: string }, pool: pg.Pool): string {
  const opts = (pool as unknown as { options: pg.PoolConfig }).options;
  const host = opts.host ?? 'localhost';
  const port = opts.port ?? 5432;
  const database = opts.database ?? '(unknown)';

  switch (err.code) {
    case 'ECONNREFUSED':
      return (
        `Could not connect to PostgreSQL at ${host}:${port}. ` +
        `Is the server running and accepting connections?`
      );
    case 'ENOTFOUND':
      return `Host "${host}" not found. Check the database host configuration.`;
    case 'ETIMEDOUT':
      return (
        `Connection to ${host}:${port} timed out. ` +
        `Check network connectivity and firewall rules.`
      );
    case '3D000':
      return `Database "${database}" does not exist on ${host}:${port}.`;
    case '28P01':
      return `Authentication failed for user "${opts.user ?? '(unknown)'}". Check credentials.`;
    case '28000':
      return `Authorization failed for user "${opts.user ?? '(unknown)'}". Check pg_hba.conf or user permissions.`;
    default:
      return err.message ?? 'Unknown error';
  }
}
