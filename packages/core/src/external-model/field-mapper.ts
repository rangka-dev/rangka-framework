import type { ExternalFieldConfig } from './types.js';

export function resolveFieldValue(record: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = record;

  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export function mapAdapterResponse(
  raw: Record<string, unknown>,
  fields: Record<string, ExternalFieldConfig>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [fieldName, config] of Object.entries(fields)) {
    if (config.computed) continue;

    const sourcePath = config.from ?? fieldName;
    result[fieldName] = resolveFieldValue(raw, sourcePath);
  }

  return result;
}

export function reverseMapForWrite(
  data: Record<string, unknown>,
  fields: Record<string, ExternalFieldConfig>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [fieldName, value] of Object.entries(data)) {
    const config = fields[fieldName];
    if (!config || config.computed) continue;

    const targetPath = config.from ?? fieldName;

    if (targetPath.includes('.')) {
      setNestedValue(result, targetPath, value);
    } else {
      result[targetPath] = value;
    }
  }

  return result;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] == null || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}
