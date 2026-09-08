import type { ReportStatus } from '../../types/reports';

export function canEditReportStatus(status: ReportStatus) {
  return status === 'DRAFT' || status === 'NEEDS_CORRECTION';
}

export function canSubmitReportStatus(status: ReportStatus) {
  return status === 'DRAFT';
}

export function canResubmitReportStatus(status: ReportStatus) {
  return status === 'NEEDS_CORRECTION';
}
