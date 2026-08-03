import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  desc: string;
  /** While true the action is in flight: the dialog stays open but cannot be re-submitted. */
  pending?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  desc,
  pending = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation(['admin', 'common']);

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            {t('common:cancel')}
          </Button>
          {/* This dialog fronts irreversible actions (force-close sends a market order and the
              request carries no idempotency key), so a second click must not reach the API. */}
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common:confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
