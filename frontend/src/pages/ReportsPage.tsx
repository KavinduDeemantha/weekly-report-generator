import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { EmptyState, ErrorState, PageLoading } from '../components/common/PageState';
import { Badge } from '../components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { getErrorMessage } from '../api/errors';
import { reportsApi } from '../features/reports/api';
import { cn } from '../lib/utils';

export function ReportsPage() {
  const reportsQuery = useQuery({
    queryKey: ['reports', 'me', { page: 1, limit: 5 }],
    queryFn: reportsApi.listMine,
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">My Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your recent weekly report history.
          </p>
        </div>
        <Link
          to="/reports/new"
          className={cn(
            'inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-blue-700',
            'sm:w-auto',
          )}
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          New report
        </Link>
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
          title="No reports yet"
          description="Create your first draft when the next reporting week is ready."
        />
      ) : null}

      {reportsQuery.data && reportsQuery.data.data.length > 0 ? (
        <div className="grid gap-4">
          {reportsQuery.data.data.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>
                      {formatDate(report.weekStart)} to {formatDate(report.weekEnd)}
                    </CardTitle>
                    <CardDescription>{report.project.name}</CardDescription>
                  </div>
                  <Badge>{report.status.replace('_', ' ')}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Current version {report.currentVersion}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}
