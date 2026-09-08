import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { ErrorState, PageLoading } from '../components/common/PageState';
import { getErrorMessage } from '../api/errors';
import { reportsApi } from '../features/reports/api';
import { reportDetailToFormValues } from '../features/reports/adapters';
import { ReportForm } from '../features/reports/components/ReportForm';
import { StatusBadge } from '../features/reports/components/StatusBadge';
import { canEditReportStatus } from '../features/reports/permissions';
import { reportsKeys } from '../features/reports/query-keys';
import type { ReportFormValues } from '../features/reports/types';

export function EditReportPage() {
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const reportQuery = useQuery({
    queryKey: reportsKeys.detail(id ?? ''),
    queryFn: () => reportsApi.getDetail(id ?? ''),
    enabled: Boolean(id),
  });

  const updateReport = useMutation({
    mutationFn: (values: ReportFormValues) => reportsApi.update(id ?? '', values),
    onSuccess: (report) => {
      void queryClient.invalidateQueries({ queryKey: reportsKeys.detail(report.id) });
      void queryClient.invalidateQueries({ queryKey: reportsKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: reportsKeys.versions(report.id) });
      navigate(`/reports/${report.id}`);
    },
  });

  if (!id) {
    return <ErrorState message="Report id is missing." />;
  }

  if (reportQuery.isLoading) {
    return <PageLoading label="Loading report" />;
  }

  if (reportQuery.isError) {
    return <ErrorState message={getErrorMessage(reportQuery.error)} />;
  }

  const report = reportQuery.data;

  if (!report) {
    return <ErrorState message="Report was not found." />;
  }

  const canEdit = canEditReportStatus(report.status);

  if (!canEdit) {
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Report is read-only
          </h1>
          <div className="mt-2">
            <StatusBadge status={report.status} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Submitted and approved reports cannot be edited from the member UI.
        </p>
        <Link className="text-sm font-medium text-primary hover:underline" to={`/reports/${id}`}>
          Back to report
        </Link>
      </section>
    );
  }

  async function handleSubmit(values: ReportFormValues) {
    setError(null);

    try {
      await updateReport.mutateAsync(values);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Edit Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes update the editable current version only.
        </p>
      </div>
      <ReportForm
        error={error}
        initialValues={reportDetailToFormValues(report)}
        isSubmitting={updateReport.isPending}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
    </section>
  );
}
