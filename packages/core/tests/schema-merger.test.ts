import { describe, it, expect } from 'vitest';
import { mergeSchemas } from '../src/boot/schema-merger.js';
import { SchemaConflictError } from '../src/boot/types.js';
import type { SchemaLoadResult } from '../src/boot/schema-loader.js';
import { field } from '@rangka/shared';

function makeLoadResult(overrides: Partial<SchemaLoadResult> = {}): SchemaLoadResult {
  return {
    schemas: overrides.schemas ?? [],
    extensions: overrides.extensions ?? [],
  };
}

describe('mergeSchemas', () => {
  it('creates resolved models from schemas', () => {
    const result = mergeSchemas(
      makeLoadResult({
        schemas: [
          {
            app: 'sales',
            module: 'sales',
            schema: {
              name: 'customer',
              label: 'Customer',
              fields: { name: field.string({ required: true }), email: field.string() },
            },
          },
        ],
      }),
    );

    expect(result.models).toHaveLength(1);
    expect(result.models[0].qualifiedName).toBe('sales.customer');
    expect(result.models[0].label).toBe('Customer');
    expect(result.models[0].fields).toHaveLength(2);
    expect(result.models[0].fields[0].name).toBe('name');
    expect(result.models[0].fields[0].provenance).toEqual({ source: 'base', app: 'sales' });
  });

  it('injects trait fields before base fields', () => {
    const result = mergeSchemas(
      makeLoadResult({
        schemas: [
          {
            app: 'sales',
            module: 'sales',
            schema: {
              name: 'invoice',
              fields: { total: field.decimal() },
              traits: ['timestamped'],
            },
          },
        ],
      }),
    );

    const model = result.models[0];
    const fieldNames = model.fields.map((f) => f.name);

    expect(fieldNames).toContain('created_at');
    expect(fieldNames).toContain('updated_at');
    expect(fieldNames).toContain('created_by');
    expect(fieldNames).toContain('updated_by');
    expect(fieldNames).toContain('total');

    const createdAt = model.fields.find((f) => f.name === 'created_at')!;
    expect(createdAt.provenance).toEqual({ source: 'trait', trait: 'timestamped' });
  });

  it('merges extension fields into base schemas', () => {
    const result = mergeSchemas(
      makeLoadResult({
        schemas: [
          {
            app: 'sales',
            module: 'sales',
            schema: { name: 'customer', fields: { name: field.string() } },
          },
        ],
        extensions: [
          {
            app: 'project',
            target: 'sales.customer',
            config: { fields: { loyalty_points: field.int({ default: 0 }) } },
          },
        ],
      }),
    );

    const model = result.models[0];
    expect(model.fields).toHaveLength(2);

    const loyalty = model.fields.find((f) => f.name === 'loyalty_points')!;
    expect(loyalty).toBeDefined();
    expect(loyalty.provenance).toEqual({ source: 'extension', app: 'project' });
  });

  it('throws SchemaConflictError when extension conflicts with base field', () => {
    expect(() =>
      mergeSchemas(
        makeLoadResult({
          schemas: [
            {
              app: 'sales',
              module: 'sales',
              schema: { name: 'customer', fields: { email: field.string() } },
            },
          ],
          extensions: [
            {
              app: 'project',
              target: 'sales.customer',
              config: { fields: { email: field.string() } },
            },
          ],
        }),
      ),
    ).toThrow(SchemaConflictError);
  });

  it('throws SchemaConflictError when two extensions conflict', () => {
    expect(() =>
      mergeSchemas(
        makeLoadResult({
          schemas: [
            {
              app: 'sales',
              module: 'sales',
              schema: { name: 'customer', fields: { name: field.string() } },
            },
          ],
          extensions: [
            {
              app: 'crm',
              target: 'sales.customer',
              config: { fields: { score: field.int() } },
            },
            {
              app: 'analytics',
              target: 'sales.customer',
              config: { fields: { score: field.int() } },
            },
          ],
        }),
      ),
    ).toThrow(SchemaConflictError);
  });

  it('sets auditLog to true by default', () => {
    const result = mergeSchemas(
      makeLoadResult({
        schemas: [
          {
            app: 'sales',
            module: 'sales',
            schema: { name: 'customer', fields: { name: field.string() } },
          },
        ],
      }),
    );

    expect(result.models[0].auditLog).toBe(true);
  });

  it('respects auditLog: false', () => {
    const result = mergeSchemas(
      makeLoadResult({
        schemas: [
          {
            app: 'sales',
            module: 'sales',
            schema: { name: 'email_queue', auditLog: false, fields: { subject: field.string() } },
          },
        ],
      }),
    );

    expect(result.models[0].auditLog).toBe(false);
  });
});
