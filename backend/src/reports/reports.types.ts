import type { PaginationMeta } from '../common/pagination.js';
import type {
  ReportStatus,
  TaskPriority,
  TaskStatus,
  TimeEntryType,
} from '../generated/prisma/enums.js';

export type ReportProjectSummary = {
  id: string;
  name: string;
};

export type ReportSummary = {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  project: ReportProjectSummary;
  status: ReportStatus;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
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
  };
};

export type PaginatedReports = {
  data: ReportSummary[];
  meta: PaginationMeta;
};
