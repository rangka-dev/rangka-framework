import * as z from 'zod';

export const jobSchema = z.object({
  name: z.string().min(1),
  concurrency: z.number().positive().optional(),
  retries: z.number().nonnegative().optional(),
  backoff: z.enum(['exponential', 'linear', 'fixed']).optional(),
  schedule: z.string().optional(),
  handler: z.function(),
});

export function validateJob(raw: unknown) {
  return jobSchema.safeParse(raw);
}
