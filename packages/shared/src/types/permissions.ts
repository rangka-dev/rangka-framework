export type {
  RolesConfig,
  RoleConfig,
  ModelPermissions,
} from '../validation/schemas/permissions.js';

import type * as z from 'zod';
import type { fieldPermissionsSchema } from '../validation/schemas/permissions.js';

export type FieldPermissions = z.infer<typeof fieldPermissionsSchema>;

export type FilterDefinition = Record<string, unknown>;
