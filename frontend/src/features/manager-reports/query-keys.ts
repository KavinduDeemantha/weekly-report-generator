import type { ManagerReportFilters } from './types';

export const managerReportKeys = {
  all: ['managerReports'] as const,
  lists: () => [...managerReportKeys.all, 'list'] as const,
  list: (filters: ManagerReportFilters) =>
    [...managerReportKeys.lists(), filters] as const,
  details: () => [...managerReportKeys.all, 'detail'] as const,
  detail: (id: string) => [...managerReportKeys.details(), id] as const,
};
