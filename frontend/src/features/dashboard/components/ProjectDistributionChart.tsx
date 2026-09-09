import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ProjectDistributionItem } from '../../../types/dashboard';
import { chartPalette } from '../chart-theme';

export function ProjectDistributionChart({
  data,
}: {
  data: ProjectDistributionItem[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: 8, right: 16, top: 16, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="projectName"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            angle={-20}
            textAnchor="end"
            height={56}
            stroke={chartPalette.slate}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke={chartPalette.slate} />
          <Tooltip
            contentStyle={{
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              boxShadow: '0 8px 24px rgb(15 23 42 / 0.08)',
            }}
            formatter={(value) => [value, 'Tasks']}
          />
          <Bar dataKey="taskCount" fill={chartPalette.cyan} radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
