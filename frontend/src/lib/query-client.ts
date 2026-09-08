import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (
          typeof error === 'object' &&
          error !== null &&
          'statusCode' in error &&
          error.statusCode === 401
        ) {
          return false;
        }

        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
});
