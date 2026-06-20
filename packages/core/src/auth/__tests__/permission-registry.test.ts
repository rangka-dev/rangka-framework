import { describe, it, expect } from 'vitest';
import {
  PermissionRegistry,
  DuplicateRoleError,
  RoleInheritanceCycleError,
} from '../permission-registry.js';

describe('PermissionRegistry', () => {
  describe('registerRoles', () => {
    it('registers roles and retrieves them', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          sales_user: {
            label: 'Sales User',
            models: { 'sales.customer': { read: true, write: true } },
          },
        },
        'sales',
      );

      const role = registry.getRole('sales_user');
      expect(role).toBeDefined();
      expect(role!.app).toBe('sales');
    });

    it('throws DuplicateRoleError for duplicate role names', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles({ admin: { label: 'Admin', models: {} } }, 'app1');

      expect(() => {
        registry.registerRoles({ admin: { label: 'Admin', models: {} } }, 'app2');
      }).toThrow(DuplicateRoleError);
    });

    it('getAllRoles returns all registered roles', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          role_a: { label: 'Role A', models: {} },
          role_b: { label: 'Role B', models: {} },
        },
        'app1',
      );

      expect(registry.getAllRoles()).toHaveLength(2);
    });
  });

  describe('inheritance resolution', () => {
    it('resolves single-level inheritance', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          parent: { label: 'Parent', models: { 'a.b': { read: true } } },
          child: { label: 'Child', extends: 'parent', models: { 'a.b': { write: true } } },
        },
        'app',
      );

      const chain = registry.getInheritanceChain('child');
      expect(chain).toEqual(['parent']);
    });

    it('resolves multi-level inheritance', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          grandparent: { label: 'Grandparent', models: { 'a.b': { read: true } } },
          parent: { label: 'Parent', extends: 'grandparent', models: {} },
          child: { label: 'Child', extends: 'parent', models: {} },
        },
        'app',
      );

      const chain = registry.getInheritanceChain('child');
      expect(chain).toEqual(['grandparent', 'parent']);
    });

    it('detects circular inheritance', () => {
      const registry = new PermissionRegistry();
      expect(() => {
        registry.registerRoles(
          {
            a: { label: 'A', extends: 'b', models: {} },
            b: { label: 'B', extends: 'a', models: {} },
          },
          'app',
        );
      }).toThrow(RoleInheritanceCycleError);
    });

    it('throws for inheritance from unknown role', () => {
      const registry = new PermissionRegistry();
      expect(() => {
        registry.registerRoles(
          {
            child: { label: 'Child', extends: 'non_existent', models: {} },
          },
          'app',
        );
      }).toThrow(/unknown role/);
    });
  });

  describe('resolvePermissionsForRoles', () => {
    it('merges permissions additively across roles', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          role_a: { label: 'Role A', models: { 'sales.customer': { read: true, write: true } } },
          role_b: { label: 'Role B', models: { 'sales.customer': { read: true, delete: true } } },
        },
        'app',
      );

      const perms = registry.resolvePermissionsForRoles(['role_a', 'role_b']);
      expect(perms.models['sales.customer']).toEqual({
        read: true,
        write: true,
        delete: true,
      });
    });

    it('inherits permissions from parent roles', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          parent: {
            label: 'Parent',
            models: { 'sales.customer': { read: true, write: true, create: true } },
          },
          child: {
            label: 'Child',
            extends: 'parent',
            models: { 'sales.customer': { delete: true } },
          },
        },
        'app',
      );

      const perms = registry.resolvePermissionsForRoles(['child']);
      expect(perms.models['sales.customer']).toEqual({
        read: true,
        write: true,
        create: true,
        delete: true,
      });
    });

    it('merges field permissions additively (most permissive wins)', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          role_a: {
            label: 'Role A',
            models: {
              'sales.invoice': {
                read: true,
                fieldPermissions: { cost_price: { read: false } },
              },
            },
          },
          role_b: {
            label: 'Role B',
            models: {
              'sales.invoice': {
                read: true,
                fieldPermissions: { cost_price: { read: true, write: true } },
              },
            },
          },
        },
        'app',
      );

      const perms = registry.resolvePermissionsForRoles(['role_a', 'role_b']);
      expect(perms.models['sales.invoice'].fieldPermissions!.cost_price).toEqual({
        read: true,
        write: true,
      });
    });

    it('resolves pages from a single role', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          admin: { label: 'Admin', models: {}, pages: ['admin.dashboard', 'admin.settings'] },
        },
        'app',
      );

      const perms = registry.resolvePermissionsForRoles(['admin']);
      expect(perms.pages.sort()).toEqual(['admin.dashboard', 'admin.settings']);
    });

    it('merges pages from multiple roles with deduplication', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          admin: { label: 'Admin', models: {}, pages: ['admin.dashboard', 'shared.reports'] },
          sales: { label: 'Sales', models: {}, pages: ['sales.dashboard', 'shared.reports'] },
        },
        'app',
      );

      const perms = registry.resolvePermissionsForRoles(['admin', 'sales']);
      expect(perms.pages.sort()).toEqual(['admin.dashboard', 'sales.dashboard', 'shared.reports']);
    });

    it('inherits pages from parent roles', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          sales_rep: { label: 'Sales Rep', models: {}, pages: ['sales.dashboard'] },
          sales_mgr: {
            label: 'Sales Mgr',
            extends: 'sales_rep',
            models: {},
            pages: ['sales.reports'],
          },
        },
        'app',
      );

      const perms = registry.resolvePermissionsForRoles(['sales_mgr']);
      expect(perms.pages.sort()).toEqual(['sales.dashboard', 'sales.reports']);
    });

    it('returns empty pages when no role defines pages', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          basic: { label: 'Basic', models: { 'a.b': { read: true } } },
        },
        'app',
      );

      const perms = registry.resolvePermissionsForRoles(['basic']);
      expect(perms.pages).toEqual([]);
    });

    it('true permission is never downgraded by own', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          admin: { label: 'Admin', models: { 'sales.order': { write: true, delete: true } } },
          restricted: {
            label: 'Restricted',
            models: { 'sales.order': { write: 'own', delete: 'own' } },
          },
        },
        'app',
      );

      const perms = registry.resolvePermissionsForRoles(['admin', 'restricted']);
      expect(perms.models['sales.order'].write).toBe(true);
      expect(perms.models['sales.order'].delete).toBe(true);
    });

    it('own is upgraded to true when a more permissive role is applied', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          restricted: {
            label: 'Restricted',
            models: { 'sales.order': { write: 'own', delete: 'own' } },
          },
          admin: { label: 'Admin', models: { 'sales.order': { write: true, delete: true } } },
        },
        'app',
      );

      const perms = registry.resolvePermissionsForRoles(['restricted', 'admin']);
      expect(perms.models['sales.order'].write).toBe(true);
      expect(perms.models['sales.order'].delete).toBe(true);
    });

    it('own remains own when no higher grant exists', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          sales_rep: {
            label: 'Sales Rep',
            models: { 'sales.order': { read: true, write: 'own', delete: 'own', create: true } },
          },
        },
        'app',
      );

      const perms = registry.resolvePermissionsForRoles(['sales_rep']);
      expect(perms.models['sales.order'].write).toBe('own');
      expect(perms.models['sales.order'].delete).toBe('own');
      expect(perms.models['sales.order'].read).toBe(true);
      expect(perms.models['sales.order'].create).toBe(true);
    });

    it('inherited role with true overrides child own', () => {
      const registry = new PermissionRegistry();
      registry.registerRoles(
        {
          base: { label: 'Base', models: { 'sales.order': { write: true } } },
          child: { label: 'Child', extends: 'base', models: { 'sales.order': { write: 'own' } } },
        },
        'app',
      );

      // Parent grants true first, child's 'own' should not downgrade
      const perms = registry.resolvePermissionsForRoles(['child']);
      expect(perms.models['sales.order'].write).toBe(true);
    });
  });
});
