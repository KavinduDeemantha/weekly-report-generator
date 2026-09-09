import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, PageLoading } from '../components/common/PageState';
import { Badge } from '../components/ui/badge';
import { getErrorMessage } from '../api/errors';
import { reportsApi } from '../features/reports/api';
import { formatDateTime } from '../features/reports/components/ReportDisplay';
import { reportsKeys } from '../features/reports/query-keys';

export function ReportVersionsPage() {
  const { id } = useParams<{ id: string }>();
  const versionsQuery = useQuery({
    queryKey: reportsKeys.versions(id ?? ''),
    queryFn: () => reportsApi.listVersions(id ?? ''),
    enabled: Boolean(id),
  });

  if (!id) {
    return <ErrorState message="Report id is missing." />;
  }

  if (versionsQuery.isLoading) {
    return <PageLoading label="Loading versions" />;
  }

  if (versionsQuery.isError) {
    return <ErrorState message={getErrorMessage(versionsQuery.error)} />;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Version History
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historical versions are immutable snapshots for review and audit.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-border bg-muted/70 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Version</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(versionsQuery.data ?? []).map((version) => (
              <tr className="transition-colors hover:bg-muted/40" key={version.versionNumber}>
                <td className="px-4 py-3 font-medium">
                  Version {version.versionNumber}
                </td>
                <td className="px-4 py-3">{formatDateTime(version.createdAt)}</td>
                <td className="px-4 py-3">
                  {version.submittedAt ? formatDateTime(version.submittedAt) : '-'}
                </td>
                <td className="px-4 py-3">
                  {version.isCurrent ? <Badge>Current</Badge> : <Badge>Historical</Badge>}
                </td>
                <td className="px-4 py-3">
                  <Link
                    className="font-medium text-primary hover:underline"
                    to={`/reports/${id}/versions/${version.versionNumber}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </section>
  );
}
