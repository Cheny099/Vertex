import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { itemVariants, containerVariants } from './utils';
import { useStrategyCreateModel } from './hooks/useStrategyCreateModel';
import { StrategyCreateFormCard } from './components/StrategyCreateFormCard';
import { StrategyCreateWebhookDialog } from './components/StrategyCreateWebhookDialog';

const StrategyCreatePage = () => {
    const { t } = useTranslation(['strategies', 'common', 'admin']);
    const {
        navigate,
        isEditMode,
        isCopyMode,
        isInitialLoading,
        isInitialError,
        initialErrorText,
        retryInitialLoad,
        form,
        watchStatus,
        submitMutation,
        handleSubmit,
        showWebhookDialog,
        closeWebhookDialog,
        webhookData,
        generateStrategyKey,
    } = useStrategyCreateModel({ t });

    if (isInitialLoading) {
        return (
            <div className="p-8 space-y-4 shadow-card animate-pulse">
                <div className="h-8 w-1/4 bg-muted rounded" />
                <div className="h-64 w-full bg-muted rounded" />
            </div>
        );
    }

    // The skeleton above waits for this mount's fetch rather than for `isLoading`, so a failed or
    // paused fetch has to have somewhere to land - otherwise the editor would sit on the skeleton
    // for good. Retry matters as much as the message: the cached record is deliberately not shown,
    // so without it a transient 502 would cost a round trip back through the list.
    if (isInitialError) {
        return (
            <div className="p-8 space-y-4">
                <p className="text-sm text-destructive">{initialErrorText}</p>
                <div className="flex items-center gap-3">
                    <Button onClick={() => retryInitialLoad()}>{t('common:retry')}</Button>
                    <Button variant="outline" onClick={() => navigate('/admin/strategies')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('common:back')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white pb-12"
            >
                <div className="p-4 md:p-8 space-y-6">
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
                            onClick={form.handleSubmit(handleSubmit)}
                            disabled={form.formState.isSubmitting || submitMutation.isPending}
                            className="gradient-primary shadow-button px-6 rounded-xl font-bold h-11"
                        >
                            {(form.formState.isSubmitting || submitMutation.isPending) ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : isCopyMode ? (
                                <Copy className="w-4 h-4 mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {t('strategies:create.save_btn')}
                        </Button>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <StrategyCreateFormCard
                            t={t}
                            register={form.register}
                            control={form.control}
                            errors={form.formState.errors}
                            watchStatus={watchStatus}
                            setStrategyKey={generateStrategyKey}
                        />
                    </motion.div>
                </div>
            </motion.div>

            <StrategyCreateWebhookDialog
                open={showWebhookDialog}
                onOpenChange={closeWebhookDialog}
                webhookData={webhookData}
                t={t}
            />
        </>
    );
};

export default StrategyCreatePage;
