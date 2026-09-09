import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import type { ProjectDistributionItem } from '../../../types/dashboard';
import { chartPalette } from '../chart-theme';
import { buildManagerReportsUrl } from '../drilldowns';
import type { DashboardFilters } from '../types';

export function ProjectDistributionChart({
  data,
  filters,
}: {
  data: ProjectDistributionItem[];
  filters: DashboardFilters;
}) {
  return (
    <div className="space-y-4">
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
              formatter={(value) => [`${value} tasks`, 'Workload']}
            />
            <Bar dataKey="taskCount" fill={chartPalette.cyan} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {data.map((project) => (
          <Link
            className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm transition-colors hover:border-primary hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            key={project.projectId}
            to={buildManagerReportsUrl(filters, { projectId: project.projectId })}
          >
            <span className="font-medium text-foreground">{project.projectName}</span>
            <span className="ml-2 text-muted-foreground">
              {project.taskCount} tasks
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
