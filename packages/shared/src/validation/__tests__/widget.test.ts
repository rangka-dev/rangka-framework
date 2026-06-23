import { describe, it, expect } from 'vitest';
import {
  widgetActionSchema,
  widgetNodeSchema,
  widgetDefinitionMetaSchema,
} from '../schemas/widget.js';

describe('widgetActionSchema', () => {
  it('accepts setValue action', () => {
    const result = widgetActionSchema.safeParse({ type: 'setValue', field: 'name', value: 'test' });
    expect(result.success).toBe(true);
  });

  it('accepts clearValue action', () => {
    const result = widgetActionSchema.safeParse({ type: 'clearValue', field: 'name' });
    expect(result.success).toBe(true);
  });

  it('accepts navigate action', () => {
    const result = widgetActionSchema.safeParse({ type: 'navigate', path: '/orders' });
    expect(result.success).toBe(true);
  });

  it('accepts service action with nested onSuccess', () => {
    const result = widgetActionSchema.safeParse({
      type: 'service',
      name: 'sales.submit',
      params: { id: '123' },
      onSuccess: { type: 'navigate', path: '/success' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts sequence action with nested actions', () => {
    const result = widgetActionSchema.safeParse({
      type: 'sequence',
      actions: [
        { type: 'validate' },
        { type: 'service', name: 'sales.submit' },
        { type: 'navigate', path: '/done' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts conditional action', () => {
    const result = widgetActionSchema.safeParse({
      type: 'conditional',
      condition: { field: 'status', operator: 'eq', value: 'draft' },
      then: { type: 'service', name: 'sales.submit' },
      else: { type: 'navigate', path: '/error' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts model.create action', () => {
    const result = widgetActionSchema.safeParse({
      type: 'model.create',
      model: 'sales.order',
      data: { customer: 'abc' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts form.submit action', () => {
    const result = widgetActionSchema.safeParse({ type: 'form.submit' });
    expect(result.success).toBe(true);
  });

  it('rejects unknown action type', () => {
    const result = widgetActionSchema.safeParse({ type: 'unknown_action' });
    expect(result.success).toBe(false);
  });

  it('rejects setValue without field', () => {
    const result = widgetActionSchema.safeParse({ type: 'setValue', value: 'test' });
    expect(result.success).toBe(false);
  });
});

describe('widgetNodeSchema', () => {
  it('accepts minimal widget node', () => {
    const result = widgetNodeSchema.safeParse({ type: 'input' });
    expect(result.success).toBe(true);
  });

  it('accepts widget with binding', () => {
    const result = widgetNodeSchema.safeParse({
      type: 'input',
      bind: { field: 'customer_name' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts widget with children (recursive)', () => {
    const result = widgetNodeSchema.safeParse({
      type: 'group',
      children: [
        { type: 'input', bind: { field: 'name' } },
        { type: 'input', bind: { field: 'email' } },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts widget with event handlers', () => {
    const result = widgetNodeSchema.safeParse({
      type: 'button',
      on: {
        click: { type: 'service', name: 'sales.submit' },
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts widget with array of actions on event', () => {
    const result = widgetNodeSchema.safeParse({
      type: 'button',
      on: {
        click: [{ type: 'validate' }, { type: 'service', name: 'sales.submit' }],
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts widget with visibility condition', () => {
    const result = widgetNodeSchema.safeParse({
      type: 'section',
      visible: { field: 'status', operator: 'eq', value: 'active' },
      children: [{ type: 'text' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts widget with source', () => {
    const result = widgetNodeSchema.safeParse({
      type: 'data',
      source: { model: 'sales.order', limit: 10 },
      children: [{ type: 'text' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts custom widget types', () => {
    const result = widgetNodeSchema.safeParse({
      type: 'my-custom-chart',
      props: { series: ['revenue', 'costs'] },
    });
    expect(result.success).toBe(true);
  });

  it('rejects widget without type', () => {
    const result = widgetNodeSchema.safeParse({ props: { label: 'test' } });
    expect(result.success).toBe(false);
  });

  it('rejects empty type string', () => {
    const result = widgetNodeSchema.safeParse({ type: '' });
    expect(result.success).toBe(false);
  });
});

describe('widgetDefinitionMetaSchema', () => {
  it('accepts valid widget definition', () => {
    const result = widgetDefinitionMetaSchema.safeParse({
      name: 'kanban',
      label: 'Kanban Board',
      category: 'data',
      schema: { columns: { type: 'string', required: true } },
      binding: 'model',
      triggers: ['cardClick', 'cardMove'],
      container: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = widgetDefinitionMetaSchema.safeParse({
      name: 'kanban',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = widgetDefinitionMetaSchema.safeParse({
      name: 'kanban',
      label: 'Kanban Board',
      category: 'invalid',
      schema: {},
      binding: 'model',
      triggers: [],
      container: false,
    });
    expect(result.success).toBe(false);
  });
});
