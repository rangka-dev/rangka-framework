import { describe, test, expect } from 'vitest';
import { evaluateCondition, evaluateConditions } from '../condition/evaluator.js';

describe('Condition Evaluator', () => {
  describe('eq operator', () => {
    test('matches equal values', () => {
      expect(
        evaluateCondition({ field: 'status', operator: 'eq', value: 'draft' }, { status: 'draft' }),
      ).toBe(true);
    });

    test('fails on unequal values', () => {
      expect(
        evaluateCondition(
          { field: 'status', operator: 'eq', value: 'draft' },
          { status: 'submitted' },
        ),
      ).toBe(false);
    });

    test('loose equality (number vs string)', () => {
      expect(evaluateCondition({ field: 'count', operator: 'eq', value: '5' }, { count: 5 })).toBe(
        true,
      );
    });
  });

  describe('neq operator', () => {
    test('passes when not equal', () => {
      expect(
        evaluateCondition(
          { field: 'status', operator: 'neq', value: 'draft' },
          { status: 'submitted' },
        ),
      ).toBe(true);
    });

    test('fails when equal', () => {
      expect(
        evaluateCondition(
          { field: 'status', operator: 'neq', value: 'draft' },
          { status: 'draft' },
        ),
      ).toBe(false);
    });
  });

  describe('in operator', () => {
    test('passes when value in array', () => {
      expect(
        evaluateCondition(
          { field: 'status', operator: 'in', value: ['draft', 'pending'] },
          { status: 'draft' },
        ),
      ).toBe(true);
    });

    test('fails when value not in array', () => {
      expect(
        evaluateCondition(
          { field: 'status', operator: 'in', value: ['draft', 'pending'] },
          { status: 'submitted' },
        ),
      ).toBe(false);
    });
  });

  describe('notIn operator', () => {
    test('passes when value not in array', () => {
      expect(
        evaluateCondition(
          { field: 'status', operator: 'notIn', value: ['draft', 'pending'] },
          { status: 'submitted' },
        ),
      ).toBe(true);
    });

    test('fails when value in array', () => {
      expect(
        evaluateCondition(
          { field: 'status', operator: 'notIn', value: ['draft', 'pending'] },
          { status: 'draft' },
        ),
      ).toBe(false);
    });
  });

  describe('empty operator', () => {
    test('passes for null', () => {
      expect(evaluateCondition({ field: 'name', operator: 'empty' }, { name: null })).toBe(true);
    });

    test('passes for undefined', () => {
      expect(evaluateCondition({ field: 'name', operator: 'empty' }, {})).toBe(true);
    });

    test('passes for empty string', () => {
      expect(evaluateCondition({ field: 'name', operator: 'empty' }, { name: '' })).toBe(true);
    });

    test('fails for non-empty value', () => {
      expect(evaluateCondition({ field: 'name', operator: 'empty' }, { name: 'test' })).toBe(false);
    });
  });

  describe('notEmpty operator', () => {
    test('passes for non-empty value', () => {
      expect(evaluateCondition({ field: 'name', operator: 'notEmpty' }, { name: 'test' })).toBe(
        true,
      );
    });

    test('fails for null', () => {
      expect(evaluateCondition({ field: 'name', operator: 'notEmpty' }, { name: null })).toBe(
        false,
      );
    });

    test('fails for empty string', () => {
      expect(evaluateCondition({ field: 'name', operator: 'notEmpty' }, { name: '' })).toBe(false);
    });
  });

  describe('gt/lt/gte/lte operators', () => {
    test('gt passes', () => {
      expect(
        evaluateCondition({ field: 'total', operator: 'gt', value: 100 }, { total: 150 }),
      ).toBe(true);
    });

    test('gt fails', () => {
      expect(evaluateCondition({ field: 'total', operator: 'gt', value: 100 }, { total: 50 })).toBe(
        false,
      );
    });

    test('lt passes', () => {
      expect(evaluateCondition({ field: 'total', operator: 'lt', value: 100 }, { total: 50 })).toBe(
        true,
      );
    });

    test('gte passes on equal', () => {
      expect(
        evaluateCondition({ field: 'total', operator: 'gte', value: 100 }, { total: 100 }),
      ).toBe(true);
    });

    test('lte passes on equal', () => {
      expect(
        evaluateCondition({ field: 'total', operator: 'lte', value: 100 }, { total: 100 }),
      ).toBe(true);
    });
  });

  describe('scope references', () => {
    test('resolves $state field', () => {
      expect(
        evaluateCondition(
          { field: '$state.step', operator: 'eq', value: 2 },
          { $state: { step: 2 } },
        ),
      ).toBe(true);
    });

    test('resolves $parent field', () => {
      expect(
        evaluateCondition(
          { field: '$parent.status', operator: 'eq', value: 'active' },
          { $parent: { status: 'active' } },
        ),
      ).toBe(true);
    });
  });

  describe('expression values', () => {
    test('resolves expression in value field', () => {
      expect(
        evaluateCondition(
          { field: 'total', operator: 'gt', value: '{{$state.threshold}}' },
          { total: 150, $state: { threshold: 100 } },
        ),
      ).toBe(true);
    });
  });

  describe('evaluateConditions (AND logic)', () => {
    test('all conditions pass', () => {
      expect(
        evaluateConditions(
          [
            { field: 'status', operator: 'eq', value: 'draft' },
            { field: 'total', operator: 'gt', value: 0 },
          ],
          { status: 'draft', total: 100 },
        ),
      ).toBe(true);
    });

    test('one condition fails', () => {
      expect(
        evaluateConditions(
          [
            { field: 'status', operator: 'eq', value: 'draft' },
            { field: 'total', operator: 'gt', value: 0 },
          ],
          { status: 'draft', total: 0 },
        ),
      ).toBe(false);
    });

    test('single condition (not array)', () => {
      expect(
        evaluateConditions(
          { field: 'status', operator: 'eq', value: 'draft' },
          { status: 'draft' },
        ),
      ).toBe(true);
    });
  });
});
