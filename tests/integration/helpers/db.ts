import { Kysely, PostgresDialect, sql } from 'kysely';
import pg from 'pg';

const { Pool } = pg;

const TEST_DB_CONFIG = {
  host: process.env.RANGKA_DB_HOST ?? 'localhost',
  port: Number(process.env.RANGKA_DB_PORT ?? 5433),
  database: process.env.RANGKA_DB_NAME ?? 'rangka_test',
  user: process.env.RANGKA_DB_USER ?? 'rangka',
  password: process.env.RANGKA_DB_PASSWORD ?? 'rangka',
};

export function createTestDb(): Kysely<unknown> {
  return new Kysely({
    dialect: new PostgresDialect({
      pool: new Pool(TEST_DB_CONFIG),
    }),
  });
}

export async function resetDatabase(db: Kysely<unknown>): Promise<void> {
  await sql`DROP SCHEMA public CASCADE`.execute(db);
  await sql`CREATE SCHEMA public`.execute(db);
}

export function getTestDatabaseConfig() {
  return TEST_DB_CONFIG;
}
