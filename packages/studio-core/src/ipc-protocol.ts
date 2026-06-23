export type ChildPhase =
  | 'resolving'
  | 'introspecting'
  | 'waiting_for_sync'
  | 'syncing'
  | 'serving'
  | 'stopped'
  | 'error';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface RuntimeStatus {
  models: number;
  pages: number;
  services: number;
  hooks: number;
  jobs: number;
  modules: string[];
}

export type DdlOperationType =
  | 'create_table'
  | 'add_column'
  | 'alter_column_type'
  | 'drop_column'
  | 'drop_table'
  | 'create_index'
  | 'add_foreign_key'
  | 'add_check_constraint'
  | 'drop_foreign_key'
  | 'drop_index';

export interface SerializedDdlOperation {
  id: string;
  type: DdlOperationType;
  table: string;
  ddl: string;
  destructive: boolean;
  detail?: string;
}

export interface ChildStatusSnapshot {
  phase: ChildPhase;
  runtime: RuntimeStatus | null;
  pendingOps: SerializedDdlOperation[];
  serverPort: number | null;
  sessionToken: string | null;
  error: string | null;
}

export type IntrospectType =
  | 'models'
  | 'pages'
  | 'services'
  | 'hooks'
  | 'roles'
  | 'jobs'
  | 'fixtures'
  | 'widgets'
  | 'modules'
  | 'navigation';

export interface ScanWarning {
  file: string;
  message: string;
}

export type ChildMessage =
  | { type: 'child:phase'; phase: ChildPhase }
  | {
      type: 'child:boot_success';
      status: RuntimeStatus;
      sessionToken: string | null;
      dbConfig: DatabaseConfig;
      warnings: ScanWarning[];
    }
  | { type: 'child:boot_error'; error: string; phase: ChildPhase; details?: string }
  | {
      type: 'child:sync_pending';
      operations: SerializedDdlOperation[];
      status: RuntimeStatus;
      dbConfig: DatabaseConfig;
      warnings: ScanWarning[];
    }
  | { type: 'child:sync_applied'; appliedIds: string[] }
  | { type: 'child:sync_error'; error: string; appliedIds: string[] }
  | { type: 'child:serving'; port: number }
  | { type: 'child:status_response'; requestId: string; status: ChildStatusSnapshot }
  | { type: 'child:introspect_response'; requestId: string; data: unknown[]; count: number }
  | { type: 'child:introspect_error'; requestId: string; error: string }
  | { type: 'child:log'; level: 'info' | 'warn' | 'error'; message: string };

export type ParentMessage =
  | { type: 'parent:sync_approve'; operationIds: string[] }
  | { type: 'parent:sync_reject'; reason?: string }
  | { type: 'parent:get_status'; requestId: string }
  | { type: 'parent:introspect'; requestId: string; resource: IntrospectType; module?: string }
  | { type: 'parent:shutdown' };
