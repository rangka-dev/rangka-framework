import { useMemo } from 'react';
import { useWidgetContext } from './useWidgetContext.js';
import { parse, evaluate } from '../expression/index.js';
import { flattenContext } from '../context/types.js';

export function useExpression(expression: string | undefined): unknown {
  const ctx = useWidgetContext();
  return useMemo(() => {
    if (!expression) return undefined;
    const flat = flattenContext(ctx);
    const ast = parse(expression);
    return evaluate(ast, flat);
  }, [expression, ctx]);
}
