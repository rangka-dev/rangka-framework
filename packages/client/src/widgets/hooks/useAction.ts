import { useCallback, useMemo, useRef } from 'react';
import { useWidgetContext } from './useWidgetContext.js';
import { usePageState } from './usePageState.js';
import { useFormContext } from '../form/FormContext.js';
import { dispatch } from '../action/dispatcher.js';
import type { WidgetAction } from '@rangka/shared';
import type { ActionHandlers } from '../action/dispatcher.js';

export function useAction(handlers: ActionHandlers) {
  const ctx = useWidgetContext();
  const state = usePageState();
  const form = useFormContext();

  const mergedHandlers = useMemo<ActionHandlers>(() => {
    if (!form) return handlers;
    return {
      ...handlers,
      formSubmit: form.submit,
      formReset: form.reset,
    };
  }, [handlers, form]);

  const fire = useCallback(
    async (action: WidgetAction) => {
      await dispatch(action, { widgetContext: ctx, state }, mergedHandlers);
    },
    [ctx, state, mergedHandlers],
  );

  return useMemo(() => ({ fire }), [fire]);
}

export function useTriggerHandlers(
  triggers: Record<string, WidgetAction | WidgetAction[]> | undefined,
  handlers: ActionHandlers,
  boundField?: string,
): Record<string, (...args: unknown[]) => void> {
  const ctx = useWidgetContext();
  const state = usePageState();
  const form = useFormContext();
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const mergedHandlers = useMemo<ActionHandlers>(() => {
    if (!form) return handlers;
    return {
      ...handlers,
      formSubmit: form.submit,
      formReset: form.reset,
    };
  }, [handlers, form]);

  return useMemo(() => {
    if (!triggers) return {};
    const result: Record<string, (...args: unknown[]) => void> = {};
    for (const [trigger, actionOrActions] of Object.entries(triggers)) {
      result[trigger] = async (...args: unknown[]) => {
        const actions = Array.isArray(actionOrActions) ? actionOrActions : [actionOrActions];
        const currentCtx = ctxRef.current;
        let widgetContext = currentCtx;
        if (args.length > 0 && boundField) {
          widgetContext = {
            ...currentCtx,
            record: { ...currentCtx.record, [boundField]: args[0] },
          };
        } else if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
          widgetContext = {
            ...currentCtx,
            record: { ...currentCtx.record, ...(args[0] as Record<string, unknown>) },
          };
        }
        try {
          for (const action of actions) {
            await dispatch(action, { widgetContext, state }, mergedHandlers);
          }
        } catch {
          // Action errors are handled by onError callbacks in the action tree.
        }
      };
    }
    return result;
  }, [triggers, state, mergedHandlers, boundField]);
}
