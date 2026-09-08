import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthenticatedUser } from '../../types/auth';
import { authQueryKey } from './hooks';
import { AUTH_UNAUTHORIZED_EVENT } from './session-events';

export function AuthSessionBoundary({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleUnauthorized() {
      queryClient.setQueryData<AuthenticatedUser | null>(authQueryKey, null);
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      });
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [queryClient]);

  return children;
}
