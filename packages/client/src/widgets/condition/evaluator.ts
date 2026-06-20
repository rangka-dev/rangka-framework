import type { Condition } from '@rangka/shared';
import { parse, evaluate } from '../expression/index.js';
import type { EvalContext } from '../expression/index.js';

export function evaluateCondition(condition: Condition, context: EvalContext): boolean {
  const fieldValue = resolveFieldValue(condition.field, context);
  const compareValue = resolveValue(condition.value, context);

  switch (condition.operator) {
    case 'eq':
      return fieldValue == compareValue;
    case 'neq':
      return fieldValue != compareValue;
    case 'in':
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);
    case 'notIn':
      return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
    case 'empty':
      return fieldValue == null || fieldValue === '';
    case 'notEmpty':
      return fieldValue != null && fieldValue !== '';
    case 'gt':
      return Number(fieldValue) > Number(compareValue);
    case 'lt':
      return Number(fieldValue) < Number(compareValue);
    case 'gte':
      return Number(fieldValue) >= Number(compareValue);
    case 'lte':
      return Number(fieldValue) <= Number(compareValue);
  }
}

export function evaluateConditions(
  conditions: Condition | Condition[],
  context: EvalContext,
): boolean {
  const list = Array.isArray(conditions) ? conditions : [conditions];
  return list.every((c) => evaluateCondition(c, context));
}

function resolveFieldValue(field: string, context: EvalContext): unknown {
  const parts = field.split('.');
  let current: unknown = context;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function resolveValue(value: unknown, context: EvalContext): unknown {
  if (typeof value === 'string' && value.includes('{{')) {
    const ast = parse(value);
    return evaluate(ast, context);
  }
  return value;
}
