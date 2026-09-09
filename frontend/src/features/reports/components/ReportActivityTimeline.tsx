import {
  CheckCircle2,
  FilePlus2,
  MessageSquareText,
  RefreshCw,
  Send,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import type { ReportDetail, Review } from '../../../types/reports';
import { formatDateTime } from './ReportDisplay';

type TimelineEvent = {
  key: string;
  label: string;
  timestamp: string;
  detail: string;
  comment?: string | null;
  icon: typeof FilePlus2;
};

export function ReportActivityTimeline({ report }: { report: ReportDetail }) {
  const events = buildTimelineEvents(report);

  if (events.length === 0) {
    return null;
  }

  return (
    <Card className="break-inside-avoid">
      <CardHeader>
        <CardTitle>Report activity</CardTitle>
        <CardDescription>
          Version-aware workflow history derived from report submissions and reviews.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {events.map((event) => {
            const Icon = event.icon;

            return (
              <li className="flex gap-3" key={event.key}>
                <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-indigo-50 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{event.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {formatDateTime(event.timestamp)} · {event.detail}
                  </span>
                  {event.comment ? (
                    <span className="mt-2 block break-words rounded-md border border-border bg-muted/40 p-2 text-sm">
                      {event.comment}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function buildTimelineEvents(report: ReportDetail): TimelineEvent[] {
  const versionSummaries = report.versionSummaries ?? [
    {
      versionNumber: report.currentVersion,
      createdAt: report.version.submittedAt ?? report.createdAt,
      submittedAt: report.version.submittedAt,
      isCurrent: true,
    },
  ];

  const events: TimelineEvent[] = [
    {
      key: 'draft-created',
      label: 'Draft created',
      timestamp: report.createdAt,
      detail: `${report.user?.name ?? 'Team member'} created the report draft.`,
      icon: FilePlus2,
    },
  ];

  for (const version of versionSummaries) {
    if (version.versionNumber > 1) {
      events.push({
        key: `version-${version.versionNumber}-created`,
        label: 'Correction version created',
        timestamp: version.createdAt,
        detail: `Version ${version.versionNumber}`,
        icon: RefreshCw,
      });
    }

    if (version.submittedAt) {
      events.push({
        key: `version-${version.versionNumber}-submitted`,
        label: version.versionNumber > 1 ? 'Report resubmitted' : 'Report submitted',
        timestamp: version.submittedAt,
        detail: `Version ${version.versionNumber}`,
        icon: Send,
      });
    }
  }

  for (const review of report.reviews) {
    events.push(toReviewEvent(review));
  }

  return events.sort(
    (left, right) =>
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );
}

function toReviewEvent(review: Review): TimelineEvent {
  const isApproved = review.action === 'APPROVED';

  return {
    key: `review-${review.id}`,
    label: isApproved ? 'Report approved' : 'Changes requested',
    timestamp: review.createdAt,
    detail: `${isApproved ? 'Approved' : 'Reviewed'} by ${review.reviewer.name} · Version ${review.versionNumber}`,
    comment: review.comment,
    icon: isApproved ? CheckCircle2 : MessageSquareText,
  };
}
