import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/errors';
import { reportsApi } from '../features/reports/api';
import { ReportForm } from '../features/reports/components/ReportForm';
import { reportsKeys } from '../features/reports/query-keys';
import type { ReportFormValues } from '../features/reports/types';

export function NewReportPage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createReport = useMutation({
    mutationFn: reportsApi.create,
    onSuccess: (report) => {
      void queryClient.invalidateQueries({ queryKey: reportsKeys.lists() });
      navigate(`/reports/${report.id}`);
    },
  });

  async function handleSubmit(values: ReportFormValues) {
    setError(null);

    try {
      await createReport.mutateAsync(values);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">New Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a draft weekly report. You can edit it until submission.
        </p>
      </div>
      <ReportForm
        error={error}
        isSubmitting={createReport.isPending}
        submitLabel="Save draft"
        onSubmit={handleSubmit}
      />
    </section>
  );
}
