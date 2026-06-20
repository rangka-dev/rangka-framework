import { describe, test, expect } from 'vitest';
import { parse } from '../expression/parser.js';
import { evaluate } from '../expression/evaluator.js';

describe('Expression Functions', () => {
  describe('Aggregate', () => {
    test('sum', () => {
      expect(evaluate(parse('{{sum(items)}}'), { items: [10, 20, 30] })).toBe(60);
    });

    test('sum of empty array', () => {
      expect(evaluate(parse('{{sum(items)}}'), { items: [] })).toBe(0);
    });

    test('count', () => {
      expect(evaluate(parse('{{count(items)}}'), { items: [1, 2, 3] })).toBe(3);
    });

    test('avg', () => {
      expect(evaluate(parse('{{avg(items)}}'), { items: [10, 20, 30] })).toBe(20);
    });

    test('avg of empty array', () => {
      expect(evaluate(parse('{{avg(items)}}'), { items: [] })).toBe(0);
    });

    test('min', () => {
      expect(evaluate(parse('{{min(items)}}'), { items: [5, 2, 8, 1] })).toBe(1);
    });

    test('max', () => {
      expect(evaluate(parse('{{max(items)}}'), { items: [5, 2, 8, 1] })).toBe(8);
    });
  });

  describe('Math', () => {
    test('round without decimals', () => {
      expect(evaluate(parse('{{round(3.7)}}'), {})).toBe(4);
    });

    test('round with decimals', () => {
      expect(evaluate(parse('{{round(3.14159, 2)}}'), {})).toBe(3.14);
    });

    test('abs', () => {
      expect(evaluate(parse('{{abs(-5)}}'), {})).toBe(5);
    });

    test('ceil', () => {
      expect(evaluate(parse('{{ceil(3.2)}}'), {})).toBe(4);
    });

    test('floor', () => {
      expect(evaluate(parse('{{floor(3.9)}}'), {})).toBe(3);
    });
  });

  describe('String', () => {
    test('upper', () => {
      expect(evaluate(parse('{{upper("hello")}}'), {})).toBe('HELLO');
    });

    test('lower', () => {
      expect(evaluate(parse('{{lower("HELLO")}}'), {})).toBe('hello');
    });

    test('concat', () => {
      expect(evaluate(parse('{{concat("a", "b", "c")}}'), {})).toBe('abc');
    });

    test('trim', () => {
      expect(evaluate(parse('{{trim("  hello  ")}}'), {})).toBe('hello');
    });

    test('upper with null', () => {
      expect(evaluate(parse('{{upper(val)}}'), { val: null })).toBe('');
    });
  });

  describe('Date', () => {
    test('today returns date string', () => {
      const result = evaluate(parse('{{today()}}'), {}) as string;
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('now returns ISO string', () => {
      const result = evaluate(parse('{{now()}}'), {}) as string;
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('add_days', () => {
      expect(evaluate(parse('{{add_days("2024-01-01", 5)}}'), {})).toBe('2024-01-06');
    });

    test('diff_days', () => {
      expect(evaluate(parse('{{diff_days("2024-01-10", "2024-01-01")}}'), {})).toBe(9);
    });

    test('format_date', () => {
      expect(evaluate(parse('{{format_date("2024-03-15", "YYYY-MM-DD")}}'), {})).toBe('2024-03-15');
    });
  });

  describe('Format', () => {
    test('format_currency', () => {
      const result = evaluate(parse('{{format_currency(1234.5, "USD")}}'), {}) as string;
      expect(result).toContain('1,234.50');
    });

    test('format_number', () => {
      const result = evaluate(parse('{{format_number(1234567, 2)}}'), {}) as string;
      expect(result).toBe('1,234,567.00');
    });
  });

  describe('Logic', () => {
    test('if true branch', () => {
      expect(evaluate(parse('{{if(true, "yes", "no")}}'), {})).toBe('yes');
    });

    test('if false branch', () => {
      expect(evaluate(parse('{{if(false, "yes", "no")}}'), {})).toBe('no');
    });

    test('if with expression condition', () => {
      expect(
        evaluate(parse('{{if(status == "draft", "Pending", "Done")}}'), { status: 'draft' }),
      ).toBe('Pending');
    });

    test('coalesce returns first non-null', () => {
      expect(evaluate(parse('{{coalesce(a, b, c)}}'), { a: null, b: undefined, c: 'found' })).toBe(
        'found',
      );
    });

    test('coalesce all null returns null', () => {
      expect(evaluate(parse('{{coalesce(a, b)}}'), { a: null, b: null })).toBe(null);
    });
  });

  describe('Error handling', () => {
    test('unknown function throws', () => {
      expect(() => evaluate(parse('{{unknown_fn()}}'), {})).toThrow('Unknown function: unknown_fn');
    });
  });
});
