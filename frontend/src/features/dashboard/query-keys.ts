import type { DashboardFilters } from './types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (filters: DashboardFilters) =>
    [...dashboardKeys.all, 'summary', filters] as const,
  submissionStatus: (filters: DashboardFilters) =>
    [...dashboardKeys.all, 'submission-status', filters] as const,
  taskTrends: (filters: DashboardFilters) =>
    [...dashboardKeys.all, 'task-trends', filters] as const,
  projectDistribution: (filters: DashboardFilters) =>
    [...dashboardKeys.all, 'project-distribution', filters] as const,
  timeDistribution: (filters: DashboardFilters) =>
    [...dashboardKeys.all, 'time-distribution', filters] as const,
  activity: (filters: DashboardFilters) =>
    [...dashboardKeys.all, 'activity', filters] as const,
};
