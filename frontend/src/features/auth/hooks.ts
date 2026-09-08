import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../api/errors';
import type { AuthenticatedUser } from '../../types/auth';
import { authApi } from './api';

export const authQueryKey = ['auth', 'me'] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: authQueryKey,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 401) {
          return null;
        }

        throw error;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      queryClient.setQueryData<AuthenticatedUser | null>(authQueryKey, user);
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: authApi.register,
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData<AuthenticatedUser | null>(authQueryKey, null);
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      });
    },
  });
}
