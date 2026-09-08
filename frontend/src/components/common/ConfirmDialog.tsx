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
      <div className="flex flex-wrap justify-end gap-2">
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
