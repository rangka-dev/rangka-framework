import { describe, test, expect } from 'vitest';
import { parse } from '../expression/parser.js';
import { evaluate } from '../expression/evaluator.js';

describe('Expression Edge Cases', () => {
  describe('Parser edge cases', () => {
    test('deeply nested parentheses', () => {
      const ast = parse('{{((((a))))}}');
      expect(ast).toEqual({ type: 'field', path: ['a'] });
    });

    test('multiple unary operators', () => {
      const result = evaluate(parse('{{!!true}}'), {});
      expect(result).toBe(true);
    });

    test('double negation', () => {
      expect(evaluate(parse('{{- -5}}'), {})).toBe(5);
    });

    test('empty string literal', () => {
      expect(evaluate(parse('{{""}}'), {})).toBe('');
    });

    test('string with escaped quotes', () => {
      expect(evaluate(parse('{{"hello \\"world\\""}}'), {})).toBe('hello "world"');
    });

    test('string with escaped newline', () => {
      expect(evaluate(parse('{{"line1\\nline2"}}'), {})).toBe('line1\nline2');
    });

    test('whitespace around expression', () => {
      expect(evaluate(parse('{{  42  }}'), {})).toBe(42);
    });

    test('complex chained comparisons', () => {
      const result = evaluate(parse('{{a > 0 && a < 100}}'), { a: 50 });
      expect(result).toBe(true);
    });

    test('function call with expression arguments', () => {
      const result = evaluate(parse('{{round(a * b / 100, 2)}}'), { a: 33, b: 7 });
      expect(result).toBe(2.31);
    });

    test('identifier starting with $', () => {
      expect(parse('{{$state.loading}}')).toEqual({ type: 'field', path: ['$state', 'loading'] });
    });

    test('identifier with underscores and numbers', () => {
      expect(parse('{{field_name_2}}')).toEqual({ type: 'field', path: ['field_name_2'] });
    });

    test('throws on unclosed string', () => {
      expect(() => parse('{{"unclosed}}')).toThrow();
    });

    test('throws on unclosed parenthesis', () => {
      expect(() => parse('{{(a + b}}')).toThrow();
    });

    test('throws on empty input', () => {
      expect(() => parse('{{}}')).toThrow();
    });

    test('throws on trailing operator', () => {
      expect(() => parse('{{a +}}')).toThrow();
    });
  });

  describe('Evaluator edge cases', () => {
    test('null arithmetic yields 0', () => {
      expect(evaluate(parse('{{a + b}}'), { a: null, b: null })).toBe(0);
    });

    test('undefined field in arithmetic', () => {
      expect(evaluate(parse('{{a * 5}}'), {})).toBeNaN();
    });

    test('string + number concatenates', () => {
      expect(evaluate(parse('{{prefix + 42}}'), { prefix: 'item-' })).toBe('item-42');
    });

    test('number + string concatenates', () => {
      expect(evaluate(parse('{{42 + suffix}}'), { suffix: '-end' })).toBe('42-end');
    });

    test('null == null is true', () => {
      expect(evaluate(parse('{{a == b}}'), { a: null, b: null })).toBe(true);
    });

    test('undefined == null is true (loose equality)', () => {
      expect(evaluate(parse('{{a == b}}'), { a: undefined, b: null })).toBe(true);
    });

    test('0 == false is true (loose equality)', () => {
      expect(evaluate(parse('{{a == b}}'), { a: 0, b: false })).toBe(true);
    });

    test('deeply nested field access', () => {
      const ctx = { a: { b: { c: { d: 42 } } } };
      expect(evaluate(parse('{{a.b.c.d}}'), ctx)).toBe(42);
    });

    test('field access on null returns undefined', () => {
      expect(evaluate(parse('{{a.b.c}}'), { a: null })).toBeUndefined();
    });

    test('field access on missing intermediate returns undefined', () => {
      expect(evaluate(parse('{{a.b.c}}'), {})).toBeUndefined();
    });

    test('logical AND short-circuits (no error on null access)', () => {
      const result = evaluate(parse('{{a && a.b}}'), { a: null });
      expect(result).toBe(null);
    });

    test('logical OR short-circuits', () => {
      const result = evaluate(parse('{{a || "default"}}'), { a: 'value' });
      expect(result).toBe('value');
    });

    test('division by zero returns 0', () => {
      expect(evaluate(parse('{{100 / 0}}'), {})).toBe(0);
    });

    test('modulo by zero returns NaN', () => {
      expect(evaluate(parse('{{10 % 0}}'), {})).toBeNaN();
    });

    test('not on null is true', () => {
      expect(evaluate(parse('{{!a}}'), { a: null })).toBe(true);
    });

    test('not on 0 is true', () => {
      expect(evaluate(parse('{{!a}}'), { a: 0 })).toBe(true);
    });

    test('not on empty string is true', () => {
      expect(evaluate(parse('{{!a}}'), { a: '' })).toBe(true);
    });

    test('complex real-world: order total with discount', () => {
      const ctx = { qty: 10, rate: 50, discount: 15, tax_rate: 0.1 };
      const expr = '{{(qty * rate * (100 - discount) / 100) * (1 + tax_rate)}}';
      expect(evaluate(parse(expr), ctx)).toBeCloseTo(467.5);
    });
  });

  describe('Function edge cases', () => {
    test('sum with non-array returns 0', () => {
      expect(evaluate(parse('{{sum(items)}}'), { items: null })).toBe(0);
    });

    test('sum with mixed types coerces to numbers', () => {
      expect(evaluate(parse('{{sum(items)}}'), { items: ['10', 20, null, '30'] })).toBe(60);
    });

    test('count of non-array returns 0', () => {
      expect(evaluate(parse('{{count(items)}}'), { items: undefined })).toBe(0);
    });

    test('min of single element', () => {
      expect(evaluate(parse('{{min(items)}}'), { items: [42] })).toBe(42);
    });

    test('max of negative numbers', () => {
      expect(evaluate(parse('{{max(items)}}'), { items: [-5, -2, -10] })).toBe(-2);
    });

    test('round negative number', () => {
      expect(evaluate(parse('{{round(-3.7)}}'), {})).toBe(-4);
    });

    test('round with many decimals', () => {
      expect(evaluate(parse('{{round(1.005, 2)}}'), {})).toBeCloseTo(1.01, 1);
    });

    test('concat with null values', () => {
      expect(evaluate(parse('{{concat(a, "-", b)}}'), { a: null, b: null })).toBe('-');
    });

    test('upper of number coerces to string', () => {
      expect(evaluate(parse('{{upper(val)}}'), { val: 123 })).toBe('123');
    });

    test('format_currency with zero', () => {
      const result = evaluate(parse('{{format_currency(0, "USD")}}'), {}) as string;
      expect(result).toContain('0.00');
    });

    test('format_number with large number', () => {
      const result = evaluate(parse('{{format_number(1000000000, 0)}}'), {}) as string;
      expect(result).toBe('1,000,000,000');
    });

    test('coalesce with 0 (not null) returns 0', () => {
      expect(evaluate(parse('{{coalesce(a, 99)}}'), { a: 0 })).toBe(0);
    });

    test('coalesce with empty string (not null) returns empty string', () => {
      expect(evaluate(parse('{{coalesce(a, "default")}}'), { a: '' })).toBe('');
    });

    test('if with falsy 0 takes else branch', () => {
      expect(evaluate(parse('{{if(count, "has items", "empty")}}'), { count: 0 })).toBe('empty');
    });

    test('if with truthy non-zero takes then branch', () => {
      expect(evaluate(parse('{{if(count, "has items", "empty")}}'), { count: 5 })).toBe(
        'has items',
      );
    });

    test('add_days crossing month boundary', () => {
      expect(evaluate(parse('{{add_days("2024-01-30", 5)}}'), {})).toBe('2024-02-04');
    });

    test('add_days negative days', () => {
      expect(evaluate(parse('{{add_days("2024-03-01", -1)}}'), {})).toBe('2024-02-29');
    });

    test('diff_days same date is 0', () => {
      expect(evaluate(parse('{{diff_days("2024-01-01", "2024-01-01")}}'), {})).toBe(0);
    });

    test('diff_days negative result', () => {
      expect(evaluate(parse('{{diff_days("2024-01-01", "2024-01-10")}}'), {})).toBe(-9);
    });
  });
});
