import type { ReportStatus } from '../../types/reports';
import type { DashboardFilters } from './types';

export function buildManagerReportsUrl(
  filters: DashboardFilters,
  extra: {
    projectId?: string;
    status?: ReportStatus;
    statusIn?: ReportStatus[];
  } = {},
) {
  const params = new URLSearchParams();

  if (filters.weekStart) {
    params.set('weekStart', filters.weekStart);
  } else {
    if (filters.from) {
      params.set('from', filters.from);
    }

    if (filters.to) {
      params.set('to', filters.to);
    }
  }

  if (filters.userId) {
    params.set('userId', filters.userId);
  }

  if (extra.projectId ?? filters.projectId) {
    params.set('projectId', extra.projectId ?? filters.projectId ?? '');
  }

  if (extra.status) {
    params.set('status', extra.status);
  }

  if (extra.statusIn && extra.statusIn.length > 0) {
    params.set('statusIn', extra.statusIn.join(','));
  }

  const query = params.toString();

  return query ? `/manager/reports?${query}` : '/manager/reports';
}
