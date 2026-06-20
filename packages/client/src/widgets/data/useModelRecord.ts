import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { modelToPath } from '../../api/paths.js';

export interface UseModelRecordOptions {
  model: string;
  id: string | null | undefined;
  enabled?: boolean;
}

export interface UseModelRecordResult {
  data: Record<string, unknown> | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function useModelRecord(options: UseModelRecordOptions): UseModelRecordResult {
  const { model, id, enabled = true } = options;
  const path = modelToPath(model);

  const query = useQuery<Record<string, unknown>>({
    queryKey: ['model', model, id],
    queryFn: async () => {
      const response = await apiClient(`${path}/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch ${model}/${id}`);
      const json = await response.json();
      return json.data ?? json;
    },
    enabled: enabled && !!id,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
