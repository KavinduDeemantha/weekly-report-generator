import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';

type DialogProps = {
  children: React.ReactNode;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function Dialog({
  children,
  description,
  isOpen,
  onClose,
  title,
}: DialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-labelledby="dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-background shadow-lg">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2
              className="text-lg font-semibold tracking-normal"
              id="dialog-title"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            aria-label="Close dialog"
            size="icon"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className={cn('p-5')}>{children}</div>
      </div>
    </div>
  );
}
