import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { History, Pencil, Send } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ErrorState, PageLoading } from '../components/common/PageState';
import { Button } from '../components/ui/button';
import { getErrorMessage } from '../api/errors';
import { reportsApi } from '../features/reports/api';
import {
  ReportContent,
  ReportHeader,
  ReviewFeedback,
} from '../features/reports/components/ReportDisplay';
import { reportsKeys } from '../features/reports/query-keys';
import {
  canEditReportStatus,
  canResubmitReportStatus,
  canSubmitReportStatus,
} from '../features/reports/permissions';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    'submit' | 'resubmit' | null
  >(null);
  const queryClient = useQueryClient();

  const reportQuery = useQuery({
    queryKey: reportsKeys.detail(id ?? ''),
    queryFn: () => reportsApi.getDetail(id ?? ''),
    enabled: Boolean(id),
  });

  const submitMutation = useMutation({
    mutationFn: () => reportsApi.submit(id ?? ''),
    onSuccess: () => invalidateReportQueries(queryClient, id ?? ''),
  });
  const resubmitMutation = useMutation({
    mutationFn: () => reportsApi.resubmit(id ?? ''),
    onSuccess: () => invalidateReportQueries(queryClient, id ?? ''),
  });

  if (!id) {
    return <ErrorState message="Report id is missing." />;
  }

  if (reportQuery.isLoading) {
    return <PageLoading label="Loading report" />;
  }

  if (reportQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(reportQuery.error)}
        onRetry={() => void reportQuery.refetch()}
      />
    );
  }

  const report = reportQuery.data;

  if (!report) {
    return <ErrorState message="Report was not found." />;
  }

  const canEdit = canEditReportStatus(report.status);
  const canSubmit = canSubmitReportStatus(report.status);
  const canResubmit = canResubmitReportStatus(report.status);
  const isMutating = submitMutation.isPending || resubmitMutation.isPending;

  async function confirmSubmitAction() {
    if (!pendingAction) {
      return;
    }
    setActionError(null);

    try {
      if (pendingAction === 'submit') {
        await submitMutation.mutateAsync();
      } else {
        await resubmitMutation.mutateAsync();
      }
      setPendingAction(null);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  }

  return (
    <section className="space-y-6">
      <ReportHeader report={report} />

      <div className="flex flex-wrap gap-2">
        {canEdit ? (
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            to={`/reports/${report.id}/edit`}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Link>
        ) : null}
        {canSubmit ? (
          <Button
            type="button"
            disabled={isMutating}
            onClick={() => setPendingAction('submit')}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Submit
          </Button>
        ) : null}
        {canResubmit ? (
          <Button
            type="button"
            disabled={isMutating}
            onClick={() => setPendingAction('resubmit')}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Resubmit
          </Button>
        ) : null}
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          to={`/reports/${report.id}/versions`}
        >
          <History className="h-4 w-4" aria-hidden="true" />
          Versions
        </Link>
      </div>

      {actionError ? <ErrorState message={actionError} /> : null}

      <ReviewFeedback
        latestCorrectionFeedback={report.latestCorrectionFeedback}
        reviews={report.reviews}
      />
      <ReportContent report={report} />

      <ConfirmDialog
        confirmLabel={pendingAction === 'resubmit' ? 'Resubmit' : 'Submit'}
        description={
          pendingAction === 'resubmit'
            ? 'This corrected report will be sent back to your manager for review.'
            : 'This report becomes read-only until a manager takes action.'
        }
        isConfirming={isMutating}
        isOpen={Boolean(pendingAction)}
        title={
          pendingAction === 'resubmit'
            ? 'Resubmit corrected report?'
            : 'Submit this report?'
        }
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void confirmSubmitAction()}
      />
    </section>
  );
}

function invalidateReportQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
) {
  void queryClient.invalidateQueries({ queryKey: reportsKeys.detail(id) });
  void queryClient.invalidateQueries({ queryKey: reportsKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: reportsKeys.versions(id) });
}
