import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { EmptyState, ErrorState, PageLoading } from '../components/common/PageState';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getErrorMessage } from '../api/errors';
import { managerReportsApi } from '../features/manager-reports/api';
import { managerReportKeys } from '../features/manager-reports/query-keys';
import type { ManagerReportFilters } from '../features/manager-reports/types';
import { projectsApi } from '../features/projects/api';
import { projectKeys } from '../features/projects/query-keys';
import {
  formatDate,
  formatDateTime,
} from '../features/reports/components/ReportDisplay';
import { StatusBadge } from '../features/reports/components/StatusBadge';
import { reportStatuses } from '../features/reports/schemas';
import { usersApi } from '../features/users/api';
import { userKeys } from '../features/users/query-keys';

export function ManagerReportsPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<ManagerReportFilters>(() =>
    createInitialFilters(searchParams),
  );

  const reportsQuery = useQuery({
    queryKey: managerReportKeys.list(filters),
    queryFn: () => managerReportsApi.list(filters),
  });
  const usersQuery = useQuery({
    queryKey: userKeys.list({ page: 1, limit: 100 }),
    queryFn: () => usersApi.list({ page: 1, limit: 100 }),
  });
  const projectsQuery = useQuery({
    queryKey: projectKeys.list({ page: 1, limit: 100 }),
    queryFn: () => projectsApi.list({ page: 1, limit: 100 }),
  });

  function updateFilters(next: Partial<ManagerReportFilters>) {
    setFilters((current) => ({ ...current, page: 1, ...next }));
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Team Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review submitted weekly reports across the team.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-soft lg:grid-cols-6">
        <select
          aria-label="Filter by status"
          className="h-10 rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors focus-visible:border-primary"
          value={filters.status ?? ''}
          onChange={(event) =>
            updateFilters({
              status: event.target.value
                ? (event.target.value as ManagerReportFilters['status'])
                : undefined,
            })
          }
        >
          <option value="">All statuses</option>
          {reportStatuses.map((status) => (
            <option key={status} value={status}>
              {status.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by team member"
          className="h-10 rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors focus-visible:border-primary"
          disabled={usersQuery.isLoading}
          value={filters.userId ?? ''}
          onChange={(event) =>
            updateFilters({ userId: event.target.value || undefined })
          }
        >
          <option value="">All members</option>
          {(usersQuery.data?.data ?? [])
            .filter((user) => user.role === 'TEAM_MEMBER')
            .map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
        </select>
        <select
          aria-label="Filter by project"
          className="h-10 rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors focus-visible:border-primary"
          disabled={projectsQuery.isLoading}
          value={filters.projectId ?? ''}
          onChange={(event) =>
            updateFilters({ projectId: event.target.value || undefined })
          }
        >
          <option value="">All projects</option>
          {(projectsQuery.data?.data ?? []).map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <Input
          aria-label="Selected week"
          type="date"
          value={filters.weekStart ?? ''}
          onChange={(event) =>
            updateFilters({
              weekStart: event.target.value || undefined,
              from: undefined,
              to: undefined,
            })
          }
        />
        <Input
          aria-label="From date"
          type="date"
          value={filters.from ?? ''}
          onChange={(event) =>
            updateFilters({
              from: event.target.value || undefined,
              weekStart: undefined,
              week: undefined,
            })
          }
        />
        <Input
          aria-label="To date"
          type="date"
          value={filters.to ?? ''}
          onChange={(event) =>
            updateFilters({
              to: event.target.value || undefined,
              weekStart: undefined,
              week: undefined,
            })
          }
        />
      </div>

      {reportsQuery.isLoading ? <PageLoading label="Loading team reports" /> : null}

      {reportsQuery.isError ? (
        <ErrorState
          message={getErrorMessage(reportsQuery.error)}
          onRetry={() => void reportsQuery.refetch()}
        />
      ) : null}

      {reportsQuery.data && reportsQuery.data.data.length === 0 ? (
        <EmptyState
          title="No team reports found"
          description="Adjust filters or wait for team members to submit reports."
        />
      ) : null}

      {reportsQuery.data && reportsQuery.data.data.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border bg-muted/70 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Week</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Version</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reportsQuery.data.data.map((report) => (
                  <tr className="transition-colors hover:bg-muted/40" key={report.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{report.user?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.user?.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">{report.project.name}</td>
                    <td className="px-4 py-3">
                      {formatDate(report.weekStart)} to {formatDate(report.weekEnd)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-4 py-3">{report.currentVersion}</td>
                    <td className="px-4 py-3">{formatDateTime(report.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                        to={`/manager/reports/${report.id}`}
                      >
                        <Search className="h-4 w-4" aria-hidden="true" />
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {reportsQuery.data.meta.page} of{' '}
              {reportsQuery.data.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={filters.page <= 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: Math.max(1, current.page - 1),
                  }))
                }
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={filters.page >= reportsQuery.data.meta.totalPages}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
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

function createInitialFilters(searchParams: URLSearchParams): ManagerReportFilters {
  const status = searchParams.get('status');

  return {
    page: Number(searchParams.get('page') ?? 1),
    limit: Number(searchParams.get('limit') ?? 10),
    status: isReportStatus(status) ? status : undefined,
    userId: searchParams.get('userId') ?? undefined,
    projectId: searchParams.get('projectId') ?? undefined,
    weekStart: searchParams.get('weekStart') ?? searchParams.get('week') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  };
}

function isReportStatus(
  value: string | null,
): value is NonNullable<ManagerReportFilters['status']> {
  return value !== null && reportStatuses.includes(value as NonNullable<ManagerReportFilters['status']>);
}
