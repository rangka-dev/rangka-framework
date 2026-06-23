import * as z from 'zod';

const modelPermissionsSchema = z.object({
  read: z.union([z.boolean(), z.literal('own')]).optional(),
  write: z.union([z.boolean(), z.literal('own')]).optional(),
  create: z.boolean().optional(),
  delete: z.union([z.boolean(), z.literal('own')]).optional(),
  fieldPermissions: z
    .record(z.string(), z.object({ read: z.boolean().optional(), write: z.boolean().optional() }))
    .optional(),
});

const fieldPermissionsSchema = z.object({
  read: z.boolean().optional(),
  write: z.boolean().optional(),
});

const filterDefinitionSchema = z.record(z.string(), z.unknown());

const roleConfigSchema = z.object({
  label: z.string(),
  extends: z.string().optional(),
  models: z.record(z.string(), modelPermissionsSchema).optional(),
  fields: z.record(z.string(), fieldPermissionsSchema).optional(),
  pages: z.array(z.string()).optional(),
  filters: z.record(z.string(), filterDefinitionSchema).optional(),
});

export const rolesConfigSchema = z.record(z.string(), roleConfigSchema);

export type RolesConfig = z.infer<typeof rolesConfigSchema>;
export type RoleConfig = z.infer<typeof roleConfigSchema>;
export type ModelPermissions = z.infer<typeof modelPermissionsSchema>;

export function validateRoles(raw: unknown) {
  return rolesConfigSchema.safeParse(raw);
}

export { modelPermissionsSchema, roleConfigSchema, fieldPermissionsSchema };
