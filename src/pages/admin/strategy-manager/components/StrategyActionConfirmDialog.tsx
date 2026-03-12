import React from 'react';
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
import type { ActionConfirmState } from '../utils';

interface StrategyActionConfirmDialogProps {
    actionConfirm: ActionConfirmState;
    setActionConfirm: React.Dispatch<React.SetStateAction<ActionConfirmState>>;
    t: (key: string, fallback?: string) => string;
}

export const StrategyActionConfirmDialog = React.memo(({
    actionConfirm,
    setActionConfirm,
    t,
}: StrategyActionConfirmDialogProps) => (
    <AlertDialog open={actionConfirm.open} onOpenChange={(open) => setActionConfirm((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{actionConfirm.title}</AlertDialogTitle>
                <AlertDialogDescription>{actionConfirm.desc}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('common:cancel', 'Cancel')}</AlertDialogCancel>
                <AlertDialogAction
                    onClick={() => {
                        actionConfirm.onConfirm();
                        setActionConfirm((prev) => ({ ...prev, open: false }));
                    }}
                >
                    {t('common:confirm', 'Confirm')}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
));

StrategyActionConfirmDialog.displayName = 'StrategyActionConfirmDialog';
