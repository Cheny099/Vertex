import { motion } from 'framer-motion';
import { BarChart, LayoutGrid, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrderStatsModel } from './order-stats/hooks/useOrderStatsModel';
import { OrderStatsErrorBoundary } from './order-stats/OrderStatsErrorBoundary';
import { OrderStatsFiltersBar } from './order-stats/components/OrderStatsFiltersBar';
import { OrderStatsSummaryCards } from './order-stats/components/OrderStatsSummaryCards';
import { OrderStatsTable } from './order-stats/components/OrderStatsTable';
import { containerVariants, itemVariants } from './order-stats/utils';

function OrderStatsPage() {
  const {
    dateRange,
    displayData,
    errorText,
    exchange,
    formatUsd,
    getDisplayGroupLabel,
    groupBy,
    isError,
    isLoading,
    overallWinRate,
    refetch,
    renderQualityWarning,
    setDateRange,
    setExchange,
    setGroupBy,
    t,
    totals,
  } = useOrderStatsModel();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-8 space-y-6 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">{t('admin:trade_performance')}</h1>
          <p className="text-slate-500 font-medium mt-1">{t('admin:trade_performance_desc', 'View summary and grouped turnover statistics in the selected range.')}</p>
        </div>
        <BarChart className="h-6 w-6 text-primary" />
      </motion.div>

      {totals && (displayData.length > 0 || isLoading) ? (
        <motion.div variants={itemVariants}>
          <OrderStatsSummaryCards
            t={t}
            totals={totals}
            totalRecords={displayData.length}
            overallWinRate={overallWinRate}
            formatUsd={formatUsd}
          />
        </motion.div>
      ) : null}

      {!totals && !isLoading && (
        <motion.div variants={itemVariants} className="bg-muted/30 border rounded-lg p-4 text-center text-sm text-muted-foreground">
          {t('admin:no_summary_data')}
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                {t('admin:stats_breakdown')}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {t('admin:refresh')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <OrderStatsFiltersBar
              t={t}
              dateRange={dateRange}
              setDateRange={setDateRange}
              groupBy={groupBy}
              onGroupByChange={setGroupBy}
              exchange={exchange}
              onExchangeChange={setExchange}
            />

            <OrderStatsTable
              t={t}
              isError={isError}
              isLoading={isLoading}
              errorText={errorText}
              rows={displayData}
              formatUsd={formatUsd}
              getGroupLabel={getDisplayGroupLabel}
              renderQualityWarning={renderQualityWarning}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default function OrderStatsWrapper() {
  return (
    <OrderStatsErrorBoundary>
      <OrderStatsPage />
    </OrderStatsErrorBoundary>
  );
}
