import type { PaginationMeta } from '../common/pagination.js';
import type {
  ReviewAction,
  ReportStatus,
  TaskPriority,
  TaskStatus,
  TimeEntryType,
} from '../generated/prisma/enums.js';

export type ReportProjectSummary = {
  id: string;
  name: string;
};

export type ReportUserSummary = {
  id: string;
  name: string;
  email: string;
};

export type ReportSummary = {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  project: ReportProjectSummary;
  user?: ReportUserSummary;
  status: ReportStatus;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ReviewResponse = {
  id: string;
  action: ReviewAction;
  comment: string | null;
  versionNumber: number;
  reviewer: {
    id: string;
    name: string;
  };
  createdAt: Date;
};

export type ReportTaskResponse = {
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

export type NextWeekTaskResponse = {
  id: string;
  description: string;
};

export type BlockerResponse = {
  id: string;
  description: string;
  isKeyIssue: boolean;
  isResolved: boolean;
};

export type AchievementResponse = {
  id: string;
  description: string;
  isKeyAchievement: boolean;
};

export type TimeEntryResponse = {
  id: string;
  type: TimeEntryType;
  hours: number;
};

export type ReportDetail = ReportSummary & {
  version: {
    id: string;
    versionNumber: number;
    notes: string | null;
    submittedAt: Date | null;
    tasks: ReportTaskResponse[];
    nextWeekTasks: NextWeekTaskResponse[];
    blockers: BlockerResponse[];
    achievements: AchievementResponse[];
    timeEntries: TimeEntryResponse[];
    reviews: ReviewResponse[];
  };
  reviews: ReviewResponse[];
  latestCorrectionFeedback: ReviewResponse | null;
  versionSummaries?: ReportVersionSummary[];
};

export type PaginatedReports = {
  data: ReportSummary[];
  meta: PaginationMeta;
};

export type ReportVersionSummary = {
  versionNumber: number;
  createdAt: Date;
  submittedAt: Date | null;
  isCurrent: boolean;
};

export type ReportVersionDetail = ReportVersionSummary & {
  notes: string | null;
  tasks: ReportTaskResponse[];
  nextWeekTasks: NextWeekTaskResponse[];
  blockers: BlockerResponse[];
  achievements: AchievementResponse[];
  timeEntries: TimeEntryResponse[];
  reviews: ReviewResponse[];
};
