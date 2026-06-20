export interface ExternalFieldMapping {
  from?: string;
}

export interface ComputedFieldConfig {
  depends: string[];
  compute: (record: Record<string, unknown>) => unknown;
}

export interface ExternalRelationshipConfig {
  type: 'link' | 'hasMany';
  model: string;
  from?: string;
  foreignKey?: string;
}

export interface ExternalFieldConfig {
  type: 'string' | 'int' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'json';
  label?: string;
  required?: boolean;
  from?: string;
  computed?: ComputedFieldConfig;
  relationship?: ExternalRelationshipConfig;
}

export interface ExternalModelConfig {
  name: string;
  source: string;
  module?: string;
  label?: string;
  fields: Record<string, ExternalFieldConfig>;
}
