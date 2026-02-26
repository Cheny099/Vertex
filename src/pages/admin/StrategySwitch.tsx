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
import { adminApi, StrategySwitchRequest, StrategySwitchPreviewRequest, StrategySwitchBulkExecuteRequest, StrategySwitchBulkPreviewRequest } from '@/api';
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

    // --- Bulk Switch State ---
    const [bulkForm, setBulkForm] = useState<{
        from_strategy_id: number;
        to_strategy_id: number;
        symbol: string;
    }>({
        from_strategy_id: 0,
        to_strategy_id: 0,
        symbol: '',
    });

    // --- Mutations & Queries ---
    const singlePreviewMutation = useMutation({
        mutationFn: (data: StrategySwitchPreviewRequest) => adminApi.strategySwitch.preview(data)
    });

    const bulkPreviewMutation = useMutation({
        mutationFn: (data: StrategySwitchBulkPreviewRequest) => adminApi.strategySwitch.bulkPreview(data)
    });

    const executeMutation = useMutation({
        mutationFn: (data: StrategySwitchRequest) => adminApi.strategySwitch.execute(data),
        onSuccess: () => {
            toast({ title: t('common:success'), description: t('admin:strategy_switch.success_msg') });
        },
        onError: (err: Error) => {
            toast({ title: t('common:error'), description: err?.message || 'Execution failed', variant: 'destructive' });
        }
    });

    const bulkExecuteMutation = useMutation({
        mutationFn: (data: StrategySwitchBulkExecuteRequest) => adminApi.strategySwitch.bulkExecute(data),
        onSuccess: (data) => {
            toast({
                title: t('common:success'),
                description: data.idempotent_reused
                    ? t('admin:strategy_switch.bulk_idempotent_msg')
                    : t('admin:strategy_switch.bulk_success_msg')
            });
        },
        onError: (err: Error) => {
            toast({ title: t('common:error'), description: err?.message || 'Bulk execution failed', variant: 'destructive' });
        }
    });

    // Poll for the single run status if one is active
    const runId = executeMutation.data?.run_id;
    const { data: runStatus } = useQuery({
        queryKey: ['strategy_switch_run', runId],
        queryFn: () => adminApi.strategySwitch.getRun(runId!),
        enabled: !!runId,
        refetchInterval: 2000
    });

    // Poll for the bulk campaign status if one is active
    const campaignId = bulkExecuteMutation.data?.campaign_id;
    const { data: campaignStatus } = useQuery({
        queryKey: ['bulk_switch_campaign', campaignId],
        queryFn: () => adminApi.strategySwitch.getCampaign(campaignId!),
        enabled: !!campaignId,
        refetchInterval: 3000
    });

    const previewPlan = singlePreviewMutation.data;

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

        const reqId = crypto.randomUUID();
        executeMutation.mutate({
            ...singleForm,
            request_id: reqId,
            reason: t('admin:strategy_switch.reason_manual_single')
        });
    };

    const handlePreview = () => {
        if (!validateSingleForm()) return;
        singlePreviewMutation.mutate(singleForm);
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
        if (!bulkForm.symbol || bulkForm.symbol.length < 2) {
            toast({ title: t('common:error'), description: t('admin:strategy_switch.symbol') + ' ' + t('validation.required'), variant: 'destructive' });
            return;
        }

        const reqId = crypto.randomUUID();
        bulkExecuteMutation.mutate({
            ...bulkForm,
            request_id: reqId,
            handover_mode: 'FLAT_THEN_SWITCH',
            reason: t('admin:strategy_switch.reason_manual_bulk')
        });
    };

    const handleBulkPreview = () => {
        if (!bulkForm.from_strategy_id || bulkForm.from_strategy_id <= 0 || !bulkForm.to_strategy_id || bulkForm.to_strategy_id <= 0 || !bulkForm.symbol || bulkForm.symbol.length < 2) {
            toast({ title: t('common:error'), description: t('validation.required'), variant: 'destructive' });
            return;
        }
        bulkPreviewMutation.mutate({
            ...bulkForm,
            handover_mode: 'FLAT_THEN_SWITCH',
            reason: t('admin:strategy_switch.reason_manual_bulk')
        });
    };

    return (
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
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
                    <div className="space-y-6">
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
                                                    onChange={e => setSingleForm({ ...singleForm, symbol: e.target.value.toUpperCase() })}
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
                                                onValueChange={(v: 'FLAT_THEN_SWITCH' | 'KEEP_POSITION_ADOPT') => setSingleForm({ ...singleForm, handover_mode: v })}
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
                                                disabled={singlePreviewMutation.isPending}
                                            >
                                                {singlePreviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
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
                                                {JSON.stringify(singlePreviewMutation.data?.plan || {}, null, 2)}
                                            </pre>
                                        </CardContent>
                                    </Card>
                                )}

                                {runStatus && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex justify-between items-center text-base">
                                                {t('admin:strategy_switch.execution_status')}
                                                <Badge variant={runStatus.status === 'SUCCESS' ? 'default' : runStatus.status === 'FAILED' ? 'destructive' : 'secondary'}>
                                                    {runStatus.status}
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs border rounded-lg p-3 bg-muted/20">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{t('admin:strategy_switch.run_id')}:</span>
                                                    <span className="font-mono font-medium">{runStatus.id}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{t('admin:strategy_switch.account_id')}:</span>
                                                    <span className="font-medium text-primary">#{runStatus.account_id}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{t('admin:strategy_switch.symbol')}:</span>
                                                    <span className="font-medium uppercase">{runStatus.symbol}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{t('admin:strategy_switch.from_sub_id')}:</span>
                                                    <span className="font-medium">#{runStatus.from_subscription_id}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{t('admin:strategy_switch.to_sub_id')}:</span>
                                                    <span className="font-medium">#{runStatus.to_subscription_id}</span>
                                                </div>
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
                    </div>
                </TabsContent>

                {/* === BULK CAMPAIGN === */}
                <TabsContent value="bulk">
                    <div className="space-y-6">
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
                                            <Label>{t('admin:strategy_switch.symbol')}</Label>
                                            <Input
                                                value={bulkForm.symbol}
                                                onChange={e => setBulkForm({ ...bulkForm, symbol: e.target.value.toUpperCase() })}
                                                placeholder={t('admin:strategy_switch.symbol_placeholder')}
                                                required
                                            />
                                            <p className="text-[10px] text-muted-foreground">
                                                {t('admin:strategy_switch.symbol_hint')}
                                            </p>
                                        </div>

                                        <p className="text-xs text-muted-foreground pb-4 uppercase font-medium">
                                            {t('admin:strategy_switch.migrate_all_hint')}
                                        </p>

                                        <div className="flex gap-3">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="w-full"
                                                onClick={handleBulkPreview}
                                                disabled={bulkPreviewMutation.isPending}
                                            >
                                                {bulkPreviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                                                {t('admin:strategy_switch.btn_preview')}
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="w-full"
                                                disabled={bulkExecuteMutation.isPending}
                                            >
                                                {bulkExecuteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                                                {t('admin:strategy_switch.btn_start_bulk')}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            {campaignStatus && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-center text-base">
                                            {t('admin:strategy_switch.campaign_status')}
                                            <Badge variant={campaignStatus.status === 'SUCCESS' ? 'default' : campaignStatus.status === 'FAILED' ? 'destructive' : 'secondary'}>
                                                {campaignStatus.status}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="text-[10px] text-muted-foreground font-mono">
                                            Campaign ID: #{campaignStatus.campaign_id}
                                        </div>
                                        <BulkSwitchStats campaign={campaignStatus} />
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {bulkPreviewMutation.data && (
                            <Card className="border-blue-500/20 bg-blue-500/5">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        {t('admin:strategy_switch.bulk_preview_result', 'Bulk Preview Results')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <PreviewStat label={t('admin:strategy_switch.total_candidates', 'Total Candidates')} value={bulkPreviewMutation.data.total_candidates} />
                                        <PreviewStat label={t('admin:strategy_switch.will_create_runs', 'New Runs')} value={bulkPreviewMutation.data.will_create_runs} />
                                        <PreviewStat label={t('admin:strategy_switch.will_reuse_runs', 'Reused Runs')} value={bulkPreviewMutation.data.will_reuse_runs} />
                                        <PreviewStat label={t('admin:strategy_switch.will_create_subs', 'New Subs')} value={bulkPreviewMutation.data.will_create_to_sub} />
                                        <PreviewStat label={t('admin:strategy_switch.will_update_params', 'Update Subs')} value={bulkPreviewMutation.data.will_update_to_sub_params} />
                                    </div>
                                    {bulkPreviewMutation.data.sample.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider">{t('admin:strategy_switch.sample_accounts', 'Sample Accounts')}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {bulkPreviewMutation.data.sample.map((s, i) => (
                                                    <div key={i} className="text-[10px] font-mono p-2 bg-background rounded border flex justify-between">
                                                        <span>Acc #{s.account_id}</span>
                                                        <span className="text-muted-foreground">{s.params_digest.slice(0, 16)}...</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

const PreviewStat = ({ label, value }: { label: string; value: number }) => (
    <div className="flex flex-col gap-1 p-3 bg-background rounded-lg border">
        <span className="text-[10px] text-muted-foreground uppercase font-medium">{label}</span>
        <span className="text-xl font-bold">{value}</span>
    </div>
);

export default StrategySwitch;
