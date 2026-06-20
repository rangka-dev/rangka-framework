import { useMutation as useTanstackMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';
import { modelToPath } from '../api/paths.js';

export interface UseMutationResult {
  create: (data: Record<string, unknown>) => Promise<unknown>;
  update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  remove: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function useMutation(model: string): UseMutationResult {
  const queryClient = useQueryClient();
  const basePath = modelToPath(model);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['model', model] });
  };

  const createMutation = useTanstackMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await apiClient(basePath, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw response;
      return response.json();
    },
    onSuccess: invalidate,
  });

  const updateMutation = useTanstackMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await apiClient(`${basePath}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw response;
      return response.json();
    },
    onSuccess: invalidate,
  });

  const removeMutation = useTanstackMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient(`${basePath}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw response;
    },
    onSuccess: invalidate,
  });

  return {
    create: (data) => createMutation.mutateAsync(data),
    update: (id, data) => updateMutation.mutateAsync({ id, data }),
    remove: (id) => removeMutation.mutateAsync(id),
    isLoading: createMutation.isPending || updateMutation.isPending || removeMutation.isPending,
  };
}
