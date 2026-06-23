import * as z from 'zod';
import { fieldSchema } from './field.js';

const actionConfigSchema = z.object({
  label: z.string(),
  icon: z.string().optional(),
  position: z.enum(['toolbar', 'menu', 'sidebar']).optional(),
  visible: z.function().optional(),
  confirm: z.string().optional(),
  handler: z.string(),
});

const extensionLayoutSchema = z.object({
  cards: z.array(z.object({ component: z.string(), position: z.string() })).optional(),
  form: z
    .object({
      sections: z
        .array(
          z.object({
            label: z.string(),
            fields: z.array(z.string()),
            after: z.string().optional(),
            columns: z.number().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export const extensionSchema = z.object({
  fields: z.record(z.string(), fieldSchema).optional(),
  hooks: z
    .object({
      validate: z.function().optional(),
      beforeSave: z.function().optional(),
      afterSave: z.function().optional(),
      beforeCreate: z.function().optional(),
      afterCreate: z.function().optional(),
      beforeUpdate: z.function().optional(),
      afterUpdate: z.function().optional(),
      beforeDelete: z.function().optional(),
      afterDelete: z.function().optional(),
    })
    .optional(),
  actions: z.record(z.string(), actionConfigSchema).optional(),
  layout: extensionLayoutSchema.optional(),
});

export type ExtensionConfig = z.infer<typeof extensionSchema>;

export function validateExtension(raw: unknown) {
  return extensionSchema.safeParse(raw);
}
