import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SubmissionStatusItem } from '../../../types/dashboard';
import { StatusBadge } from '../../reports/components/StatusBadge';
import { chartPalette } from '../chart-theme';
import { submissionStatusLabel } from '../formatters';

type ChartRow = {
  name: string;
  value: number;
  status: string;
};

export function SubmissionStatusChart({
  data,
}: {
  data: SubmissionStatusItem[];
}) {
  const chartData: ChartRow[] = data.map((item) => ({
    name: item.user.name,
    value: 1,
    status: submissionStatusLabel(item.status),
  }));

  return (
    <div className="space-y-4">
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 16, right: 24, top: 12, bottom: 12 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              width={110}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <Tooltip formatter={(_, __, row) => row.payload.status} />
            <Bar dataKey="value" fill={chartPalette.blue} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {data.map((item) => (
          <div
            className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2"
            key={item.user.id}
          >
            <span className="text-sm font-medium">{item.user.name}</span>
            {item.status === 'NOT_STARTED' ? (
              <span className="rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                Not started
              </span>
            ) : (
              <StatusBadge status={item.status} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
