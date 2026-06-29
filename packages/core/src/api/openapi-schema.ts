import type { FieldConfig } from '@rangka/shared';
import type { ResolvedModel } from '../schema/types.js';

export interface JsonSchemaProperty {
  type?: string;
  format?: string;
  description?: string;
  enum?: readonly string[];
  items?: { type: string };
  oneOf?: Array<{ type: string }>;
}

export interface JsonSchemaObject {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

/** Map a Rangka field type to its JSON Schema equivalent. Returns null for relation/computed types. */
export function fieldToJsonSchema(config: FieldConfig): JsonSchemaProperty | null {
  switch (config.type) {
    case 'string':
    case 'text':
    case 'code':
    case 'sequence':
    case 'dynamicLink':
      return { type: 'string' };
    case 'int':
      return { type: 'integer' };
    case 'decimal':
    case 'money':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'date':
      return { type: 'string', format: 'date' };
    case 'datetime':
      return { type: 'string', format: 'date-time' };
    case 'enum':
      return { type: 'string', enum: config.options };
    case 'json':
      return { oneOf: [{ type: 'object' }, { type: 'array' }] };
    case 'link':
      return { type: 'string', description: `Reference to ${config.model}` };
    case 'attachment':
      return { type: 'string', format: 'uri' };
    case 'attachments':
      return { type: 'array', items: { type: 'string' } };
    // Relation and computed types have no direct JSON representation
    case 'hasMany':
    case 'children':
    case 'manyToMany':
    case 'tree':
    case 'computed':
      return null;
  }
}

/** Build a full JSON Schema object for a model, including all serializable fields. */
export function modelToSchemaComponent(model: ResolvedModel): JsonSchemaObject {
  const properties: Record<string, JsonSchemaProperty> = {
    id: { type: 'string', description: 'Primary key' },
  };
  const required: string[] = [];

  for (const field of model.fields) {
    const fieldSchema = fieldToJsonSchema(field.config);
    if (!fieldSchema) continue;

    const property: JsonSchemaProperty = { ...fieldSchema };
    if ('label' in field.config && field.config.label) {
      property.description = field.config.label;
    }
    properties[field.name] = property;

    if ('required' in field.config && field.config.required) {
      required.push(field.name);
    }
  }

  const schema: JsonSchemaObject = { type: 'object', properties };
  if (required.length > 0) {
    schema.required = required;
  }
  return schema;
}

/** Schema for creating a record — same as the full schema but without the `id` field. */
export function modelToCreateSchema(model: ResolvedModel): JsonSchemaObject {
  const full = modelToSchemaComponent(model);
  const { id: _, ...properties } = full.properties;
  return { type: 'object', properties };
}

/** Schema for updating a record — same as create (all fields optional, no `id`). */
export function modelToUpdateSchema(model: ResolvedModel): JsonSchemaObject {
  const full = modelToSchemaComponent(model);
  const { id: _, ...properties } = full.properties;
  return { type: 'object', properties };
}
