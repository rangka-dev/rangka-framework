import type { TableDefinition } from '../db/types.js';

export function getJobTables(): TableDefinition[] {
  return [buildJobsTable(), buildDeadLettersTable(), buildScheduledJobsTable()];
}

function buildJobsTable(): TableDefinition {
  return {
    name: 'rangka_jobs',
    columns: [
      {
        name: 'id',
        type: 'UUID',
        nullable: false,
        primaryKey: true,
        defaultValue: 'gen_random_uuid()',
      },
      { name: 'name', type: 'TEXT', nullable: false },
      { name: 'data', type: 'JSONB', nullable: true },
      { name: 'state', type: 'TEXT', nullable: false, defaultValue: "'created'" },
      { name: 'retry_count', type: 'INTEGER', nullable: false, defaultValue: '0' },
      { name: 'max_retries', type: 'INTEGER', nullable: false, defaultValue: '0' },
      { name: 'backoff', type: 'TEXT', nullable: false, defaultValue: "'exponential'" },
      { name: 'start_after', type: 'TIMESTAMPTZ', nullable: true },
      { name: 'started_at', type: 'TIMESTAMPTZ', nullable: true },
      { name: 'completed_at', type: 'TIMESTAMPTZ', nullable: true },
      { name: 'failed_at', type: 'TIMESTAMPTZ', nullable: true },
      { name: 'error', type: 'TEXT', nullable: true },
      { name: 'unique_key', type: 'TEXT', nullable: true },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()' },
      { name: 'expire_in', type: 'INTERVAL', nullable: false, defaultValue: "'15 minutes'" },
    ],
    foreignKeys: [],
    checkConstraints: [
      {
        name: 'chk_rangka_jobs_state',
        column: 'state',
        expression: "state IN ('created', 'active', 'completed', 'failed')",
      },
    ],
    indexes: [
      {
        name: 'idx_rangka_jobs_state_start_after',
        table: 'rangka_jobs',
        columns: ['state', 'start_after'],
        unique: false,
      },
      {
        name: 'idx_rangka_jobs_name_state',
        table: 'rangka_jobs',
        columns: ['name', 'state'],
        unique: false,
      },
      {
        name: 'idx_rangka_jobs_unique_key_active',
        table: 'rangka_jobs',
        columns: ['unique_key'],
        unique: true,
        where: "state IN ('created', 'active')",
      },
    ],
  };
}

function buildDeadLettersTable(): TableDefinition {
  return {
    name: 'rangka_dead_letters',
    columns: [
      {
        name: 'id',
        type: 'UUID',
        nullable: false,
        primaryKey: true,
        defaultValue: 'gen_random_uuid()',
      },
      { name: 'job_id', type: 'UUID', nullable: false },
      { name: 'name', type: 'TEXT', nullable: false },
      { name: 'data', type: 'JSONB', nullable: true },
      { name: 'error', type: 'TEXT', nullable: true },
      { name: 'retry_count', type: 'INTEGER', nullable: false, defaultValue: '0' },
      { name: 'failed_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()' },
    ],
    foreignKeys: [],
    checkConstraints: [],
    indexes: [
      {
        name: 'idx_rangka_dead_letters_name',
        table: 'rangka_dead_letters',
        columns: ['name'],
        unique: false,
      },
    ],
  };
}

function buildScheduledJobsTable(): TableDefinition {
  return {
    name: 'rangka_scheduled_jobs',
    columns: [
      {
        name: 'id',
        type: 'UUID',
        nullable: false,
        primaryKey: true,
        defaultValue: 'gen_random_uuid()',
      },
      { name: 'name', type: 'TEXT', nullable: false },
      { name: 'cron', type: 'TEXT', nullable: false },
      { name: 'data', type: 'JSONB', nullable: true },
      { name: 'last_run_at', type: 'TIMESTAMPTZ', nullable: true },
      { name: 'next_run_at', type: 'TIMESTAMPTZ', nullable: true },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()' },
    ],
    foreignKeys: [],
    checkConstraints: [],
    indexes: [
      {
        name: 'uidx_rangka_scheduled_jobs_name',
        table: 'rangka_scheduled_jobs',
        columns: ['name'],
        unique: true,
      },
      {
        name: 'idx_rangka_scheduled_jobs_next_run',
        table: 'rangka_scheduled_jobs',
        columns: ['next_run_at'],
        unique: false,
      },
    ],
  };
}
