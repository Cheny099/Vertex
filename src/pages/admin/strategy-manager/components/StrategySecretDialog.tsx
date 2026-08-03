import type { TFunction } from 'i18next';
import React from 'react';
import { Copy, Key } from 'lucide-react';
import { toast } from 'sonner';
import type { StrategyWebhookSecretResponse } from '@/api/types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSecretExample } from '../utils';

interface StrategySecretDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentSecret: StrategyWebhookSecretResponse | null;
    t: TFunction;
}

export const StrategySecretDialog = React.memo(({
    open,
    onOpenChange,
    currentSecret,
    t,
}: StrategySecretDialogProps) => {
    const copyValue = (value: string) => {
        navigator.clipboard.writeText(value);
        toast.success(t('copy'));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-8 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-full">
                            <Key className="w-6 h-6 text-amber-500" />
                        </div>
                        {t('webhook_secret_title')}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium pt-2">
                        {t('secret_hint')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-6 border-y border-slate-50 my-2">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                {t('admin:filter_strategy_id', 'Strategy ID')}
                            </Label>
                            <div className="flex gap-2 group">
                                <Input readOnly value={currentSecret?.strategy_id || ''} className="h-12 bg-slate-50 border-none rounded-xl font-mono text-xs focus-visible:ring-primary/20" />
                                <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl border-slate-200" onClick={() => copyValue(String(currentSecret?.strategy_id || ''))}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                {t('strategies:detail.strategy_key', 'Strategy Key')}
                            </Label>
                            <div className="flex gap-2 group">
                                <Input readOnly value={currentSecret?.strategy_key || ''} className="h-12 bg-slate-50 border-none rounded-xl font-mono text-xs focus-visible:ring-primary/20" />
                                <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl border-slate-200" onClick={() => copyValue(currentSecret?.strategy_key || '')}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('secret_key_label')}</Label>
                            <div className="flex gap-2 group">
                                <Input readOnly value={currentSecret?.secret || ''} className="h-12 bg-slate-50 border-none rounded-xl font-mono text-xs focus-visible:ring-primary/20" />
                                <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl border-slate-200" onClick={() => copyValue(currentSecret?.secret || '')}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        {currentSecret && (
                            <div className="space-y-2 mt-4 p-4 bg-slate-50 rounded-xl">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {t('strategies:detail.webhook_secret_hint_title')}
                                </Label>
                                <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap mt-2">
                                    {createSecretExample(currentSecret)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button className="w-full h-12 rounded-xl font-bold gradient-primary shadow-button" onClick={() => onOpenChange(false)}>
                        {t('common:done')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});

StrategySecretDialog.displayName = 'StrategySecretDialog';
