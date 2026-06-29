import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { modelToPath } from '../../api/paths.js';
import { useNavigate } from '../../router/hooks.js';
import { useShell } from '../../shell/ShellContext.js';
import type { ActionHandlers } from '../action/dispatcher.js';

export interface UseActionHandlersOptions {
  model?: string;
  sourceQueryKey?: unknown[];
}

export function useActionHandlers(options: UseActionHandlersOptions = {}): ActionHandlers {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shell = useShell();

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  const handleService = useCallback(
    async (name: string, params: Record<string, unknown>): Promise<Record<string, unknown>> => {
      const response = await apiClient(`/api/services/${name}`, {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Service call failed' }));
        throw new Error(err.message ?? 'Service call failed');
      }
      return response.json();
    },
    [],
  );

  const handleRefreshSource = useCallback(() => {
    if (options.sourceQueryKey) {
      queryClient.invalidateQueries({ queryKey: options.sourceQueryKey });
    } else if (options.model) {
      queryClient.invalidateQueries({ queryKey: ['model', options.model] });
    }
  }, [queryClient, options.sourceQueryKey, options.model]);

  const handleFocus = useCallback((field: string) => {
    const el = document.querySelector(`[data-field="${field}"]`) as HTMLElement | null;
    el?.focus();
  }, []);

  const handleValidate = useCallback(async (_fields?: string[]): Promise<boolean> => {
    return true;
  }, []);

  const handleModelCreate = useCallback(
    async (model: string, data: Record<string, unknown>): Promise<Record<string, unknown>> => {
      const path = modelToPath(model);
      const response = await apiClient(path, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Create failed' }));
        throw new Error(err.message ?? 'Create failed');
      }
      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ['model', model] });
      return result;
    },
    [queryClient],
  );

  const handleModelUpdate = useCallback(
    async (
      model: string,
      id: string,
      data: Record<string, unknown>,
    ): Promise<Record<string, unknown>> => {
      const path = `${modelToPath(model)}/${id}`;
      const response = await apiClient(path, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Update failed' }));
        throw new Error(err.message ?? 'Update failed');
      }
      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ['model', model] });
      return result;
    },
    [queryClient],
  );

  const handleModelDelete = useCallback(
    async (model: string, id: string): Promise<void> => {
      const path = `${modelToPath(model)}/${id}`;
      const response = await apiClient(path, { method: 'DELETE' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Delete failed' }));
        throw new Error(err.message ?? 'Delete failed');
      }
      queryClient.invalidateQueries({ queryKey: ['model', model] });
    },
    [queryClient],
  );

  const handleModelFetch = useCallback(
    async (model: string, id: string): Promise<Record<string, unknown>> => {
      const path = `${modelToPath(model)}/${id}`;
      const response = await apiClient(path);
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Fetch failed' }));
        throw new Error(err.message ?? 'Fetch failed');
      }
      return response.json();
    },
    [],
  );

  const handleModelList = useCallback(
    async (
      model: string,
      filters?: Record<string, unknown>,
    ): Promise<Record<string, unknown>[]> => {
      const url = new URL(modelToPath(model), window.location.origin);
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          url.searchParams.set(`filter[${key}]`, String(value));
        }
      }
      const response = await apiClient(url.pathname + url.search);
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'List failed' }));
        throw new Error(err.message ?? 'List failed');
      }
      const result = await response.json();
      return Array.isArray(result) ? result : (result.data ?? []);
    },
    [],
  );

  const handleToast = useCallback(
    (message: string, variant?: string) => {
      shell.toast(message, (variant as 'info' | 'success' | 'warning' | 'error') ?? 'info');
    },
    [shell],
  );

  return useMemo(
    () => ({
      navigate: handleNavigate,
      service: handleService,
      refreshSource: handleRefreshSource,
      focus: handleFocus,
      validate: handleValidate,
      modelCreate: handleModelCreate,
      modelUpdate: handleModelUpdate,
      modelDelete: handleModelDelete,
      modelFetch: handleModelFetch,
      modelList: handleModelList,
      toast: handleToast,
    }),
    [
      handleNavigate,
      handleService,
      handleRefreshSource,
      handleFocus,
      handleValidate,
      handleModelCreate,
      handleModelUpdate,
      handleModelDelete,
      handleModelFetch,
      handleModelList,
      handleToast,
    ],
  );
}
