import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';
import { modelToPath } from '../api/paths.js';

export interface UseRecordResult<T = unknown> {
  data: T | undefined;
  isLoading: boolean;
}

export function useRecord<T = unknown>(
  model: string,
  id: string | null | undefined,
): UseRecordResult<T> {
  const query = useQuery<T>({
    queryKey: ['model', model, id],
    queryFn: async () => {
      const path = `${modelToPath(model)}/${id}`;
      const response = await apiClient(path);
      if (!response.ok) throw response;
      return response.json() as Promise<T>;
    },
    enabled: !!id,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
  };
}
