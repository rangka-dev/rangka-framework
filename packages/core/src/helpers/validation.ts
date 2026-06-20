import type { ResolvedModel } from '../schema/types.js';

export function findMissingRequiredFields(
  model: ResolvedModel,
  body: Record<string, unknown>,
): string[] {
  const missing: string[] = [];
  for (const field of model.fields) {
    if ('required' in field.config && field.config.required && body[field.name] === undefined) {
      missing.push(field.name);
    }
  }
  return missing;
}
