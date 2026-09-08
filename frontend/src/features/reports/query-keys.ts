import type { ReportListFilters } from './types';

export const reportsKeys = {
  all: ['reports'] as const,
  lists: () => [...reportsKeys.all, 'list'] as const,
  list: (filters: ReportListFilters) =>
    [...reportsKeys.lists(), filters] as const,
  details: () => [...reportsKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportsKeys.details(), id] as const,
  versions: (id: string) => [...reportsKeys.detail(id), 'versions'] as const,
  version: (id: string, versionNumber: number) =>
    [...reportsKeys.versions(id), versionNumber] as const,
};
