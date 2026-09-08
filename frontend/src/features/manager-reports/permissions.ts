import type { ReportStatus } from '../../types/reports';

export function canReviewReportStatus(status: ReportStatus) {
  return status === 'SUBMITTED';
}
