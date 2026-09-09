import { useMutation, useQuery } from '@tanstack/react-query';
import { Bot, Loader2, Send, Trash2 } from 'lucide-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { aiApi } from '../features/ai/api';
import { canRetryAiError, getAiErrorMessage } from '../features/ai/errors';
import type {
  ManagerChatFilters,
  ManagerChatMessage,
  ManagerChatResponse,
} from '../features/ai/types';
import { projectsApi } from '../features/projects/api';
import { projectKeys } from '../features/projects/query-keys';
import { usersApi } from '../features/users/api';
import { userKeys } from '../features/users/query-keys';

type ChatEntry =
  ManagerChatMessage &
    Partial<Pick<ManagerChatResponse, 'scope' | 'sources' | 'relatedReports'>>;

type DateFilterMode = 'single-week' | 'date-range';

const starterPrompts = [
  "Summarize this week's team activity",
  'Who has open blockers?',
  'Who has not submitted yet?',
  'Which reports need correction?',
  'Which project has the highest workload?',
  'What did Priya work on this week?',
];

export function ManagerAiAssistantPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [filters, setFilters] = useState<ManagerChatFilters>({});
  const [dateMode, setDateMode] = useState<DateFilterMode>('single-week');
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSubmittedMessageRef = useRef<string>('');
  const usersQuery = useQuery({
    queryKey: userKeys.list({ page: 1, limit: 100 }),
    queryFn: () => usersApi.list({ page: 1, limit: 100 }),
  });
  const projectsQuery = useQuery({
    queryKey: projectKeys.list({ page: 1, limit: 100 }),
    queryFn: () => projectsApi.list({ page: 1, limit: 100 }),
  });
  const chatMutation = useMutation({
    mutationFn: (text: string) =>
      aiApi.askManagerChat({
        message: text,
        filters: activeFilters(dateMode, filters),
        history: messagesToHistory(messages),
      }),
    onSuccess: (response) => {
      lastSubmittedMessageRef.current = '';
      setMessage('');
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: response.answer,
          scope: response.scope,
          sources: response.sources,
          relatedReports: response.relatedReports,
        },
      ]);
    },
    onError: () => {
      setMessage((current) => current || lastSubmittedMessageRef.current);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages, chatMutation.isPending]);

  function submit(text: string) {
    const trimmed = text.trim();

    if (!trimmed || chatMutation.isPending) {
      return;
    }

    setMessages((current) => [...current, { role: 'user', content: trimmed }]);
    setMessage('');
    lastSubmittedMessageRef.current = trimmed;
    chatMutation.mutate(trimmed);
  }

  function retryLastMessage() {
    const lastMessage = lastSubmittedMessageRef.current;

    if (!lastMessage || chatMutation.isPending) {
      return;
    }

    chatMutation.reset();
    setMessage('');
    chatMutation.mutate(lastMessage);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit(message);
    }
  }

  function setMode(mode: DateFilterMode) {
    setDateMode(mode);
    setFilters((current) =>
      mode === 'single-week'
        ? { ...current, from: undefined, to: undefined }
        : { ...current, weekStart: undefined },
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          AI Team Assistant
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask questions about reports, blockers, workload, projects, and team
          activity.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              aria-label="AI assistant date filter mode"
              className="inline-flex rounded-lg border border-border bg-muted p-1"
              role="group"
            >
              <button
                aria-pressed={dateMode === 'single-week'}
                className={modeButtonClass(dateMode === 'single-week')}
                type="button"
                onClick={() => setMode('single-week')}
              >
                Single week
              </button>
              <button
                aria-pressed={dateMode === 'date-range'}
                className={modeButtonClass(dateMode === 'date-range')}
                type="button"
                onClick={() => setMode('date-range')}
              >
                Date range
              </button>
            </div>
            {dateMode === 'single-week' ? (
              <div>
                <Label htmlFor="manager-ai-week">Selected week</Label>
                <Input
                  className="mt-2"
                  id="manager-ai-week"
                  type="date"
                  value={filters.weekStart ?? ''}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      weekStart: event.target.value || undefined,
                      from: undefined,
                      to: undefined,
                    }))
                  }
                />
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="manager-ai-from">From</Label>
                  <Input
                    className="mt-2"
                    id="manager-ai-from"
                    type="date"
                    value={filters.from ?? ''}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        from: event.target.value || undefined,
                        weekStart: undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="manager-ai-to">To</Label>
                  <Input
                    className="mt-2"
                    id="manager-ai-to"
                    type="date"
                    value={filters.to ?? ''}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        to: event.target.value || undefined,
                        weekStart: undefined,
                      }))
                    }
                  />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="manager-ai-user">Team member</Label>
              <select
                className="mt-2 h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm"
                disabled={usersQuery.isLoading}
                id="manager-ai-user"
                value={filters.userId ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
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
              <Label htmlFor="manager-ai-project">Project</Label>
              <select
                className="mt-2 h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm"
                disabled={projectsQuery.isLoading}
                id="manager-ai-project"
                value={filters.projectId ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({
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
          </CardContent>
        </Card>

        <Card className="min-h-[620px]">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
                Team Q&A
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Answers are grounded in backend report data for the selected
                scope.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={messages.length === 0 || chatMutation.isPending}
              onClick={() => {
                setMessages([]);
                chatMutation.reset();
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear
            </Button>
          </CardHeader>
          <CardContent className="flex h-[520px] flex-col gap-4">
            <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Start with one of these grounded team-report questions.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {starterPrompts.map((prompt) => (
                      <button
                        className="rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={chatMutation.isPending}
                        key={prompt}
                        type="button"
                        onClick={() => submit(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((entry, index) => (
                    <ChatBubble entry={entry} key={`${entry.role}-${index}`} />
                  ))}
                  {chatMutation.isPending ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Thinking with current report data...
                    </div>
                  ) : null}
                  {chatMutation.isError ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {getAiErrorMessage(chatMutation.error)}
                      <Button
                        className="ml-3"
                        type="button"
                        variant="outline"
                        onClick={() => chatMutation.reset()}
                      >
                        Dismiss
                      </Button>
                      {canRetryAiError(chatMutation.error) ? (
                        <Button
                          className="ml-2"
                          type="button"
                          variant="outline"
                          onClick={retryLastMessage}
                        >
                          Retry
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                  <div ref={scrollRef} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager-ai-message">Message</Label>
              <textarea
                className="min-h-24 w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={chatMutation.isPending}
                id="manager-ai-message"
                placeholder="Ask about reports, blockers, submissions, workload..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Enter sends. Shift+Enter adds a new line.
                </p>
                <Button
                  type="button"
                  disabled={!message.trim() || chatMutation.isPending}
                  onClick={() => submit(message)}
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ChatBubble({ entry }: { entry: ChatEntry }) {
  const isUser = entry.role === 'user';
  const content = entry.content;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg border p-3 text-sm ${
          isUser
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-card'
        }`}
      >
        <p className="whitespace-pre-wrap leading-6">{content}</p>
        {!isUser && entry.scope && entry.sources ? (
          <div className="mt-3 space-y-2 border-t border-border pt-2 text-xs text-muted-foreground">
            <p>
              Scope: {entry.scope.mode === 'week'
                ? `Week of ${entry.scope.weekStart}`
                : `${entry.scope.from ?? 'Start'} to ${entry.scope.to ?? 'End'}`}
              {' '}· Sources: {entry.sources.reportCount} reports,{' '}
              {entry.sources.memberCount} members
            </p>
            {entry.relatedReports?.length ? (
              <div className="flex flex-wrap gap-2">
                {entry.relatedReports.map((report) => (
                  <Link
                    className="font-medium text-primary hover:underline"
                    key={report.reportId}
                    to={`/manager/reports/${report.reportId}`}
                  >
                    {report.memberName} / {report.projectName}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function activeFilters(
  mode: DateFilterMode,
  filters: ManagerChatFilters,
): ManagerChatFilters {
  const common = cleanFilters({
    userId: filters.userId,
    projectId: filters.projectId,
  });

  if (mode === 'single-week') {
    return cleanFilters({ ...common, weekStart: filters.weekStart });
  }

  return cleanFilters({ ...common, from: filters.from, to: filters.to });
}

function messagesToHistory(messages: ChatEntry[]): ManagerChatMessage[] {
  return messages
    .map((entry) => ({
      role: entry.role,
      content: entry.content,
    }))
    .slice(-8);
}

function cleanFilters(filters: ManagerChatFilters): ManagerChatFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  ) as ManagerChatFilters;
}

function modeButtonClass(isSelected: boolean) {
  return [
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    isSelected
      ? 'bg-card text-primary shadow-sm ring-1 ring-border'
      : 'text-muted-foreground hover:text-foreground',
  ].join(' ');
}
