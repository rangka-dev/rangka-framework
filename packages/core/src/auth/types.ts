import type { RolesConfig, ModelPermissions } from '@rangka/shared';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  enabled: boolean;
  password_hash: string;
  [key: string]: unknown;
}

export interface AuthSession {
  id: string;
  token: string;
  user_id: string;
  expires_at: Date;
  created_at: Date;
  permission_version?: number;
}

export interface ResolvedPermissions {
  models: Record<string, ModelPermissions>;
  pages: string[];
  version: number;
}

export interface RequestContext {
  user?: AuthUser;
  session?: AuthSession;
  permissions?: ResolvedPermissions;
  roles?: string[];
  scopeFilters?: ScopeFilter[];
}

export interface ScopeFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface RegisteredRole {
  name: string;
  config: RolesConfig[string];
  app: string;
}

export interface PermissionCacheEntry {
  permissions: ResolvedPermissions;
  version: number;
}
