import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { JobRegistry } from './registry.js';
import { toCount } from '../helpers/coerce.js';

/**
 * ScheduleManager polls the database for cron-scheduled jobs that are due,
 * enqueues them, and advances their next_run_at timestamps.
 */
export class ScheduleManager {
  private running = false;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly pollInterval: number;
  private readonly db: Kysely<unknown>;
  private readonly registry: JobRegistry;

  constructor(db: Kysely<unknown>, registry: JobRegistry, pollInterval = 60000) {
    this.db = db;
    this.registry = registry;
    this.pollInterval = pollInterval;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Upserts all registered scheduled jobs into the database. */
  async syncSchedules(): Promise<void> {
    const scheduledJobs = this.registry.getScheduled();

    for (const job of scheduledJobs) {
      const cronExpr = job.config.schedule!;
      const nextRun = this.computeNextRun(cronExpr);

      await sql`
        INSERT INTO rangka_scheduled_jobs (name, cron, data, next_run_at)
        VALUES (${job.name}, ${cronExpr}, NULL, ${nextRun})
        ON CONFLICT (name) DO UPDATE SET cron = ${cronExpr}, next_run_at = COALESCE(rangka_scheduled_jobs.next_run_at, ${nextRun})
      `.execute(this.db);
    }
  }

  /** Starts the polling loop. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.schedulePoll();
  }

  /** Stops the polling loop. */
  async stop(): Promise<void> {
    this.running = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  /**
   * Parses a 5-field cron expression and returns the next matching minute
   * after `from`. Scans up to ~1 year of minutes before giving up.
   */
  computeNextRun(cronExpr: string, from: Date = new Date()): Date {
    const fields = cronExpr.trim().split(/\s+/);
    if (fields.length !== 5) {
      throw new Error(`Invalid cron expression: "${cronExpr}"`);
    }

    const [minuteExpr, hourExpr, dayOfMonthExpr, monthExpr, dayOfWeekExpr] = fields;

    // Start scanning from the next whole minute after `from`
    const candidate = new Date(from.getTime());
    candidate.setSeconds(0, 0);
    candidate.setMinutes(candidate.getMinutes() + 1);

    const ONE_YEAR_IN_MINUTES = 525_960;

    for (let i = 0; i < ONE_YEAR_IN_MINUTES; i++) {
      const matchesAllFields =
        this.matchesCronField(minuteExpr, candidate.getMinutes(), 0, 59) &&
        this.matchesCronField(hourExpr, candidate.getHours(), 0, 23) &&
        this.matchesCronField(dayOfMonthExpr, candidate.getDate(), 1, 31) &&
        this.matchesCronField(monthExpr, candidate.getMonth() + 1, 1, 12) &&
        this.matchesCronField(dayOfWeekExpr, candidate.getDay(), 0, 6);

      if (matchesAllFields) {
        return candidate;
      }

      candidate.setMinutes(candidate.getMinutes() + 1);
    }

    throw new Error(`Could not compute next run for cron: "${cronExpr}"`);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /** Arms the next poll timer. */
  private schedulePoll(): void {
    this.pollTimer = setTimeout(() => this.poll(), this.pollInterval);
  }

  /** Runs one poll cycle, then re-arms the timer if still running. */
  private poll(): void {
    if (!this.running) return;

    this.checkSchedules().finally(() => {
      if (this.running) {
        this.schedulePoll();
      }
    });
  }

  /**
   * Finds all schedules that are due and processes each one:
   * - Skips enqueuing if the job already has a pending/active instance.
   * - Otherwise enqueues a new job instance.
   * In both cases, advances the schedule's next_run_at.
   */
  private async checkSchedules(): Promise<void> {
    const dueSchedules = await sql<{ id: string; name: string; cron: string; data: unknown }>`
      SELECT id, name, cron, data FROM rangka_scheduled_jobs
      WHERE next_run_at <= NOW()
      FOR UPDATE SKIP LOCKED
    `.execute(this.db);

    for (const schedule of dueSchedules.rows) {
      const alreadyPending = await this.hasPendingJob(schedule.name);

      if (!alreadyPending) {
        await this.enqueueJob(schedule.name, schedule.data);
      }

      await this.advanceSchedule(schedule.id, schedule.cron);
    }
  }

  /** Inserts a new job instance into the jobs table. */
  private async enqueueJob(name: string, data: unknown): Promise<void> {
    await sql`
      INSERT INTO rangka_jobs (name, data, state, max_retries, backoff)
      VALUES (${name}, ${JSON.stringify(data)}::jsonb, 'created', 0, 'exponential')
    `.execute(this.db);
  }

  /** Updates a schedule's next_run_at and records last_run_at. */
  private async advanceSchedule(scheduleId: string, cronExpr: string): Promise<void> {
    const nextRun = this.computeNextRun(cronExpr);
    await sql`
      UPDATE rangka_scheduled_jobs
      SET next_run_at = ${nextRun}, last_run_at = NOW()
      WHERE id = ${scheduleId}
    `.execute(this.db);
  }

  /** Returns true if a job with the given name is already created or active. */
  private async hasPendingJob(name: string): Promise<boolean> {
    const result = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM rangka_jobs
      WHERE name = ${name} AND state IN ('created', 'active')
    `.execute(this.db);
    return toCount(result.rows[0]) > 0;
  }

  /**
   * Checks whether a single cron field expression matches the given value.
   * Supports: wildcard (*), lists (1,5,10), ranges (1-5), and steps (star/5, 1-10/2).
   */
  private matchesCronField(expr: string, value: number, min: number, _max: number): boolean {
    if (expr === '*') return true;

    // A field can be a comma-separated list of segments
    for (const segment of expr.split(',')) {
      if (this.segmentMatches(segment, value, min)) {
        return true;
      }
    }

    return false;
  }

  /** Evaluates a single segment of a cron field (step, range, or literal). */
  private segmentMatches(segment: string, value: number, fieldMin: number): boolean {
    if (segment.includes('/')) {
      // Step expression, e.g. "*/5" or "10-30/5"
      const [rangeExpr, stepStr] = segment.split('/');
      const step = parseInt(stepStr, 10);
      const start = rangeExpr === '*' ? fieldMin : parseInt(rangeExpr, 10);
      return value >= start && (value - start) % step === 0;
    }

    if (segment.includes('-')) {
      // Range expression, e.g. "1-5"
      const [startStr, endStr] = segment.split('-');
      const rangeStart = parseInt(startStr, 10);
      const rangeEnd = parseInt(endStr, 10);
      return value >= rangeStart && value <= rangeEnd;
    }

    // Exact value, e.g. "30"
    return parseInt(segment, 10) === value;
  }
}
