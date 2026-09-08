import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TimeDistributionItem } from '../../../types/dashboard';
import { chartPalette } from '../chart-theme';
import { formatEnumLabel } from '../formatters';

export function TimeDistributionChart({
  data,
}: {
  data: TimeDistributionItem[];
}) {
  const chartData = data.map((item) => ({
    ...item,
    label: formatEnumLabel(item.type),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ left: 8, right: 16, top: 16, bottom: 32 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            angle={-15}
            textAnchor="end"
            height={48}
          />
          <YAxis tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip formatter={(value) => [`${value}h`, 'Hours']} />
          <Bar dataKey="hours" fill={chartPalette.amber} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
