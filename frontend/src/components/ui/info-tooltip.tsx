import { Info } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '../../lib/utils';

type InfoTooltipProps = {
  label: string;
  children: string;
};

export function InfoTooltip({ label, children }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span className="relative inline-flex">
      <button
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-expanded={isOpen}
        aria-label={label}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted"
        type="button"
        onBlur={() => setIsOpen(false)}
        onClick={() => setIsOpen(true)}
        onFocus={() => setIsOpen(true)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>
      <span
        className={cn(
          'absolute right-0 top-8 z-30 hidden w-64 rounded-md border border-border bg-background p-3 text-left text-xs font-normal leading-5 text-foreground shadow-md',
          isOpen && 'block',
        )}
        id={tooltipId}
        role="tooltip"
      >
        {children}
      </span>
    </span>
  );
}
