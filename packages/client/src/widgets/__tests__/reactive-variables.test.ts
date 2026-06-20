import { describe, test, expect } from 'vitest';
import {
  parseFilterKey,
  getFiltersForModel,
  getSortForModel,
  getPageForModel,
  isReactiveVariableKey,
  getModelFromKey,
} from '../reactivity/variables.js';
import { StateStore } from '../state/store.js';

describe('parseFilterKey', () => {
  test('parses simple eq filter', () => {
    const result = parseFilterKey('$filter.sales.order.status');
    expect(result).toEqual({ model: 'sales.order', field: 'status', operator: 'eq' });
  });

  test('parses __gt suffix', () => {
    const result = parseFilterKey('$filter.sales.order.total__gt');
    expect(result).toEqual({ model: 'sales.order', field: 'total', operator: 'gt' });
  });

  test('parses __gte suffix', () => {
    const result = parseFilterKey('$filter.sales.order.total__gte');
    expect(result).toEqual({ model: 'sales.order', field: 'total', operator: 'gte' });
  });

  test('parses __lt suffix', () => {
    const result = parseFilterKey('$filter.sales.order.total__lt');
    expect(result).toEqual({ model: 'sales.order', field: 'total', operator: 'lt' });
  });

  test('parses __lte suffix', () => {
    const result = parseFilterKey('$filter.sales.order.total__lte');
    expect(result).toEqual({ model: 'sales.order', field: 'total', operator: 'lte' });
  });

  test('parses __like suffix', () => {
    const result = parseFilterKey('$filter.sales.order.name__like');
    expect(result).toEqual({ model: 'sales.order', field: 'name', operator: 'like' });
  });

  test('parses __empty suffix', () => {
    const result = parseFilterKey('$filter.sales.order.deleted_at__empty');
    expect(result).toEqual({ model: 'sales.order', field: 'deleted_at', operator: 'empty' });
  });

  test('parses __not_empty suffix', () => {
    const result = parseFilterKey('$filter.sales.order.email__not_empty');
    expect(result).toEqual({ model: 'sales.order', field: 'email', operator: 'not_empty' });
  });

  test('returns null for non-filter keys', () => {
    expect(parseFilterKey('$state.activeTab')).toBeNull();
    expect(parseFilterKey('$sort.sales.order')).toBeNull();
    expect(parseFilterKey('$page.sales.order')).toBeNull();
    expect(parseFilterKey('random.key')).toBeNull();
  });

  test('returns null for filter key with too few segments', () => {
    expect(parseFilterKey('$filter.sales')).toBeNull();
    expect(parseFilterKey('$filter.')).toBeNull();
  });

  test('handles field names with underscores', () => {
    const result = parseFilterKey('$filter.hr.employee.first_name');
    expect(result).toEqual({ model: 'hr.employee', field: 'first_name', operator: 'eq' });
  });

  test('handles field with underscore and operator suffix', () => {
    const result = parseFilterKey('$filter.hr.employee.start_date__gte');
    expect(result).toEqual({ model: 'hr.employee', field: 'start_date', operator: 'gte' });
  });
});

describe('getFiltersForModel', () => {
  test('returns empty array when no filters exist', () => {
    const state = new Map<string, unknown>();
    expect(getFiltersForModel(state, 'sales.order')).toEqual([]);
  });

  test('returns filters for the specified model only', () => {
    const state = new Map<string, unknown>([
      ['$filter.sales.order.status', 'draft'],
      ['$filter.sales.order.total__gt', 100],
      ['$filter.hr.employee.name', 'John'],
    ]);

    const filters = getFiltersForModel(state, 'sales.order');
    expect(filters).toHaveLength(2);
    expect(filters).toContainEqual({
      model: 'sales.order',
      field: 'status',
      operator: 'eq',
      value: 'draft',
    });
    expect(filters).toContainEqual({
      model: 'sales.order',
      field: 'total',
      operator: 'gt',
      value: 100,
    });
  });

  test('uses "in" operator when value is an array', () => {
    const state = new Map<string, unknown>([['$filter.sales.order.status', ['draft', 'pending']]]);

    const filters = getFiltersForModel(state, 'sales.order');
    expect(filters).toEqual([
      {
        model: 'sales.order',
        field: 'status',
        operator: 'in',
        value: ['draft', 'pending'],
      },
    ]);
  });

  test('skips null/undefined values (cleared filters)', () => {
    const state = new Map<string, unknown>([
      ['$filter.sales.order.status', null],
      ['$filter.sales.order.total__gt', undefined],
      ['$filter.sales.order.name', 'Acme'],
    ]);

    const filters = getFiltersForModel(state, 'sales.order');
    expect(filters).toHaveLength(1);
    expect(filters[0].field).toBe('name');
  });

  test('ignores non-filter keys in the state', () => {
    const state = new Map<string, unknown>([
      ['$state.activeTab', 'orders'],
      ['$sort.sales.order', '-date'],
      ['$filter.sales.order.status', 'active'],
    ]);

    const filters = getFiltersForModel(state, 'sales.order');
    expect(filters).toHaveLength(1);
  });
});

describe('getSortForModel', () => {
  test('returns null when sort not set', () => {
    const state = new Map<string, unknown>();
    expect(getSortForModel(state, 'sales.order')).toBeNull();
  });

  test('returns null when sort is null', () => {
    const state = new Map<string, unknown>([['$sort.sales.order', null]]);
    expect(getSortForModel(state, 'sales.order')).toBeNull();
  });

  test('returns null for empty string', () => {
    const state = new Map<string, unknown>([['$sort.sales.order', '']]);
    expect(getSortForModel(state, 'sales.order')).toBeNull();
  });

  test('parses single ascending sort', () => {
    const state = new Map<string, unknown>([['$sort.sales.order', 'name']]);
    expect(getSortForModel(state, 'sales.order')).toEqual([{ field: 'name', direction: 'asc' }]);
  });

  test('parses single descending sort', () => {
    const state = new Map<string, unknown>([['$sort.sales.order', '-date']]);
    expect(getSortForModel(state, 'sales.order')).toEqual([{ field: 'date', direction: 'desc' }]);
  });

  test('parses multi-field sort', () => {
    const state = new Map<string, unknown>([['$sort.sales.order', '-date,name']]);
    expect(getSortForModel(state, 'sales.order')).toEqual([
      { field: 'date', direction: 'desc' },
      { field: 'name', direction: 'asc' },
    ]);
  });

  test('handles whitespace in sort string', () => {
    const state = new Map<string, unknown>([['$sort.sales.order', ' -date , name ']]);
    expect(getSortForModel(state, 'sales.order')).toEqual([
      { field: 'date', direction: 'desc' },
      { field: 'name', direction: 'asc' },
    ]);
  });

  test('returns sort for specific model only', () => {
    const state = new Map<string, unknown>([
      ['$sort.sales.order', '-date'],
      ['$sort.hr.employee', 'name'],
    ]);
    expect(getSortForModel(state, 'hr.employee')).toEqual([{ field: 'name', direction: 'asc' }]);
  });
});

describe('getPageForModel', () => {
  test('returns null when page not set', () => {
    const state = new Map<string, unknown>();
    expect(getPageForModel(state, 'sales.order')).toBeNull();
  });

  test('returns null when page is null', () => {
    const state = new Map<string, unknown>([['$page.sales.order', null]]);
    expect(getPageForModel(state, 'sales.order')).toBeNull();
  });

  test('returns page number', () => {
    const state = new Map<string, unknown>([['$page.sales.order', 2]]);
    expect(getPageForModel(state, 'sales.order')).toBe(2);
  });

  test('floors decimal page numbers', () => {
    const state = new Map<string, unknown>([['$page.sales.order', 2.7]]);
    expect(getPageForModel(state, 'sales.order')).toBe(2);
  });

  test('handles string page numbers', () => {
    const state = new Map<string, unknown>([['$page.sales.order', '3']]);
    expect(getPageForModel(state, 'sales.order')).toBe(3);
  });

  test('returns null for invalid page values', () => {
    const state = new Map<string, unknown>([['$page.sales.order', 'abc']]);
    expect(getPageForModel(state, 'sales.order')).toBeNull();
  });

  test('returns null for page less than 1', () => {
    const state = new Map<string, unknown>([['$page.sales.order', 0]]);
    expect(getPageForModel(state, 'sales.order')).toBeNull();
  });

  test('returns page for specific model only', () => {
    const state = new Map<string, unknown>([
      ['$page.sales.order', 5],
      ['$page.hr.employee', 2],
    ]);
    expect(getPageForModel(state, 'hr.employee')).toBe(2);
  });
});

describe('isReactiveVariableKey', () => {
  test('identifies filter keys', () => {
    expect(isReactiveVariableKey('$filter.sales.order.status')).toBe('filter');
  });

  test('identifies sort keys', () => {
    expect(isReactiveVariableKey('$sort.sales.order')).toBe('sort');
  });

  test('identifies page keys', () => {
    expect(isReactiveVariableKey('$page.sales.order')).toBe('page');
  });

  test('identifies state keys', () => {
    expect(isReactiveVariableKey('$state.activeTab')).toBe('state');
  });

  test('returns null for unrecognized keys', () => {
    expect(isReactiveVariableKey('random.key')).toBeNull();
    expect(isReactiveVariableKey('name')).toBeNull();
  });
});

describe('getModelFromKey', () => {
  test('extracts model from filter key', () => {
    expect(getModelFromKey('$filter.sales.order.status')).toBe('sales.order');
  });

  test('extracts model from sort key', () => {
    expect(getModelFromKey('$sort.sales.order')).toBe('sales.order');
  });

  test('extracts model from page key', () => {
    expect(getModelFromKey('$page.sales.order')).toBe('sales.order');
  });

  test('returns null for state keys', () => {
    expect(getModelFromKey('$state.activeTab')).toBeNull();
  });

  test('returns null for unrecognized keys', () => {
    expect(getModelFromKey('random.key')).toBeNull();
  });
});

describe('StateStore integration with reactive variables', () => {
  test('stores and retrieves $filter values', () => {
    const store = new StateStore();
    store.set('$filter.sales.order.status', 'draft');
    expect(store.get('$filter.sales.order.status')).toBe('draft');
  });

  test('stores and retrieves $sort values', () => {
    const store = new StateStore();
    store.set('$sort.sales.order', '-date,name');
    expect(store.get('$sort.sales.order')).toBe('-date,name');
  });

  test('stores and retrieves $page values', () => {
    const store = new StateStore();
    store.set('$page.sales.order', 2);
    expect(store.get('$page.sales.order')).toBe(2);
  });

  test('notifies subscribers for $filter changes', () => {
    const store = new StateStore();
    const calls: unknown[] = [];
    store.subscribe('$filter.sales.order.status', (v) => calls.push(v));
    store.set('$filter.sales.order.status', 'draft');
    store.set('$filter.sales.order.status', 'active');
    expect(calls).toEqual(['draft', 'active']);
  });

  test('notifies subscribers for $sort changes', () => {
    const store = new StateStore();
    const calls: unknown[] = [];
    store.subscribe('$sort.sales.order', (v) => calls.push(v));
    store.set('$sort.sales.order', '-date');
    store.set('$sort.sales.order', 'name');
    expect(calls).toEqual(['-date', 'name']);
  });

  test('notifies subscribers for $page changes', () => {
    const store = new StateStore();
    const calls: unknown[] = [];
    store.subscribe('$page.sales.order', (v) => calls.push(v));
    store.set('$page.sales.order', 1);
    store.set('$page.sales.order', 2);
    expect(calls).toEqual([1, 2]);
  });

  test('setMany works with mixed reactive variable keys', () => {
    const store = new StateStore();
    store.setMany({
      '$filter.sales.order.status': 'draft',
      '$sort.sales.order': '-date',
      '$page.sales.order': 1,
    });
    expect(store.get('$filter.sales.order.status')).toBe('draft');
    expect(store.get('$sort.sales.order')).toBe('-date');
    expect(store.get('$page.sales.order')).toBe(1);
  });

  test('getFiltersForModel works with store snapshot', () => {
    const store = new StateStore();
    store.set('$filter.sales.order.status', 'draft');
    store.set('$filter.sales.order.total__gt', 100);
    store.set('$sort.sales.order', '-date');

    // Build map from store keys
    const stateMap = new Map<string, unknown>();
    for (const key of store.keys()) {
      stateMap.set(key, store.get(key));
    }

    const filters = getFiltersForModel(stateMap, 'sales.order');
    expect(filters).toHaveLength(2);
    expect(filters).toContainEqual({
      model: 'sales.order',
      field: 'status',
      operator: 'eq',
      value: 'draft',
    });
    expect(filters).toContainEqual({
      model: 'sales.order',
      field: 'total',
      operator: 'gt',
      value: 100,
    });
  });

  test('clearing a filter by setting null removes it from results', () => {
    const store = new StateStore();
    store.set('$filter.sales.order.status', 'draft');
    store.set('$filter.sales.order.status', null);

    const stateMap = new Map<string, unknown>();
    for (const key of store.keys()) {
      stateMap.set(key, store.get(key));
    }

    const filters = getFiltersForModel(stateMap, 'sales.order');
    expect(filters).toHaveLength(0);
  });
});
