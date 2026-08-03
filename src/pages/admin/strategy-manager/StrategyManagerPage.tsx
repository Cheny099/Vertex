import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useStrategyManagerModel } from './hooks/useStrategyManagerModel';
import { StrategiesTable } from './components/StrategiesTable';
import { StrategySecretDialog } from './components/StrategySecretDialog';
import { StrategyImportDialog } from './components/StrategyImportDialog';
import { StrategyActionConfirmDialog } from './components/StrategyActionConfirmDialog';
import { containerVariants, itemVariants } from './utils';

const StrategyManagerPage = () => {
    const { t } = useTranslation(['admin', 'strategies', 'common']);
    const {
        strategies,
        isLoading,
        isError,
        strategyErrorText,
        secretDialogOpen,
        setSecretDialogOpen,
        currentSecret,
        csvFile,
        setCsvFile,
        importDialogOpen,
        handleImportDialogOpenChange,
        actionConfirm,
        setActionConfirm,
        isDragging,
        importStatsMutation,
        publishStrategy,
        unpublishStrategy,
        viewSecret,
        requestRotateSecret,
        openImportDialog,
        handleImport,
        onDragOver,
        onDragLeave,
        onDrop,
    } = useStrategyManagerModel({ t });

    if (isLoading) {
        return (
            <div className="p-8 space-y-4 shadow-card animate-pulse">
                <div className="h-10 w-1/4 bg-slate-200 rounded-xl" />
                <div className="h-[400px] w-full bg-slate-100 rounded-3xl" />
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6 p-4 md:p-8 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white pb-20"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">{t('strategies')}</h1>
                    <p className="text-slate-500 mt-1 font-medium">{t('strategies_desc')}</p>
                </div>
                <Link to="/admin/strategies/create">
                    <Button className="h-10 gradient-primary shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 px-6 rounded-xl">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('create_strategy')}
                    </Button>
                </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
                <StrategiesTable
                    strategies={strategies}
                    isLoading={isLoading}
                    isError={isError}
                    strategyErrorText={strategyErrorText}
                    t={t}
                    onPublish={publishStrategy}
                    onUnpublish={unpublishStrategy}
                    onViewSecret={viewSecret}
                    onRotateSecret={requestRotateSecret}
                    onImport={openImportDialog}
                />
            </motion.div>

            <StrategySecretDialog
                open={secretDialogOpen}
                onOpenChange={setSecretDialogOpen}
                currentSecret={currentSecret}
                t={t}
            />

            <StrategyImportDialog
                open={importDialogOpen}
                onOpenChange={handleImportDialogOpenChange}
                csvFile={csvFile}
                setCsvFile={setCsvFile}
                isDragging={isDragging}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onImport={handleImport}
                isPending={importStatsMutation.isPending}
                t={t}
            />

            <StrategyActionConfirmDialog
                actionConfirm={actionConfirm}
                setActionConfirm={setActionConfirm}
                t={t}
            />
        </motion.div>
    );
};

export default StrategyManagerPage;
