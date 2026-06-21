import { useMemo } from 'react';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useDataQuery } from '../../../hooks/useDataQuery.js';
import { apiClient } from '../../../../api/client.js';
import { modelToPath } from '../../../../api/paths.js';
import { filtersToParams, sortToString } from '../../../data/useModelQuery.js';
import type { SortEntry } from '../../../reactivity/variables.js';

export interface UseInfiniteModelQueryOptions {
  model: string;
  pageSize: number;
  enabled?: boolean;
  staticFilters?: Record<string, unknown>;
}

export interface UseInfiniteModelQueryResult {
  data: Record<string, unknown>[];
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  total: number | undefined;
  sort: SortEntry[] | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  queryKey: unknown[];
}

function staticFiltersToParams(filters: Record<string, unknown>): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [field, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined) {
      params[`filter[${field}]`] = String(value);
    }
  }
  return params;
}

export function useInfiniteModelQuery(
  options: UseInfiniteModelQueryOptions,
): UseInfiniteModelQueryResult {
  const { model, pageSize, enabled = true, staticFilters } = options;
  const { filters, sort, search } = useDataQuery(model);

  const baseParams = useMemo(() => {
    const params: Record<string, string> = {
      limit: String(pageSize),
      ...filtersToParams(filters),
      ...(staticFilters ? staticFiltersToParams(staticFilters) : {}),
    };
    const sortStr = sortToString(sort);
    if (sortStr) params.sort = sortStr;
    if (search) params.search = search;
    return params;
  }, [filters, sort, pageSize, search, staticFilters]);

  const path = modelToPath(model);
  const queryKey = ['model', model, 'infinite', baseParams];

  const query = useInfiniteQuery<{
    data: Record<string, unknown>[];
    total?: number;
    meta?: { total?: number };
  }>({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const url = new URL(path, window.location.origin);
      for (const [key, value] of Object.entries(baseParams)) {
        url.searchParams.set(key, value);
      }
      url.searchParams.set('page', String(pageParam));
      const response = await apiClient(url.pathname + url.search);
      if (!response.ok) throw new Error(`Failed to fetch ${model} list`);
      const json = await response.json();
      if (Array.isArray(json)) {
        return { data: json, total: undefined };
      }
      return json;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.meta?.total ?? lastPage.total;
      const fetched = allPages.reduce((sum, p) => sum + p.data.length, 0);
      if (total != null && fetched >= total) return undefined;
      if (lastPage.data.length < pageSize) return undefined;
      return allPages.length + 1;
    },
    enabled: enabled && !!model,
    placeholderData: keepPreviousData,
  });

  const data = useMemo(() => {
    if (!query.data) return [];
    return query.data.pages.flatMap((p) => p.data);
  }, [query.data]);

  const total = useMemo(() => {
    if (!query.data || query.data.pages.length === 0) return undefined;
    const lastPage = query.data.pages[query.data.pages.length - 1];
    return lastPage.meta?.total ?? lastPage.total;
  }, [query.data]);

  return {
    data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    error: query.error,
    total,
    sort,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: () => query.fetchNextPage(),
    queryKey,
  };
}
