import { AlertCircle, Award, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import type {
  Achievement,
  Blocker,
  ReportDetail,
  ReportTask,
  ReportVersionDetail,
  Review,
  TimeEntry,
} from '../../../types/reports';
import { StatusBadge } from './StatusBadge';

type ReportLike = ReportDetail | ReportVersionDetail;

export function ReportHeader({ report }: { report: ReportDetail }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Weekly report
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal">
          {formatDate(report.weekStart)} to {formatDate(report.weekEnd)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {report.project.name} · Version {report.currentVersion}
        </p>
      </div>
      <StatusBadge status={report.status} />
    </div>
  );
}

export function ReviewFeedback({
  latestCorrectionFeedback,
  reviews,
}: {
  latestCorrectionFeedback?: Review | null;
  reviews: Review[];
}) {
  return (
    <div className="space-y-4">
      {latestCorrectionFeedback ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-1 h-4 w-4 flex-none" aria-hidden="true" />
            <AlertDescription>
              <span className="block font-medium">Changes requested</span>
              <span className="mt-1 block break-words">
                {latestCorrectionFeedback.comment}
              </span>
              <span className="mt-2 block text-xs">
                {latestCorrectionFeedback.reviewer.name} ·{' '}
                {formatDateTime(latestCorrectionFeedback.createdAt)}
              </span>
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      {reviews.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Manager feedback</CardTitle>
            <CardDescription>Reviews linked to report versions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.map((review) => (
              <div
                className="rounded-lg border border-border bg-muted/50 p-3"
                key={review.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{review.action.replace('_', ' ').toLowerCase()}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Version {review.versionNumber}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(review.createdAt)}
                  </span>
                </div>
                <p className="mt-2 break-words text-sm">
                  {review.comment ?? `${review.reviewer.name} approved this report.`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reviewed by {review.reviewer.name}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function ReportContent({ report }: { report: ReportLike }) {
  const content = 'version' in report ? report.version : report;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            {content.notes || 'No notes added.'}
          </p>
        </CardContent>
      </Card>

      <TasksTable tasks={content.tasks} />
      <SimpleList
        title="Next week"
        items={content.nextWeekTasks}
        getText={(item) => item.description}
      />
      <BlockersList blockers={content.blockers} />
      <AchievementsList achievements={content.achievements} />
      <TimeBreakdown entries={content.timeEntries} />
    </div>
  );
}

function TasksTable({ tasks }: { tasks: ReportTask[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks completed</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks added.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Task</th>
                  <th className="px-3 py-2 font-medium">Priority</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Plan</th>
                  <th className="px-3 py-2 font-medium">Actual</th>
                  <th className="px-3 py-2 font-medium">Hours</th>
                  <th className="px-3 py-2 font-medium">Deliverable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.map((task) => (
                  <tr className="transition-colors hover:bg-muted/40" key={task.id}>
                    <td className="px-3 py-3 font-medium">{task.name}</td>
                    <td className="px-3 py-3">{task.priority}</td>
                    <td className="px-3 py-3">{task.status.replace('_', ' ')}</td>
                    <td className="px-3 py-3">{task.plannedPercentage}%</td>
                    <td className="px-3 py-3">{task.actualPercentage}%</td>
                    <td className="px-3 py-3">
                      {task.actualHours ?? 0}/{task.plannedHours ?? 0}
                    </td>
                    <td className="px-3 py-3">{task.deliverable ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SimpleList<T>({
  title,
  items,
  getText,
}: {
  title: string;
  items: T[];
  getText: (item: T) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items added.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li className="rounded-lg border border-border bg-muted/40 p-3 text-sm" key={index}>
                <span className="break-words">{getText(item)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function BlockersList({ blockers }: { blockers: Blocker[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Blockers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {blockers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blockers added.</p>
        ) : (
          blockers.map((blocker) => (
            <div
              className="rounded-lg border border-border bg-muted/40 p-3"
              key={blocker.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                {blocker.isKeyIssue ? (
                  <Badge className="border-amber-300 bg-amber-50 text-amber-800">
                    Key issue
                  </Badge>
                ) : null}
                {blocker.isResolved ? (
                  <Badge className="border-green-200 bg-green-50 text-green-700">
                    Resolved
                  </Badge>
                ) : (
                  <Badge>Open</Badge>
                )}
              </div>
              <p className="mt-2 break-words text-sm">{blocker.description}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AchievementsList({ achievements }: { achievements: Achievement[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {achievements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No achievements added.</p>
        ) : (
          achievements.map((achievement) => (
            <div
              className="rounded-lg border border-green-100 bg-green-50/50 p-3"
              key={achievement.id}
            >
              <div className="flex items-start gap-2">
                {achievement.isKeyAchievement ? (
                  <Award className="mt-0.5 h-4 w-4 text-green-700" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
                <p className="break-words text-sm">{achievement.description}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function TimeBreakdown({ entries }: { entries: TimeEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Time breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No time entries added.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <div
                className="rounded-lg border border-border bg-muted/40 p-3"
                key={entry.id}
              >
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {entry.type}
                </p>
                <p className="mt-1 text-lg font-semibold">{entry.hours}h</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
