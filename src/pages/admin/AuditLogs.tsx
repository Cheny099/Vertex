import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditLogsFiltersBar } from './audit-logs/components/AuditLogsFiltersBar';
import { AuditLogsTable } from './audit-logs/components/AuditLogsTable';
import { useAuditLogsModel } from './audit-logs/hooks/useAuditLogsModel';
import { containerVariants, itemVariants } from './audit-logs/utils';

export default function AuditLogs() {
  const {
    action,
    actor,
    data,
    dateRange,
    formatAction,
    formatTargetType,
    getActionColor,
    goNextPage,
    goPrevPage,
    handleActionChange,
    handleActorChange,
    handleDateRangeChange,
    handleTargetIdChange,
    handleTargetTypeChange,
    hasNextPage,
    isError,
    isLoading,
    logs,
    page,
    queryErrorText,
    refresh,
    t,
    targetId,
    targetType,
  } = useAuditLogsModel();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 p-4 md:p-8 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">{t('admin:system_logs')}</h1>
        <p className="text-slate-500 font-medium">{t('admin:system_logs_desc')}</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle>{t('admin:system_logs')}</CardTitle>
                <CardDescription>
                  {t('admin:total')}: {data?.total || 0}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl" onClick={refresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('admin:refresh')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AuditLogsFiltersBar
              t={t}
              actor={actor}
              action={action}
              targetType={targetType}
              targetId={targetId}
              dateRange={dateRange}
              onActorChange={handleActorChange}
              onActionChange={handleActionChange}
              onTargetTypeChange={handleTargetTypeChange}
              onTargetIdChange={handleTargetIdChange}
              onDateRangeChange={handleDateRangeChange}
            />

            <AuditLogsTable
              t={t}
              logs={logs}
              isError={isError}
              isLoading={isLoading}
              queryErrorText={queryErrorText}
              getActionColor={getActionColor}
              formatAction={formatAction}
              formatTargetType={formatTargetType}
            />

            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goPrevPage}
                disabled={page === 1 || isLoading}
              >
                {t('admin:prev')}
              </Button>
              <div className="text-sm font-medium">{t('admin:page_current', { page })}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={goNextPage}
                disabled={!hasNextPage || isLoading}
              >
                {t('admin:next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
