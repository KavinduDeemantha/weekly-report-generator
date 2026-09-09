import {
  CheckCircle2,
  FileCheck2,
  MessageSquareText,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type {
  DashboardActivityItem,
  DashboardActivityType,
} from '../../../types/dashboard';
import { activityLabel, formatDateTime } from '../formatters';

const icons: Record<DashboardActivityType, typeof FileCheck2> = {
  REPORT_SUBMITTED: FileCheck2,
  REPORT_RESUBMITTED: RefreshCw,
  CHANGES_REQUESTED: MessageSquareText,
  REPORT_APPROVED: CheckCircle2,
};

export function ActivityFeed({ data }: { data: DashboardActivityItem[] }) {
  return (
    <div className="space-y-3">
      {data.map((item) => {
        const Icon = icons[item.type];

        return (
          <div
            className="flex gap-3 rounded-lg border border-border bg-muted/40 p-3 transition-colors hover:bg-muted/70"
            key={`${item.type}-${item.reportId}-${item.createdAt}`}
          >
            <div className="mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-indigo-50 text-primary">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{activityLabel(item.type)}</p>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(item.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.message}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.user.name} - {item.project.name}
                {item.versionNumber ? ` - Version ${item.versionNumber}` : ''}
                {item.reviewer ? ` - Reviewer: ${item.reviewer.name}` : ''}
              </p>
            </div>
            <Link
              className="self-start text-sm font-medium text-primary hover:underline"
              to={`/manager/reports/${item.reportId}`}
            >
              View
            </Link>
          </div>
        );
      })}
    </div>
  );
}
