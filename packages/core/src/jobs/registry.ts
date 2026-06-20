import type { JobConfig } from '@rangka/shared';
import type { RegisteredJob } from './types.js';

/**
 * Stores and validates background job definitions.
 * Jobs can be one-off or scheduled via cron expressions.
 */
export class JobRegistry {
  private readonly jobs: Map<string, RegisteredJob> = new Map();

  /** Register a new job after validating its configuration. */
  register(name: string, config: JobConfig): void {
    if (this.jobs.has(name)) {
      throw new Error(`Job "${name}" is already registered`);
    }

    const validationErrors = this.validate(name, config);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid job config for "${name}": ${validationErrors.join('; ')}`);
    }

    this.jobs.set(name, { name, config });
  }

  get(name: string): RegisteredJob | undefined {
    return this.jobs.get(name);
  }

  has(name: string): boolean {
    return this.jobs.has(name);
  }

  getAll(): RegisteredJob[] {
    return Array.from(this.jobs.values());
  }

  /** Return only jobs that have a cron schedule defined. */
  getScheduled(): RegisteredJob[] {
    return this.getAll().filter((job) => !!job.config.schedule);
  }

  /** Validate job name and config, returning a list of human-readable errors. */
  private validate(name: string, config: JobConfig): string[] {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Job name must not be empty');
    }

    if (typeof config.handler !== 'function') {
      errors.push('Job handler must be a function');
    }

    this.validateConcurrency(config, errors);
    this.validateRetries(config, errors);
    this.validateBackoff(config, errors);
    this.validateSchedule(config, errors);

    return errors;
  }

  private validateConcurrency(config: JobConfig, errors: string[]): void {
    if (
      config.concurrency !== undefined &&
      (config.concurrency < 1 || !Number.isInteger(config.concurrency))
    ) {
      errors.push('Concurrency must be a positive integer');
    }
  }

  private validateRetries(config: JobConfig, errors: string[]): void {
    if (config.retries !== undefined && (config.retries < 0 || !Number.isInteger(config.retries))) {
      errors.push('Retries must be a non-negative integer');
    }
  }

  private validateBackoff(config: JobConfig, errors: string[]): void {
    const allowedStrategies = ['exponential', 'linear', 'fixed'];
    if (config.backoff !== undefined && !allowedStrategies.includes(config.backoff)) {
      errors.push('Backoff must be one of: exponential, linear, fixed');
    }
  }

  private validateSchedule(config: JobConfig, errors: string[]): void {
    if (config.schedule !== undefined) {
      const cronFields = config.schedule.trim().split(/\s+/);
      if (cronFields.length !== 5) {
        errors.push('Schedule must be a valid 5-field cron expression');
      }
    }
  }
}
