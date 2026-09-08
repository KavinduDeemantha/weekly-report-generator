import { ErrorState, PageLoading } from '../../../components/common/PageState';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { getErrorMessage } from '../../../api/errors';

type DashboardSectionProps = {
  children: React.ReactNode;
  description?: string;
  error?: unknown;
  isEmpty?: boolean;
  isLoading?: boolean;
  title: string;
};

export function DashboardSection({
  children,
  description,
  error,
  isEmpty,
  isLoading,
  title,
}: DashboardSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {isLoading ? <PageLoading label={`Loading ${title.toLowerCase()}`} /> : null}
        {error ? <ErrorState message={getErrorMessage(error)} /> : null}
        {!isLoading && !error && isEmpty ? (
          <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed border-border bg-slate-50 p-6 text-center text-sm text-muted-foreground">
            No dashboard data for the selected filters.
          </div>
        ) : null}
        {!isLoading && !error && !isEmpty ? children : null}
      </CardContent>
    </Card>
  );
}
