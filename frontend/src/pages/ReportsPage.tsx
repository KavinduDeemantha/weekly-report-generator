import { useQuery } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, PageLoading } from '../components/common/PageState';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getErrorMessage } from '../api/errors';
import { projectsApi } from '../features/projects/api';
import { reportsApi } from '../features/reports/api';
import {
  formatDate,
  formatDateTime,
} from '../features/reports/components/ReportDisplay';
import { StatusBadge } from '../features/reports/components/StatusBadge';
import { canEditReportStatus } from '../features/reports/permissions';
import { reportsKeys } from '../features/reports/query-keys';
import { reportStatuses } from '../features/reports/schemas';
import type { ReportListFilters } from '../features/reports/types';

export function ReportsPage() {
  const [filters, setFilters] = useState<ReportListFilters>({
    page: 1,
    limit: 10,
  });

  const reportsQuery = useQuery({
    queryKey: reportsKeys.list(filters),
    queryFn: () => reportsApi.listMine(filters),
  });
  const projectsQuery = useQuery({
    queryKey: ['projects', 'active'],
    queryFn: projectsApi.listActive,
  });

  function updateFilters(next: Partial<ReportListFilters>) {
    setFilters((current) => ({ ...current, page: 1, ...next }));
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">My Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Weekly report history, newest weeks first.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-blue-700"
          to="/reports/new"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          Create report
        </Link>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-background p-4 md:grid-cols-4">
        <select
          aria-label="Filter by status"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.status ?? ''}
          onChange={(event) =>
            updateFilters({
              status: event.target.value
                ? (event.target.value as ReportListFilters['status'])
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
          aria-label="Filter by project"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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
          aria-label="From date"
          type="date"
          value={filters.from ?? ''}
          onChange={(event) =>
            updateFilters({ from: event.target.value || undefined })
          }
        />
        <Input
          aria-label="To date"
          type="date"
          value={filters.to ?? ''}
          onChange={(event) =>
            updateFilters({ to: event.target.value || undefined })
          }
        />
      </div>

      {reportsQuery.isLoading ? <PageLoading label="Loading reports" /> : null}

      {reportsQuery.isError ? (
        <ErrorState
          message={getErrorMessage(reportsQuery.error)}
          onRetry={() => void reportsQuery.refetch()}
        />
      ) : null}

      {reportsQuery.data && reportsQuery.data.data.length === 0 ? (
        <EmptyState
          title="No reports found"
          description="Adjust the filters or create a new weekly report draft."
        />
      ) : null}

      {reportsQuery.data && reportsQuery.data.data.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Week</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Version</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reportsQuery.data.data.map((report) => {
                  const canEdit = canEditReportStatus(report.status);

                  return (
                    <tr key={report.id}>
                      <td className="px-4 py-3 font-medium">
                        {formatDate(report.weekStart)} to{' '}
                        {formatDate(report.weekEnd)}
                      </td>
                      <td className="px-4 py-3">{report.project.name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-4 py-3">{report.currentVersion}</td>
                      <td className="px-4 py-3">
                        {formatDateTime(report.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <Link
                            className="font-medium text-primary hover:underline"
                            to={`/reports/${report.id}`}
                          >
                            View
                          </Link>
                          {canEdit ? (
                            <Link
                              className="font-medium text-primary hover:underline"
                              to={`/reports/${report.id}/edit`}
                            >
                              Edit
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
