import { describe, it, expect } from 'vitest';
import { getOperatorsForType, operatorSymbol } from '../filter-operators';

describe('filter-operators', () => {
  describe('getOperatorsForType', () => {
    it('returns string operators for string type', () => {
      const ops = getOperatorsForType('string');
      expect(ops.map((o) => o.value)).toContain('like');
      expect(ops.map((o) => o.value)).toContain('eq');
      expect(ops.map((o) => o.value)).toContain('empty');
    });

    it('returns numeric operators for int type', () => {
      const ops = getOperatorsForType('int');
      expect(ops.map((o) => o.value)).toContain('gt');
      expect(ops.map((o) => o.value)).toContain('lte');
      expect(ops.every((o) => o.needsValue)).toBe(true);
    });

    it('returns numeric operators for decimal type', () => {
      const ops = getOperatorsForType('decimal');
      expect(ops.map((o) => o.value)).toEqual(getOperatorsForType('int').map((o) => o.value));
    });

    it('returns numeric operators for money type', () => {
      const ops = getOperatorsForType('money');
      expect(ops.map((o) => o.value)).toContain('gt');
    });

    it('returns date operators for date type', () => {
      const ops = getOperatorsForType('date');
      expect(ops.map((o) => o.value)).toEqual(['eq', 'gt', 'lt']);
    });

    it('returns date operators for datetime type', () => {
      const ops = getOperatorsForType('datetime');
      expect(ops.map((o) => o.value)).toEqual(['eq', 'gt', 'lt']);
    });

    it('returns boolean operators for boolean type', () => {
      const ops = getOperatorsForType('boolean');
      expect(ops).toHaveLength(2);
      expect(ops.every((o) => o.needsValue === false)).toBe(true);
    });

    it('returns select operators for enum type', () => {
      const ops = getOperatorsForType('enum');
      expect(ops.map((o) => o.value)).toEqual(['eq', 'neq']);
    });

    it('returns select operators for link type', () => {
      const ops = getOperatorsForType('link');
      expect(ops.map((o) => o.value)).toEqual(['eq', 'neq']);
    });

    it('defaults to string operators for unknown type', () => {
      const ops = getOperatorsForType('unknown');
      expect(ops.map((o) => o.value)).toContain('like');
    });
  });

  describe('operatorSymbol', () => {
    it('maps eq to =', () => {
      expect(operatorSymbol('eq')).toBe('=');
    });

    it('maps neq to ≠', () => {
      expect(operatorSymbol('neq')).toBe('≠');
    });

    it('maps gt to >', () => {
      expect(operatorSymbol('gt')).toBe('>');
    });

    it('maps gte to ≥', () => {
      expect(operatorSymbol('gte')).toBe('≥');
    });

    it('maps lt to <', () => {
      expect(operatorSymbol('lt')).toBe('<');
    });

    it('maps lte to ≤', () => {
      expect(operatorSymbol('lte')).toBe('≤');
    });

    it('maps like to ≈', () => {
      expect(operatorSymbol('like')).toBe('≈');
    });

    it('maps empty to is empty', () => {
      expect(operatorSymbol('empty')).toBe('is empty');
    });

    it('maps not_empty to is not empty', () => {
      expect(operatorSymbol('not_empty')).toBe('is not empty');
    });

    it('defaults to = for unknown operator', () => {
      expect(operatorSymbol('unknown')).toBe('=');
    });
  });
});
