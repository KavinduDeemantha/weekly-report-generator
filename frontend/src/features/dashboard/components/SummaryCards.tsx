import { Activity, AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import type { DashboardSummary } from '../../../types/dashboard';

const cards = [
  {
    key: 'totalReportsSubmitted',
    label: 'Total Reports Submitted',
    icon: FileText,
  },
  {
    key: 'submissionComplianceRate',
    label: 'Submission Compliance Rate',
    icon: CheckCircle2,
    suffix: '%',
  },
  {
    key: 'pendingCount',
    label: 'Pending',
    icon: Clock,
  },
  {
    key: 'needsCorrectionCount',
    label: 'Needs Correction',
    icon: AlertTriangle,
  },
  {
    key: 'openBlockersCount',
    label: 'Open Blockers',
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
                {card.label}
                <Icon className="h-4 w-4" aria-hidden="true" />
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
