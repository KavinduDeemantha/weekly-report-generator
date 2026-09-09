import { Activity, AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import type { DashboardSummary } from '../../../types/dashboard';
import { buildManagerReportsUrl } from '../drilldowns';
import type { DashboardFilters } from '../types';

const cards = [
  {
    key: 'totalReportsSubmitted',
    label: 'Submitted Reports',
    description:
      'Reports that have been submitted by team members for the selected reporting period.',
    icon: FileText,
    accent: 'border-t-primary text-primary bg-indigo-50',
  },
  {
    key: 'submissionComplianceRate',
    label: 'Submission Compliance Rate',
    description:
      'Percentage of active team members with a Submitted, Needs Correction, or Approved report for the selected week.',
    icon: CheckCircle2,
    suffix: '%',
    accent: 'border-t-accent text-accent bg-cyan-50',
  },
  {
    key: 'pendingCount',
    label: 'Pending',
    description:
      'Active team members with a Draft report or no report for the selected week.',
    icon: Clock,
    accent: 'border-t-warning text-warning bg-amber-50',
  },
  {
    key: 'needsCorrectionCount',
    label: 'Needs Correction',
    description:
      'Reports currently returned by a manager and waiting for member corrections.',
    icon: AlertTriangle,
    accent: 'border-t-warning text-warning bg-amber-50',
  },
  {
    key: 'openBlockersCount',
    label: 'Open Blockers',
    description:
      'Unresolved blockers from the current version of reports in the selected scope.',
    icon: Activity,
    accent: 'border-t-destructive text-destructive bg-red-50',
  },
] as const;

export function SummaryCards({
  data,
  filters,
  isLoading,
}: {
  data?: DashboardSummary;
  filters: DashboardFilters;
  isLoading: boolean;
}) {
  const [openHelpKey, setOpenHelpKey] = useState<string | null>(null);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = data?.[card.key] ?? 0;
        const isHelpOpen = openHelpKey === card.key;
        const helpId = `dashboard-summary-${card.key}-help`;

        const href =
          card.key === 'needsCorrectionCount'
            ? buildManagerReportsUrl(filters, { status: 'NEEDS_CORRECTION' })
            : null;

        return (
          <Card className={`border-t-4 ${card.accent.split(' ')[0]}`} key={card.key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-start justify-between gap-3 text-sm font-medium text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="leading-5">{card.label}</span>
                  <MetricHelp
                    descriptionId={helpId}
                    isOpen={isHelpOpen}
                    label={`About ${card.label}`}
                    onClose={() => setOpenHelpKey(null)}
                    onToggle={() =>
                      setOpenHelpKey((current) =>
                        current === card.key ? null : card.key,
                      )
                    }
                  />
                </span>
                <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${card.accent.split(' ').slice(1).join(' ')}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </CardTitle>
              {isHelpOpen ? (
                <p
                  className="mt-2 rounded-md border border-border bg-muted/50 p-2 text-xs font-normal leading-5 text-foreground"
                  id={helpId}
                  role="note"
                >
                  {card.description}
                </p>
              ) : null}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
              ) : (
                <div className="flex items-end justify-between gap-3">
                  <p className="text-3xl font-semibold tracking-normal">
                    {value}
                    {'suffix' in card ? card.suffix : ''}
                  </p>
                  {href ? (
                    <Link
                      className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      to={href}
                    >
                      View reports
                    </Link>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function MetricHelp({
  descriptionId,
  isOpen,
  label,
  onClose,
  onToggle,
}: {
  descriptionId: string;
  isOpen: boolean;
  label: string;
  onClose: () => void;
  onToggle: () => void;
}) {
  return (
    <span className="inline-flex">
      <button
        aria-controls={descriptionId}
        aria-describedby={isOpen ? descriptionId : undefined}
        aria-expanded={isOpen}
        aria-label={label}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted"
        type="button"
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
      >
        <span
          aria-hidden="true"
          className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] font-semibold leading-none"
        >
          i
        </span>
      </button>
    </span>
  );
}
