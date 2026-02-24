import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, RefreshCw, Eye, EyeOff, ShieldCheck, Key, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { strategyApi, StrategyWebhookSecretResponse } from '@/api';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface WebhookSecretDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    strategyId: number;
    strategyName: string;
}

export const WebhookSecretDialog = ({
    open,
    onOpenChange,
    strategyId,
    strategyName,
}: WebhookSecretDialogProps) => {
    const { t } = useTranslation(['strategies', 'common']);
    const queryClient = useQueryClient();
    const [showSecret, setShowSecret] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['strategy', strategyId, 'secret'],
        queryFn: () => strategyApi.getWebhookSecret(strategyId),
        enabled: open && !!strategyId,
        staleTime: 0, // Always fetch fresh secret on open
    });

    const rotateMutation = useMutation({
        mutationFn: () => strategyApi.rotateWebhookSecret(strategyId),
        onSuccess: (newData: StrategyWebhookSecretResponse) => {
            queryClient.setQueryData(['strategy', strategyId, 'secret'], newData);
            toast.success(t('strategies:detail.webhook_secret_rotated'));
        },
        onError: (err: any) => {
            toast.error(err.message || t('common:error'));
        }
    });

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(t('strategies:detail.webhook_secret_copied'));
    };

    const handleRotate = () => {
        if (confirm(t('strategies:detail.webhook_secret_rotate_confirm'))) {
            rotateMutation.mutate();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        {t('strategies:detail.webhook_secret_title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('strategies:detail.webhook_secret_desc')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ) : isError ? (
                        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{t('strategies:detail.load_failed')}</span>
                        </div>
                    ) : (
                        <>
                            {/* Strategy Key Display */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Strategy Key (Required)
                                </Label>
                                <div className="flex items-center gap-2 relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <Key className="w-4 h-4" />
                                    </div>
                                    <Input
                                        readOnly
                                        value={data?.strategy_key || ''}
                                        className="pl-9 font-mono bg-secondary/20"
                                    />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="shrink-0"
                                        onClick={() => handleCopy(data?.strategy_key || '')}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Secret Display */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {t('strategies:detail.webhook_secret_label')}
                                    </Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={handleRotate}
                                        disabled={rotateMutation.isPending}
                                    >
                                        <RefreshCw className={`w-3 h-3 mr-1 ${rotateMutation.isPending ? 'animate-spin' : ''}`} />
                                        {t('strategies:detail.webhook_secret_rotate')}
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 relative">
                                    <Input
                                        type={showSecret ? "text" : "password"}
                                        readOnly
                                        value={data?.secret || ''}
                                        className="font-mono bg-secondary/5 pr-10"
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute right-12 top-0 h-full hover:bg-transparent"
                                        onClick={() => setShowSecret(!showSecret)}
                                    >
                                        {showSecret ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="shrink-0"
                                        onClick={() => handleCopy(data?.secret || '')}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* JSON Hint */}
                            <Alert className="bg-primary/5 border-primary/20">
                                <AlertTitle className="text-xs font-bold text-primary mb-2">
                                    {t('strategies:detail.webhook_secret_hint_title')}
                                </AlertTitle>
                                <AlertDescription>
                                    <pre className="text-[10px] font-mono whitespace-pre-wrap text-muted-foreground bg-background/50 p-2 rounded border border-border/50">
                                        {JSON.stringify({
                                            secret: "****************",
                                            strategy_key: data?.strategy_key || "YOUR_KEY",
                                            action: "long_entry",
                                            price: "{{close}}",
                                            ticker: "{{ticker}}"
                                        }, null, 2)}
                                    </pre>
                                </AlertDescription>
                            </Alert>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('common:close')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
