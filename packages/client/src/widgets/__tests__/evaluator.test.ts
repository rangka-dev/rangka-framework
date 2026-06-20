import { describe, test, expect } from 'vitest';
import { parse } from '../expression/parser.js';
import { evaluate } from '../expression/evaluator.js';

describe('Expression Evaluator', () => {
  test('evaluates number literal', () => {
    expect(evaluate(parse('{{42}}'), {})).toBe(42);
  });

  test('evaluates string literal', () => {
    expect(evaluate(parse('{{"hello"}}'), {})).toBe('hello');
  });

  test('evaluates boolean literal', () => {
    expect(evaluate(parse('{{true}}'), {})).toBe(true);
  });

  test('evaluates null literal', () => {
    expect(evaluate(parse('{{null}}'), {})).toBe(null);
  });

  test('evaluates field reference', () => {
    expect(evaluate(parse('{{qty}}'), { qty: 5 })).toBe(5);
  });

  test('evaluates dotted field reference', () => {
    expect(evaluate(parse('{{$parent.currency}}'), { $parent: { currency: 'USD' } })).toBe('USD');
  });

  test('returns undefined for missing field', () => {
    expect(evaluate(parse('{{missing}}'), {})).toBeUndefined();
  });

  test('evaluates addition', () => {
    expect(evaluate(parse('{{a + b}}'), { a: 3, b: 7 })).toBe(10);
  });

  test('evaluates subtraction', () => {
    expect(evaluate(parse('{{a - b}}'), { a: 10, b: 3 })).toBe(7);
  });

  test('evaluates multiplication', () => {
    expect(evaluate(parse('{{qty * rate}}'), { qty: 5, rate: 100 })).toBe(500);
  });

  test('evaluates division', () => {
    expect(evaluate(parse('{{a / b}}'), { a: 10, b: 2 })).toBe(5);
  });

  test('division by zero returns 0', () => {
    expect(evaluate(parse('{{a / b}}'), { a: 10, b: 0 })).toBe(0);
  });

  test('evaluates modulo', () => {
    expect(evaluate(parse('{{a % b}}'), { a: 10, b: 3 })).toBe(1);
  });

  test('string concatenation with +', () => {
    expect(evaluate(parse('{{name + " " + suffix}}'), { name: 'Order', suffix: '#1' })).toBe(
      'Order #1',
    );
  });

  test('evaluates equality', () => {
    expect(evaluate(parse('{{status == "draft"}}'), { status: 'draft' })).toBe(true);
    expect(evaluate(parse('{{status == "draft"}}'), { status: 'submitted' })).toBe(false);
  });

  test('evaluates inequality', () => {
    expect(evaluate(parse('{{status != "draft"}}'), { status: 'submitted' })).toBe(true);
  });

  test('evaluates comparison operators', () => {
    expect(evaluate(parse('{{a > b}}'), { a: 5, b: 3 })).toBe(true);
    expect(evaluate(parse('{{a < b}}'), { a: 5, b: 3 })).toBe(false);
    expect(evaluate(parse('{{a >= b}}'), { a: 5, b: 5 })).toBe(true);
    expect(evaluate(parse('{{a <= b}}'), { a: 3, b: 5 })).toBe(true);
  });

  test('evaluates logical AND (short-circuit)', () => {
    expect(evaluate(parse('{{a && b}}'), { a: true, b: 'yes' })).toBe('yes');
    expect(evaluate(parse('{{a && b}}'), { a: false, b: 'yes' })).toBe(false);
  });

  test('evaluates logical OR (short-circuit)', () => {
    expect(evaluate(parse('{{a || b}}'), { a: null, b: 'fallback' })).toBe('fallback');
    expect(evaluate(parse('{{a || b}}'), { a: 'first', b: 'second' })).toBe('first');
  });

  test('evaluates unary not', () => {
    expect(evaluate(parse('{{!active}}'), { active: true })).toBe(false);
    expect(evaluate(parse('{{!active}}'), { active: false })).toBe(true);
  });

  test('evaluates unary negation', () => {
    expect(evaluate(parse('{{-amount}}'), { amount: 50 })).toBe(-50);
  });

  test('evaluates nested expressions', () => {
    expect(evaluate(parse('{{(qty * rate) + tax}}'), { qty: 5, rate: 100, tax: 25 })).toBe(525);
  });

  test('evaluates complex expression', () => {
    const expr = '{{qty * rate * (1 - discount / 100)}}';
    expect(evaluate(parse(expr), { qty: 10, rate: 50, discount: 10 })).toBe(450);
  });
});
