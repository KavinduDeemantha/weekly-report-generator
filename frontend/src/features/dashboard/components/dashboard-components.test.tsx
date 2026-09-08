import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { projectKeys } from '../../projects/query-keys';
import { userKeys } from '../../users/query-keys';
import { ActivityFeed } from './ActivityFeed';
import { DashboardFilters } from './DashboardFilters';
import { DashboardSection } from './DashboardSection';
import { SummaryCards } from './SummaryCards';

function renderWithProviders(
  ui: React.ReactElement,
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  }),
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('dashboard components', () => {
  it('renders summary card values from the API response', () => {
    renderWithProviders(
      <SummaryCards
        isLoading={false}
        data={{
          totalReportsSubmitted: 3,
          submissionComplianceRate: 75,
          pendingCount: 1,
          needsCorrectionCount: 1,
          openBlockersCount: 2,
        }}
      />,
    );

    expect(screen.getByText('Total Reports Submitted')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Open Blockers')).toBeInTheDocument();
  });

  it('renders an empty state for a chart section with no data', () => {
    renderWithProviders(
      <DashboardSection title="Task Trends" isEmpty>
        <div>Chart</div>
      </DashboardSection>,
    );

    expect(
      screen.getByText('No dashboard data for the selected filters.'),
    ).toBeInTheDocument();
  });

  it('renders readable activity labels', () => {
    renderWithProviders(
      <ActivityFeed
        data={[
          {
            type: 'CHANGES_REQUESTED',
            reportId: 'report-1',
            user: { id: 'user-1', name: 'Sunil Silva' },
            project: { id: 'project-1', name: 'Client Portal' },
            createdAt: '2026-09-08T10:00:00.000Z',
            message: 'Changes were requested for Sunil Silva report',
          },
        ]}
      />,
    );

    expect(screen.getByText('Changes requested')).toBeInTheDocument();
    expect(screen.getByText('Sunil Silva · Client Portal')).toBeInTheDocument();
  });

  it('applies selected filters only when requested', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData(userKeys.list({ page: 1, limit: 100 }), {
      data: [
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Team Member',
          email: 'member@example.com',
          role: 'TEAM_MEMBER',
        },
      ],
      meta: { page: 1, limit: 100, total: 1 },
    });
    queryClient.setQueryData(projectKeys.list({ page: 1, limit: 100 }), {
      data: [
        {
          id: '00000000-0000-0000-0000-000000000002',
          name: 'Client Portal',
          description: null,
          isActive: true,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    const onChange = vi.fn();

    renderWithProviders(
      <DashboardFilters filters={{}} onChange={onChange} />,
      queryClient,
    );

    await userEvent.type(screen.getByLabelText('Selected week'), '2026-09-07');
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    expect(onChange).toHaveBeenCalledWith({ weekStart: '2026-09-07' });
  });
});
