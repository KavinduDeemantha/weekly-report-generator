import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { SubmissionStatusItem } from '../../../types/dashboard';
import { StatusBadge } from '../../reports/components/StatusBadge';
import { formatWeek, submissionStatusLabel } from '../formatters';

const statusOrder = [
  'APPROVED',
  'SUBMITTED',
  'NEEDS_CORRECTION',
  'DRAFT',
  'NOT_STARTED',
] as const;

export function SubmissionStatusChart({
  data,
}: {
  data: SubmissionStatusItem[];
}) {
  const distribution = statusOrder
    .map((status) => ({
      status,
      count: data.filter((item) => item.status === status).length,
    }))
    .filter((item) => item.count > 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {distribution.map((item) => (
          <div
            className="rounded-lg border border-border bg-muted/40 px-3 py-2"
            key={item.status}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {submissionStatusLabel(item.status)}
            </p>
            <p className="mt-1 text-xl font-semibold">{item.count}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Member</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Report context</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
        {data.map((item) => (
          <tr className="transition-colors hover:bg-muted/40" key={item.user.id}>
            <td className="px-4 py-3">
              <p className="font-medium text-foreground">{item.user.name}</p>
              <p className="text-xs text-muted-foreground">{item.user.email}</p>
            </td>
            <td className="px-4 py-3">
              {item.status === 'NOT_STARTED' ? (
                <span className="rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  Not started
                </span>
              ) : (
                <StatusBadge status={item.status} />
              )}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {item.report ? (
                <>
                  <span className="font-medium text-foreground">
                    {item.report.project.name}
                  </span>
                  <span> · Week of {formatWeek(item.report.weekStart)}</span>
                </>
              ) : (
                'No report in this scope'
              )}
            </td>
            <td className="px-4 py-3 text-right">
              {item.report ? (
                <Link
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  to={`/manager/reports/${item.report.id}`}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  View report
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">-</span>
              )}
            </td>
          </tr>
        ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
