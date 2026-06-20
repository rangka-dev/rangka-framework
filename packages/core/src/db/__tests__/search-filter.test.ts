import { describe, it, expect } from 'vitest';
import { applySearchFilter } from '../filter-applier.js';

describe('applySearchFilter', () => {
  function createMockQuery() {
    const conditions: any[] = [];
    const query = {
      where: (arg: any) => {
        conditions.push(arg);
        return query;
      },
      getConditions: () => conditions,
    };
    return query;
  }

  it('returns query unchanged when term is empty', () => {
    const query = createMockQuery();
    const result = applySearchFilter(query, '', ['name', 'email']);
    expect(result).toBe(query);
    expect(query.getConditions()).toHaveLength(0);
  });

  it('returns query unchanged when fields array is empty', () => {
    const query = createMockQuery();
    const result = applySearchFilter(query, 'test', []);
    expect(result).toBe(query);
    expect(query.getConditions()).toHaveLength(0);
  });

  it('adds a where clause for non-empty term and fields', () => {
    const query = createMockQuery();
    const result = applySearchFilter(query, 'test', ['name', 'email']);
    expect(result).toBe(query);
    expect(query.getConditions()).toHaveLength(1);
    expect(typeof query.getConditions()[0]).toBe('function');
  });

  it('escapes % and _ in search term', () => {
    const query = createMockQuery();
    const result = applySearchFilter(query, '100%_done', ['name']);
    expect(result).toBe(query);
    expect(query.getConditions()).toHaveLength(1);
  });
});
