import { useMemo } from 'react';
import { usePageState, useStateVersion } from './usePageState.js';
import {
  getFiltersForModel,
  getSortForModel,
  getPageForModel,
  getSearchForModel,
  type ParsedFilter,
  type SortEntry,
} from '../reactivity/variables.js';

export interface DataQueryState {
  filters: ParsedFilter[];
  sort: SortEntry[] | null;
  page: number | null;
  search: string | null;
}

/**
 * Hook that reads the current $filter, $sort, and $page reactive variables
 * for a given model from the page state store.
 *
 * Widgets like `table` and `data` (collection mode) use this to determine
 * what query params to send when fetching data.
 *
 * Re-renders whenever any value in the store changes (same granularity as
 * other widget hooks that use useStateVersion).
 */
export function useDataQuery(model: string): DataQueryState {
  const store = usePageState();
  // Subscribe to version changes so we re-render when any store value changes
  const version = useStateVersion();

  return useMemo(() => {
    // Build a Map view of the store for the helper functions
    const stateMap = new Map<string, unknown>();
    for (const key of store.keys()) {
      stateMap.set(key, store.get(key));
    }

    return {
      filters: getFiltersForModel(stateMap, model),
      sort: getSortForModel(stateMap, model),
      page: getPageForModel(stateMap, model),
      search: getSearchForModel(stateMap, model),
    };
  }, [store, model, version]);
}
