import { describe, test, expect } from 'vitest';
import { buildDependencyMap } from '../reactivity/tracker.js';
import { validateWidgetTree } from '../validation/validator.js';
import type { WidgetNode, WidgetDefinitionMeta } from '@rangka/shared';

describe('Dependency Tracker Edge Cases', () => {
  test('empty widget array produces empty maps', () => {
    const map = buildDependencyMap([]);
    expect(map.fields.size).toBe(0);
    expect(map.state.size).toBe(0);
  });

  test('widget with no bind, no visible, no props has no deps', () => {
    const nodes: WidgetNode[] = [{ id: 'w1', type: 'divider' }];
    const map = buildDependencyMap(nodes);
    expect(map.fields.size).toBe(0);
    expect(map.state.size).toBe(0);
  });

  test('non-expression string props are not tracked', () => {
    const nodes: WidgetNode[] = [
      { id: 'w1', type: 'button', props: { label: 'Click me', variant: 'primary' } },
    ];
    const map = buildDependencyMap(nodes);
    expect(map.fields.size).toBe(0);
    expect(map.state.size).toBe(0);
  });

  test('deeply nested children are tracked', () => {
    const nodes: WidgetNode[] = [
      {
        id: 'l1',
        type: 'group',
        children: [
          {
            id: 'l2',
            type: 'group',
            children: [
              {
                id: 'deep',
                type: 'input',
                bind: { field: 'deep_field' },
              },
            ],
          },
        ],
      },
    ];
    const map = buildDependencyMap(nodes);
    expect(map.fields.get('deep_field')).toEqual(new Set(['deep']));
  });

  test('same widget multiple deps from different sources', () => {
    const nodes: WidgetNode[] = [
      {
        id: 'w1',
        type: 'text',
        bind: { expression: '{{qty * rate}}' },
        visible: { field: '$state.showTotal', operator: 'eq', value: true },
        props: { style: '{{if($state.bold, "bold", "body")}}' },
      },
    ];
    const map = buildDependencyMap(nodes);
    expect(map.fields.get('qty')).toContain('w1');
    expect(map.fields.get('rate')).toContain('w1');
    expect(map.state.get('showTotal')).toContain('w1');
    expect(map.state.get('bold')).toContain('w1');
  });

  test('expression with function call tracks arguments', () => {
    const nodes: WidgetNode[] = [
      {
        id: 'w1',
        type: 'text',
        bind: { expression: '{{format_currency(total, currency)}}' },
      },
    ];
    const map = buildDependencyMap(nodes);
    expect(map.fields.get('total')).toEqual(new Set(['w1']));
    expect(map.fields.get('currency')).toEqual(new Set(['w1']));
  });

  test('condition value with expression adds deps', () => {
    const nodes: WidgetNode[] = [
      {
        id: 'w1',
        type: 'section',
        visible: { field: 'total', operator: 'gt', value: '{{$state.threshold}}' },
      },
    ];
    const map = buildDependencyMap(nodes);
    expect(map.fields.get('total')).toContain('w1');
    expect(map.state.get('threshold')).toContain('w1');
  });

  test('malformed expression in props does not crash', () => {
    const nodes: WidgetNode[] = [
      {
        id: 'w1',
        type: 'text',
        props: { label: '{{@invalid syntax}}' },
      },
    ];
    const map = buildDependencyMap(nodes);
    expect(map.fields.size).toBe(0);
  });
});

describe('Validator Edge Cases', () => {
  const registry = new Map<string, WidgetDefinitionMeta>([
    [
      'input',
      {
        name: 'input',
        label: 'Input',
        category: 'input',
        schema: { label: { type: 'string' } },
        binding: 'field',
        triggers: ['change'],
        container: false,
      },
    ],
    [
      'group',
      {
        name: 'group',
        label: 'Group',
        category: 'layout',
        schema: { direction: { type: 'enum', options: ['row', 'column'] } },
        binding: 'none',
        triggers: [],
        container: true,
      },
    ],
    [
      'table',
      {
        name: 'table',
        label: 'Table',
        category: 'layout',
        schema: {},
        binding: 'none',
        triggers: ['rowClick'],
        container: true,
        accepts: ['column'],
      },
    ],
    [
      'column',
      {
        name: 'column',
        label: 'Column',
        category: 'layout',
        schema: { label: { type: 'string', required: true } },
        binding: 'none',
        triggers: [],
        container: true,
      },
    ],
  ]);

  test('empty tree produces no errors', () => {
    expect(validateWidgetTree([], registry)).toEqual([]);
  });

  test('multiple errors reported for same widget', () => {
    const nodes: WidgetNode[] = [
      {
        type: 'input',
        bind: { expression: '{{name}}' },
        on: { invalid: { type: 'refreshSource' } },
        children: [{ type: 'input' }],
      },
    ];
    const errors = validateWidgetTree(nodes, registry);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  test('deeply nested error has full path', () => {
    const nodes: WidgetNode[] = [
      {
        type: 'group',
        children: [
          {
            type: 'group',
            children: [
              {
                type: 'group',
                children: [{ type: 'nonexistent' }],
              },
            ],
          },
        ],
      },
    ];
    const errors = validateWidgetTree(nodes, registry);
    expect(errors[0].path).toBe('[0].children[0].children[0].children[0]');
  });

  test('container with empty children is valid', () => {
    const nodes: WidgetNode[] = [{ type: 'group', children: [] }];
    expect(validateWidgetTree(nodes, registry)).toEqual([]);
  });

  test('container without children field is valid', () => {
    const nodes: WidgetNode[] = [{ type: 'group' }];
    expect(validateWidgetTree(nodes, registry)).toEqual([]);
  });

  test('table accepts column children', () => {
    const nodes: WidgetNode[] = [
      {
        type: 'table',
        source: { model: 'test' },
        children: [
          { type: 'column', props: { label: 'Name' } },
          { type: 'column', props: { label: 'Email' } },
        ],
      },
    ];
    expect(validateWidgetTree(nodes, registry)).toEqual([]);
  });

  test('table rejects multiple invalid children', () => {
    const nodes: WidgetNode[] = [
      {
        type: 'table',
        source: { model: 'test' },
        children: [{ type: 'input', bind: { field: 'x' } }, { type: 'group' }],
      },
    ];
    const errors = validateWidgetTree(nodes, registry);
    expect(errors).toHaveLength(2);
    expect(errors[0].path).toContain('children[0]');
    expect(errors[1].path).toContain('children[1]');
  });

  test('prop with boolean default not required', () => {
    const nodes: WidgetNode[] = [{ type: 'group', props: {} }];
    expect(validateWidgetTree(nodes, registry)).toEqual([]);
  });
});
