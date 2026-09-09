import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { getErrorMessage } from '../api/errors';
import { ErrorState } from '../components/common/PageState';
import { Button } from '../components/ui/button';
import { ActivityFeed } from '../features/dashboard/components/ActivityFeed';
import { DashboardFilters } from '../features/dashboard/components/DashboardFilters';
import { DashboardSection } from '../features/dashboard/components/DashboardSection';
import { ProjectDistributionChart } from '../features/dashboard/components/ProjectDistributionChart';
import { SubmissionStatusChart } from '../features/dashboard/components/SubmissionStatusChart';
import { SummaryCards } from '../features/dashboard/components/SummaryCards';
import { TaskTrendsChart } from '../features/dashboard/components/TaskTrendsChart';
import { TimeDistributionChart } from '../features/dashboard/components/TimeDistributionChart';
import {
  useDashboardActivity,
  useDashboardSummary,
  useProjectDistribution,
  useSubmissionStatus,
  useTaskTrends,
  useTimeDistribution,
} from '../features/dashboard/hooks';
import { dashboardKeys } from '../features/dashboard/query-keys';
import type { DashboardFilters as DashboardFiltersState } from '../features/dashboard/types';

export function ManagerDashboardPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DashboardFiltersState>({
    limit: 20,
  });
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const summary = useDashboardSummary(filters);
  const submissionStatus = useSubmissionStatus(filters);
  const taskTrends = useTaskTrends(filters);
  const projectDistribution = useProjectDistribution(filters);
  const timeDistribution = useTimeDistribution(filters);
  const activity = useDashboardActivity(filters);
  const dashboardQueries = [
    summary,
    submissionStatus,
    taskTrends,
    projectDistribution,
    timeDistribution,
    activity,
  ];
  const isRefreshing = dashboardQueries.some((query) => query.isFetching);
  const latestSuccessfulUpdate = Math.max(
    ...dashboardQueries.map((query) => query.dataUpdatedAt),
  );

  useEffect(() => {
    if (latestSuccessfulUpdate > 0) {
      setLastRefreshedAt(new Date(latestSuccessfulUpdate));
    }
  }, [latestSuccessfulUpdate]);

  function refreshDashboard() {
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Manager Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Backend analytics for reporting compliance, workload, blockers, and recent review activity.
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">
            Viewing: {formatDashboardScope(filters)}
          </p>
          {lastRefreshedAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Last refreshed: {formatRefreshTime(lastRefreshedAt)}
            </p>
          ) : null}
        </div>
        <Button
          className="w-full sm:w-auto"
          type="button"
          variant="outline"
          disabled={isRefreshing}
          onClick={refreshDashboard}
        >
          <RefreshCw
            className={isRefreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      <DashboardFilters filters={filters} onChange={setFilters} />

      {summary.isError ? (
        <ErrorState message={getErrorMessage(summary.error)} />
      ) : null}
      <SummaryCards data={summary.data} isLoading={summary.isLoading} />

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSection
          description="Completed tasks by report week, using current report versions only."
          emptyMessage="No completed tasks were reported in the selected scope."
          error={taskTrends.error}
          isEmpty={(taskTrends.data ?? []).length === 0}
          isLoading={taskTrends.isLoading}
          title="Task Trends"
        >
          <TaskTrendsChart data={taskTrends.data ?? []} />
        </DashboardSection>

        <DashboardSection
          description="Current submission state for each active team member."
          emptyMessage="No active team members match the selected filters."
          error={submissionStatus.error}
          isEmpty={(submissionStatus.data ?? []).length === 0}
          isLoading={submissionStatus.isLoading}
          title="Submission Status"
        >
          <SubmissionStatusChart data={submissionStatus.data ?? []} />
        </DashboardSection>

        <DashboardSection
          description="Current-version task count by project."
          emptyMessage="No report tasks exist for projects in the selected scope."
          error={projectDistribution.error}
          isEmpty={(projectDistribution.data ?? []).length === 0}
          isLoading={projectDistribution.isLoading}
          title="Tasks by Project"
        >
          <ProjectDistributionChart data={projectDistribution.data ?? []} />
        </DashboardSection>

        <DashboardSection
          description="Time entries grouped by work type."
          emptyMessage="No time entries were reported in the selected scope."
          error={timeDistribution.error}
          isEmpty={(timeDistribution.data ?? []).length === 0}
          isLoading={timeDistribution.isLoading}
          title="Time Distribution"
        >
          <TimeDistributionChart data={timeDistribution.data ?? []} />
        </DashboardSection>
      </div>

      <DashboardSection
        description="Recent submissions, resubmissions, requested changes, and approvals."
        emptyMessage="No report or review activity exists in the selected scope."
        error={activity.error}
        isEmpty={(activity.data ?? []).length === 0}
        isLoading={activity.isLoading}
        title="Recent Activity"
      >
        <ActivityFeed data={activity.data ?? []} />
      </DashboardSection>
    </section>
  );
}

function formatDashboardScope(filters: DashboardFiltersState): string {
  if (filters.weekStart) {
    return `Week of ${formatDate(filters.weekStart)} to ${formatDate(addDays(filters.weekStart, 6))}`;
  }

  if (filters.from || filters.to) {
    if (filters.from && filters.to) {
      return `${formatDate(filters.from)} to ${formatDate(filters.to)}`;
    }

    if (filters.from) {
      return `From ${formatDate(filters.from)}`;
    }

    return `Through ${formatDate(filters.to ?? '')}`;
  }

  const currentWeekStart = getCurrentUtcWeekStart();

  return `Current week, ${formatDate(currentWeekStart)} to ${formatDate(addDays(currentWeekStart, 6))}`;
}

function getCurrentUtcWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const weekStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysSinceMonday,
    ),
  );

  return weekStart.toISOString().slice(0, 10);
}

function addDays(dateInput: string, days: number): string {
  const date = new Date(`${dateInput}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatRefreshTime(value: Date): string {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}
