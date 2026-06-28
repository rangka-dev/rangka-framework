import { describe, it, expect } from 'vitest';
import { externalModelToResolved } from '../schema-converter.js';
import type { ExternalModelConfig } from '../types.js';

describe('externalModelToResolved', () => {
  const baseConfig: ExternalModelConfig = {
    name: 'Customer',
    source: 'stripe',
    label: 'Stripe Customer',
    fields: {
      id: { type: 'string' },
      email: { type: 'string' },
      name: { type: 'string', from: 'metadata.company_name' },
    },
  };

  it('produces correct qualifiedName', () => {
    const { model } = externalModelToResolved(baseConfig, 'billing');
    expect(model.qualifiedName).toBe('billing.Customer');
  });

  it('sets source from config', () => {
    const { model } = externalModelToResolved(baseConfig, 'billing');
    expect(model.source).toBe('stripe');
  });

  it('sets app', () => {
    const { model } = externalModelToResolved(baseConfig, 'billing');
    expect(model.app).toBe('billing');
  });

  it('sets name and label', () => {
    const { model } = externalModelToResolved(baseConfig, 'billing');
    expect(model.name).toBe('Customer');
    expect(model.label).toBe('Stripe Customer');
  });

  it('has empty traits', () => {
    const { model } = externalModelToResolved(baseConfig, 'billing');
    expect(model.traits).toEqual([]);
  });

  it('has empty indexes', () => {
    const { model } = externalModelToResolved(baseConfig, 'billing');
    expect(model.indexes).toEqual([]);
  });

  it('sets auditLog to false', () => {
    const { model } = externalModelToResolved(baseConfig, 'billing');
    expect(model.auditLog).toBe(false);
  });

  it('converts fields to ResolvedField array', () => {
    const { model } = externalModelToResolved(baseConfig, 'billing');
    expect(model.fields).toHaveLength(3);

    const idField = model.fields.find((f) => f.name === 'id');
    expect(idField).toEqual({
      name: 'id',
      config: { type: 'string', label: undefined, required: undefined },
      provenance: { source: 'base' },
    });
  });

  it('preserves field type and label', () => {
    const config: ExternalModelConfig = {
      name: 'Invoice',
      source: 'stripe',
      fields: {
        amount: { type: 'decimal', label: 'Amount', required: true },
      },
    };

    const { model } = externalModelToResolved(config, 'billing');
    const amountField = model.fields.find((f) => f.name === 'amount');
    expect(amountField?.config).toEqual({ type: 'decimal', label: 'Amount', required: true });
  });

  it('sets provenance to base for all fields', () => {
    const { model } = externalModelToResolved(baseConfig, 'billing');
    for (const field of model.fields) {
      expect(field.provenance).toEqual({ source: 'base' });
    }
  });

  it('handles config without label', () => {
    const config: ExternalModelConfig = {
      name: 'Product',
      source: 'shopify',
      fields: { id: { type: 'string' } },
    };

    const { model } = externalModelToResolved(config, 'store');
    expect(model.label).toBeUndefined();
  });

  describe('relationships', () => {
    it('returns empty relationships when no relationship fields', () => {
      const { relationships } = externalModelToResolved(baseConfig, 'billing');
      expect(relationships).toEqual([]);
    });

    it('extracts link relationships from fields', () => {
      const config: ExternalModelConfig = {
        name: 'Invoice',
        source: 'stripe',
        fields: {
          id: { type: 'string' },
          order: {
            type: 'string',
            from: 'metadata.order_id',
            relationship: { type: 'link', model: 'sales.Order' },
          },
        },
      };

      const { relationships } = externalModelToResolved(config, 'billing');
      expect(relationships).toHaveLength(1);
      expect(relationships[0]).toEqual({
        type: 'link',
        from: 'billing.Invoice',
        field: 'order',
        to: 'sales.Order',
        foreignKey: undefined,
      });
    });

    it('extracts hasMany relationships with foreignKey', () => {
      const config: ExternalModelConfig = {
        name: 'Customer',
        source: 'stripe',
        fields: {
          id: { type: 'string' },
          invoices: {
            type: 'json',
            relationship: { type: 'hasMany', model: 'billing.Invoice', foreignKey: 'customer_id' },
          },
        },
      };

      const { relationships } = externalModelToResolved(config, 'billing');
      expect(relationships).toHaveLength(1);
      expect(relationships[0]).toEqual({
        type: 'hasMany',
        from: 'billing.Customer',
        field: 'invoices',
        to: 'billing.Invoice',
        foreignKey: 'customer_id',
      });
    });

    it('extracts multiple relationships', () => {
      const config: ExternalModelConfig = {
        name: 'Order',
        source: 'stripe',
        fields: {
          id: { type: 'string' },
          customer: {
            type: 'string',
            relationship: { type: 'link', model: 'billing.Customer' },
          },
          items: {
            type: 'json',
            relationship: { type: 'hasMany', model: 'billing.LineItem', foreignKey: 'order_id' },
          },
        },
      };

      const { relationships } = externalModelToResolved(config, 'billing');
      expect(relationships).toHaveLength(2);
    });
  });
});
