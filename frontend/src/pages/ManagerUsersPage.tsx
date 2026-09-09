import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { EmptyState, ErrorState, PageLoading } from '../components/common/PageState';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { getErrorMessage } from '../api/errors';
import { usersApi } from '../features/users/api';
import { userKeys } from '../features/users/query-keys';

export function ManagerUsersPage() {
  const [page, setPage] = useState(1);
  const filters = { page, limit: 20 };
  const usersQuery = useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => usersApi.list(filters),
  });
  const totalPages = usersQuery.data
    ? usersQuery.data.meta.totalPages ??
      Math.max(1, Math.ceil(usersQuery.data.meta.total / usersQuery.data.meta.limit))
    : 1;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Read-only team directory from the backend users API.
        </p>
      </div>

      {usersQuery.isLoading ? <PageLoading label="Loading users" /> : null}
      {usersQuery.isError ? (
        <ErrorState
          message={getErrorMessage(usersQuery.error)}
          onRetry={() => void usersQuery.refetch()}
        />
      ) : null}
      {usersQuery.data && usersQuery.data.data.length === 0 ? (
        <EmptyState title="No users" description="No users are available." />
      ) : null}

      {usersQuery.data && usersQuery.data.data.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/70 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usersQuery.data.data.map((user) => (
                <tr className="transition-colors hover:bg-muted/40" key={user.id}>
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge>{user.role.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.isActive === undefined ? (
                      <span className="text-muted-foreground">Not exposed</span>
                    ) : (
                      <Badge>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {usersQuery.data.meta.page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
