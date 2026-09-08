import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';
import type { ReportStatus } from '../../../types/reports';

const statusStyles: Record<ReportStatus, string> = {
  DRAFT: 'border-slate-300 bg-slate-100 text-slate-700',
  SUBMITTED: 'border-blue-200 bg-blue-50 text-blue-700',
  NEEDS_CORRECTION: 'border-amber-200 bg-amber-50 text-amber-800',
  APPROVED: 'border-green-200 bg-green-50 text-green-700',
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <Badge className={cn('capitalize', statusStyles[status])}>
      {status.toLowerCase().replace('_', ' ')}
    </Badge>
  );
}
