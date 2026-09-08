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
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="projectName"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            angle={-20}
            textAnchor="end"
            height={56}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip formatter={(value) => [value, 'Tasks']} />
          <Bar dataKey="taskCount" fill={chartPalette.green} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
