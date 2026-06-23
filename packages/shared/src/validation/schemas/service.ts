import * as z from 'zod';

export const serviceSchema = z.object({
  name: z.string().min(1),
  deps: z.array(z.string()).optional(),
  factory: z.function(),
});

export function validateService(raw: unknown) {
  return serviceSchema.safeParse(raw);
}
