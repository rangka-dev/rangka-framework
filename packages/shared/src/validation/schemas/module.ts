import * as z from 'zod';

const navigationItemSchema = z.object({
  page: z.string(),
  label: z.string(),
  icon: z.string().optional(),
});

const navigationSectionSchema = z.object({
  section: z.string(),
  items: z.array(navigationItemSchema),
});

const scopeDefinitionSchema = z.object({
  model: z.string(),
  default: z.string(),
  switchable: z.boolean().optional(),
});

const RESERVED_MODULE_NAMES = ['core'] as const;

export const moduleSchema = z.object({
  name: z
    .string()
    .min(1)
    .refine(
      (name) =>
        !RESERVED_MODULE_NAMES.includes(
          name.toLowerCase() as (typeof RESERVED_MODULE_NAMES)[number],
        ),
      { error: 'Module name is reserved' },
    )
    .refine((name) => !name.toLowerCase().startsWith('rangka'), {
      error: 'Module names starting with "rangka" are reserved',
    }),
  label: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  order: z.number().optional(),
  type: z.enum(['internal', 'external']).optional(),
  depends: z.array(z.string()).optional(),
  scopes: z.record(z.string(), scopeDefinitionSchema).optional(),
  navigation: z.array(navigationSectionSchema).optional(),
});

export type ModuleConfig = z.infer<typeof moduleSchema>;

export function validateModule(raw: unknown) {
  return moduleSchema.safeParse(raw);
}

export { navigationItemSchema, navigationSectionSchema, scopeDefinitionSchema };
