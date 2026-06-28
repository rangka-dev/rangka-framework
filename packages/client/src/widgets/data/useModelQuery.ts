import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useDataQuery } from '../hooks/useDataQuery.js';
import { apiClient } from '../../api/client.js';
import { modelToPath } from '../../api/paths.js';
import type { ParsedFilter, SortEntry } from '../reactivity/variables.js';

export interface UseModelQueryOptions {
  model: string;
  pageSize?: number;
  enabled?: boolean;
  staticFilters?: Record<string, unknown>;
}

export interface UseModelQueryResult {
  data: Record<string, unknown>[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  total: number | undefined;
  page: number;
  pageSize: number;
  sort: SortEntry[] | null;
}

export function filtersToParams(filters: ParsedFilter[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const f of filters) {
    const key = f.operator === 'eq' ? `filter[${f.field}]` : `filter[${f.field}][${f.operator}]`;
    params[key] = Array.isArray(f.value) ? f.value.join(',') : String(f.value);
  }
  return params;
}

export function sortToString(sort: SortEntry[] | null): string | undefined {
  if (!sort || sort.length === 0) return undefined;
  return sort.map((s) => (s.direction === 'desc' ? `-${s.field}` : s.field)).join(',');
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

export function useModelQuery(options: UseModelQueryOptions): UseModelQueryResult {
  const { model, pageSize = 20, enabled = true, staticFilters } = options;
  const { filters, sort, page: storePage, search } = useDataQuery(model);
  const page = storePage ?? 1;

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      page: String(page),
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
    return params;
  }, [filters, sort, page, pageSize, search, staticFilters]);

  const path = modelToPath(model);
  const queryKey = ['model', model, queryParams];

  const query = useQuery<
    { data: Record<string, unknown>[]; total?: number } | Record<string, unknown>[]
  >({
    queryKey,
    queryFn: async () => {
      const url = new URL(path, window.location.origin);
      for (const [key, value] of Object.entries(queryParams)) {
        url.searchParams.set(key, value);
      }
      const response = await apiClient(url.pathname + url.search);
      if (!response.ok) throw new Error(`Failed to fetch ${model} list`);
      return response.json();
    },
    enabled: enabled && !!model,
    placeholderData: keepPreviousData,
  });

  const rawData = query.data;
  let data: Record<string, unknown>[] = [];
  let total: number | undefined;

  if (rawData && !Array.isArray(rawData) && 'data' in rawData) {
    data = (
      rawData as { data: Record<string, unknown>[]; meta?: { total?: number }; total?: number }
    ).data;
    const raw = rawData as { meta?: { total?: number }; total?: number };
    total = raw.meta?.total ?? raw.total;
  } else if (Array.isArray(rawData)) {
    data = rawData;
  }

  return {
    data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    total,
    page,
    pageSize,
    sort,
  };
}
