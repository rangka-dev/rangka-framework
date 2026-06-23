import * as z from 'zod';
import { fieldSchema } from './field.js';

export const indexConfigSchema = z.object({
  fields: z.array(z.string()),
  unique: z.boolean().optional(),
});

export const scopeConfigSchema = z.union([
  z.string(),
  z.object({ name: z.string(), field: z.string() }),
]);

export const modelSchema = z
  .object({
    name: z.string().min(1),
    label: z.string().optional(),
    naming: z.string().optional(),
    scope: scopeConfigSchema.optional(),
    auditLog: z.boolean().optional(),
    fields: z.record(z.string(), fieldSchema),
    indexes: z.array(indexConfigSchema).optional(),
    traits: z.array(z.enum(['ledger', 'timestamped', 'soft_delete'])).optional(),
  })
  .check(
    z.refine(
      (data) => {
        if (!data.indexes) return true;
        const fieldNames = Object.keys(data.fields);
        return data.indexes.every((idx) => idx.fields.every((f) => fieldNames.includes(f)));
      },
      { error: 'Index references undefined field(s)' },
    ),
  );

export type ModelConfig = z.infer<typeof modelSchema>;

export function validateModel(raw: unknown) {
  return modelSchema.safeParse(raw);
}
