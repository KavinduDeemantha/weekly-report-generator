import type { ReportStatus, TimeEntryType } from '../generated/prisma/enums.js';

export type DashboardSummary = {
  totalReportsSubmitted: number;
  submissionComplianceRate: number;
  pendingCount: number;
  needsCorrectionCount: number;
  openBlockersCount: number;
};

export type SubmissionDashboardStatus = ReportStatus | 'NOT_STARTED';

export type SubmissionStatusItem = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  status: SubmissionDashboardStatus;
  report: {
    id: string;
    weekStart: Date;
    project: {
      id: string;
      name: string;
    };
  } | null;
};

export type TaskTrendItem = {
  weekStart: string;
  completedTasks: number;
};

export type ProjectDistributionItem = {
  projectId: string;
  projectName: string;
  taskCount: number;
};

export type TimeDistributionItem = {
  type: TimeEntryType;
  hours: number;
};

export type DashboardActivityType =
  | 'REPORT_SUBMITTED'
  | 'REPORT_RESUBMITTED'
  | 'CHANGES_REQUESTED'
  | 'REPORT_APPROVED';

export type DashboardActivityItem = {
  type: DashboardActivityType;
  reportId: string;
  versionNumber?: number;
  user: {
    id: string;
    name: string;
  };
  reviewer?: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    name: string;
  };
  createdAt: Date;
  message: string;
};
