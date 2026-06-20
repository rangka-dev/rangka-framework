import { describe, it, expect } from 'vitest';
import { HookRegistry } from '../registry.js';

describe('HookRegistry', () => {
  it('registers base hooks and retrieves chain', () => {
    const registry = new HookRegistry();
    const hooks = { validate: () => {} };
    registry.register('sales.invoice', hooks, 'sales');

    const chain = registry.getChain('sales.invoice');
    expect(chain).toBeDefined();
    expect(chain!.entries).toHaveLength(1);
    expect(chain!.entries[0].source).toBe('sales');
    expect(chain!.entries[0].hooks).toBe(hooks);
  });

  it('returns undefined for unknown model', () => {
    const registry = new HookRegistry();
    expect(registry.getChain('unknown.model')).toBeUndefined();
  });

  it('hasHooks returns false for unknown model', () => {
    const registry = new HookRegistry();
    expect(registry.hasHooks('unknown.model')).toBe(false);
  });

  it('merges extension hooks after base in registration order', () => {
    const registry = new HookRegistry();
    const baseHooks = { beforeCreate: async () => {} };
    const extHooks = { beforeCreate: async () => {} };

    registry.register('sales.invoice', baseHooks, 'sales');
    registry.register('sales.invoice', extHooks, 'custom');

    const chain = registry.getChain('sales.invoice');
    expect(chain!.entries).toHaveLength(2);
    expect(chain!.entries[0].source).toBe('sales');
    expect(chain!.entries[1].source).toBe('custom');
  });

  it('maintains app dependency order across multiple extensions', () => {
    const registry = new HookRegistry();
    registry.register('sales.invoice', { validate: () => {} }, 'sales');
    registry.register('sales.invoice', { validate: () => {} }, 'addon_a');
    registry.register('sales.invoice', { validate: () => {} }, 'addon_b');

    const chain = registry.getChain('sales.invoice');
    expect(chain!.entries.map((e) => e.source)).toEqual(['sales', 'addon_a', 'addon_b']);
  });
});
