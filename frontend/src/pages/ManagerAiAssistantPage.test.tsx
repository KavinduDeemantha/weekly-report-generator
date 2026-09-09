import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/errors';
import { aiApi } from '../features/ai/api';
import { projectKeys } from '../features/projects/query-keys';
import { userKeys } from '../features/users/query-keys';
import { ManagerAiAssistantPage } from './ManagerAiAssistantPage';

vi.mock('../features/ai/api', () => ({
  aiApi: {
    askManagerChat: vi.fn(),
  },
}));

describe('ManagerAiAssistantPage', () => {
  it('sends a starter prompt and renders the assistant response', async () => {
    vi.mocked(aiApi.askManagerChat).mockResolvedValueOnce({
      answer: 'Two members have open blockers.',
      scope: { mode: 'week', weekStart: '2026-09-07' },
      sources: { reportCount: 3, memberCount: 5 },
      relatedReports: [
        {
          reportId: 'report-1',
          memberName: 'Priya',
          projectName: 'Client Portal',
        },
      ],
    });

    renderPage();

    await userEvent.click(screen.getByText('Who has open blockers?'));

    await waitFor(() =>
      expect(screen.getByText('Two members have open blockers.')).toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: 'Priya / Client Portal' })).toHaveAttribute(
      'href',
      '/manager/reports/report-1',
    );
  });

  it('includes active filter scope in the request', async () => {
    vi.mocked(aiApi.askManagerChat).mockResolvedValueOnce({
      answer: 'Priya worked on Client Portal.',
      scope: { mode: 'week', weekStart: '2026-09-07' },
      sources: { reportCount: 1, memberCount: 1 },
    });

    renderPage();

    await userEvent.type(screen.getByLabelText('Selected week'), '2026-09-07');
    await userEvent.selectOptions(screen.getByLabelText('Team member'), 'user-1');
    await userEvent.selectOptions(screen.getByLabelText('Project'), 'project-1');
    await userEvent.type(
      screen.getByLabelText('Message'),
      'What did Priya work on this week?',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(aiApi.askManagerChat).toHaveBeenCalledTimes(1));
    expect(aiApi.askManagerChat).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'What did Priya work on this week?',
        filters: {
          weekStart: '2026-09-07',
          userId: 'user-1',
          projectId: 'project-1',
        },
      }),
    );
  });

  it('clears the in-session conversation', async () => {
    vi.mocked(aiApi.askManagerChat).mockResolvedValueOnce({
      answer: 'Three reports were submitted.',
      scope: { mode: 'week', weekStart: '2026-09-07' },
      sources: { reportCount: 3, memberCount: 5 },
    });

    renderPage();

    await userEvent.click(screen.getByText("Summarize this week's team activity"));
    await waitFor(() =>
      expect(screen.getByText('Three reports were submitted.')).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.queryByText('Three reports were submitted.')).not.toBeInTheDocument();
    expect(
      screen.getByText('Start with one of these grounded team-report questions.'),
    ).toBeInTheDocument();
  });

  it('renders rate-limit errors and preserves the prompt for retry', async () => {
    vi.mocked(aiApi.askManagerChat).mockRejectedValueOnce(
      new ApiError(
        'AI request limit reached. Please try again shortly.',
        429,
        undefined,
        'AI_RATE_LIMITED',
        30,
      ),
    );

    renderPage();

    await userEvent.type(screen.getByLabelText('Message'), 'Who has open blockers?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(
        screen.getByText('AI request limit reached. Try again shortly.'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Message')).toHaveValue('Who has open blockers?');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('renders model-unavailable errors without a retry action', async () => {
    vi.mocked(aiApi.askManagerChat).mockRejectedValueOnce(
      new ApiError(
        'Configured AI model is unavailable. Please check Gemini model settings.',
        503,
        undefined,
        'AI_MODEL_UNAVAILABLE',
      ),
    );

    renderPage();

    await userEvent.type(screen.getByLabelText('Message'), 'Who has open blockers?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(
        screen.getByText(
          'The configured AI model is unavailable. Please check the backend AI settings.',
        ),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });


  it('retries the last failed message without duplicating the user message', async () => {
    vi.mocked(aiApi.askManagerChat)
      .mockRejectedValueOnce(
        new ApiError(
          'AI service is temporarily unavailable. Please try again.',
          503,
          undefined,
          'AI_UNAVAILABLE',
        ),
      )
      .mockResolvedValueOnce({
        answer: 'Priya has one open blocker.',
        scope: { mode: 'week', weekStart: '2026-09-07' },
        sources: { reportCount: 1, memberCount: 1 },
      });

    renderPage();

    await userEvent.type(screen.getByLabelText('Message'), 'Who has open blockers?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('AI service is temporarily unavailable. Please try again.');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() =>
      expect(screen.getByText('Priya has one open blocker.')).toBeInTheDocument(),
    );
    expect(aiApi.askManagerChat).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText('Who has open blockers?')).toHaveLength(1);
  });

  it('does not send duplicate requests while a chat request is loading', async () => {
    vi.mocked(aiApi.askManagerChat).mockReturnValueOnce(
      new Promise<never>(() => undefined),
    );

    renderPage();

    await userEvent.type(
      screen.getByLabelText('Message'),
      'Summarize this week',
    );
    const sendButton = screen.getByRole('button', { name: 'Send' });

    await userEvent.click(sendButton);
    await userEvent.click(sendButton);

    expect(aiApi.askManagerChat).toHaveBeenCalledTimes(1);
  });
});

function renderPage() {
  vi.mocked(aiApi.askManagerChat).mockClear();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(userKeys.list({ page: 1, limit: 100 }), {
    data: [
      {
        id: 'user-1',
        name: 'Priya',
        email: 'priya@example.com',
        role: 'TEAM_MEMBER',
        isActive: true,
        createdAt: '2026-09-01T00:00:00.000Z',
      },
    ],
    meta: { page: 1, limit: 100, total: 1 },
  });
  queryClient.setQueryData(projectKeys.list({ page: 1, limit: 100 }), {
    data: [
      {
        id: 'project-1',
        name: 'Client Portal',
        description: null,
        isActive: true,
        assignedMemberCount: 1,
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
    ],
    meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ManagerAiAssistantPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
