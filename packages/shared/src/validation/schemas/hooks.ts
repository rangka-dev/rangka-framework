import * as z from 'zod';

export const hooksSchema = z.object({
  validate: z.function().optional(),
  beforeSave: z.function().optional(),
  afterSave: z.function().optional(),
  beforeCreate: z.function().optional(),
  afterCreate: z.function().optional(),
  beforeUpdate: z.function().optional(),
  afterUpdate: z.function().optional(),
  beforeDelete: z.function().optional(),
  afterDelete: z.function().optional(),
});

export function validateHooks(raw: unknown) {
  return hooksSchema.safeParse(raw);
}
