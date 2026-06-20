import type { JobConfig } from '@rangka/shared';

export type JobState = 'created' | 'active' | 'completed' | 'failed';

export type BackoffStrategy = 'exponential' | 'linear' | 'fixed';

export interface JobRecord {
  id: string;
  name: string;
  data: unknown;
  state: JobState;
  retry_count: number;
  max_retries: number;
  backoff: BackoffStrategy;
  start_after: Date | null;
  started_at: Date | null;
  completed_at: Date | null;
  failed_at: Date | null;
  error: string | null;
  unique_key: string | null;
  created_at: Date;
  expire_in: string;
}

export interface DeadLetterRecord {
  id: string;
  job_id: string;
  name: string;
  data: unknown;
  error: string | null;
  retry_count: number;
  failed_at: Date;
  created_at: Date;
}

export interface ScheduledJobRecord {
  id: string;
  name: string;
  cron: string;
  data: unknown;
  last_run_at: Date | null;
  next_run_at: Date | null;
  created_at: Date;
}

export interface JobWorkerConfig {
  pollInterval?: number;
  enabled?: boolean;
}

export interface RegisteredJob {
  name: string;
  config: JobConfig;
}

export interface EnqueueOptions {
  delay?: number;
  unique?: boolean;
  uniqueKey?: string;
  retries?: number;
  backoff?: BackoffStrategy;
}
