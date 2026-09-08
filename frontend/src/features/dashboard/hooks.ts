import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './api';
import { dashboardKeys } from './query-keys';
import type { DashboardFilters } from './types';

export function useDashboardSummary(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.summary(filters),
    queryFn: () => dashboardApi.getSummary(filters),
  });
}

export function useSubmissionStatus(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.submissionStatus(filters),
    queryFn: () => dashboardApi.getSubmissionStatus(filters),
  });
}

export function useTaskTrends(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.taskTrends(filters),
    queryFn: () => dashboardApi.getTaskTrends(filters),
  });
}

export function useProjectDistribution(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.projectDistribution(filters),
    queryFn: () => dashboardApi.getProjectDistribution(filters),
  });
}

export function useTimeDistribution(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.timeDistribution(filters),
    queryFn: () => dashboardApi.getTimeDistribution(filters),
  });
}

export function useDashboardActivity(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.activity(filters),
    queryFn: () => dashboardApi.getActivity(filters),
  });
}
