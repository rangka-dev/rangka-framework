import { describe, it, expect } from 'vitest';
import { validatePage } from '../schemas/page.js';

describe('validatePage', () => {
  it('accepts valid page definition', () => {
    const result = validatePage({
      key: 'sales.orders',
      label: 'Orders',
      type: 'collection',
      body: [
        {
          type: 'table',
          source: { model: 'sales.order' },
          children: [
            { type: 'column', props: { label: 'Number' }, bind: { field: 'order_number' } },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing key', () => {
    const result = validatePage({
      label: 'Orders',
      type: 'collection',
      body: [{ type: 'text' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty body', () => {
    const result = validatePage({
      key: 'sales.orders',
      label: 'Orders',
      type: 'collection',
      body: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid page type', () => {
    const result = validatePage({
      key: 'sales.orders',
      label: 'Orders',
      type: 'invalid',
      body: [{ type: 'text' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts page with actions', () => {
    const result = validatePage({
      key: 'sales.orders',
      label: 'Orders',
      type: 'collection',
      actions: [
        {
          type: 'button',
          label: 'Create',
          variant: 'primary',
          action: { type: 'navigate', path: '/new' },
        },
      ],
      body: [{ type: 'table', source: { model: 'sales.order' } }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts page with layout', () => {
    const result = validatePage({
      key: 'sales.dashboard',
      label: 'Dashboard',
      type: 'dashboard',
      layout: 'full',
      body: [{ type: 'grid', children: [{ type: 'text' }] }],
    });
    expect(result.success).toBe(true);
  });
});
