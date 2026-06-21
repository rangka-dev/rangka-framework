import { useCallback, useState } from 'react';
import { useQueryClient, useMutation as useTanstackMutation } from '@tanstack/react-query';
import { apiClient } from '../../../../api/client.js';
import { modelToPath } from '../../../../api/paths.js';

interface UseDatagridMutationsOptions {
  model: string;
  queryKey: unknown[];
}

export function useDatagridMutations({ model, queryKey }: UseDatagridMutationsOptions) {
  const queryClient = useQueryClient();
  const basePath = modelToPath(model);
  const [isLoading, setIsLoading] = useState(false);

  const cellUpdateMutation = useTanstackMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await apiClient(`${basePath}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw response;
      return response.json();
    },
  });

  const updateCell = useCallback(
    async (rowId: string, field: string, value: unknown) => {
      queryClient.setQueryData(queryKey, (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const pages = (old as { pages?: { data: Record<string, unknown>[] }[] }).pages;
        if (!Array.isArray(pages)) return old;
        return {
          ...(old as object),
          pages: pages.map((page) => ({
            ...page,
            data: page.data.map((row) =>
              String(row.id) === rowId ? { ...row, [field]: value } : row,
            ),
          })),
        };
      });

      try {
        await cellUpdateMutation.mutateAsync({ id: rowId, data: { [field]: value } });
      } catch {
        queryClient.invalidateQueries({ queryKey: ['model', model] });
        throw new Error(`Failed to update ${field}`);
      }
    },
    [model, queryKey, queryClient, cellUpdateMutation],
  );

  const createRowMutation = useTanstackMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await apiClient(basePath, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw response;
      const json = await response.json();
      return (json.data ?? json) as Record<string, unknown>;
    },
  });

  const createRow = useCallback(
    async (data: Record<string, unknown> = {}) => {
      setIsLoading(true);
      try {
        const result = await createRowMutation.mutateAsync(data);
        queryClient.setQueryData(queryKey, (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const cache = old as {
            pages?: {
              data: Record<string, unknown>[];
              total?: number;
              meta?: { total?: number };
            }[];
            pageParams?: unknown[];
          };
          if (!Array.isArray(cache.pages) || cache.pages.length === 0) return old;
          const firstPage = cache.pages[0];
          const newTotal = (firstPage.meta?.total ?? firstPage.total ?? 0) + 1;
          return {
            ...cache,
            pages: [
              {
                ...firstPage,
                data: [result as Record<string, unknown>, ...firstPage.data],
                total: newTotal,
                meta: firstPage.meta ? { ...firstPage.meta, total: newTotal } : undefined,
              },
              ...cache.pages.slice(1),
            ],
          };
        });
        return result as Record<string, unknown>;
      } finally {
        setIsLoading(false);
      }
    },
    [createRowMutation, queryClient, queryKey],
  );

  const deleteRowMutation = useTanstackMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient(`${basePath}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw response;
    },
  });

  const deleteRows = useCallback(
    async (ids: string[]) => {
      queryClient.setQueryData(queryKey, (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const pages = (old as { pages?: { data: Record<string, unknown>[] }[] }).pages;
        if (!Array.isArray(pages)) return old;
        const idSet = new Set(ids);
        return {
          ...(old as object),
          pages: pages.map((page) => ({
            ...page,
            data: page.data.filter((row) => !idSet.has(String(row.id))),
          })),
        };
      });

      try {
        await Promise.all(ids.map((id) => deleteRowMutation.mutateAsync(id)));
      } catch {
        queryClient.invalidateQueries({ queryKey: ['model', model] });
      }
    },
    [model, queryKey, queryClient, deleteRowMutation],
  );

  return { updateCell, createRow, deleteRows, isLoading };
}
