export type DashboardSummary = {
  totalReportsSubmitted: number;
  submissionComplianceRate: number;
  pendingCount: number;
  needsCorrectionCount: number;
  openBlockersCount: number;
};

export type DashboardSubmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'NEEDS_CORRECTION'
  | 'APPROVED'
  | 'NOT_STARTED';

export type SubmissionStatusItem = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  status: DashboardSubmissionStatus;
  report: {
    id: string;
    weekStart: string;
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
  type: string;
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
  createdAt: string;
  message: string;
};
