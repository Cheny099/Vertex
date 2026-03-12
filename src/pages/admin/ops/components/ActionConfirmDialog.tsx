import type { TFunction } from 'i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ActionConfirmDialogProps = {
  t: TFunction;
  open: boolean;
  title: string;
  desc: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function ActionConfirmDialog({
  t,
  open,
  title,
  desc,
  onOpenChange,
  onConfirm,
}: ActionConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{desc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common:cancel', 'Cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{t('common:confirm', 'Confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

