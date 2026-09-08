import type {
  TaskPriority,
  TaskStatus,
  TimeEntryType,
  ReportStatus,
} from '../../types/reports';

export type ReportListFilters = {
  page: number;
  limit: number;
  status?: ReportStatus;
  projectId?: string;
  from?: string;
  to?: string;
};

export type ReportFormTask = {
  name: string;
  priority: TaskPriority;
  plannedPercentage: number;
  actualPercentage: number;
  status: TaskStatus;
  plannedHours?: number;
  actualHours?: number;
  deliverable?: string;
};

export type ReportFormValues = {
  weekStart: string;
  weekEnd: string;
  projectId: string;
  notes?: string;
  tasks: ReportFormTask[];
  nextWeekTasks: { description: string }[];
  blockers: {
    description: string;
    isKeyIssue: boolean;
    isResolved: boolean;
  }[];
  achievements: {
    description: string;
    isKeyAchievement: boolean;
  }[];
  timeEntries: {
    type: TimeEntryType;
    hours: number;
  }[];
};
