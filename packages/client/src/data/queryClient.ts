import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(onSessionExpired: () => void): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof Response && error.status === 401) {
            onSessionExpired();
            return false;
          }
          return failureCount < 3;
        },
        staleTime: 30_000,
      },
    },
  });
}
