import { Activity, AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { InfoTooltip } from '../../../components/ui/info-tooltip';
import type { DashboardSummary } from '../../../types/dashboard';

const cards = [
  {
    key: 'totalReportsSubmitted',
    label: 'Total Reports Submitted',
    description: 'Reports submitted by team members for the selected period.',
    icon: FileText,
  },
  {
    key: 'submissionComplianceRate',
    label: 'Submission Compliance Rate',
    description:
      'Percentage of active team members with a Submitted, Needs Correction, or Approved report for the selected week.',
    icon: CheckCircle2,
    suffix: '%',
  },
  {
    key: 'pendingCount',
    label: 'Pending',
    description:
      'Active team members with a Draft report or no report for the selected week.',
    icon: Clock,
  },
  {
    key: 'needsCorrectionCount',
    label: 'Needs Correction',
    description:
      'Reports currently returned by a manager and waiting for member corrections.',
    icon: AlertTriangle,
  },
  {
    key: 'openBlockersCount',
    label: 'Open Blockers',
    description:
      'Unresolved blockers from the current version of reports in the selected scope.',
    icon: Activity,
  },
] as const;

export function SummaryCards({
  data,
  isLoading,
}: {
  data?: DashboardSummary;
  isLoading: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = data?.[card.key] ?? 0;

        return (
          <Card key={card.key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {card.label}
                  <InfoTooltip label={`About ${card.label}`}>
                    {card.description}
                  </InfoTooltip>
                </span>
                <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
              ) : (
                <p className="text-2xl font-semibold">
                  {value}
                  {'suffix' in card ? card.suffix : ''}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
