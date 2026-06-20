import type { FrameworkContext } from './context.js';

export interface JobConfig {
  concurrency?: number;
  retries?: number;
  backoff?: 'exponential' | 'linear' | 'fixed';
  schedule?: string;
  handler: (data: unknown, ctx: FrameworkContext) => Promise<void>;
}
