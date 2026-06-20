import { describe, test, expect } from 'vitest';
import { evaluateCondition, evaluateConditions } from '../condition/evaluator.js';

describe('Condition Edge Cases', () => {
  test('eq with null value matches null field', () => {
    expect(evaluateCondition({ field: 'x', operator: 'eq', value: null }, { x: null })).toBe(true);
  });

  test('eq with undefined field matches null (loose)', () => {
    expect(evaluateCondition({ field: 'x', operator: 'eq', value: null }, {})).toBe(true);
  });

  test('neq null vs undefined is false (loose equality)', () => {
    expect(evaluateCondition({ field: 'x', operator: 'neq', value: null }, {})).toBe(false);
  });

  test('gt with string numbers coerces', () => {
    expect(evaluateCondition({ field: 'x', operator: 'gt', value: '5' }, { x: '10' })).toBe(true);
  });

  test('lt with null field (NaN comparison)', () => {
    expect(evaluateCondition({ field: 'x', operator: 'lt', value: 5 }, { x: null })).toBe(true);
  });

  test('in with empty array always false', () => {
    expect(evaluateCondition({ field: 'x', operator: 'in', value: [] }, { x: 'anything' })).toBe(
      false,
    );
  });

  test('notIn with empty array always true', () => {
    expect(evaluateCondition({ field: 'x', operator: 'notIn', value: [] }, { x: 'anything' })).toBe(
      true,
    );
  });

  test('empty with 0 is not empty', () => {
    expect(evaluateCondition({ field: 'x', operator: 'empty' }, { x: 0 })).toBe(false);
  });

  test('empty with false is not empty', () => {
    expect(evaluateCondition({ field: 'x', operator: 'empty' }, { x: false })).toBe(false);
  });

  test('notEmpty with 0 is true', () => {
    expect(evaluateCondition({ field: 'x', operator: 'notEmpty' }, { x: 0 })).toBe(true);
  });

  test('deeply nested field resolution', () => {
    expect(
      evaluateCondition(
        { field: '$state.wizard.currentStep', operator: 'eq', value: 3 },
        { $state: { wizard: { currentStep: 3 } } },
      ),
    ).toBe(true);
  });

  test('multiple conditions with all passing', () => {
    expect(
      evaluateConditions(
        [
          { field: 'a', operator: 'gt', value: 0 },
          { field: 'b', operator: 'notEmpty' },
          { field: 'c', operator: 'in', value: ['x', 'y'] },
        ],
        { a: 5, b: 'hello', c: 'x' },
      ),
    ).toBe(true);
  });

  test('multiple conditions short-circuits on first false', () => {
    expect(
      evaluateConditions(
        [
          { field: 'a', operator: 'eq', value: 'wrong' },
          { field: 'b', operator: 'notEmpty' },
        ],
        { a: 'right', b: 'hello' },
      ),
    ).toBe(false);
  });

  test('gte with equal values', () => {
    expect(evaluateCondition({ field: 'x', operator: 'gte', value: 10 }, { x: 10 })).toBe(true);
  });

  test('lte with equal values', () => {
    expect(evaluateCondition({ field: 'x', operator: 'lte', value: 10 }, { x: 10 })).toBe(true);
  });

  test('in operator with numeric values', () => {
    expect(evaluateCondition({ field: 'x', operator: 'in', value: [1, 2, 3] }, { x: 2 })).toBe(
      true,
    );
  });

  test('notIn operator with numeric values', () => {
    expect(evaluateCondition({ field: 'x', operator: 'notIn', value: [1, 2, 3] }, { x: 5 })).toBe(
      true,
    );
  });

  test('expression value resolves against context', () => {
    expect(
      evaluateCondition(
        { field: 'total', operator: 'gte', value: '{{min_total}}' },
        { total: 100, min_total: 50 },
      ),
    ).toBe(true);
  });

  test('expression value with function call', () => {
    expect(
      evaluateCondition(
        { field: 'count', operator: 'gt', value: '{{count(items)}}' },
        { count: 5, items: [1, 2, 3] },
      ),
    ).toBe(true);
  });
});
