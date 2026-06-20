import { useMemo } from 'react';
import { useWidgetContext } from './useWidgetContext.js';
import { usePageState, useStateVersion } from './usePageState.js';
import { evaluateConditions } from '../condition/index.js';
import { flattenContext } from '../context/types.js';
import type { Condition } from '@rangka/shared';

export function useCondition(conditions: Condition | Condition[] | undefined): boolean {
  const ctx = useWidgetContext();
  const state = usePageState();
  const stateVersion = useStateVersion();
  return useMemo(() => {
    if (!conditions) return true;
    const flat = flattenContext(ctx);
    const merged: Record<string, unknown> = {
      ...flat,
      $state: Object.fromEntries(state.keys().map((k) => [k, state.get(k)])),
    };
    return evaluateConditions(conditions, merged);
  }, [conditions, ctx, state, stateVersion]);
}
