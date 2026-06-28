import { describe, it, expect } from 'vitest';
import { validateApp } from '../schemas/module.js';

describe('validateApp', () => {
  it('accepts valid app', () => {
    const result = validateApp({
      name: 'sales',
      label: 'Sales',
      icon: 'shopping-cart',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = validateApp({ label: 'Sales' });
    expect(result.success).toBe(false);
  });

  it('rejects missing label', () => {
    const result = validateApp({ name: 'sales' });
    expect(result.success).toBe(false);
  });

  it('rejects reserved app name "core"', () => {
    const result = validateApp({ name: 'core', label: 'Core' });
    expect(result.success).toBe(false);
  });

  it('rejects reserved app name case-insensitive "Core"', () => {
    const result = validateApp({ name: 'Core', label: 'Core App' });
    expect(result.success).toBe(false);
  });

  it('rejects reserved app name case-insensitive "CORE"', () => {
    const result = validateApp({ name: 'CORE', label: 'Core App' });
    expect(result.success).toBe(false);
  });

  it('rejects app names starting with "rangka"', () => {
    const result = validateApp({ name: 'rangka_internal', label: 'Internal' });
    expect(result.success).toBe(false);
  });

  it('rejects app names starting with "Rangka" (case-insensitive)', () => {
    const result = validateApp({ name: 'Rangka_test', label: 'Test' });
    expect(result.success).toBe(false);
  });

  it('accepts app with navigation', () => {
    const result = validateApp({
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

  it('accepts app with scopes', () => {
    const result = validateApp({
      name: 'sales',
      label: 'Sales',
      scopes: {
        company: { model: 'core.company', default: 'user.company_id', switchable: true },
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts app with depends', () => {
    const result = validateApp({
      name: 'invoicing',
      label: 'Invoicing',
      depends: ['sales', 'inventory'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts app with type', () => {
    const result = validateApp({
      name: 'payments',
      label: 'Payments',
      type: 'external',
    });
    expect(result.success).toBe(true);
  });
});
