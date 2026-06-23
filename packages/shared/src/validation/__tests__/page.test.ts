import { describe, it, expect } from 'vitest';
import { validatePage } from '../schemas/page.js';

describe('validatePage', () => {
  it('accepts valid page definition', () => {
    const result = validatePage({
      key: 'sales.orders',
      label: 'Orders',
      widgets: [
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
      widgets: [{ type: 'text' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty widgets', () => {
    const result = validatePage({
      key: 'sales.orders',
      label: 'Orders',
      widgets: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts page with actions', () => {
    const result = validatePage({
      key: 'sales.orders',
      label: 'Orders',
      actions: [
        {
          type: 'button',
          label: 'Create',
          variant: 'primary',
          action: { type: 'navigate', path: '/new' },
        },
      ],
      widgets: [{ type: 'table', source: { model: 'sales.order' } }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts page with layout', () => {
    const result = validatePage({
      key: 'sales.dashboard',
      label: 'Dashboard',
      layout: 'full',
      widgets: [{ type: 'grid', children: [{ type: 'text' }] }],
    });
    expect(result.success).toBe(true);
  });
});
