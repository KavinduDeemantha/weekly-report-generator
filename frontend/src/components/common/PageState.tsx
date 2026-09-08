import { AlertCircle, FileText, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function PageLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Alert className="border-red-200 bg-red-50 text-red-900">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
        <div className="space-y-3">
          <AlertDescription>{message}</AlertDescription>
          {onRetry ? (
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </Alert>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background p-8 text-center">
      <FileText className="mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
