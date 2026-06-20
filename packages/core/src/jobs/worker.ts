import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { FrameworkContext } from '@rangka/shared';
import type { JobRegistry } from './registry.js';
import type { JobRecord, BackoffStrategy, JobWorkerConfig } from './types.js';
import { toCount } from '../helpers/coerce.js';

const MAX_BACKOFF_MS = 600_000; // 10 minutes
const BATCH_SIZE = 10;

/**
 * Polls the database for pending jobs, claims them, and executes their handlers.
 * Supports concurrency limits, retry with backoff, and graceful shutdown.
 */
export class JobWorker {
  private running = false;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private activeJobIds = new Set<string>();
  private readonly pollInterval: number;
  private readonly db: Kysely<unknown>;
  private readonly registry: JobRegistry;
  private readonly ctx: FrameworkContext;
  private shutdownResolve: (() => void) | null = null;

  constructor(
    db: Kysely<unknown>,
    registry: JobRegistry,
    ctx: FrameworkContext,
    config: JobWorkerConfig = {},
  ) {
    this.db = db;
    this.registry = registry;
    this.ctx = ctx;
    this.pollInterval = config.pollInterval ?? 2000;
  }

  /** Begin polling for jobs. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.poll();
  }

  /** Stop polling and wait for in-flight jobs to finish. */
  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    // If jobs are still executing, return a promise that resolves when they drain.
    if (this.activeJobIds.size > 0) {
      return new Promise<void>((resolve) => {
        this.shutdownResolve = resolve;
      });
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  getInFlightCount(): number {
    return this.activeJobIds.size;
  }

  // ---------------------------------------------------------------------------
  // Polling loop
  // ---------------------------------------------------------------------------

  /** Single poll iteration: claim a batch of jobs, execute them, then schedule the next poll. */
  private poll(): void {
    if (!this.running) return;

    this.claimAndExecute().finally(() => {
      if (this.running) {
        this.pollTimer = setTimeout(() => this.poll(), this.pollInterval);
      }
    });
  }

  /** Claim available jobs from the database and run them concurrently. */
  private async claimAndExecute(): Promise<void> {
    const jobs = await this.claimJobs();
    await Promise.allSettled(jobs.map((job) => this.executeJob(job)));
  }

  // ---------------------------------------------------------------------------
  // Job claiming
  // ---------------------------------------------------------------------------

  /**
   * Fetch pending jobs that this worker can handle, respecting concurrency limits.
   * Uses SELECT FOR UPDATE SKIP LOCKED to allow multiple workers without conflicts.
   */
  private async claimJobs(): Promise<JobRecord[]> {
    const registeredNames = this.registry.getAll().map((entry) => entry.name);
    if (registeredNames.length === 0) return [];

    const pendingJobs = await this.fetchPendingJobs(registeredNames);
    return this.claimWithConcurrencyCheck(pendingJobs);
  }

  /** Query the database for jobs that are ready to run. */
  private async fetchPendingJobs(jobNames: string[]): Promise<JobRecord[]> {
    const namePlaceholders = jobNames.map((name) => `'${name}'`).join(', ');

    const result = await sql<JobRecord>`
      SELECT * FROM rangka_jobs
      WHERE state = 'created'
        AND name IN (${sql.raw(namePlaceholders)})
        AND (start_after IS NULL OR start_after <= NOW())
      ORDER BY created_at ASC
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    `.execute(this.db);

    return result.rows;
  }

  /** Filter jobs by concurrency limits and mark them as active. */
  private async claimWithConcurrencyCheck(pendingJobs: JobRecord[]): Promise<JobRecord[]> {
    const claimed: JobRecord[] = [];

    for (const job of pendingJobs) {
      const registration = this.registry.get(job.name);
      if (!registration) continue;

      if (await this.exceedsConcurrencyLimit(job.name, registration.config.concurrency)) {
        continue;
      }

      await sql`
        UPDATE rangka_jobs SET state = 'active', started_at = NOW()
        WHERE id = ${job.id}
      `.execute(this.db);

      claimed.push({ ...job, state: 'active' });
    }

    return claimed;
  }

  /** Returns true if the job type already has too many active instances. */
  private async exceedsConcurrencyLimit(
    jobName: string,
    maxConcurrency: number | undefined,
  ): Promise<boolean> {
    const limit = maxConcurrency ?? Infinity;
    if (limit === Infinity) return false;

    const activeCount = await this.getActiveCount(jobName);
    return activeCount >= limit;
  }

  private async getActiveCount(jobName: string): Promise<number> {
    const result = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM rangka_jobs
      WHERE name = ${jobName} AND state = 'active'
    `.execute(this.db);

    return toCount(result.rows[0]);
  }

  // ---------------------------------------------------------------------------
  // Job execution
  // ---------------------------------------------------------------------------

  /** Run a single job's handler, then mark it completed or handle failure. */
  private async executeJob(job: JobRecord): Promise<void> {
    const registration = this.registry.get(job.name);
    if (!registration) return;

    this.activeJobIds.add(job.id);

    try {
      await registration.config.handler(job.data, this.ctx);
      await this.markCompleted(job.id);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await this.handleFailure(job, errorMessage);
    } finally {
      this.activeJobIds.delete(job.id);
      this.resolveShutdownIfDrained();
    }
  }

  /** If the worker is stopping and no jobs remain in flight, signal completion. */
  private resolveShutdownIfDrained(): void {
    if (!this.running && this.activeJobIds.size === 0 && this.shutdownResolve) {
      this.shutdownResolve();
      this.shutdownResolve = null;
    }
  }

  private async markCompleted(jobId: string): Promise<void> {
    await sql`
      UPDATE rangka_jobs SET state = 'completed', completed_at = NOW()
      WHERE id = ${jobId}
    `.execute(this.db);
  }

  // ---------------------------------------------------------------------------
  // Failure handling and retries
  // ---------------------------------------------------------------------------

  /** Either schedule a retry (with backoff) or move the job to the dead-letter table. */
  private async handleFailure(job: JobRecord, error: string): Promise<void> {
    const attemptNumber = job.retry_count + 1;

    if (attemptNumber > job.max_retries) {
      await this.moveToDeadLetter(job, error);
    } else {
      await this.scheduleRetry(job, attemptNumber, error);
    }
  }

  /** Reset the job to 'created' with a delayed start_after timestamp. */
  private async scheduleRetry(job: JobRecord, attemptNumber: number, error: string): Promise<void> {
    const delayMs = this.computeBackoffDelay(job.backoff, attemptNumber);
    const retryAfter = new Date(Date.now() + delayMs);

    await sql`
      UPDATE rangka_jobs
      SET state = 'created',
          retry_count = ${attemptNumber},
          failed_at = NOW(),
          error = ${error},
          start_after = ${retryAfter}
      WHERE id = ${job.id}
    `.execute(this.db);
  }

  /** Permanently fail the job: archive it to dead letters and mark it failed. */
  private async moveToDeadLetter(job: JobRecord, error: string): Promise<void> {
    await sql`
      INSERT INTO rangka_dead_letters (job_id, name, data, error, retry_count, failed_at)
      VALUES (
        ${job.id},
        ${job.name},
        ${JSON.stringify(job.data)}::jsonb,
        ${error},
        ${job.retry_count + 1},
        NOW()
      )
    `.execute(this.db);

    await sql`
      UPDATE rangka_jobs SET state = 'failed', failed_at = NOW(), error = ${error}
      WHERE id = ${job.id}
    `.execute(this.db);
  }

  /** Calculate how long to wait before the next retry attempt. */
  private computeBackoffDelay(backoff: BackoffStrategy, retryCount: number): number {
    switch (backoff) {
      case 'exponential': {
        const delayMs = 1000 * Math.pow(2, retryCount);
        return Math.min(delayMs, MAX_BACKOFF_MS);
      }
      case 'linear':
        return 10_000 * retryCount;
      case 'fixed':
        return 5000;
      default:
        return 1000 * Math.pow(2, retryCount);
    }
  }
}
