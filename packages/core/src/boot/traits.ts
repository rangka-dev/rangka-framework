import type { FieldConfig } from '@rangka/shared';

export interface TraitFields {
  [fieldName: string]: FieldConfig;
}

const timestampedFields: TraitFields = {
  created_at: { type: 'datetime' },
  updated_at: { type: 'datetime' },
  created_by: { type: 'link', model: 'core.user' },
  updated_by: { type: 'link', model: 'core.user' },
};

const softDeleteFields: TraitFields = {
  archived_at: { type: 'datetime' },
};

const traitFieldMap: Record<string, TraitFields> = {
  timestamped: timestampedFields,
  soft_delete: softDeleteFields,
};

export function getTraitFields(trait: string): TraitFields {
  return traitFieldMap[trait] ?? {};
}
