import type { ExternalFieldConfig } from './types.js';

export function evaluateComputedFields(
  record: Record<string, unknown>,
  fields: Record<string, ExternalFieldConfig>,
): Record<string, unknown> {
  const result = { ...record };

  for (const [fieldName, config] of Object.entries(fields)) {
    if (!config.computed) continue;
    result[fieldName] = config.computed.compute(result);
  }

  return result;
}
