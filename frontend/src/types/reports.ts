export type ReportStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'NEEDS_CORRECTION'
  | 'APPROVED';

export type ReportSummary = {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
  };
};

export type PaginatedReports = {
  data: ReportSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
