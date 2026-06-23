export { boot } from './boot/index.js';
export type { BootOptions, BootResult } from './boot/index.js';
export { SchemaRegistry } from './schema/registry.js';
export { loadSchemas } from './boot/schema-loader.js';
export type { SchemaLoadResult } from './boot/schema-loader.js';
export { mergeSchemas } from './boot/schema-merger.js';
export type { MergeResult } from './boot/schema-merger.js';
export type {
  ResolvedModel,
  ResolvedField,
  FieldProvenance,
  ModelRelationship,
  ExtensionSource,
} from './schema/types.js';
export type { RangkaPackageInfo, DiscoverySource, DiscoveredApp } from './boot/types.js';
export {
  SchemaConflictError,
  MissingDependencyError,
  CircularDependencyError,
} from './boot/types.js';
export { DefinitionValidationError } from './boot/validator.js';
export type { DefinitionError } from './boot/validator.js';
export { validateModelReferences } from './boot/cross-validator.js';
export { validatePageBindings } from './boot/page-utils.js';
export type { PageValidationWarning } from './boot/page-utils.js';
export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from './errors.js';
export { NodeModulesDiscoverySource, MemoryDiscoverySource } from './boot/discovery.js';
export { ProjectScanner } from './boot/project-scanner.js';
export type { ProjectScanResult, ScanWarning } from './boot/project-scanner.js';
export { DatabaseClient } from './db/client.js';
export type { DatabaseClientConfig } from './db/client.js';
export type {
  ColumnDefinition,
  TableDefinition,
  IndexDefinition,
  ForeignKeyDefinition,
  DesiredState,
  ActualState,
  DdlOperation,
} from './db/types.js';
export { mapFieldsToColumns, modelToTableName } from './db/field-mapper.js';
export { SchemaToDesired } from './db/desired-state.js';
export { DiffEngine } from './db/diff-engine.js';
export { introspect } from './db/introspect.js';
export { autoSync } from './db/auto-sync.js';
export type { DdlOperation as CoreDdlOperation } from './db/types.js';
export { createServer } from './api/server.js';
export { QueryParser, QueryValidationError } from './api/query-parser.js';
export { generateRoutes } from './api/route-generator.js';
export type { ServerConfig, ApiDefinition } from './api/types.js';
export { defineRoles, defineConfig } from '@rangka/shared';
export type { RangkaConfig } from '@rangka/shared';

// Auth & Permissions
export {
  PermissionRegistry,
  DuplicateRoleError,
  RoleInheritanceCycleError,
} from './auth/permission-registry.js';
export {
  createAuthHook,
  getAuthContext,
  createSessionHandler,
  deleteSessionHandler,
  regenerateSessionToken,
  generateToken,
} from './auth/session.js';
export { createModelPermissionGuard } from './auth/model-permissions.js';
export { createScopeHook, createScopeWriteGuard, applyScopeFiltersToQuery } from './auth/scopes.js';
export { ScopeRegistry, ScopeResolutionError } from './auth/scope-registry.js';
export type { ResolvedScope, ModelScopeBinding } from './auth/scope-registry.js';
export {
  createFieldWriteGuard,
  createFieldStripHook,
  resolveFieldPermissions,
} from './auth/field-permissions.js';
export { debugPermissions, formatDebugResult } from './auth/debug.js';
export { getCoreModels, getCoreApp } from './auth/core-module.js';
export { coreSchemas } from './auth/core-models.js';
export { seedCoreData } from './auth/seed.js';
export { hashPassword, verifyPassword } from './auth/password.js';
export type {
  AuthUser,
  AuthSession,
  RequestContext,
  ScopeFilter,
  ResolvedPermissions,
  RegisteredRole,
} from './auth/types.js';

// Hooks
export { HookRegistry } from './hooks/registry.js';
export { ValidationError } from './hooks/errors.js';
export { executeHookPipeline } from './hooks/executor.js';
export { createHookContext } from './hooks/context.js';
export type {
  HookChain,
  HookEntry,
  HookLifecycle,
  HookContext,
  HookDocument,
} from './hooks/types.js';

// Validation
export { validateFields } from './validation/field-validator.js';
export type { FieldViolation } from './validation/field-validator.js';

// Jobs & Queue
export { JobRegistry } from './jobs/registry.js';
export { enqueue } from './jobs/enqueue.js';
export { JobWorker } from './jobs/worker.js';
export { ScheduleManager } from './jobs/scheduler.js';
export { getJobTables } from './jobs/tables.js';
export type {
  JobRecord,
  DeadLetterRecord,
  ScheduledJobRecord,
  JobState,
  BackoffStrategy,
  JobWorkerConfig,
  RegisteredJob,
  EnqueueOptions,
} from './jobs/types.js';

// Events
export { EventBus } from './events/bus.js';
export type { EventListener, EventBusConfig } from './events/types.js';

// Services
export {
  ServiceRegistry,
  ServiceCircularDependencyError,
  ServiceNotFoundError,
  DuplicateServiceError,
} from './services/registry.js';
export type {
  ServiceDefinition,
  ServiceFactory,
  ServiceInstance,
  ServiceDependency,
  ServiceContext,
} from './services/types.js';

// Context
export { createFrameworkContext, createRequestContext } from './context.js';
export type { FrameworkContextOptions, RequestScopedContextOptions } from './context.js';

// Fixtures
export { FixtureRegistry } from './fixtures/registry.js';
export { loadFixtures } from './fixtures/loader.js';
export type {
  FixtureDefinition,
  FixtureRef,
  FixtureRecord,
  FixtureStatus,
  FixtureLoadResult,
  RegisteredFixture,
} from './fixtures/types.js';

// Audit Log
export { getAuditTables } from './audit/tables.js';
export { recordAudit, getAuditHistory } from './audit/record.js';
export type { AuditAction, AuditChange, AuditLogRecord, AuditOptions } from './audit/types.js';

// Widgets
export { WidgetRegistry } from './widgets/widget-registry.js';
export { validatePageBody } from './widgets/slot-validator.js';
export type { SlotValidationError } from './widgets/slot-validator.js';

// Coercion helpers
export { toBool, toInt, isNil, toCount } from './helpers/coerce.js';
