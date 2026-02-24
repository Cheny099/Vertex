
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowRightLeft, Upload, Play, Eye } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adminApi, StrategySwitchRequest, StrategySwitchPreviewRequest } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SwitchRunTimeline } from '@/components/StrategySwitch/SwitchRunTimeline';
import { BulkSwitchStats } from '@/components/StrategySwitch/BulkSwitchStats';

const StrategySwitch = () => {
    const { t } = useTranslation(['admin', 'common']);
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('single');

    // --- Single Switch State ---
    const [singleForm, setSingleForm] = useState<StrategySwitchPreviewRequest>({
        account_id: 0,
        symbol: '',
        from_subscription_id: 0,
        to_subscription_id: 0,
        handover_mode: 'FLAT_THEN_SWITCH'
    });
    const [previewPlan, setPreviewPlan] = useState<any>(null);
    const [runId, setRunId] = useState<number | null>(null);

    // --- Bulk Campaign State ---
    const [bulkForm, setBulkForm] = useState({
        from_strategy_id: 0,
        to_strategy_id: 0,
        handover_mode: 'FLAT_THEN_SWITCH' as const,
        symbol: '',
        csvFile: null as File | null
    });
    const [campaignId, setCampaignId] = useState<number | null>(null);

    // --- Mutations ---
    const previewMutation = useMutation({
        mutationFn: adminApi.strategySwitch.preview,
        onSuccess: (data) => {
            setPreviewPlan(data);
            toast({ title: t('common:success'), description: t('admin:strategy_switch.preview_ready') });
        },
        onError: (err: Error) => {
            toast({ title: t('common:error'), description: parseError(err), variant: 'destructive' });
        }
    });

    const executeMutation = useMutation({
        mutationFn: adminApi.strategySwitch.execute,
        onSuccess: (data) => {
            setRunId(data.run_id);
            toast({ title: t('common:success'), description: t('admin:strategy_switch.execution_started') });
        },
        onError: (err: Error) => {
            toast({ title: t('common:error'), description: parseError(err), variant: 'destructive' });
        }
    });

    const bulkExecuteMutation = useMutation({
        mutationFn: adminApi.strategySwitch.bulkExecute,
        onSuccess: (data) => {
            setCampaignId(data.campaign_id);
            toast({ title: t('common:success'), description: t('admin:strategy_switch.campaign_started') });
        },
        onError: (err: Error) => {
            toast({ title: t('common:error'), description: parseError(err), variant: 'destructive' });
        }
    });

    // --- Queries for Status Polling ---
    const { data: runStatus } = useQuery({
        queryKey: ['strategy-switch-run', runId],
        queryFn: () => adminApi.strategySwitch.getRun(runId!),
        enabled: !!runId,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return (status === 'COMPLETED' || status === 'FAILED') ? false : 3000;
        }
    });

    const { data: campaignStatus } = useQuery({
        queryKey: ['strategy-switch-campaign', campaignId],
        queryFn: () => adminApi.strategySwitch.getCampaign(campaignId!),
        enabled: !!campaignId,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return (status === 'COMPLETED' || status === 'FAILED') ? false : 5000;
        }
    });

    // --- Handlers ---
    const parseError = (err: Error) => {
        try {
            // Try to parse as JSON first
            const errorObj = JSON.parse(err.message);
            if (Array.isArray(errorObj)) {
                // Handle Pydantic validation errors
                return errorObj.map((e: any) => {
                    const field = e.loc?.[e.loc.length - 1];
                    const msg = e.msg;
                    // Translate common errors if possible, or formatted string
                    return `${field}: ${msg}`;
                }).join('\n');
            }
            return err.message;
        } catch {
            return err.message;
        }
    };

    const validateSingleForm = (): boolean => {
        if (!singleForm.account_id || singleForm.account_id <= 0) {
            toast({ title: t('common:error'), description: t('admin:strategy_switch.account_id') + ' ' + t('validation.required'), variant: 'destructive' });
            return false;
        }
        if (!singleForm.symbol || singleForm.symbol.length < 2) {
            toast({ title: t('common:error'), description: t('admin:strategy_switch.symbol') + ' ' + t('validation.required'), variant: 'destructive' });
            return false;
        }
        if (!singleForm.from_subscription_id || singleForm.from_subscription_id <= 0) {
            toast({ title: t('common:error'), description: t('admin:strategy_switch.from_sub_id') + ' ' + t('validation.required'), variant: 'destructive' });
            return false;
        }
        if (!singleForm.to_subscription_id || singleForm.to_subscription_id <= 0) {
            toast({ title: t('common:error'), description: t('admin:strategy_switch.to_sub_id') + ' ' + t('validation.required'), variant: 'destructive' });
            return false;
        }
        return true;
    };

    const handleSingleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateSingleForm()) return;

        // Backend requires a valid UUID
        const reqId = crypto.randomUUID();
        executeMutation.mutate({
            ...singleForm,
            request_id: reqId,
            reason: 'Manual Admin Switch'
        });
    };

    const handlePreview = () => {
        if (!validateSingleForm()) return;
        previewMutation.mutate(singleForm);
    };

    const handleBulkSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!bulkForm.from_strategy_id || bulkForm.from_strategy_id <= 0) {
            toast({ title: t('common:error'), description: t('admin:strategy_switch.from_strategy_id') + ' ' + t('validation.required'), variant: 'destructive' });
            return;
        }
        if (!bulkForm.to_strategy_id || bulkForm.to_strategy_id <= 0) {
            toast({ title: t('common:error'), description: t('admin:strategy_switch.to_strategy_id') + ' ' + t('validation.required'), variant: 'destructive' });
            return;
        }
        if (!bulkForm.symbol) {
            toast({ title: t('common:error'), description: t('admin:strategy_switch.symbol') + ' ' + t('validation.required'), variant: 'destructive' });
            return;
        }

        const reqId = crypto.randomUUID();
        bulkExecuteMutation.mutate({
            ...bulkForm,
            // If we had CSV, we'd parse account_ids here. 
            // Currently simplified to "Switch All" for the demo unless file logic added.
            request_id: reqId,
            reason: 'Manual Admin Bulk Switch'
        });
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <ArrowRightLeft className="w-8 h-8 text-primary" />
                    {t('admin:strategy_switch.title')}
                </h1>
                <p className="text-muted-foreground mt-2">{t('admin:strategy_switch.description')}</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="single">{t('admin:strategy_switch.tab_single')}</TabsTrigger>
                    <TabsTrigger value="bulk">{t('admin:strategy_switch.tab_bulk')}</TabsTrigger>
                </TabsList>

                {/* === SINGLE SWITCH === */}
                <TabsContent value="single">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('admin:strategy_switch.single_switch')}</CardTitle>
                                <CardDescription>{t('admin:strategy_switch.single_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSingleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t('admin:strategy_switch.account_id')}</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={singleForm.account_id || ''}
                                                onChange={e => setSingleForm({ ...singleForm, account_id: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('admin:strategy_switch.symbol')}</Label>
                                            <Input
                                                value={singleForm.symbol}
                                                onChange={e => setSingleForm({ ...singleForm, symbol: e.target.value })}
                                                placeholder={t('admin:strategy_switch.symbol_placeholder')}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t('admin:strategy_switch.from_sub_id')}</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={singleForm.from_subscription_id || ''}
                                                onChange={e => setSingleForm({ ...singleForm, from_subscription_id: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('admin:strategy_switch.to_sub_id')}</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={singleForm.to_subscription_id || ''}
                                                onChange={e => setSingleForm({ ...singleForm, to_subscription_id: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t('admin:strategy_switch.handover_mode')}</Label>
                                        <Select
                                            value={singleForm.handover_mode}
                                            onValueChange={(v: any) => setSingleForm({ ...singleForm, handover_mode: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FLAT_THEN_SWITCH">{t('admin:strategy_switch.mode_flat')}</SelectItem>
                                                <SelectItem value="KEEP_POSITION_ADOPT">{t('admin:strategy_switch.mode_adopt')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="w-full"
                                            onClick={handlePreview}
                                            disabled={previewMutation.isPending}
                                        >
                                            {previewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                                            {t('admin:strategy_switch.btn_preview')}
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={executeMutation.isPending}
                                        >
                                            {executeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                                            {t('admin:strategy_switch.btn_execute')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            {previewPlan && (
                                <Card className="border-blue-500/20 bg-blue-500/5">
                                    <CardHeader>
                                        <CardTitle className="text-base">{t('admin:strategy_switch.preview_result')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="text-xs font-mono bg-background p-3 rounded-md overflow-auto max-h-[200px]">
                                            {JSON.stringify(previewPlan, null, 2)}
                                        </pre>
                                    </CardContent>
                                </Card>
                            )}

                            {runStatus && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-center text-base">
                                            {t('admin:strategy_switch.execution_status')}
                                            <Badge variant={runStatus.status === 'COMPLETED' || runStatus.status === 'SUCCESS' ? 'default' : runStatus.status === 'FAILED' ? 'destructive' : 'secondary'}>
                                                {runStatus.status}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">{t('admin:strategy_switch.run_id')}:</span>
                                            <span className="font-mono font-medium">{runStatus.id}</span>
                                        </div>

                                        {runStatus.error_message && (
                                            <Alert variant="destructive">
                                                <AlertTitle>{t('common:error')}</AlertTitle>
                                                <AlertDescription className="break-all">{runStatus.error_message}</AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="border rounded-md p-2 bg-muted/30">
                                            <SwitchRunTimeline run={runStatus} />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* === BULK CAMPAIGN === */}
                <TabsContent value="bulk">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('admin:strategy_switch.bulk_campaign')}</CardTitle>
                                <CardDescription>{t('admin:strategy_switch.bulk_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleBulkSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{t('admin:strategy_switch.from_strategy_id')}</Label>
                                            <Input
                                                type="number"
                                                value={bulkForm.from_strategy_id || ''}
                                                onChange={e => setBulkForm({ ...bulkForm, from_strategy_id: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('admin:strategy_switch.to_strategy_id')}</Label>
                                            <Input
                                                type="number"
                                                value={bulkForm.to_strategy_id || ''}
                                                onChange={e => setBulkForm({ ...bulkForm, to_strategy_id: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t('admin:strategy_switch.symbol')} (Optional if inferred)</Label>
                                        <Input
                                            value={bulkForm.symbol || ''}
                                            onChange={e => setBulkForm({ ...bulkForm, symbol: e.target.value.toUpperCase() })}
                                            placeholder="e.g. BTCUSDT"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            {t('admin:strategy_switch.symbol_hint', 'Target symbol for the new positions.')}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t('admin:strategy_switch.target_accounts')}</Label>
                                        <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                            <span className="text-sm text-muted-foreground">{t('admin:strategy_switch.upload_csv_hint')}</span>
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept=".csv,.txt"
                                                onChange={e => setBulkForm({ ...bulkForm, csvFile: e.target.files?.[0] || null })}
                                            />
                                        </div>
                                        {bulkForm.csvFile && (
                                            <p className="text-xs text-primary">{t('admin:strategy_switch.selected_file')} {bulkForm.csvFile.name}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">{t('admin:strategy_switch.migrate_all_hint')}</p>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={bulkExecuteMutation.isPending}
                                    >
                                        {bulkExecuteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                                        {t('admin:strategy_switch.btn_start_bulk')}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {campaignStatus && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center text-base">
                                        {t('admin:strategy_switch.campaign_status')}
                                        <Badge variant={campaignStatus.status === 'COMPLETED' || campaignStatus.status === 'SUCCESS' ? 'default' : 'secondary'}>
                                            {campaignStatus.status}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <BulkSwitchStats campaign={campaignStatus} />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default StrategySwitch;
