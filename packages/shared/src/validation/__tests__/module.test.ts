import { describe, it, expect } from 'vitest';
import { validateModule } from '../schemas/module.js';

describe('validateModule', () => {
  it('accepts valid module', () => {
    const result = validateModule({
      name: 'sales',
      label: 'Sales',
      icon: 'shopping-cart',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = validateModule({ label: 'Sales' });
    expect(result.success).toBe(false);
  });

  it('rejects missing label', () => {
    const result = validateModule({ name: 'sales' });
    expect(result.success).toBe(false);
  });

  it('rejects reserved module name "core"', () => {
    const result = validateModule({ name: 'core', label: 'Core' });
    expect(result.success).toBe(false);
  });

  it('rejects reserved module name case-insensitive "Core"', () => {
    const result = validateModule({ name: 'Core', label: 'Core Module' });
    expect(result.success).toBe(false);
  });

  it('rejects reserved module name case-insensitive "CORE"', () => {
    const result = validateModule({ name: 'CORE', label: 'Core Module' });
    expect(result.success).toBe(false);
  });

  it('rejects module names starting with "rangka"', () => {
    const result = validateModule({ name: 'rangka_internal', label: 'Internal' });
    expect(result.success).toBe(false);
  });

  it('rejects module names starting with "Rangka" (case-insensitive)', () => {
    const result = validateModule({ name: 'Rangka_test', label: 'Test' });
    expect(result.success).toBe(false);
  });

  it('accepts module with navigation', () => {
    const result = validateModule({
      name: 'sales',
      label: 'Sales',
      navigation: [
        {
          section: 'Orders',
          items: [{ page: 'sales.orders', label: 'Orders', icon: 'list' }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts module with scopes', () => {
    const result = validateModule({
      name: 'sales',
      label: 'Sales',
      scopes: {
        company: { model: 'core.company', default: 'user.company_id', switchable: true },
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts module with depends', () => {
    const result = validateModule({
      name: 'invoicing',
      label: 'Invoicing',
      depends: ['sales', 'inventory'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts module with type', () => {
    const result = validateModule({
      name: 'payments',
      label: 'Payments',
      type: 'external',
    });
    expect(result.success).toBe(true);
  });
});
