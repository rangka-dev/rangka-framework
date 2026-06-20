import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { EnqueueOptions, BackoffStrategy } from './types.js';

export interface EnqueueParams {
  name: string;
  data?: unknown;
  options?: EnqueueOptions;
}

/**
 * Insert a job row into rangka_jobs and return its ID.
 * If `unique` is set, deduplicates against active/created jobs with the same key.
 */
export async function enqueue(
  db: Kysely<unknown>,
  name: string,
  data: unknown = null,
  options: EnqueueOptions = {},
): Promise<string> {
  const maxRetries = options.retries ?? 0;
  const backoff: BackoffStrategy = options.backoff ?? 'exponential';
  const startAfter = options.delay ? new Date(Date.now() + options.delay) : null;
  const uniqueKey = options.unique ? (options.uniqueKey ?? name) : null;

  if (uniqueKey) {
    return insertUniqueJob(db, name, data, maxRetries, backoff, startAfter, uniqueKey);
  }

  return insertJob(db, name, data, maxRetries, backoff, startAfter);
}

/** Insert a job with a unique_key constraint — returns the existing job ID if a duplicate exists. */
async function insertUniqueJob(
  db: Kysely<unknown>,
  name: string,
  data: unknown,
  maxRetries: number,
  backoff: BackoffStrategy,
  startAfter: Date | null,
  uniqueKey: string,
): Promise<string> {
  const result = await sql<{ id: string }>`
    INSERT INTO rangka_jobs (name, data, state, max_retries, backoff, start_after, unique_key)
    VALUES (
      ${name},
      ${JSON.stringify(data)}::jsonb,
      'created',
      ${maxRetries},
      ${backoff},
      ${startAfter},
      ${uniqueKey}
    )
    ON CONFLICT (unique_key) WHERE state IN ('created', 'active')
    DO NOTHING
    RETURNING id
  `.execute(db);

  // If insert was skipped due to conflict, look up the existing job's ID
  if (result.rows.length === 0) {
    const existing = await sql<{ id: string }>`
      SELECT id FROM rangka_jobs WHERE unique_key = ${uniqueKey} AND state IN ('created', 'active') LIMIT 1
    `.execute(db);
    return existing.rows[0]?.id ?? '';
  }

  return result.rows[0].id;
}

/** Insert a standard (non-unique) job row. */
async function insertJob(
  db: Kysely<unknown>,
  name: string,
  data: unknown,
  maxRetries: number,
  backoff: BackoffStrategy,
  startAfter: Date | null,
): Promise<string> {
  const result = await sql<{ id: string }>`
    INSERT INTO rangka_jobs (name, data, state, max_retries, backoff, start_after)
    VALUES (
      ${name},
      ${JSON.stringify(data)}::jsonb,
      'created',
      ${maxRetries},
      ${backoff},
      ${startAfter}
    )
    RETURNING id
  `.execute(db);

  return result.rows[0].id;
}
