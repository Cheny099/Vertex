import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LegalDocsTable } from './components/LegalDocsTable';
import { LegalEditorDialog } from './components/LegalEditorDialog';
import { useLegalManagerModel } from './hooks/useLegalManagerModel';
import { containerVariants, itemVariants } from './utils';

const LegalManagerPage = () => {
    const { t } = useTranslation('admin');
    const {
        activeTab,
        setActiveTab,
        createOpen,
        setCreateOpen,
        editingId,
        formData,
        setFormData,
        editorTab,
        setEditorTab,
        isLoadingDetail,
        docs,
        docsErrorText,
        isLoading,
        isError,
        activateMutation,
        createMutation,
        openCreate,
        openEdit,
    } = useLegalManagerModel({ t });

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-4 md:p-8 space-y-6 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">{t('legal')}</h1>
                    <p className="text-slate-500 font-medium mt-1">{t('legal_desc')}</p>
                </div>
                <Button
                    className="h-10 px-5 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2"
                    onClick={openCreate}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('new_version')}
                </Button>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Tabs
                    value={activeTab}
                    onValueChange={(value) => {
                        if (value === 'terms' || value === 'privacy' || value === 'auto_trade_notice') {
                            setActiveTab(value);
                        }
                    }}
                >
                    <TabsList className="bg-slate-100/50 border border-slate-200 p-1 rounded-xl">
                        <TabsTrigger value="terms" className="rounded-lg">{t('terms')}</TabsTrigger>
                        <TabsTrigger value="privacy" className="rounded-lg">{t('privacy')}</TabsTrigger>
                        <TabsTrigger value="auto_trade_notice" className="rounded-lg">{t('auto_trade_notice')}</TabsTrigger>
                    </TabsList>
                </Tabs>
            </motion.div>

            <motion.div variants={itemVariants}>
                <LegalDocsTable
                    docs={docs}
                    isLoading={isLoading}
                    isError={isError}
                    docsErrorText={docsErrorText}
                    t={t}
                    onActivate={(id) => activateMutation.mutate(id)}
                    onEdit={openEdit}
                />
            </motion.div>

            <LegalEditorDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                activeTab={activeTab}
                editingId={editingId}
                formData={formData}
                setFormData={setFormData}
                editorTab={editorTab}
                setEditorTab={setEditorTab}
                isLoadingDetail={isLoadingDetail}
                isPending={createMutation.isPending}
                t={t}
                onSubmit={() => createMutation.mutate(formData)}
            />
        </motion.div>
    );
};

export default LegalManagerPage;
