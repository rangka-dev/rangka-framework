import { describe, it, expect } from 'vitest';
import { ScopeRegistry, ScopeResolutionError } from '../scope-registry.js';
import { SchemaRegistry } from '../../schema/registry.js';
import type { ResolvedModel } from '../../schema/types.js';
import type { ModuleConfig } from '@rangka/shared';

function makeModel(overrides: Partial<ResolvedModel> & { qualifiedName: string }): ResolvedModel {
  return {
    app: overrides.module ?? 'test',
    module: overrides.module ?? 'test',
    name: overrides.qualifiedName.split('.')[1],
    auditLog: false,
    traits: [],
    fields: [],
    indexes: [],
    ...overrides,
  };
}

function linkField(name: string, model: string) {
  return {
    name,
    config: { type: 'link' as const, model },
    provenance: { source: 'base' as const },
  };
}

describe('ScopeRegistry', () => {
  describe('scope registration', () => {
    it('registers scopes from modules', () => {
      const modules: ModuleConfig[] = [
        {
          name: 'core',
          label: 'Core',
          scopes: {
            company: { model: 'core.company', default: 'user.default_company', switchable: true },
          },
        },
      ];
      const schemaRegistry = new SchemaRegistry([
        makeModel({ qualifiedName: 'core.company', module: 'core', fields: [] }),
      ]);

      const scopeRegistry = new ScopeRegistry(modules, schemaRegistry);

      const scope = scopeRegistry.getScope('company');
      expect(scope).toBeDefined();
      expect(scope!.name).toBe('company');
      expect(scope!.definition.model).toBe('core.company');
      expect(scope!.module).toBe('core');
    });

    it('registers multiple scopes from different modules', () => {
      const modules: ModuleConfig[] = [
        {
          name: 'core',
          label: 'Core',
          scopes: {
            company: { model: 'core.company', default: 'user.default_company' },
          },
        },
        {
          name: 'cms',
          label: 'CMS',
          scopes: {
            workspace: { model: 'cms.workspace', default: 'user.default_workspace' },
          },
        },
      ];
      const schemaRegistry = new SchemaRegistry([
        makeModel({ qualifiedName: 'core.company', module: 'core' }),
        makeModel({ qualifiedName: 'cms.workspace', module: 'cms' }),
      ]);

      const scopeRegistry = new ScopeRegistry(modules, schemaRegistry);

      expect(scopeRegistry.getAllScopes()).toHaveLength(2);
      expect(scopeRegistry.getScope('company')).toBeDefined();
      expect(scopeRegistry.getScope('workspace')).toBeDefined();
    });

    it('throws on duplicate scope name across modules', () => {
      const modules: ModuleConfig[] = [
        {
          name: 'core',
          label: 'Core',
          scopes: { company: { model: 'core.company', default: 'user.default_company' } },
        },
        {
          name: 'sales',
          label: 'Sales',
          scopes: { company: { model: 'sales.company', default: 'user.company' } },
        },
      ];
      const schemaRegistry = new SchemaRegistry([
        makeModel({ qualifiedName: 'core.company', module: 'core' }),
        makeModel({ qualifiedName: 'sales.company', module: 'sales' }),
      ]);

      expect(() => new ScopeRegistry(modules, schemaRegistry)).toThrow(ScopeResolutionError);
      expect(() => new ScopeRegistry(modules, schemaRegistry)).toThrow(
        /Scope "company" declared by module "sales" conflicts/,
      );
    });

    it('handles modules without scopes', () => {
      const modules: ModuleConfig[] = [
        { name: 'core', label: 'Core' },
        { name: 'sales', label: 'Sales' },
      ];
      const schemaRegistry = new SchemaRegistry([]);

      const scopeRegistry = new ScopeRegistry(modules, schemaRegistry);
      expect(scopeRegistry.getAllScopes()).toHaveLength(0);
    });
  });

  describe('model binding resolution', () => {
    it('resolves scope column from link field targeting scope model', () => {
      const modules: ModuleConfig[] = [
        {
          name: 'core',
          label: 'Core',
          scopes: { company: { model: 'core.company', default: 'user.default_company' } },
        },
      ];
      const invoiceModel = makeModel({
        qualifiedName: 'sales.invoice',
        module: 'sales',
        scope: 'company',
        fields: [linkField('company', 'core.company'), linkField('customer', 'sales.customer')],
      });
      const schemaRegistry = new SchemaRegistry([
        makeModel({ qualifiedName: 'core.company', module: 'core' }),
        makeModel({ qualifiedName: 'sales.customer', module: 'sales' }),
        invoiceModel,
      ]);

      const scopeRegistry = new ScopeRegistry(modules, schemaRegistry);

      const binding = scopeRegistry.getModelBinding('sales.invoice');
      expect(binding).toBeDefined();
      expect(binding!.scopeName).toBe('company');
      expect(binding!.column).toBe('company');
      expect(binding!.scopeModel).toBe('core.company');
    });

    it('returns undefined for models without scope', () => {
      const modules: ModuleConfig[] = [
        {
          name: 'core',
          label: 'Core',
          scopes: { company: { model: 'core.company', default: 'user.default_company' } },
        },
      ];
      const customerModel = makeModel({
        qualifiedName: 'sales.customer',
        module: 'sales',
        fields: [linkField('company', 'core.company')],
      });
      const schemaRegistry = new SchemaRegistry([
        makeModel({ qualifiedName: 'core.company', module: 'core' }),
        customerModel,
      ]);

      const scopeRegistry = new ScopeRegistry(modules, schemaRegistry);
      expect(scopeRegistry.getModelBinding('sales.customer')).toBeUndefined();
      expect(scopeRegistry.isModelScoped('sales.customer')).toBe(false);
    });

    it('isModelScoped returns true for scoped models', () => {
      const modules: ModuleConfig[] = [
        {
          name: 'core',
          label: 'Core',
          scopes: { company: { model: 'core.company', default: 'user.default_company' } },
        },
      ];
      const invoiceModel = makeModel({
        qualifiedName: 'sales.invoice',
        module: 'sales',
        scope: 'company',
        fields: [linkField('company', 'core.company')],
      });
      const schemaRegistry = new SchemaRegistry([
        makeModel({ qualifiedName: 'core.company', module: 'core' }),
        invoiceModel,
      ]);

      const scopeRegistry = new ScopeRegistry(modules, schemaRegistry);
      expect(scopeRegistry.isModelScoped('sales.invoice')).toBe(true);
    });

    it('throws when model references undefined scope', () => {
      const modules: ModuleConfig[] = [{ name: 'core', label: 'Core' }];
      const invoiceModel = makeModel({
        qualifiedName: 'sales.invoice',
        module: 'sales',
        scope: 'company',
        fields: [linkField('company', 'core.company')],
      });
      const schemaRegistry = new SchemaRegistry([
        makeModel({ qualifiedName: 'core.company', module: 'core' }),
        invoiceModel,
      ]);

      expect(() => new ScopeRegistry(modules, schemaRegistry)).toThrow(ScopeResolutionError);
      expect(() => new ScopeRegistry(modules, schemaRegistry)).toThrow(
        /references scope "company" which is not defined/,
      );
    });

    it('throws when model has no link field to scope model', () => {
      const modules: ModuleConfig[] = [
        {
          name: 'core',
          label: 'Core',
          scopes: { company: { model: 'core.company', default: 'user.default_company' } },
        },
      ];
      const invoiceModel = makeModel({
        qualifiedName: 'sales.invoice',
        module: 'sales',
        scope: 'company',
        fields: [
          { name: 'total', config: { type: 'number' } as any, provenance: { source: 'base' } },
        ],
      });
      const schemaRegistry = new SchemaRegistry([
        makeModel({ qualifiedName: 'core.company', module: 'core' }),
        invoiceModel,
      ]);

      expect(() => new ScopeRegistry(modules, schemaRegistry)).toThrow(ScopeResolutionError);
      expect(() => new ScopeRegistry(modules, schemaRegistry)).toThrow(
        /has no link field to "core.company"/,
      );
    });

    it('throws when model has multiple link fields to scope model without explicit field', () => {
      const modules: ModuleConfig[] = [
        {
          name: 'core',
          label: 'Core',
          scopes: { company: { model: 'core.company', default: 'user.default_company' } },
        },
      ];
      const transferModel = makeModel({
        qualifiedName: 'accounting.transfer',
        module: 'accounting',
        scope: 'company',
        fields: [
          linkField('source_company', 'core.company'),
          linkField('target_company', 'core.company'),
        ],
      });
      const schemaRegistry = new SchemaRegistry([
        makeModel({ qualifiedName: 'core.company', module: 'core' }),
        transferModel,
      ]);

      expect(() => new ScopeRegistry(modules, schemaRegistry)).toThrow(ScopeResolutionError);
      expect(() => new ScopeRegistry(modules, schemaRegistry)).toThrow(
        /multiple link fields.*source_company, target_company/,
      );
    });

    it('uses explicit field override when model has multiple links', () => {
      const modules: ModuleConfig[] = [
        {
          name: 'core',
          label: 'Core',
          scopes: { company: { model: 'core.company', default: 'user.default_company' } },
        },
      ];
      const transferModel = makeModel({
        qualifiedName: 'accounting.transfer',
        module: 'accounting',
        scope: { name: 'company', field: 'source_company' },
        fields: [
          linkField('source_company', 'core.company'),
          linkField('target_company', 'core.company'),
        ],
      });
      const schemaRegistry = new SchemaRegistry([
        makeModel({ qualifiedName: 'core.company', module: 'core' }),
        transferModel,
      ]);

      const scopeRegistry = new ScopeRegistry(modules, schemaRegistry);
      const binding = scopeRegistry.getModelBinding('accounting.transfer');
      expect(binding).toBeDefined();
      expect(binding!.column).toBe('source_company');
      expect(binding!.scopeName).toBe('company');
    });
  });
});
