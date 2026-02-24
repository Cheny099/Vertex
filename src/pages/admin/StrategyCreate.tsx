import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Save, Copy, Info, Check, Zap, Key, Loader2, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    strategyApi, adminApi,
    getStrategySchema
} from '@/api';
import { useToast } from '@/components/ui/use-toast';
import RiskDisclosureDialog from '@/components/RiskDisclosureDialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

// Variants for consistent animations
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
} as const;

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
} as const;

const StrategyCreate = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { t } = useTranslation(['strategies', 'common', 'admin']);

    const [showWebhookDialog, setShowWebhookDialog] = useState(false);
    const [webhookData, setWebhookData] = useState<{ url: string, secret: string } | null>(null);

    const isCopy = searchParams.get('copy') === 'true';
    const isEditMode = !!id && !isCopy;
    const isCopyMode = !!id && isCopy;

    const DEFAULT_STRATEGY_VALUES = {
        name: '',
        description: '',
        type: 'signal',
        pair: '',
        status: 'active',
        strategyKey: '',
    };

    const schema = useMemo(() => getStrategySchema(t), [t]);

    const {
        register,
        handleSubmit: handleFormSubmit,
        setValue,
        watch,
        reset,
        control,
        formState: { errors, isSubmitting }
    } = useForm<any>({
        resolver: zodResolver(schema),
        defaultValues: DEFAULT_STRATEGY_VALUES,
    });

    const watchStatus = watch('status');

    // 加载现有策略数据
    const { data: initialData, isLoading: isInitialLoading } = useQuery({
        queryKey: ['strategy', id],
        queryFn: () => strategyApi.get(parseInt(id!)),
        enabled: !!id,
    });

    // 当现有数据加载完成时，重置表单
    useEffect(() => {
        if (initialData) {
            reset({
                ...DEFAULT_STRATEGY_VALUES,
                ...initialData,
                strategyKey: initialData.strategy_key,
                name: isCopyMode ? `${initialData.name} (Copy)` : initialData.name,
                status: initialData.status || 'active',
            });
        }
    }, [initialData, isCopyMode, reset]);

    const [legalError, setLegalError] = useState<{ docKey: string, version: string } | null>(null);
    const [pendingFormData, setPendingFormData] = useState<any | null>(null);

    const submitMutation = useMutation({
        mutationFn: async (data: any) => {
            let strat: any;
            const { name, description, status, type, pair, strategyKey } = data;

            // API expects 'active' | 'inactive'
            const finalStatus = status === 'active' || status === true ? 'active' : 'inactive';

            const payload: any = {
                strategy_key: strategyKey,
                name,
                description,
                status: finalStatus,
                config: {
                    ...(isEditMode && initialData?.config ? initialData.config : {}),
                    type: type || 'signal',
                    pair: pair || '',
                }
            };

            if (isEditMode && id) {
                strat = await adminApi.strategies.update(parseInt(id), payload);
            } else {
                payload.strategy_key = strategyKey || `sk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                strat = await adminApi.strategies.create(payload);
            }

            if (!isEditMode) {
                const secretData = await adminApi.strategies.getWebhookSecret(strat.id);
                return { ...strat, webhookSecret: secretData };
            }

            return strat;
        },
        onSuccess: (data: any) => {
            if (data.webhookSecret) {
                setWebhookData({
                    url: `${window.location.origin}/api/v1/webhook/${data.strategy_key}`,
                    secret: data.webhookSecret.secret
                });
                setShowWebhookDialog(true);
            } else {
                toast({ title: t('strategies:create.toast_success'), description: isEditMode ? t('strategies:create.toast_updated') : t('strategies:create.toast_created') });
                queryClient.invalidateQueries({ queryKey: ['strategies'] });
                navigate('/admin/strategies');
            }
        },
        onError: (error: any) => {
            if (error?.code === 'LEGAL_ACCEPTANCE_REQUIRED' && error.detail) {
                setLegalError({
                    docKey: error.detail.doc_key,
                    version: error.detail.required_version || '1.0'
                });
                return;
            }
            toast({ title: t('strategies:detail.toast_error'), description: error.message || t('strategies:create.toast_failed'), variant: 'destructive' });
        }
    });

    const onSubmit = (data: any) => {
        setPendingFormData(data);
        submitMutation.mutate(data);
    };

    const handleLegalAccepted = () => {
        if (pendingFormData) {
            submitMutation.mutate(pendingFormData);
        }
        setLegalError(null);
    };

    if (isInitialLoading) {
        return (
            <div className="p-8 space-y-4 shadow-card animate-pulse">
                <div className="h-8 w-1/4 bg-muted rounded" />
                <div className="h-64 w-full bg-muted rounded" />
            </div>
        );
    }

    return (
        <>
            <AnimatePresence>
                {legalError && (
                    <RiskDisclosureDialog
                        open={!!legalError}
                        onOpenChange={(open) => !open && setLegalError(null)}
                        docKey={legalError.docKey as any}
                        requiredVersion={legalError.version}
                        onAccept={handleLegalAccepted}
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white pb-12"
            >
                <div className="p-4 md:p-8 space-y-6">
                    {/* Header */}
                    <motion.div variants={itemVariants} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/strategies')} className="rounded-xl hover:bg-white/50">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {isEditMode ? t('strategies:create.title_edit') : isCopyMode ? t('strategies:create.title_copy') : t('strategies:create.title_create')}
                                </h1>
                                <p className="text-muted-foreground text-sm font-medium">
                                    {isEditMode ? t('strategies:create.subtitle_edit') : t('strategies:create.subtitle_create')}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleFormSubmit(onSubmit)}
                            disabled={isSubmitting || submitMutation.isPending}
                            className="gradient-primary shadow-button px-6 rounded-xl font-bold h-11"
                        >
                            {(isSubmitting || submitMutation.isPending) ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : isCopyMode ? (
                                <Copy className="w-4 h-4 mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {t('strategies:create.save_btn')}
                        </Button>
                    </motion.div>

                    {/* Form Layout */}
                    <div className="max-w-2xl mx-auto">
                        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-3xl border border-white/40 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-8 md:p-10">
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-2.5 rounded-2xl">
                                        <Info className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black">{t('strategies:create.metadata_api')}</h2>
                                        <p className="text-xs text-muted-foreground font-medium mt-0.5">{t('strategies:create.metadata_desc')}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Strategy Key */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-bold ml-1">{t('strategies:detail.strategy_key')}</Label>
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black opacity-50">{t('strategies:create.unique_id_label')}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1 group">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                                <Input
                                                    {...register('strategyKey')}
                                                    placeholder="sk_..."
                                                    className="pl-12 font-mono text-xs h-12 bg-white/50 border-white/20 rounded-2xl shadow-inner-sm focus-visible:ring-primary/20"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-12 w-12 rounded-2xl bg-white/50 border-white/20 hover:bg-white transiton-all"
                                                onClick={() => setValue('strategyKey', `sk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`)}
                                                title={t('strategies:create.gen_key')}
                                            >
                                                <Zap className="w-4.5 h-4.5 text-primary" />
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground ml-1">{t('strategies:create.key_desc')}</p>
                                    </div>

                                    {/* Name */}
                                    <div className="space-y-2.5">
                                        <Label className="text-sm font-bold ml-1">{t('strategies:create.name_label')}</Label>
                                        <Input
                                            placeholder={t('strategies:create.name_placeholder')}
                                            {...register('name')}
                                            className={cn("h-12 bg-white/50 border-white/20 rounded-2xl shadow-inner-sm focus-visible:ring-primary/20", errors.name && 'border-destructive ring-destructive/20')}
                                        />
                                        {errors.name && <p className="text-xs text-destructive font-medium mt-1.5 ml-1">{errors.name.message as string}</p>}
                                    </div>

                                    {/* Type & Pair */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2.5">
                                            <Label className="text-sm font-bold ml-1">{t('strategies:create.type_label')}</Label>
                                            <Input
                                                placeholder={t('strategies:create.type_placeholder')}
                                                {...register('type')}
                                                className="h-12 bg-white/50 border-white/20 rounded-2xl shadow-inner-sm focus-visible:ring-primary/20 font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-sm font-bold ml-1">{t('strategies:create.pair_label')}</Label>
                                            <Input
                                                placeholder={t('strategies:create.pair_placeholder')}
                                                {...register('pair')}
                                                className="h-12 bg-white/50 border-white/20 rounded-2xl shadow-inner-sm focus-visible:ring-primary/20 font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2.5">
                                        <Label className="text-sm font-bold ml-1">{t('strategies:create.desc_label')}</Label>
                                        <Textarea
                                            placeholder={t('strategies:create.desc_placeholder')}
                                            rows={3}
                                            {...register('description')}
                                            className="bg-white/50 border-white/20 rounded-2xl shadow-inner-sm focus-visible:ring-primary/20 resize-none min-h-[100px]"
                                        />
                                    </div>

                                    {/* Status Toggle */}
                                    <div className="pt-4">
                                        <div className="bg-slate-50/50 rounded-3xl p-5 flex items-center justify-between border border-slate-100/50">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("p-2 rounded-xl", watchStatus === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-200 text-slate-400")}>
                                                    {watchStatus === 'active' ? <Check className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-bold">{t('strategies:detail.signal_status')}</Label>
                                                    <p className="text-[10px] text-muted-foreground font-medium">
                                                        {watchStatus === 'active' ? t('strategies:detail.status_active') : t('strategies:detail.status_maintenance')}
                                                    </p>
                                                </div>
                                            </div>
                                            <Controller
                                                name="status"
                                                control={control}
                                                render={({ field }) => (
                                                    <Switch
                                                        checked={field.value === 'active'}
                                                        onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                                                        className="data-[state=checked]:bg-emerald-500"
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Webhook Success Dialog */}
            <Dialog open={showWebhookDialog} onOpenChange={(open) => {
                if (!open) {
                    setShowWebhookDialog(false);
                    navigate('/admin/strategies');
                }
            }}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-8 bg-white/95 backdrop-blur-xl">
                    <DialogHeader className="items-center text-center">
                        <div className="bg-emerald-500 icon-glow p-4 rounded-full mb-4">
                            <Check className="w-8 h-8 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-black">
                            {t('strategies:create.webhook_created_title')}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium mt-2 leading-relaxed">
                            {t('strategies:create.webhook_created_desc')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                {t('strategies:create.webhook_url_label')}
                            </Label>
                            <div className="flex items-center gap-2 group">
                                <code className="flex-1 bg-slate-100 p-4 rounded-2xl text-[11px] font-mono break-all border border-slate-200 group-hover:bg-slate-50 transition-colors shadow-inner-sm">
                                    {webhookData?.url}
                                </code>
                                <Button size="icon" variant="outline" className="h-12 w-12 rounded-2xl bg-white shadow-sm border-slate-200 hover:scale-105 transition-transform" onClick={() => {
                                    navigator.clipboard.writeText(webhookData?.url || '');
                                    toast({ title: t('common:copied') });
                                }}>
                                    <Copy className="w-4.5 h-4.5" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                {t('strategies:create.secret_json_label')}
                            </Label>
                            <div className="relative group">
                                <pre className="bg-slate-900 text-slate-100 p-5 rounded-2xl text-[11px] font-mono overflow-x-auto whitespace-pre-wrap border shadow-2xl leading-relaxed">
                                    {`{
    "secret": "${webhookData?.secret}",
    "action": "{{strategy.order.action}}",
    "symbol": "{{ticker}}"
}`}
                                </pre>
                                <Button size="icon" variant="ghost" className="absolute top-4 right-4 h-9 w-9 hover:bg-white/10 text-white/40 hover:text-emerald-400 transition-colors" onClick={() => {
                                    navigator.clipboard.writeText(`{\n    "secret": "${webhookData?.secret}",\n    "action": "{{strategy.order.action}}",\n    "symbol": "{{ticker}}"\n}`);
                                    toast({ title: t('common:copied') });
                                }}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex items-start gap-2 ml-1">
                                <Info className="w-3 h-3 text-emerald-500 mt-0.5" />
                                <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                                    {t('strategies:create.webhook_secret_hint')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button className="w-full h-14 rounded-2xl font-black text-lg gradient-primary shadow-button hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => {
                            setShowWebhookDialog(false);
                            navigate('/admin/strategies');
                        }}>{t('common:done')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default StrategyCreate;
