import { describe, test, expect } from 'vitest';
import { buildDependencyMap, getAffectedWidgets } from '../reactivity/tracker.js';
import type { WidgetNode } from '@rangka/shared';

describe('Dependency Tracker', () => {
  test('tracks field binding dependency', () => {
    const nodes: WidgetNode[] = [{ id: 'w1', type: 'input', bind: { field: 'name' } }];
    const map = buildDependencyMap(nodes);
    expect(map.fields.get('name')).toEqual(new Set(['w1']));
  });

  test('tracks expression binding dependencies', () => {
    const nodes: WidgetNode[] = [
      { id: 'w1', type: 'text', bind: { expression: '{{qty * rate}}' } },
    ];
    const map = buildDependencyMap(nodes);
    expect(map.fields.get('qty')).toEqual(new Set(['w1']));
    expect(map.fields.get('rate')).toEqual(new Set(['w1']));
  });

  test('tracks $state dependency in expression', () => {
    const nodes: WidgetNode[] = [
      { id: 'w1', type: 'text', bind: { expression: '{{$state.step}}' } },
    ];
    const map = buildDependencyMap(nodes);
    expect(map.state.get('step')).toEqual(new Set(['w1']));
  });

  test('tracks visible condition field dependency', () => {
    const nodes: WidgetNode[] = [
      { id: 'w1', type: 'section', visible: { field: 'status', operator: 'eq', value: 'draft' } },
    ];
    const map = buildDependencyMap(nodes);
    expect(map.fields.get('status')).toEqual(new Set(['w1']));
  });

  test('tracks $state dependency in visible condition', () => {
    const nodes: WidgetNode[] = [
      { id: 'w1', type: 'section', visible: { field: '$state.step', operator: 'eq', value: 2 } },
    ];
    const map = buildDependencyMap(nodes);
    expect(map.state.get('step')).toEqual(new Set(['w1']));
  });

  test('tracks multiple visible conditions', () => {
    const nodes: WidgetNode[] = [
      {
        id: 'w1',
        type: 'section',
        visible: [
          { field: 'status', operator: 'eq', value: 'draft' },
          { field: '$state.editing', operator: 'eq', value: true },
        ],
      },
    ];
    const map = buildDependencyMap(nodes);
    expect(map.fields.get('status')).toEqual(new Set(['w1']));
    expect(map.state.get('editing')).toEqual(new Set(['w1']));
  });

  test('tracks props expression dependencies', () => {
    const nodes: WidgetNode[] = [
      {
        id: 'w1',
        type: 'button',
        props: {
          disabled: '{{$state.loading}}',
          label: '{{if($state.step == 3, "Submit", "Next")}}',
        },
      },
    ];
    const map = buildDependencyMap(nodes);
    expect(map.state.get('loading')).toEqual(new Set(['w1']));
    expect(map.state.get('step')).toEqual(new Set(['w1']));
  });

  test('tracks children recursively', () => {
    const nodes: WidgetNode[] = [
      {
        id: 'parent',
        type: 'group',
        children: [
          { id: 'child1', type: 'input', bind: { field: 'name' } },
          { id: 'child2', type: 'text', bind: { expression: '{{total}}' } },
        ],
      },
    ];
    const map = buildDependencyMap(nodes);
    expect(map.fields.get('name')).toEqual(new Set(['child1']));
    expect(map.fields.get('total')).toEqual(new Set(['child2']));
  });

  test('multiple widgets depending on same field', () => {
    const nodes: WidgetNode[] = [
      { id: 'w1', type: 'input', bind: { field: 'qty' } },
      { id: 'w2', type: 'text', bind: { expression: '{{qty * rate}}' } },
    ];
    const map = buildDependencyMap(nodes);
    expect(map.fields.get('qty')).toEqual(new Set(['w1', 'w2']));
  });

  test('getAffectedWidgets returns correct set for field', () => {
    const nodes: WidgetNode[] = [
      { id: 'w1', type: 'input', bind: { field: 'qty' } },
      { id: 'w2', type: 'text', bind: { expression: '{{qty * rate}}' } },
      { id: 'w3', type: 'text', bind: { field: 'name' } },
    ];
    const map = buildDependencyMap(nodes);
    expect(getAffectedWidgets(map, 'qty', false)).toEqual(new Set(['w1', 'w2']));
    expect(getAffectedWidgets(map, 'name', false)).toEqual(new Set(['w3']));
  });

  test('getAffectedWidgets returns correct set for state key', () => {
    const nodes: WidgetNode[] = [
      { id: 'w1', type: 'button', props: { disabled: '{{$state.loading}}' } },
      { id: 'w2', type: 'section', visible: { field: '$state.step', operator: 'eq', value: 2 } },
    ];
    const map = buildDependencyMap(nodes);
    expect(getAffectedWidgets(map, 'loading', true)).toEqual(new Set(['w1']));
    expect(getAffectedWidgets(map, 'step', true)).toEqual(new Set(['w2']));
  });

  test('getAffectedWidgets returns empty set for unknown key', () => {
    const map = buildDependencyMap([]);
    expect(getAffectedWidgets(map, 'unknown', false)).toEqual(new Set());
  });

  test('generates path-based id when node has no id', () => {
    const nodes: WidgetNode[] = [{ type: 'input', bind: { field: 'name' } }];
    const map = buildDependencyMap(nodes);
    expect(map.fields.get('name')).toEqual(new Set(['[0]']));
  });
});
