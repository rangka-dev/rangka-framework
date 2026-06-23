import * as z from 'zod';

export const fixtureSchema = z.object({
  model: z.string().min(1),
  key: z.string().min(1),
  variant: z.string().optional(),
  depends: z.array(z.string()).optional(),
  records: z.array(z.record(z.string(), z.unknown())),
});

export type FixtureConfig = z.infer<typeof fixtureSchema>;

export function validateFixture(raw: unknown) {
  return fixtureSchema.safeParse(raw);
}
