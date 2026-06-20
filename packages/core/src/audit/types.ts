export type AuditAction = 'create' | 'update' | 'delete' | 'submit' | 'cancel';

export interface AuditChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface AuditLogRecord {
  id: string;
  model: string;
  document_id: string;
  action: AuditAction;
  changes: Record<string, { from: unknown; to: unknown }>;
  user_id: string | null;
  timestamp: Date;
}

export interface AuditOptions {
  model: string;
  documentId: string;
  action: AuditAction;
  userId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}
