import type {
  DashboardActivityType,
  DashboardSubmissionStatus,
} from '../../types/dashboard';

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatWeek(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function activityLabel(type: DashboardActivityType) {
  const labels: Record<DashboardActivityType, string> = {
    REPORT_SUBMITTED: 'Report submitted',
    REPORT_RESUBMITTED: 'Report resubmitted',
    CHANGES_REQUESTED: 'Changes requested',
    REPORT_APPROVED: 'Report approved',
  };

  return labels[type];
}

export function submissionStatusLabel(status: DashboardSubmissionStatus) {
  return status === 'NOT_STARTED' ? 'Not started' : formatEnumLabel(status);
}
