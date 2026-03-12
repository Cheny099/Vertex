/**
 * @anchor-id RECENT_TRADES
 * @module-type component
 * @disposable false
 * @mock-data trades 数组为临�?Mock，后端对接时替换
 */

import { motion } from 'framer-motion';
import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RecentTradeRow } from './RecentTradeRow';
import { useRecentTradesModel } from '@/components/dashboard/hooks/useRecentTradesModel';

const RecentTrades = () => {
  const { t } = useTranslation(['dashboard', 'common', 'history']);
  const navigate = useNavigate();
  const {
    errorText,
    hasActiveAccount,
    isAccountsLoading,
    isFetching,
    isLoading,
    isError,
    normalizedTrades,
  } = useRecentTradesModel();

  const handleViewAll = useCallback(() => {
    navigate('/history');
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="glass-card rounded-xl overflow-hidden h-full"
    >
      <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('recent_trades.title')}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left p-4 font-medium">{t('recent_trades.table.time')}</th>
              <th className="text-left p-4 font-medium">{t('recent_trades.table.pair')}</th>
              <th className="text-left p-4 font-medium">{t('recent_trades.table.type')}</th>
              <th className="text-right p-4 font-medium">{t('recent_trades.table.price')}</th>
              <th className="text-right p-4 font-medium">{t('recent_trades.table.volume')}</th>
              <th className="text-right p-4 font-medium">{t('recent_trades.table.pnl')}</th>
            </tr>
          </thead>
          <TooltipProvider>
            <tbody className="divide-y divide-border">
              {isAccountsLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                    {t('common:loading')}
                  </td>
                </tr>
              ) : !hasActiveAccount ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                    {t('account_status.empty_text')}
                  </td>
                </tr>
              ) : (isLoading || isFetching) ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                    {t('common:loading')}
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-destructive">
                    {errorText}
                  </td>
                </tr>
              ) : normalizedTrades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">{t('history:table.empty')}</td>
                </tr>
              ) : normalizedTrades.map((trade, index: number) => (
                <RecentTradeRow
                  key={trade.key}
                  timeText={trade.timeText}
                  symbolText={trade.symbolText}
                  side={trade.side}
                  priceValue={trade.priceValue}
                  volumeValue={trade.volumeValue}
                  profit={trade.profit}
                  isFilledWithoutPrice={trade.isFilledWithoutPrice}
                  index={index}
                  t={t}
                />
              ))}
            </tbody>
          </TooltipProvider>
        </table>
      </div>

      <div className="p-4 border-t border-border">
        <button
          onClick={handleViewAll}
          className="w-full py-2 text-sm text-primary hover:text-primary-light transition-colors"
        >
          {t('recent_trades.view_all')}
        </button>
      </div>
    </motion.div>
  );
};

export default memo(RecentTrades);
