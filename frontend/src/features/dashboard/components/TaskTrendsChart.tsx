import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TaskTrendItem } from '../../../types/dashboard';
import { chartPalette } from '../chart-theme';
import { formatWeek } from '../formatters';

export function TaskTrendsChart({ data }: { data: TaskTrendItem[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 8, right: 16, top: 16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="weekStart"
            tickFormatter={formatWeek}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke={chartPalette.slate}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke={chartPalette.slate} />
          <Tooltip
            contentStyle={{
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              boxShadow: '0 8px 24px rgb(15 23 42 / 0.08)',
            }}
            formatter={(value) => [value, 'Completed tasks']}
            labelFormatter={(label) => `Week of ${formatWeek(String(label))}`}
          />
          <Line
            type="monotone"
            dataKey="completedTasks"
            stroke={chartPalette.indigo}
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
