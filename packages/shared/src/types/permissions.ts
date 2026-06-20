export interface ModelPermissions {
  read?: boolean | 'own';
  write?: boolean | 'own';
  create?: boolean;
  delete?: boolean | 'own';
  fieldPermissions?: Record<string, { read?: boolean; write?: boolean }>;
}

export type FieldPermissions = { read?: boolean; write?: boolean };

export type FilterDefinition = Record<string, unknown>;

export interface RoleConfig {
  label: string;
  extends?: string;
  models?: Record<string, ModelPermissions>;
  fields?: Record<string, FieldPermissions>;
  pages?: string[];
  filters?: Record<string, FilterDefinition>;
}

export type RolesConfig = Record<string, RoleConfig>;
