import { describe, test, expect } from 'vitest';
import { validateWidgetTree } from '../validation/validator.js';
import type { WidgetDefinitionMeta, WidgetNode } from '@rangka/shared';

function makeRegistry(defs: WidgetDefinitionMeta[]): Map<string, WidgetDefinitionMeta> {
  return new Map(defs.map((d) => [d.name, d]));
}

const buttonDef: WidgetDefinitionMeta = {
  name: 'button',
  label: 'Button',
  category: 'action',
  schema: {
    label: { type: 'string', required: true },
    variant: {
      type: 'enum',
      options: ['primary', 'secondary', 'ghost', 'danger'],
      default: 'secondary',
    },
    size: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' },
  },
  binding: 'none',
  triggers: ['click'],
  container: false,
};

const inputDef: WidgetDefinitionMeta = {
  name: 'input',
  label: 'Input',
  category: 'input',
  schema: {
    label: { type: 'string' },
    placeholder: { type: 'string' },
    readOnly: { type: 'boolean' },
  },
  binding: 'field',
  triggers: ['change', 'focus', 'blur'],
  container: false,
};

const groupDef: WidgetDefinitionMeta = {
  name: 'group',
  label: 'Group',
  category: 'layout',
  schema: {
    direction: { type: 'enum', options: ['row', 'column'], default: 'column' },
    gap: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' },
  },
  binding: 'none',
  triggers: [],
  container: true,
};

const tableDef: WidgetDefinitionMeta = {
  name: 'table',
  label: 'Table',
  category: 'layout',
  schema: {
    selectable: { type: 'boolean' },
    pageSize: { type: 'number' },
  },
  binding: 'model',
  triggers: ['rowClick', 'select', 'pageChange'],
  container: true,
  accepts: ['column'],
};

const columnDef: WidgetDefinitionMeta = {
  name: 'column',
  label: 'Column',
  category: 'layout',
  schema: {
    label: { type: 'string', required: true },
    width: { type: 'string' },
  },
  binding: 'none',
  triggers: [],
  container: true,
};

const registry = makeRegistry([buttonDef, inputDef, groupDef, tableDef, columnDef]);

describe('Widget Tree Validator', () => {
  test('valid tree produces no errors', () => {
    const nodes: WidgetNode[] = [
      { type: 'button', props: { label: 'Click me' } },
      { type: 'input', bind: { field: 'name' } },
    ];
    expect(validateWidgetTree(nodes, registry)).toEqual([]);
  });

  test('rejects unknown widget type', () => {
    const nodes: WidgetNode[] = [{ type: 'unknown_widget' }];
    const errors = validateWidgetTree(nodes, registry);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Unknown widget type: 'unknown_widget'");
  });

  test('rejects children on non-container', () => {
    const nodes: WidgetNode[] = [
      { type: 'button', props: { label: 'test' }, children: [{ type: 'input' }] },
    ];
    const errors = validateWidgetTree(nodes, registry);
    expect(errors.some((e) => e.message.includes('not a container'))).toBe(true);
  });

  test('rejects disallowed child types (accepts list)', () => {
    const nodes: WidgetNode[] = [
      {
        type: 'table',
        bind: { model: { name: 'test' } },
        children: [{ type: 'button', props: { label: 'bad' } }],
      },
    ];
    const errors = validateWidgetTree(nodes, registry);
    expect(errors.some((e) => e.message.includes('does not accept child type'))).toBe(true);
  });

  test('allows valid child types', () => {
    const nodes: WidgetNode[] = [
      {
        type: 'table',
        bind: { model: { name: 'test' } },
        children: [{ type: 'column', props: { label: 'Name' } }],
      },
    ];
    expect(validateWidgetTree(nodes, registry)).toEqual([]);
  });

  test('rejects unknown prop', () => {
    const nodes: WidgetNode[] = [{ type: 'button', props: { label: 'test', unknownProp: true } }];
    const errors = validateWidgetTree(nodes, registry);
    expect(errors.some((e) => e.message.includes("Unknown prop 'unknownProp'"))).toBe(true);
  });

  test('rejects invalid prop type', () => {
    const nodes: WidgetNode[] = [{ type: 'button', props: { label: 123 } }];
    const errors = validateWidgetTree(nodes, registry);
    expect(errors.some((e) => e.message.includes("Invalid value for prop 'label'"))).toBe(true);
  });

  test('rejects invalid enum value', () => {
    const nodes: WidgetNode[] = [{ type: 'button', props: { label: 'test', variant: 'invalid' } }];
    const errors = validateWidgetTree(nodes, registry);
    expect(errors.some((e) => e.message.includes("Invalid value for prop 'variant'"))).toBe(true);
  });

  test('allows expression strings in props', () => {
    const nodes: WidgetNode[] = [
      { type: 'button', props: { label: '{{$state.label}}', variant: 'primary' } },
    ];
    expect(validateWidgetTree(nodes, registry)).toEqual([]);
  });

  test('reports missing required prop', () => {
    const nodes: WidgetNode[] = [{ type: 'button', props: { variant: 'primary' } }];
    const errors = validateWidgetTree(nodes, registry);
    expect(errors.some((e) => e.message.includes("Missing required prop 'label'"))).toBe(true);
  });

  test('reports missing required prop when no props at all', () => {
    const nodes: WidgetNode[] = [{ type: 'button' }];
    const errors = validateWidgetTree(nodes, registry);
    expect(errors.some((e) => e.message.includes("Missing required prop 'label'"))).toBe(true);
  });

  test('rejects unknown trigger in on', () => {
    const nodes: WidgetNode[] = [
      { type: 'button', props: { label: 'test' }, on: { hover: { type: 'navigate', path: '/' } } },
    ];
    const errors = validateWidgetTree(nodes, registry);
    expect(errors.some((e) => e.message.includes("Unknown trigger 'hover'"))).toBe(true);
  });

  test('allows valid trigger', () => {
    const nodes: WidgetNode[] = [
      { type: 'button', props: { label: 'test' }, on: { click: { type: 'navigate', path: '/' } } },
    ];
    expect(validateWidgetTree(nodes, registry)).toEqual([]);
  });

  test('rejects binding on widget that does not support it', () => {
    const nodes: WidgetNode[] = [
      { type: 'button', props: { label: 'test' }, bind: { field: 'name' } },
    ];
    const errors = validateWidgetTree(nodes, registry);
    expect(errors.some((e) => e.message.includes('does not support data binding'))).toBe(true);
  });

  test('rejects wrong binding mode', () => {
    const nodes: WidgetNode[] = [{ type: 'input', bind: { model: { name: 'sales.order' } } }];
    const errors = validateWidgetTree(nodes, registry);
    expect(
      errors.some((e) => e.message.includes("expects binding mode 'field' but got 'model'")),
    ).toBe(true);
  });

  test('reports error path correctly for nested widgets', () => {
    const nodes: WidgetNode[] = [
      {
        type: 'group',
        children: [{ type: 'button', props: { label: 'ok' } }, { type: 'unknown_type' }],
      },
    ];
    const errors = validateWidgetTree(nodes, registry);
    expect(errors[0].path).toBe('[0].children[1]');
  });
});
