import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, History, MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { getErrorMessage } from '../api/errors';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ErrorState, PageLoading } from '../components/common/PageState';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Dialog } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { dashboardKeys } from '../features/dashboard/query-keys';
import { managerReportsApi } from '../features/manager-reports/api';
import { canReviewReportStatus } from '../features/manager-reports/permissions';
import { managerReportKeys } from '../features/manager-reports/query-keys';
import {
  requestChangesSchema,
  type RequestChangesValues,
} from '../features/manager-reports/schemas';
import {
  ReportContent,
  ReportHeader,
  ReviewFeedback,
  formatDateTime,
} from '../features/reports/components/ReportDisplay';
import { reportsKeys } from '../features/reports/query-keys';

export function ManagerReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const form = useForm<RequestChangesValues>({
    resolver: zodResolver(requestChangesSchema),
    defaultValues: { comment: '' },
  });

  const reportQuery = useQuery({
    queryKey: managerReportKeys.detail(id ?? ''),
    queryFn: () => managerReportsApi.getDetail(id ?? ''),
    enabled: Boolean(id),
  });

  const requestChanges = useMutation({
    mutationFn: (values: RequestChangesValues) =>
      managerReportsApi.requestChanges(id ?? '', values.comment.trim()),
    onSuccess: async () => {
      await invalidateManagerReportQueries(queryClient, id ?? '');
      setIsRequestDialogOpen(false);
      form.reset({ comment: '' });
      setSuccessMessage('Change request sent.');
    },
  });
  const approve = useMutation({
    mutationFn: () => managerReportsApi.approve(id ?? ''),
    onSuccess: async () => {
      await invalidateManagerReportQueries(queryClient, id ?? '');
      setSuccessMessage('Report approved.');
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

  const canReview = canReviewReportStatus(report.status);
  const isMutating = requestChanges.isPending || approve.isPending;

  async function handleApprove() {
    setActionError(null);
    setSuccessMessage(null);

    try {
      await approve.mutateAsync();
      setIsApproveDialogOpen(false);
    } catch (error) {
      setActionError(getReviewActionMessage(error));
    }
  }

  async function handleRequestChanges(values: RequestChangesValues) {
    setActionError(null);
    setSuccessMessage(null);

    try {
      await requestChanges.mutateAsync(values);
    } catch (error) {
      setActionError(getReviewActionMessage(error));
    }
  }

  return (
    <section className="space-y-6">
      <ReportHeader report={report} />

      <Card>
        <CardHeader>
          <CardTitle>Team member</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{report.user?.name ?? 'Unknown member'}</p>
          <p className="text-sm text-muted-foreground">{report.user?.email}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {canReview ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={isMutating}
              onClick={() => setIsRequestDialogOpen(true)}
            >
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              Request changes
            </Button>
            <Button
              type="button"
              disabled={isMutating}
              onClick={() => setIsApproveDialogOpen(true)}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Approve
            </Button>
          </>
        ) : null}
      </div>

      {successMessage ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {successMessage}
        </div>
      ) : null}
      {actionError ? <ErrorState message={actionError} /> : null}

      <VersionSummaries reportId={report.id} versions={report.versionSummaries ?? []} />
      <ReviewFeedback reviews={report.reviews} />
      <ReportContent report={report} />

      <Dialog
        description="Tell the team member what needs to change before resubmission."
        isOpen={isRequestDialogOpen}
        title="Request changes"
        onClose={() => setIsRequestDialogOpen(false)}
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(handleRequestChanges)}>
          <div>
            <Label htmlFor="comment">Comment</Label>
            <textarea
              className="mt-2 min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              id="comment"
              {...form.register('comment')}
            />
            {form.formState.errors.comment ? (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.comment.message}
              </p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRequestDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={requestChanges.isPending}>
              Send request
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        confirmLabel="Approve report"
        description="This marks the submitted report as approved and closes the current review cycle."
        isConfirming={approve.isPending}
        isOpen={isApproveDialogOpen}
        title="Approve this report?"
        onCancel={() => setIsApproveDialogOpen(false)}
        onConfirm={() => void handleApprove()}
      />
    </section>
  );
}

function VersionSummaries({
  reportId,
  versions,
}: {
  reportId: string;
  versions: { versionNumber: number; createdAt: string; submittedAt: string | null; isCurrent: boolean }[];
}) {
  if (versions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4" aria-hidden="true" />
          Version summaries
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {versions.map((version) => (
          <div
            className="flex flex-col gap-2 rounded-md border border-border bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
            key={version.versionNumber}
          >
            <div>
              <p className="text-sm font-medium">Version {version.versionNumber}</p>
              <p className="text-xs text-muted-foreground">
                Created {formatDateTime(version.createdAt)}
                {version.submittedAt
                  ? ` · Submitted ${formatDateTime(version.submittedAt)}`
                  : ' · Not submitted'}
              </p>
            </div>
            <Link
              className="text-sm font-medium text-primary hover:underline"
              to={`/manager/reports/${reportId}/versions/${version.versionNumber}`}
            >
              View version
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

async function invalidateManagerReportQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: managerReportKeys.detail(id) }),
    queryClient.invalidateQueries({ queryKey: managerReportKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: reportsKeys.detail(id) }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
  ]);
}

function getReviewActionMessage(error: unknown) {
  const message = getErrorMessage(error);

  if (message.toLowerCase().includes('submitted')) {
    return 'This report is no longer in a reviewable state.';
  }

  return message;
}
