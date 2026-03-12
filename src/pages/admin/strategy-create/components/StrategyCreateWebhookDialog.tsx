import { Check, Copy, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { buildWebhookJson } from '../utils';

interface StrategyCreateWebhookDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    webhookData: { url: string; secret: string; strategy_key: string } | null;
    t: (key: string) => string;
}

export const StrategyCreateWebhookDialog = ({
    open,
    onOpenChange,
    webhookData,
    t,
}: StrategyCreateWebhookDialogProps) => {
    const { toast } = useToast();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-8 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden rounded-3xl">
                <DialogHeader className="items-center text-center">
                    <div className="bg-emerald-500 icon-glow p-4 rounded-full mb-4">
                        <Check className="w-8 h-8 text-white" />
                    </div>
                    <DialogTitle className="text-2xl font-black">{t('strategies:create.webhook_created_title')}</DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium mt-2 leading-relaxed">
                        {t('strategies:create.webhook_created_desc')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-6">
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                            {t('strategies:create.webhook_url_label')}
                        </Label>
                        <div className="flex items-center gap-2 group">
                            <code className="flex-1 bg-slate-100 p-4 rounded-2xl text-xs font-mono break-all border border-slate-200 group-hover:bg-slate-50 transition-colors shadow-inner-sm">
                                {webhookData?.url}
                            </code>
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-12 w-12 rounded-2xl bg-white shadow-sm border-slate-200 hover:scale-105 transition-transform"
                                onClick={() => {
                                    navigator.clipboard.writeText(webhookData?.url || '');
                                    toast({ title: t('common:copied') });
                                }}
                            >
                                <Copy className="w-4.5 h-4.5" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                            {t('strategies:create.secret_json_label')}
                        </Label>
                        <div className="relative group">
                            <pre className="bg-slate-900 text-slate-100 p-5 rounded-2xl text-xs font-mono overflow-x-auto whitespace-pre-wrap border shadow-2xl leading-relaxed">
                                {buildWebhookJson(webhookData)}
                            </pre>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute top-4 right-4 h-9 w-9 hover:bg-white/10 text-white/40 hover:text-emerald-400 transition-colors"
                                onClick={() => {
                                    navigator.clipboard.writeText(buildWebhookJson(webhookData));
                                    toast({ title: t('common:copied') });
                                }}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex items-start gap-2 ml-1">
                            <Info className="w-3 h-3 text-emerald-500 mt-0.5" />
                            <p className="text-xs text-muted-foreground font-medium leading-tight">
                                {t('strategies:create.webhook_secret_hint')}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button className="w-full h-14 rounded-2xl font-black text-lg gradient-primary shadow-button hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => onOpenChange(false)}>
                        {t('common:done')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
