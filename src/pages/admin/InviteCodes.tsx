import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { zhCN, enUS } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InviteCodeCreateDialog } from './invite-codes/components/InviteCodeCreateDialog';
import { InviteCodesConfirmDialog } from './invite-codes/components/InviteCodesConfirmDialog';
import { InviteCodesTable } from './invite-codes/components/InviteCodesTable';
import { useInviteCodesModel } from './invite-codes/hooks/useInviteCodesModel';
import { containerVariants, itemVariants } from './invite-codes/utils';

export default function InviteCodesManagement() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const calendarLocale = useMemo(() => (i18n.language === 'zh' ? zhCN : enUS), [i18n.language]);
  const {
    actionConfirm,
    createMutation,
    createdCode,
    data,
    goNextPage,
    goPrevPage,
    handleCloseCreate,
    handleConfirmAction,
    handleConfirmOpenChange,
    handleCopy,
    handleCreate,
    hasCopied,
    isCreateOpen,
    isError,
    isLoading,
    newInvite,
    openCreate,
    page,
    queryErrorText,
    requestRevoke,
    revokeMutation,
    setNewInvite,
    total,
    totalPages,
  } = useInviteCodesModel();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 p-4 md:p-8 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">{t('admin:invites.title', 'Invite Codes')}</h1>
          <p className="text-slate-500 font-medium">
            {t('admin:invites.description', 'Manage invite codes used to grant users subscription access.')}
          </p>
        </div>
        <Button onClick={openCreate} className="h-10 px-5 rounded-xl gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
          <Plus className="w-4 h-4" />
          {t('admin:invites.new_code', 'Generate Code')}
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <CardTitle className="text-lg">{t('admin:invites.list_title', 'All Issued Codes')}</CardTitle>
            <CardDescription>
              {t('admin:invites.list_desc', 'Only the last 4 characters of the code are visible for security.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteCodesTable
              t={t}
              items={data?.items || []}
              isError={isError}
              isLoading={isLoading}
              queryErrorText={queryErrorText}
              revokePendingId={revokeMutation.variables}
              onRequestRevoke={requestRevoke}
            />

            {total > 0 && (
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <div>{t('admin:page_info', { page, total: totalPages })}</div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goPrevPage}
                    disabled={page <= 1}
                  >
                    {t('admin:prev')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goNextPage}
                    disabled={page >= totalPages}
                  >
                    {t('admin:next')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <InviteCodeCreateDialog
        t={t}
        open={isCreateOpen}
        onOpenChange={handleCloseCreate}
        createdCode={createdCode}
        hasCopied={hasCopied}
        onCopy={handleCopy}
        newInvite={newInvite}
        onNewInviteChange={setNewInvite}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
        calendarLocale={calendarLocale}
      />

      <InviteCodesConfirmDialog
        t={t}
        state={actionConfirm}
        onOpenChange={handleConfirmOpenChange}
        onConfirm={handleConfirmAction}
      />
    </motion.div>
  );
}
