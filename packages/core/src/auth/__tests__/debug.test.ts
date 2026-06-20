import { describe, it, expect } from 'vitest';
import { formatDebugResult } from '../debug.js';
import type { DebugResult } from '../debug.js';

describe('debug permissions', () => {
  describe('formatDebugResult', () => {
    it('formats a complete debug result', () => {
      const result: DebugResult = {
        user: { email: 'john@test.com', id: 'u1', enabled: true },
        roles: ['Sales User', 'Sales Manager'],
        inheritanceChains: {
          'Sales User': [],
          'Sales Manager': ['Sales User'],
        },
        effectivePermissions: {
          'sales.customer': { read: true, write: true, create: true, delete: true },
          'sales.invoice': { read: true, write: true },
        },
        fieldRestrictions: {
          'sales.invoice': { hidden: ['cost_price'], readOnly: ['discount_limit'] },
        },
      };

      const output = formatDebugResult(result);

      expect(output).toContain('john@test.com');
      expect(output).toContain('Sales User, Sales Manager');
      expect(output).toContain('Sales Manager ← Sales User');
      expect(output).toContain('sales.customer: read, write, create, delete');
      expect(output).toContain('cost_price');
      expect(output).toContain('discount_limit');
    });

    it('handles user with no roles', () => {
      const result: DebugResult = {
        user: { email: 'nobody@test.com', id: 'u3', enabled: true },
        roles: [],
        inheritanceChains: {},
        effectivePermissions: {},
        fieldRestrictions: {},
      };

      const output = formatDebugResult(result);
      expect(output).toContain('Roles: (none)');
    });
  });
});
