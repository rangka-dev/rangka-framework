export function stripHiddenFields(
  record: Record<string, unknown>,
  hidden: Set<string>,
): Record<string, unknown> {
  if (hidden.size === 0) return record;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!hidden.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

export function enforceReadOnly(data: Record<string, unknown>, readOnly: Set<string>): void {
  if (readOnly.size === 0) return;

  const violated: string[] = [];
  for (const field of readOnly) {
    if (field in data && data[field] !== undefined) {
      violated.push(field);
    }
  }

  if (violated.length > 0) {
    throw new Error(`Cannot write to read-only fields: ${violated.join(', ')}`);
  }
}
