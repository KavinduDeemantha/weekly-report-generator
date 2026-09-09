import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel: string;
  description: string;
  isConfirming?: boolean;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  variant?: 'default' | 'destructive';
};

export function ConfirmDialog({
  cancelLabel = 'Cancel',
  confirmLabel,
  description,
  isConfirming = false,
  isOpen,
  onCancel,
  onConfirm,
  title,
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Dialog
      description={description}
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
    >
      <div className="-mx-5 -mb-5 mt-1 flex flex-wrap justify-end gap-2 border-t border-border bg-slate-50 px-5 py-4">
        <Button
          type="button"
          variant="outline"
          disabled={isConfirming}
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={variant}
          disabled={isConfirming}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
