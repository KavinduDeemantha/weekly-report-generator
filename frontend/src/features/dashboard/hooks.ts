import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './api';
import { dashboardKeys } from './query-keys';
import type { DashboardFilters } from './types';

const dashboardQueryOptions = {
  staleTime: 30_000,
  refetchOnWindowFocus: true,
} as const;

export function useDashboardSummary(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.summary(filters),
    queryFn: () => dashboardApi.getSummary(filters),
    ...dashboardQueryOptions,
  });
}

export function useSubmissionStatus(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.submissionStatus(filters),
    queryFn: () => dashboardApi.getSubmissionStatus(filters),
    ...dashboardQueryOptions,
  });
}

export function useTaskTrends(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.taskTrends(filters),
    queryFn: () => dashboardApi.getTaskTrends(filters),
    ...dashboardQueryOptions,
  });
}

export function useProjectDistribution(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.projectDistribution(filters),
    queryFn: () => dashboardApi.getProjectDistribution(filters),
    ...dashboardQueryOptions,
  });
}

export function useTimeDistribution(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.timeDistribution(filters),
    queryFn: () => dashboardApi.getTimeDistribution(filters),
    ...dashboardQueryOptions,
  });
}

export function useDashboardActivity(filters: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.activity(filters),
    queryFn: () => dashboardApi.getActivity(filters),
    ...dashboardQueryOptions,
  });
}
