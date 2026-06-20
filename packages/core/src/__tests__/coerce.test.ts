import { describe, it, expect } from 'vitest';
import { toBool, toInt, isNil, toCount } from '../helpers/coerce.js';

describe('toBool', () => {
  it('returns true for boolean true', () => {
    expect(toBool(true)).toBe(true);
  });

  it('returns true for string "true"', () => {
    expect(toBool('true')).toBe(true);
  });

  it('returns true for number 1', () => {
    expect(toBool(1)).toBe(true);
  });

  it('returns true for string "1"', () => {
    expect(toBool('1')).toBe(true);
  });

  it('returns false for boolean false', () => {
    expect(toBool(false)).toBe(false);
  });

  it('returns false for string "false"', () => {
    expect(toBool('false')).toBe(false);
  });

  it('returns false for 0', () => {
    expect(toBool(0)).toBe(false);
  });

  it('returns false for null', () => {
    expect(toBool(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(toBool(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(toBool('')).toBe(false);
  });

  it('returns false for arbitrary string', () => {
    expect(toBool('yes')).toBe(false);
  });
});

describe('toInt', () => {
  it('returns the integer for a number', () => {
    expect(toInt(42)).toBe(42);
  });

  it('truncates floating point numbers', () => {
    expect(toInt(3.9)).toBe(3);
    expect(toInt(-2.7)).toBe(-2);
  });

  it('parses numeric strings', () => {
    expect(toInt('10')).toBe(10);
    expect(toInt('  5 ')).toBe(5);
  });

  it('returns fallback for NaN values', () => {
    expect(toInt('abc')).toBe(0);
    expect(toInt('abc', -1)).toBe(-1);
  });

  it('returns fallback for null', () => {
    expect(toInt(null)).toBe(0);
    expect(toInt(null, 99)).toBe(99);
  });

  it('returns fallback for undefined', () => {
    expect(toInt(undefined)).toBe(0);
  });

  it('returns fallback for Infinity', () => {
    expect(toInt(Infinity)).toBe(0);
    expect(toInt(-Infinity, 5)).toBe(5);
  });

  it('returns fallback for empty string', () => {
    expect(toInt('')).toBe(0);
  });

  it('handles string with leading zeros', () => {
    expect(toInt('007')).toBe(7);
  });
});

describe('isNil', () => {
  it('returns true for null', () => {
    expect(isNil(null)).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(isNil(undefined)).toBe(true);
  });

  it('returns false for 0', () => {
    expect(isNil(0)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isNil('')).toBe(false);
  });

  it('returns false for false', () => {
    expect(isNil(false)).toBe(false);
  });

  it('returns false for NaN', () => {
    expect(isNil(NaN)).toBe(false);
  });

  it('returns false for objects', () => {
    expect(isNil({})).toBe(false);
    expect(isNil([])).toBe(false);
  });
});

describe('toCount', () => {
  it('extracts count from object', () => {
    expect(toCount({ count: '5' })).toBe(5);
    expect(toCount({ count: 10 })).toBe(10);
  });

  it('returns 0 for null', () => {
    expect(toCount(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(toCount(undefined)).toBe(0);
  });

  it('returns 0 when count is missing', () => {
    expect(toCount({})).toBe(0);
  });

  it('returns 0 when count is not a number', () => {
    expect(toCount({ count: 'abc' })).toBe(0);
  });

  it('handles bigint-style string from database', () => {
    expect(toCount({ count: '12345' })).toBe(12345);
  });

  it('handles raw numeric value without object wrapper', () => {
    expect(toCount(7)).toBe(7);
    expect(toCount('3')).toBe(3);
  });
});
