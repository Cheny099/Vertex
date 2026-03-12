import type { TFunction } from 'i18next';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { InviteActionConfirmState } from '../utils';

interface InviteCodesConfirmDialogProps {
  t: TFunction<'admin' | 'common'>;
  state: InviteActionConfirmState;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function InviteCodesConfirmDialog({
  t,
  state,
  onOpenChange,
  onConfirm,
}: InviteCodesConfirmDialogProps) {
  return (
    <AlertDialog open={state.open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state.title}</AlertDialogTitle>
          <AlertDialogDescription>{state.desc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common:cancel', 'Cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t('common:confirm', 'Confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
