import { createContext, useContext, useSyncExternalStore, useCallback } from 'react';
import { StateStore } from '../state/store.js';

const PageStateContext = createContext<StateStore | null>(null);

export const PageStateProvider = PageStateContext.Provider;

export function usePageState() {
  const store = useContext(PageStateContext);
  if (!store) {
    throw new Error('usePageState must be used within a PageStateProvider');
  }
  return store;
}

export function useStateVersion(): number {
  const store = usePageState();
  const subscribe = useCallback((cb: () => void) => store.onchange(cb), [store]);
  const getSnapshot = useCallback(() => store.getVersion(), [store]);
  return useSyncExternalStore(subscribe, getSnapshot);
}
