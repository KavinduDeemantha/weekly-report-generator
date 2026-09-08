import type { ReportStatus } from '../../types/reports';

export type ManagerReportFilters = {
  page: number;
  limit: number;
  status?: ReportStatus;
  userId?: string;
  projectId?: string;
  from?: string;
  to?: string;
};
