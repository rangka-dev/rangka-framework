export { hashPassword, verifyPassword } from './password.js';
export {
  PermissionRegistry,
  DuplicateRoleError,
  RoleInheritanceCycleError,
} from './permission-registry.js';
export {
  createAuthHook,
  getAuthContext,
  createSessionHandler,
  deleteSessionHandler,
  regenerateSessionToken,
  generateToken,
} from './session.js';
export { createModelPermissionGuard, isOwnerOnly, modelHasCreatedBy } from './model-permissions.js';
export { createScopeHook, createScopeWriteGuard, applyScopeFiltersToQuery } from './scopes.js';
export type { ScopeHookContext, FilterProvider } from './scopes.js';
export { ScopeRegistry, ScopeResolutionError } from './scope-registry.js';
export type { ResolvedScope, ModelScopeBinding } from './scope-registry.js';
export {
  createFieldWriteGuard,
  createFieldStripHook,
  resolveFieldPermissions,
} from './field-permissions.js';
export { debugPermissions, formatDebugResult } from './debug.js';
export { getCoreModels, getCoreApp } from './core-module.js';
export { coreSchemas } from './core-models.js';
export { seedCoreData } from './seed.js';
export type {
  AuthUser,
  AuthSession,
  RequestContext,
  ScopeFilter,
  ResolvedPermissions,
  RegisteredRole,
  PermissionCacheEntry,
} from './types.js';
