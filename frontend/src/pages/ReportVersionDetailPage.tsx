import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, PageLoading } from '../components/common/PageState';
import {
  ReportContent,
  ReviewFeedback,
  formatDateTime,
} from '../features/reports/components/ReportDisplay';
import { reportsApi } from '../features/reports/api';
import { reportsKeys } from '../features/reports/query-keys';
import { getErrorMessage } from '../api/errors';

export function ReportVersionDetailPage() {
  const { id, versionNumber } = useParams<{
    id: string;
    versionNumber: string;
  }>();
  const parsedVersion = Number(versionNumber);
  const versionQuery = useQuery({
    queryKey: reportsKeys.version(id ?? '', parsedVersion),
    queryFn: () => reportsApi.getVersion(id ?? '', parsedVersion),
    enabled: Boolean(id) && Number.isInteger(parsedVersion),
  });

  if (!id || !Number.isInteger(parsedVersion)) {
    return <ErrorState message="Version route is invalid." />;
  }

  if (versionQuery.isLoading) {
    return <PageLoading label="Loading version" />;
  }

  if (versionQuery.isError) {
    return <ErrorState message={getErrorMessage(versionQuery.error)} />;
  }

  const version = versionQuery.data;

  if (!version) {
    return <ErrorState message="Version was not found." />;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Version {version.versionNumber}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Created {formatDateTime(version.createdAt)}
          {version.submittedAt
            ? ` · Submitted ${formatDateTime(version.submittedAt)}`
            : ' · Not submitted yet'}
        </p>
        <Link
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          to={`/reports/${id}/versions`}
        >
          Back to versions
        </Link>
      </div>

      <ReviewFeedback reviews={version.reviews} />
      <ReportContent report={version} />
    </section>
  );
}
