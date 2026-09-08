import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { projectsApi } from '../../projects/api';
import { projectKeys } from '../../projects/query-keys';
import { usersApi } from '../../users/api';
import { userKeys } from '../../users/query-keys';
import type { DashboardFilters } from '../types';

type DashboardFiltersProps = {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
};

export function DashboardFilters({
  filters,
  onChange,
}: DashboardFiltersProps) {
  const [draft, setDraft] = useState<DashboardFilters>(filters);
  const usersQuery = useQuery({
    queryKey: userKeys.list({ page: 1, limit: 100 }),
    queryFn: () => usersApi.list({ page: 1, limit: 100 }),
  });
  const projectsQuery = useQuery({
    queryKey: projectKeys.list({ page: 1, limit: 100 }),
    queryFn: () => projectsApi.list({ page: 1, limit: 100 }),
  });

  function applyFilters() {
    onChange(cleanFilters(draft));
  }

  function resetFilters() {
    setDraft({});
    onChange({});
  }

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <Label htmlFor="dashboard-week">Selected week</Label>
          <Input
            className="mt-2"
            id="dashboard-week"
            type="date"
            value={draft.weekStart ?? ''}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                weekStart: event.target.value || undefined,
                from: event.target.value ? undefined : current.from,
                to: event.target.value ? undefined : current.to,
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="dashboard-from">From</Label>
          <Input
            className="mt-2"
            disabled={Boolean(draft.weekStart)}
            id="dashboard-from"
            type="date"
            value={draft.from ?? ''}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                from: event.target.value || undefined,
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="dashboard-to">To</Label>
          <Input
            className="mt-2"
            disabled={Boolean(draft.weekStart)}
            id="dashboard-to"
            type="date"
            value={draft.to ?? ''}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                to: event.target.value || undefined,
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="dashboard-user">Team member</Label>
          <select
            className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            disabled={usersQuery.isLoading}
            id="dashboard-user"
            value={draft.userId ?? ''}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                userId: event.target.value || undefined,
              }))
            }
          >
            <option value="">All members</option>
            {(usersQuery.data?.data ?? [])
              .filter((user) => user.role === 'TEAM_MEMBER')
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <Label htmlFor="dashboard-project">Project</Label>
          <select
            className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            disabled={projectsQuery.isLoading}
            id="dashboard-project"
            value={draft.projectId ?? ''}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                projectId: event.target.value || undefined,
              }))
            }
          >
            <option value="">All projects</option>
            {(projectsQuery.data?.data ?? []).map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={resetFilters}>
          Clear filters
        </Button>
        <Button type="button" onClick={applyFilters}>
          Apply filters
        </Button>
      </div>
    </div>
  );
}

function cleanFilters(filters: DashboardFilters): DashboardFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  ) as DashboardFilters;
}
