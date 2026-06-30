import { useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDataQuery } from '../hooks/useDataQuery.js';
import { apiClient } from '../../api/client.js';
import { modelToPath } from '../../api/paths.js';
import { filtersToParams, sortToString } from './useModelQuery.js';
import type { SortEntry } from '../reactivity/variables.js';

export interface UseInfiniteModelQueryOptions {
  model: string;
  pageSize?: number;
  enabled?: boolean;
  staticFilters?: Record<string, unknown>;
  include?: string[];
}

export interface UseInfiniteModelQueryResult {
  data: Record<string, unknown>[];
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  error: Error | null;
  total: number | undefined;
  sort: SortEntry[] | null;
}

interface PageResponse {
  data: Record<string, unknown>[];
  meta?: { total?: number };
  total?: number;
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
  const { model, pageSize = 50, enabled = true, staticFilters, include } = options;
  const { filters, sort, search } = useDataQuery(model);

  const baseParams = useMemo(() => {
    const params: Record<string, string> = {
      limit: String(pageSize),
      ...filtersToParams(filters),
      ...(staticFilters ? staticFiltersToParams(staticFilters) : {}),
    };
    const sortStr = sortToString(sort);
    if (sortStr) {
      params.sort = sortStr;
    }
    if (search) {
      params.search = search;
    }
    if (include && include.length > 0) {
      params.include = include.join(',');
    }
    return params;
  }, [filters, sort, pageSize, search, staticFilters, include]);

  const path = modelToPath(model);
  const queryKey = ['model', model, 'infinite', baseParams];

  const query = useInfiniteQuery<PageResponse>({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const url = new URL(path, window.location.origin);
      for (const [key, value] of Object.entries(baseParams)) {
        url.searchParams.set(key, value);
      }
      url.searchParams.set('page', String(pageParam));
      const response = await apiClient(url.pathname + url.search);
      if (!response.ok) throw new Error(`Failed to fetch ${model} list`);
      return response.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.meta?.total ?? lastPage.total;
      if (total == null) return undefined;
      const fetched = allPages.length * pageSize;
      return fetched < total ? allPages.length + 1 : undefined;
    },
    enabled: enabled && !!model,
  });

  const data = useMemo(() => {
    if (!query.data) return [];
    return query.data.pages.flatMap((page) => page.data);
  }, [query.data]);

  const total = useMemo(() => {
    if (!query.data || query.data.pages.length === 0) return undefined;
    const lastPage = query.data.pages[query.data.pages.length - 1];
    return lastPage.meta?.total ?? lastPage.total;
  }, [query.data]);

  const fetchNextPage = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  return {
    data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage,
    error: query.error,
    total,
    sort,
  };
}
