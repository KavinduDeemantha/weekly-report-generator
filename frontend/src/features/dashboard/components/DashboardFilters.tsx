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

type DateFilterMode = 'single-week' | 'date-range';

type DashboardFiltersProps = {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
};

export function DashboardFilters({
  filters,
  onChange,
}: DashboardFiltersProps) {
  const [draft, setDraft] = useState<DashboardFilters>(filters);
  const [mode, setMode] = useState<DateFilterMode>(() =>
    filters.from || filters.to ? 'date-range' : 'single-week',
  );
  const [dateError, setDateError] = useState<string | null>(null);
  const usersQuery = useQuery({
    queryKey: userKeys.list({ page: 1, limit: 100 }),
    queryFn: () => usersApi.list({ page: 1, limit: 100 }),
  });
  const projectsQuery = useQuery({
    queryKey: projectKeys.list({ page: 1, limit: 100 }),
    queryFn: () => projectsApi.list({ page: 1, limit: 100 }),
  });

  function applyFilters() {
    const validationError = validateDateFilters(mode, draft);

    if (validationError) {
      setDateError(validationError);
      return;
    }

    setDateError(null);
    onChange(toAppliedFilters(mode, draft));
  }

  function resetFilters() {
    setDraft({});
    setMode('single-week');
    setDateError(null);
    onChange({});
  }

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-4">
        <div
          aria-label="Dashboard date filter mode"
          className="inline-flex rounded-md border border-border bg-slate-50 p-1"
          role="group"
        >
          <button
            aria-pressed={mode === 'single-week'}
            className={getModeButtonClass(mode === 'single-week')}
            type="button"
            onClick={() => {
              setMode('single-week');
              setDateError(null);
            }}
          >
            Single week
          </button>
          <button
            aria-pressed={mode === 'date-range'}
            className={getModeButtonClass(mode === 'date-range')}
            type="button"
            onClick={() => {
              setMode('date-range');
              setDateError(null);
            }}
          >
            Date range
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === 'single-week'
            ? 'View analytics for one reporting week.'
            : 'View analytics across multiple reporting weeks.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {mode === 'single-week' ? (
          <div>
            <Label htmlFor="dashboard-week">Selected week</Label>
            <Input
              aria-describedby={dateError ? 'dashboard-date-error' : undefined}
              aria-invalid={Boolean(dateError)}
              className="mt-2"
              id="dashboard-week"
              type="date"
              value={draft.weekStart ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  weekStart: event.target.value || undefined,
                }))
              }
            />
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="dashboard-from">From</Label>
              <Input
                aria-describedby={dateError ? 'dashboard-date-error' : undefined}
                aria-invalid={Boolean(dateError)}
                className="mt-2"
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
                aria-describedby={dateError ? 'dashboard-date-error' : undefined}
                aria-invalid={Boolean(dateError)}
                className="mt-2"
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
          </>
        )}
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
      {dateError ? (
        <p className="mt-3 text-sm text-red-600" id="dashboard-date-error">
          {dateError}
        </p>
      ) : null}
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

function toAppliedFilters(
  mode: DateFilterMode,
  filters: DashboardFilters,
): DashboardFilters {
  const commonFilters = cleanFilters({
    userId: filters.userId,
    projectId: filters.projectId,
    limit: filters.limit,
  });

  if (mode === 'single-week') {
    return cleanFilters({
      ...commonFilters,
      weekStart: filters.weekStart,
    });
  }

  return cleanFilters({
    ...commonFilters,
    from: filters.from,
    to: filters.to,
  });
}

function validateDateFilters(
  mode: DateFilterMode,
  filters: DashboardFilters,
): string | null {
  if (mode === 'single-week') {
    if (filters.weekStart && !isValidDateInput(filters.weekStart)) {
      return 'Choose a valid selected week date.';
    }

    return null;
  }

  if (filters.from && !isValidDateInput(filters.from)) {
    return 'Choose a valid from date.';
  }

  if (filters.to && !isValidDateInput(filters.to)) {
    return 'Choose a valid to date.';
  }

  if (filters.from && filters.to && filters.from > filters.to) {
    return 'From date must be on or before To date.';
  }

  return null;
}

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function cleanFilters(filters: DashboardFilters): DashboardFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  ) as DashboardFilters;
}

function getModeButtonClass(isSelected: boolean) {
  return [
    'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    isSelected
      ? 'bg-background text-foreground shadow-sm'
      : 'text-muted-foreground hover:text-foreground',
  ].join(' ');
}
