import type { AuditLogRecord, AuditOptions } from './types.js';

const IGNORED_FIELDS = new Set(['updated_at', 'created_at', '_fixture_source', '_fixture_hash']);

// Compares two snapshots of a document and returns which fields changed.
// Null/undefined snapshots are treated as empty (all fields added or removed).
function computeFieldChanges(
  previousState: Record<string, unknown> | null | undefined,
  currentState: Record<string, unknown> | null | undefined,
): Record<string, { from: unknown; to: unknown }> {
  const previous = previousState ?? {};
  const current = currentState ?? {};
  const allFields = new Set([...Object.keys(previous), ...Object.keys(current)]);
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  for (const field of allFields) {
    if (IGNORED_FIELDS.has(field)) continue;

    const previousValue = previous[field] ?? null;
    const currentValue = current[field] ?? null;
    const hasChanged = JSON.stringify(previousValue) !== JSON.stringify(currentValue);

    if (hasChanged) {
      changes[field] = { from: previousValue, to: currentValue };
    }
  }

  return changes;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recordAudit(db: any, options: AuditOptions): Promise<AuditLogRecord | null> {
  const changes = computeFieldChanges(options.before, options.after);

  if (options.action === 'update' && Object.keys(changes).length === 0) {
    return null;
  }

  const [row] = await db
    .insertInto('rangka_audit_log')
    .values({
      model: options.model,
      document_id: options.documentId,
      action: options.action,
      changes: JSON.stringify(changes),
      user_id: options.userId ?? null,
    })
    .returningAll()
    .execute();

  return row as AuditLogRecord;
}

export async function getAuditHistory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  model: string,
  documentId: string,
): Promise<AuditLogRecord[]> {
  const rows = await db
    .selectFrom('rangka_audit_log')
    .selectAll()
    .where('model', '=', model)
    .where('document_id', '=', documentId)
    .orderBy('timestamp', 'desc')
    .execute();

  return rows as AuditLogRecord[];
}
