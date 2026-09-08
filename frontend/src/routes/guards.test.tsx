import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { authQueryKey } from '../features/auth/hooks';
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

  it('blocks team members from manager routes', async () => {
    renderWithAuth({
      initialPath: '/manager/reports',
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
});
