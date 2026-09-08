export type ReportStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'NEEDS_CORRECTION'
  | 'APPROVED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BLOCKED';
export type TimeEntryType =
  | 'DEVELOPMENT'
  | 'TESTING'
  | 'MEETINGS'
  | 'DOCUMENTATION'
  | 'OTHER';
export type ReviewAction = 'REQUEST_CHANGES' | 'APPROVED';

export type ReportSummary = {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  project: {
    id: string;
    name: string;
  };
};

export type Review = {
  id: string;
  action: ReviewAction;
  comment: string | null;
  versionNumber: number;
  reviewer: {
    id: string;
    name: string;
  };
  createdAt: string;
};

export type ReportTask = {
  id: string;
  name: string;
  priority: TaskPriority;
  plannedPercentage: number;
  actualPercentage: number;
  status: TaskStatus;
  plannedHours: number | null;
  actualHours: number | null;
  deliverable: string | null;
};

export type NextWeekTask = {
  id: string;
  description: string;
};

export type Blocker = {
  id: string;
  description: string;
  isKeyIssue: boolean;
  isResolved: boolean;
};

export type Achievement = {
  id: string;
  description: string;
  isKeyAchievement: boolean;
};

export type TimeEntry = {
  id: string;
  type: TimeEntryType;
  hours: number;
};

export type ReportVersionContent = {
  notes: string | null;
  tasks: ReportTask[];
  nextWeekTasks: NextWeekTask[];
  blockers: Blocker[];
  achievements: Achievement[];
  timeEntries: TimeEntry[];
  reviews: Review[];
};

export type ReportDetail = ReportSummary & {
  version: ReportVersionContent & {
    id: string;
    versionNumber: number;
    submittedAt: string | null;
  };
  reviews: Review[];
  latestCorrectionFeedback: Review | null;
  versionSummaries?: ReportVersionSummary[];
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

export type ReportVersionSummary = {
  versionNumber: number;
  createdAt: string;
  submittedAt: string | null;
  isCurrent: boolean;
};

export type ReportVersionDetail = ReportVersionSummary & ReportVersionContent;
