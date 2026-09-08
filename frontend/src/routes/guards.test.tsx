import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthSessionBoundary } from '../features/auth/AuthSessionBoundary';
import { authQueryKey } from '../features/auth/hooks';
import { AUTH_UNAUTHORIZED_EVENT } from '../features/auth/session-events';
import type { AuthenticatedUser } from '../types/auth';
import { RequireAuth, RequireRole } from './guards';

function createTestQueryClient(user: AuthenticatedUser | null) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  queryClient.setQueryData(authQueryKey, user);

  return queryClient;
}

function renderWithAuth({
  initialPath,
  user,
  element,
}: {
  initialPath: string;
  user: AuthenticatedUser | null;
  element: ReactElement;
}) {
  return render(
    <QueryClientProvider client={createTestQueryClient(user)}>
      <AuthSessionBoundary>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route element={element}>
              <Route path={initialPath} element={<div>Protected page</div>} />
            </Route>
            <Route path="/login" element={<div>Login page</div>} />
            <Route path="/reports" element={<div>Reports page</div>} />
            <Route
              path="/manager/dashboard"
              element={<div>Manager dashboard</div>}
            />
          </Routes>
        </MemoryRouter>
      </AuthSessionBoundary>
    </QueryClientProvider>,
  );
}

describe('route guards', () => {
  it('redirects unauthenticated users away from protected routes', async () => {
    renderWithAuth({
      initialPath: '/reports',
      user: null,
      element: <RequireAuth />,
    });

    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('blocks team members from manager dashboard routes', async () => {
    renderWithAuth({
      initialPath: '/manager/dashboard',
      user: {
        id: 'member-1',
        name: 'Team Member',
        email: 'member@example.com',
        role: 'TEAM_MEMBER',
      },
      element: <RequireRole allowedRoles={['MANAGER']} />,
    });

    expect(await screen.findByText('Reports page')).toBeInTheDocument();
  });

  it('clears protected UI when the API reports an expired session', async () => {
    renderWithAuth({
      initialPath: '/reports',
      user: {
        id: 'member-1',
        name: 'Team Member',
        email: 'member@example.com',
        role: 'TEAM_MEMBER',
      },
      element: <RequireAuth />,
    });

    expect(await screen.findByText('Protected page')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    });

    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });
});
