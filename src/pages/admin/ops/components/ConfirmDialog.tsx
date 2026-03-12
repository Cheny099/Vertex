import { useTranslation } from 'react-i18next';

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
};

export function ConfirmDialog({ open, onOpenChange, onConfirm, title, desc }: ConfirmDialogProps) {
  const { t } = useTranslation(['admin', 'common']);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common:cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t('common:confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
