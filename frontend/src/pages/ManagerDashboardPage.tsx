import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { ErrorState, PageLoading } from '../components/common/PageState';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { getErrorMessage } from '../api/errors';
import { dashboardApi } from '../features/dashboard/api';

const metricCards = [
  {
    key: 'totalReportsSubmitted',
    label: 'Submitted',
    icon: FileText,
  },
  {
    key: 'submissionComplianceRate',
    label: 'Compliance',
    icon: CheckCircle2,
    suffix: '%',
  },
  {
    key: 'pendingCount',
    label: 'Pending',
    icon: Clock,
  },
  {
    key: 'needsCorrectionCount',
    label: 'Needs correction',
    icon: AlertTriangle,
  },
  {
    key: 'openBlockersCount',
    label: 'Open blockers',
    icon: Activity,
  },
] as const;

export function ManagerDashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.getSummary,
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Manager Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Current reporting health and team activity overview.
        </p>
      </div>

      {summaryQuery.isLoading ? (
        <PageLoading label="Loading dashboard" />
      ) : null}

      {summaryQuery.isError ? (
        <ErrorState
          message={getErrorMessage(summaryQuery.error)}
          onRetry={() => void summaryQuery.refetch()}
        />
      ) : null}

      {summaryQuery.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metricCards.map((metric) => {
            const Icon = metric.icon;
            const value = summaryQuery.data[metric.key];

            return (
              <Card key={metric.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                    {metric.label}
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {value}
                    {'suffix' in metric ? metric.suffix : ''}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submission status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-36 rounded-md border border-dashed border-border bg-slate-50" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task and time trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-36 rounded-md border border-dashed border-border bg-slate-50" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
