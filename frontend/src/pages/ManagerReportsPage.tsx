import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { EmptyState, ErrorState, PageLoading } from '../components/common/PageState';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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

type DateFilterMode = 'single-week' | 'date-range';

export function ManagerReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = createInitialFilters(searchParams);
  const dateMode: DateFilterMode =
    !filters.weekStart && (filters.from || filters.to)
      ? 'date-range'
      : 'single-week';

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
    setSearchParams(filtersToSearchParams({ ...filters, page: 1, ...next }));
  }

  function clearFilters() {
    setSearchParams({});
  }

  function changeDateMode(nextMode: DateFilterMode) {
    if (nextMode === 'single-week') {
      updateFilters({ from: undefined, to: undefined });
      return;
    }

    updateFilters({ weekStart: undefined, week: undefined });
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Team Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review submitted weekly reports across the team.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-soft">
        <div>
          <div
            aria-label="Team reports date filter mode"
            className="inline-flex rounded-lg border border-border bg-muted p-1"
            role="group"
          >
            <button
              aria-pressed={dateMode === 'single-week'}
              className={getModeButtonClass(dateMode === 'single-week')}
              type="button"
              onClick={() => changeDateMode('single-week')}
            >
              Single week
            </button>
            <button
              aria-pressed={dateMode === 'date-range'}
              className={getModeButtonClass(dateMode === 'date-range')}
              type="button"
              onClick={() => changeDateMode('date-range')}
            >
              Date range
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {dateMode === 'single-week'
              ? 'Filter reports for one reporting week.'
              : 'Filter reports across multiple reporting weeks.'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label htmlFor="manager-reports-status">Status</Label>
            <select
              className="mt-2 h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors focus-visible:border-primary"
              id="manager-reports-status"
              value={filters.statusIn ? 'SUBMITTED_RELATED' : filters.status ?? ''}
              onChange={(event) =>
                updateFilters(createStatusFilter(event.target.value))
              }
            >
              <option value="">All statuses</option>
              <option value="SUBMITTED_RELATED">Submitted related</option>
              {reportStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="manager-reports-user">Team member</Label>
            <select
              className="mt-2 h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors focus-visible:border-primary"
              disabled={usersQuery.isLoading}
              id="manager-reports-user"
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
          </div>
          <div>
            <Label htmlFor="manager-reports-project">Project</Label>
            <select
              className="mt-2 h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors focus-visible:border-primary"
              disabled={projectsQuery.isLoading}
              id="manager-reports-project"
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
          </div>
          {dateMode === 'single-week' ? (
            <div>
              <Label htmlFor="manager-reports-week">Selected week</Label>
              <Input
                className="mt-2"
                id="manager-reports-week"
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
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="manager-reports-from">From</Label>
                <Input
                  className="mt-2"
                  id="manager-reports-from"
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
              </div>
              <div>
                <Label htmlFor="manager-reports-to">To</Label>
                <Input
                  className="mt-2"
                  id="manager-reports-to"
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
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
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
                  updateFilters({ page: Math.max(1, filters.page - 1) })
                }
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={filters.page >= reportsQuery.data.meta.totalPages}
                onClick={() => updateFilters({ page: filters.page + 1 })}
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

export function createInitialFilters(
  searchParams: URLSearchParams,
): ManagerReportFilters {
  const status = searchParams.get('status');
  const statusIn = parseStatusIn(searchParams.get('statusIn'));

  return {
    page: positiveNumber(searchParams.get('page'), 1),
    limit: positiveNumber(searchParams.get('limit'), 10),
    status: isReportStatus(status) ? status : undefined,
    statusIn,
    userId: validUuid(searchParams.get('userId')),
    projectId: validUuid(searchParams.get('projectId')),
    weekStart: validDate(searchParams.get('weekStart') ?? searchParams.get('week')),
    from: validDate(searchParams.get('from')),
    to: validDate(searchParams.get('to')),
  };
}

function isReportStatus(
  value: string | null,
): value is NonNullable<ManagerReportFilters['status']> {
  return value !== null && reportStatuses.includes(value as NonNullable<ManagerReportFilters['status']>);
}

function createStatusFilter(value: string): Partial<ManagerReportFilters> {
  if (value === 'SUBMITTED_RELATED') {
    return {
      status: undefined,
      statusIn: 'SUBMITTED,NEEDS_CORRECTION,APPROVED',
    };
  }

  return {
    status: value ? (value as ManagerReportFilters['status']) : undefined,
    statusIn: undefined,
  };
}

export function filtersToSearchParams(
  filters: ManagerReportFilters,
): URLSearchParams {
  const params = new URLSearchParams();

  setNumberParam(params, 'page', filters.page, 1);
  setNumberParam(params, 'limit', filters.limit, 10);
  setStringParam(params, 'status', filters.status);
  setStringParam(params, 'statusIn', filters.statusIn);
  setStringParam(params, 'userId', filters.userId);
  setStringParam(params, 'projectId', filters.projectId);
  setStringParam(params, 'weekStart', filters.weekStart);

  if (!filters.weekStart) {
    setStringParam(params, 'from', filters.from);
    setStringParam(params, 'to', filters.to);
  }

  return params;
}

function setStringParam(
  params: URLSearchParams,
  key: string,
  value: string | undefined,
) {
  if (value) {
    params.set(key, value);
  }
}

function setNumberParam(
  params: URLSearchParams,
  key: string,
  value: number,
  defaultValue: number,
) {
  if (value !== defaultValue) {
    params.set(key, String(value));
  }
}

function positiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function validDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function validUuid(value: string | null) {
  return value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
    ? value
    : undefined;
}

function parseStatusIn(value: string | null) {
  if (!value) {
    return undefined;
  }

  const statuses = value.split(',').map((status) => status.trim());
  return statuses.length > 0 && statuses.every((status) => isReportStatus(status))
    ? statuses.join(',')
    : undefined;
}

function getModeButtonClass(isSelected: boolean) {
  return [
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    isSelected
      ? 'bg-card text-primary shadow-sm ring-1 ring-border'
      : 'text-muted-foreground hover:text-foreground',
  ].join(' ');
}
