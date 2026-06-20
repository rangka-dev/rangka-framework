import type { TableDefinition } from '../db/types.js';

export function getAuditTables(): TableDefinition[] {
  return [buildAuditLogTable()];
}

function buildAuditLogTable(): TableDefinition {
  return {
    name: 'rangka_audit_log',
    columns: [
      {
        name: 'id',
        type: 'UUID',
        nullable: false,
        primaryKey: true,
        defaultValue: 'gen_random_uuid()',
      },
      { name: 'model', type: 'TEXT', nullable: false },
      { name: 'document_id', type: 'UUID', nullable: false },
      { name: 'action', type: 'TEXT', nullable: false },
      { name: 'changes', type: 'JSONB', nullable: false, defaultValue: "'{}'" },
      { name: 'user_id', type: 'UUID', nullable: true },
      { name: 'timestamp', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()' },
    ],
    foreignKeys: [],
    checkConstraints: [
      {
        name: 'chk_rangka_audit_log_action',
        column: 'action',
        expression: "action IN ('create', 'update', 'delete', 'submit', 'cancel')",
      },
    ],
    indexes: [
      {
        name: 'idx_rangka_audit_log_model_doc',
        table: 'rangka_audit_log',
        columns: ['model', 'document_id'],
        unique: false,
      },
      {
        name: 'idx_rangka_audit_log_timestamp',
        table: 'rangka_audit_log',
        columns: ['timestamp'],
        unique: false,
      },
    ],
  };
}
