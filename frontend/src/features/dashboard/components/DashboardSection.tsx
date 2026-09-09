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
  emptyMessage?: string;
  error?: unknown;
  isEmpty?: boolean;
  isLoading?: boolean;
  title: string;
};

export function DashboardSection({
  children,
  description,
  emptyMessage = 'No dashboard data for the selected filters.',
  error,
  isEmpty,
  isLoading,
  title,
}: DashboardSectionProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {isLoading ? <PageLoading label={`Loading ${title.toLowerCase()}`} /> : null}
        {error ? <ErrorState message={getErrorMessage(error)} /> : null}
        {!isLoading && !error && isEmpty ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : null}
        {!isLoading && !error && !isEmpty ? children : null}
      </CardContent>
    </Card>
  );
}
