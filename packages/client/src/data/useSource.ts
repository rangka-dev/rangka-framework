import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';
import { modelToPath } from '../api/paths.js';

export interface UseSourceOptions {
  model?: string;
  endpoint?: string;
  params?: Record<string, unknown>;
  page?: number;
  pageSize?: number;
  sort?: string;
  filter?: Record<string, string>;
}

export interface UseSourceResult<T = unknown> {
  data: T[] | undefined;
  isLoading: boolean;
  pagination: { total?: number; page: number; pageSize: number } | undefined;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (sort: string | undefined) => void;
  setFilter: (field: string, value: string | undefined) => void;
  clearFilters: () => void;
  sortParam: string | undefined;
  filterParams: Record<string, string>;
}

export function useSource<T = unknown>(options: UseSourceOptions): UseSourceResult<T> {
  const { model, endpoint, params } = options;
  const path = endpoint ?? (model ? modelToPath(model) : '');

  const [page, setPage] = useState(options.page ?? 1);
  const [pageSize, setPageSize] = useState(options.pageSize ?? 20);
  const [sortParam, setSortParam] = useState<string | undefined>(options.sort);
  const [filterParams, setFilterParams] = useState<Record<string, string>>(options.filter ?? {});

  const allParams: Record<string, unknown> = {
    ...params,
    page: String(page),
    pageSize: String(pageSize),
  };
  if (sortParam) {
    allParams.sort = sortParam;
  }
  for (const [field, value] of Object.entries(filterParams)) {
    allParams[`filter[${field}]`] = value;
  }

  const queryKey = model ? ['model', model, allParams] : ['endpoint', endpoint, allParams];

  const query = useQuery<{ data: T[]; total?: number } | T[]>({
    queryKey,
    queryFn: async () => {
      const url = new URL(path, window.location.origin);
      for (const [key, value] of Object.entries(allParams)) {
        url.searchParams.set(key, String(value));
      }
      const response = await apiClient(url.pathname + url.search);
      if (!response.ok) throw response;
      return response.json();
    },
    enabled: !!path,
  });

  const rawData = query.data;
  let data: T[] | undefined;
  let total: number | undefined;

  if (rawData && !Array.isArray(rawData) && 'data' in rawData) {
    data = rawData.data;
    total = rawData.total;
  } else if (Array.isArray(rawData)) {
    data = rawData;
  }

  const setFilterField = useCallback((field: string, value: string | undefined) => {
    setFilterParams((prev) => {
      const next = { ...prev };
      if (value === undefined || value === '') {
        delete next[field];
      } else {
        next[field] = value;
      }
      return next;
    });
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilterParams({});
    setPage(1);
  }, []);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return {
    data,
    isLoading: query.isLoading,
    pagination: { total, page, pageSize },
    setPage,
    setPageSize: handleSetPageSize,
    setSort: setSortParam,
    setFilter: setFilterField,
    clearFilters,
    sortParam,
    filterParams,
  };
}
