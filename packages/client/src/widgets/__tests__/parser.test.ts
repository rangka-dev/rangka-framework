import { describe, test, expect } from 'vitest';
import { parse } from '../expression/parser.js';

describe('Expression Parser', () => {
  test('parses number literal', () => {
    expect(parse('{{42}}')).toEqual({ type: 'literal', value: 42 });
  });

  test('parses decimal number', () => {
    expect(parse('{{3.14}}')).toEqual({ type: 'literal', value: 3.14 });
  });

  test('parses string literal (double quotes)', () => {
    expect(parse('{{"hello"}}')).toEqual({ type: 'literal', value: 'hello' });
  });

  test('parses string literal (single quotes)', () => {
    expect(parse("{{'world'}}")).toEqual({ type: 'literal', value: 'world' });
  });

  test('parses boolean true', () => {
    expect(parse('{{true}}')).toEqual({ type: 'literal', value: true });
  });

  test('parses boolean false', () => {
    expect(parse('{{false}}')).toEqual({ type: 'literal', value: false });
  });

  test('parses null', () => {
    expect(parse('{{null}}')).toEqual({ type: 'literal', value: null });
  });

  test('parses field reference', () => {
    expect(parse('{{qty}}')).toEqual({ type: 'field', path: ['qty'] });
  });

  test('parses dotted field reference', () => {
    expect(parse('{{$parent.currency}}')).toEqual({ type: 'field', path: ['$parent', 'currency'] });
  });

  test('parses deep field reference', () => {
    expect(parse('{{$root.company.name}}')).toEqual({
      type: 'field',
      path: ['$root', 'company', 'name'],
    });
  });

  test('parses addition', () => {
    expect(parse('{{a + b}}')).toEqual({
      type: 'binary',
      operator: '+',
      left: { type: 'field', path: ['a'] },
      right: { type: 'field', path: ['b'] },
    });
  });

  test('parses multiplication', () => {
    expect(parse('{{qty * rate}}')).toEqual({
      type: 'binary',
      operator: '*',
      left: { type: 'field', path: ['qty'] },
      right: { type: 'field', path: ['rate'] },
    });
  });

  test('respects operator precedence', () => {
    const ast = parse('{{a + b * c}}');
    expect(ast).toEqual({
      type: 'binary',
      operator: '+',
      left: { type: 'field', path: ['a'] },
      right: {
        type: 'binary',
        operator: '*',
        left: { type: 'field', path: ['b'] },
        right: { type: 'field', path: ['c'] },
      },
    });
  });

  test('parses parenthesized expression', () => {
    const ast = parse('{{(a + b) * c}}');
    expect(ast).toEqual({
      type: 'binary',
      operator: '*',
      left: {
        type: 'binary',
        operator: '+',
        left: { type: 'field', path: ['a'] },
        right: { type: 'field', path: ['b'] },
      },
      right: { type: 'field', path: ['c'] },
    });
  });

  test('parses comparison operators', () => {
    expect(parse('{{a == b}}')).toMatchObject({ type: 'binary', operator: '==' });
    expect(parse('{{a != b}}')).toMatchObject({ type: 'binary', operator: '!=' });
    expect(parse('{{a > b}}')).toMatchObject({ type: 'binary', operator: '>' });
    expect(parse('{{a < b}}')).toMatchObject({ type: 'binary', operator: '<' });
    expect(parse('{{a >= b}}')).toMatchObject({ type: 'binary', operator: '>=' });
    expect(parse('{{a <= b}}')).toMatchObject({ type: 'binary', operator: '<=' });
  });

  test('parses logical operators', () => {
    expect(parse('{{a && b}}')).toMatchObject({ type: 'binary', operator: '&&' });
    expect(parse('{{a || b}}')).toMatchObject({ type: 'binary', operator: '||' });
  });

  test('parses unary not', () => {
    expect(parse('{{!active}}')).toEqual({
      type: 'unary',
      operator: '!',
      operand: { type: 'field', path: ['active'] },
    });
  });

  test('parses unary negation', () => {
    expect(parse('{{-5}}')).toEqual({
      type: 'unary',
      operator: '-',
      operand: { type: 'literal', value: 5 },
    });
  });

  test('parses function call with no args', () => {
    expect(parse('{{today()}}')).toEqual({ type: 'call', name: 'today', args: [] });
  });

  test('parses function call with args', () => {
    expect(parse('{{round(value, 2)}}')).toEqual({
      type: 'call',
      name: 'round',
      args: [
        { type: 'field', path: ['value'] },
        { type: 'literal', value: 2 },
      ],
    });
  });

  test('parses nested function call', () => {
    const ast = parse('{{format_currency(sum(items), "USD")}}');
    expect(ast).toEqual({
      type: 'call',
      name: 'format_currency',
      args: [
        { type: 'call', name: 'sum', args: [{ type: 'field', path: ['items'] }] },
        { type: 'literal', value: 'USD' },
      ],
    });
  });

  test('parses if function', () => {
    const ast = parse('{{if(status == "draft", "Pending", "Done")}}');
    expect(ast.type).toBe('call');
    expect((ast as { name: string }).name).toBe('if');
  });

  test('parses without delimiters', () => {
    expect(parse('qty * rate')).toEqual({
      type: 'binary',
      operator: '*',
      left: { type: 'field', path: ['qty'] },
      right: { type: 'field', path: ['rate'] },
    });
  });

  test('throws on invalid input', () => {
    expect(() => parse('{{@invalid}}')).toThrow();
  });
});
