import type { ReportStatus } from '../../types/reports';

export type ManagerReportFilters = {
  page: number;
  limit: number;
  status?: ReportStatus;
  statusIn?: string;
  userId?: string;
  projectId?: string;
  weekStart?: string;
  week?: string;
  from?: string;
  to?: string;
};
