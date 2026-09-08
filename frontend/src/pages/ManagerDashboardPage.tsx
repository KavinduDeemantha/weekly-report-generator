import { useState } from 'react';
import { getErrorMessage } from '../api/errors';
import { ErrorState } from '../components/common/PageState';
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
import type { DashboardFilters as DashboardFiltersState } from '../features/dashboard/types';

export function ManagerDashboardPage() {
  const [filters, setFilters] = useState<DashboardFiltersState>({
    limit: 20,
  });
  const summary = useDashboardSummary(filters);
  const submissionStatus = useSubmissionStatus(filters);
  const taskTrends = useTaskTrends(filters);
  const projectDistribution = useProjectDistribution(filters);
  const timeDistribution = useTimeDistribution(filters);
  const activity = useDashboardActivity(filters);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Manager Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Backend analytics for reporting compliance, workload, blockers, and recent review activity.
        </p>
      </div>

      <DashboardFilters filters={filters} onChange={setFilters} />

      {summary.isError ? (
        <ErrorState message={getErrorMessage(summary.error)} />
      ) : null}
      <SummaryCards data={summary.data} isLoading={summary.isLoading} />

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardSection
          description="Completed tasks by report week, using current report versions only."
          error={taskTrends.error}
          isEmpty={(taskTrends.data ?? []).length === 0}
          isLoading={taskTrends.isLoading}
          title="Task Trends"
        >
          <TaskTrendsChart data={taskTrends.data ?? []} />
        </DashboardSection>

        <DashboardSection
          description="Current submission state for each active team member."
          error={submissionStatus.error}
          isEmpty={(submissionStatus.data ?? []).length === 0}
          isLoading={submissionStatus.isLoading}
          title="Submission Status"
        >
          <SubmissionStatusChart data={submissionStatus.data ?? []} />
        </DashboardSection>

        <DashboardSection
          description="Current-version task count by project."
          error={projectDistribution.error}
          isEmpty={(projectDistribution.data ?? []).length === 0}
          isLoading={projectDistribution.isLoading}
          title="Project Distribution"
        >
          <ProjectDistributionChart data={projectDistribution.data ?? []} />
        </DashboardSection>

        <DashboardSection
          description="Time entries grouped by work type."
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
