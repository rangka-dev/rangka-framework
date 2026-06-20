import { describe, test, expect, beforeEach } from 'vitest';
import { WidgetRegistry } from '../widgets/widget-registry.js';
import { validatePageBody } from '../widgets/slot-validator.js';
import type { WidgetDefinitionMeta, WidgetNode } from '@rangka/shared';

const buttonMeta: WidgetDefinitionMeta = {
  name: 'button',
  label: 'Button',
  category: 'action',
  schema: { label: { type: 'string', required: true } },
  binding: 'none',
  triggers: ['click'],
  container: false,
};

const inputMeta: WidgetDefinitionMeta = {
  name: 'input',
  label: 'Input',
  category: 'input',
  schema: { label: { type: 'string' } },
  binding: 'field',
  triggers: ['change', 'focus', 'blur'],
  container: false,
};

const groupMeta: WidgetDefinitionMeta = {
  name: 'group',
  label: 'Group',
  category: 'layout',
  schema: { direction: { type: 'enum', options: ['row', 'column'] } },
  binding: 'none',
  triggers: [],
  container: true,
};

const tableMeta: WidgetDefinitionMeta = {
  name: 'table',
  label: 'Table',
  category: 'layout',
  schema: {},
  binding: 'model',
  triggers: ['rowClick'],
  container: true,
  accepts: ['column'],
};

const columnMeta: WidgetDefinitionMeta = {
  name: 'column',
  label: 'Column',
  category: 'layout',
  schema: { label: { type: 'string', required: true } },
  binding: 'none',
  triggers: [],
  container: true,
};

describe('WidgetRegistry', () => {
  let registry: WidgetRegistry;

  beforeEach(() => {
    registry = new WidgetRegistry();
  });

  test('registers and retrieves a widget', () => {
    registry.register(buttonMeta);
    expect(registry.get('button')).toEqual(buttonMeta);
  });

  test('has returns true for registered widget', () => {
    registry.register(buttonMeta);
    expect(registry.has('button')).toBe(true);
  });

  test('has returns false for unregistered widget', () => {
    expect(registry.has('nonexistent')).toBe(false);
  });

  test('get returns undefined for unregistered widget', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  test('throws on duplicate registration', () => {
    registry.register(buttonMeta);
    expect(() => registry.register(buttonMeta)).toThrow("Widget 'button' is already registered");
  });

  test('getAll returns all registered widgets', () => {
    registry.register(buttonMeta);
    registry.register(inputMeta);
    expect(registry.getAll()).toHaveLength(2);
  });

  test('names returns all widget names', () => {
    registry.register(buttonMeta);
    registry.register(inputMeta);
    expect(registry.names().sort()).toEqual(['button', 'input']);
  });

  test('clear removes all widgets', () => {
    registry.register(buttonMeta);
    registry.clear();
    expect(registry.has('button')).toBe(false);
    expect(registry.getAll()).toHaveLength(0);
  });
});

describe('validatePageBody', () => {
  let widgetRegistry: WidgetRegistry;

  beforeEach(() => {
    widgetRegistry = new WidgetRegistry();
    widgetRegistry.register(buttonMeta);
    widgetRegistry.register(inputMeta);
    widgetRegistry.register(groupMeta);
    widgetRegistry.register(tableMeta);
    widgetRegistry.register(columnMeta);
  });

  test('valid body produces no errors', () => {
    const body: WidgetNode[] = [
      { type: 'input', bind: { field: 'name' } },
      { type: 'button', props: { label: 'Save' }, on: { click: { type: 'navigate', path: '/' } } },
    ];
    expect(validatePageBody(body, widgetRegistry)).toEqual([]);
  });

  test('empty body is valid', () => {
    expect(validatePageBody([], widgetRegistry)).toEqual([]);
  });

  test('reports unknown widget type', () => {
    const body: WidgetNode[] = [{ type: 'unknown_widget' }];
    const errors = validatePageBody(body, widgetRegistry);
    expect(errors).toHaveLength(1);
    expect(errors[0].path).toBe('body[0]');
    expect(errors[0].message).toContain('Unknown widget type');
  });

  test('reports children on non-container', () => {
    const body: WidgetNode[] = [
      { type: 'button', props: { label: 'x' }, children: [{ type: 'input' }] },
    ];
    const errors = validatePageBody(body, widgetRegistry);
    expect(errors.some((e) => e.message.includes('not a container'))).toBe(true);
  });

  test('reports disallowed child type', () => {
    const body: WidgetNode[] = [
      {
        type: 'table',
        bind: { model: { name: 'test' } },
        children: [{ type: 'button', props: { label: 'bad' } }],
      },
    ];
    const errors = validatePageBody(body, widgetRegistry);
    expect(errors.some((e) => e.message.includes('does not accept child type'))).toBe(true);
  });

  test('reports unknown trigger', () => {
    const body: WidgetNode[] = [
      { type: 'button', props: { label: 'x' }, on: { hover: { type: 'navigate', path: '/' } } },
    ];
    const errors = validatePageBody(body, widgetRegistry);
    expect(errors.some((e) => e.message.includes("Unknown trigger 'hover'"))).toBe(true);
  });

  test('reports invalid binding mode', () => {
    const body: WidgetNode[] = [{ type: 'button', props: { label: 'x' }, bind: { field: 'name' } }];
    const errors = validatePageBody(body, widgetRegistry);
    expect(errors.some((e) => e.message.includes('does not support data binding'))).toBe(true);
  });

  test('validates nested children recursively', () => {
    const body: WidgetNode[] = [
      {
        type: 'group',
        children: [
          {
            type: 'group',
            children: [{ type: 'nonexistent' }],
          },
        ],
      },
    ];
    const errors = validatePageBody(body, widgetRegistry);
    expect(errors).toHaveLength(1);
    expect(errors[0].path).toContain('children');
  });

  test('validates multiple top-level widgets independently', () => {
    const body: WidgetNode[] = [{ type: 'unknown1' }, { type: 'unknown2' }];
    const errors = validatePageBody(body, widgetRegistry);
    expect(errors).toHaveLength(2);
    expect(errors[0].path).toBe('body[0]');
    expect(errors[1].path).toBe('body[1]');
  });
});
