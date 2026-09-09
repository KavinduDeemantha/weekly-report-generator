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
import { SubmissionStatusChart } from './SubmissionStatusChart';
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

    expect(screen.getByText('Submitted Reports')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Open Blockers')).toBeInTheDocument();
  });

  it('shows accessible help content for dashboard metrics', async () => {
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

    await userEvent.click(
      screen.getByRole('button', { name: 'About Pending' }),
    );

    expect(
      screen.getByText(
        'Active team members with a Draft report or no report for the selected week.',
      ),
    ).toBeInTheDocument();
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

  it('renders submission status as a categorical member list', () => {
    renderWithProviders(
      <SubmissionStatusChart
        data={[
          {
            user: {
              id: 'user-approved',
              name: 'Priya Jayawardena',
              email: 'priya@example.com',
            },
            status: 'APPROVED',
            report: {
              id: 'report-approved',
              weekStart: '2026-09-07T00:00:00.000Z',
              project: { id: 'project-1', name: 'Client Portal' },
            },
          },
          {
            user: {
              id: 'user-not-started',
              name: 'Kamal Silva',
              email: 'kamal@example.com',
            },
            status: 'NOT_STARTED',
            report: null,
          },
        ]}
      />,
    );

    expect(screen.getByText('Priya Jayawardena')).toBeInTheDocument();
    expect(screen.getByText('approved')).toBeInTheDocument();
    expect(screen.getByText('Kamal Silva')).toBeInTheDocument();
    expect(screen.getAllByText('Not started')).toHaveLength(2);
    expect(screen.getByText('Client Portal')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view report/i })).toHaveAttribute(
      'href',
      '/manager/reports/report-approved',
    );
  });

  it('defaults to single week mode and shows only the week input', () => {
    renderWithProviders(
      <DashboardFilters filters={{}} onChange={vi.fn()} />,
      createDashboardFilterQueryClient(),
    );

    expect(
      screen.getByRole('button', { name: 'Single week' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Selected week')).toBeInTheDocument();
    expect(screen.queryByLabelText('From')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('To')).not.toBeInTheDocument();
  });

  it('shows only from and to inputs in date range mode', async () => {
    renderWithProviders(
      <DashboardFilters filters={{}} onChange={vi.fn()} />,
      createDashboardFilterQueryClient(),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Date range' }));

    expect(
      screen.getByRole('button', { name: 'Date range' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByLabelText('Selected week')).not.toBeInTheDocument();
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
  });

  it('applies single week filters without stale date range values', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <DashboardFilters
        filters={{
          from: '2026-09-01',
          to: '2026-09-30',
        }}
        onChange={onChange}
      />,
      createDashboardFilterQueryClient(),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Single week' }));
    await userEvent.type(screen.getByLabelText('Selected week'), '2026-09-07');
    await userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(onChange).toHaveBeenCalledWith({ weekStart: '2026-09-07' });
  });

  it('applies date range filters without stale selected week values', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <DashboardFilters
        filters={{
          weekStart: '2026-09-07',
        }}
        onChange={onChange}
      />,
      createDashboardFilterQueryClient(),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Date range' }));
    await userEvent.type(screen.getByLabelText('From'), '2026-09-01');
    await userEvent.type(screen.getByLabelText('To'), '2026-09-30');
    await userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(onChange).toHaveBeenCalledWith({
      from: '2026-09-01',
      to: '2026-09-30',
    });
  });

  it('rejects an invalid date range before applying filters', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <DashboardFilters filters={{}} onChange={onChange} />,
      createDashboardFilterQueryClient(),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Date range' }));
    await userEvent.type(screen.getByLabelText('From'), '2026-09-30');
    await userEvent.type(screen.getByLabelText('To'), '2026-09-01');
    await userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect(
      screen.getByText('From date must be on or before To date.'),
    ).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears filters and resets back to single week mode', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <DashboardFilters filters={{}} onChange={onChange} />,
      createDashboardFilterQueryClient(),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Date range' }));
    await userEvent.type(screen.getByLabelText('From'), '2026-09-30');
    await userEvent.type(screen.getByLabelText('To'), '2026-09-01');
    await userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(
      screen.getByRole('button', { name: 'Single week' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Selected week')).toHaveValue('');
    expect(
      screen.queryByText('From date must be on or before To date.'),
    ).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({});
  });

  it('applies selected filters only when requested', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <DashboardFilters filters={{}} onChange={onChange} />,
      createDashboardFilterQueryClient(),
    );

    await userEvent.type(screen.getByLabelText('Selected week'), '2026-09-07');
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    expect(onChange).toHaveBeenCalledWith({ weekStart: '2026-09-07' });
  });
});

function createDashboardFilterQueryClient() {
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

  return queryClient;
}
