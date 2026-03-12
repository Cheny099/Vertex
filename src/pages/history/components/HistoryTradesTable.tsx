import { memo, useMemo, type ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { motion } from 'framer-motion';
import type { Order } from '@/api';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HistoryTradeRow } from './HistoryTradeRow';

interface AccountOption {
  id: number;
  name: string;
}

interface HistoryTradesTableProps {
  t: TFunction;
  viewMode: 'system' | 'turboflow';
  displayedTrades: Order[];
  accounts: AccountOption[];
  isLoading: boolean;
  isError: boolean;
  queryErrorMessage: string;
  getMappedFailureMessage: (trade: Order) => string | undefined;
  getMappedFailureAction: (trade: Order) => string | undefined;
  isCancelPending: boolean;
  isRetryPending: boolean;
  isReorderPending: boolean;
  isDebugPending: boolean;
  onRetryOrReorder: (trade: Order) => void;
  onCancel: (trade: Order) => void;
  onDebug: (trade: Order) => void;
  pagination: ReactNode;
}

function HistoryTradesTableComponent({
  t,
  viewMode,
  displayedTrades,
  accounts,
  isLoading,
  isError,
  queryErrorMessage,
  getMappedFailureMessage,
  getMappedFailureAction,
  isCancelPending,
  isRetryPending,
  isReorderPending,
  isDebugPending,
  onRetryOrReorder,
  onCancel,
  onDebug,
  pagination,
}: HistoryTradesTableProps) {
  const accountNameMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const account of accounts) {
      map.set(account.id, account.name);
    }
    return map;
  }, [accounts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border bg-secondary/30">
              <th className="text-left p-4 font-medium">{t('history:table.time')}</th>
              <th className="text-left p-4 font-medium">{t('history:table.pair')}</th>
              <th className="text-left p-4 font-medium">{t('history:table.side')}</th>
              <th className="text-left p-4 font-medium">{t('history:table.account')}</th>
              <th className="text-right p-4 font-medium">{t('history:table.price')}</th>
              <th className="text-right p-4 font-medium">{t('history:table.amount')}</th>
              <th className="text-right p-4 font-medium">{t('history:table.pnl')}</th>
              <th className="text-center p-4 font-medium">{t('history:table.status')}</th>
              <th className="text-right p-4 font-medium">{t('history:table.action')}</th>
            </tr>
          </thead>

          <TooltipProvider>
            <tbody className="divide-y divide-border">
            {displayedTrades.length > 0 ? (
              displayedTrades.map((trade: Order, index: number) => (
                <HistoryTradeRow
                  key={trade.id ?? `${trade.account_id}-${trade.created_at ?? index}`}
                  t={t}
                  trade={trade}
                  rowIndex={index}
                  viewMode={viewMode}
                  accountName={accountNameMap.get(trade.account_id)}
                  getMappedFailureMessage={getMappedFailureMessage}
                  getMappedFailureAction={getMappedFailureAction}
                  isCancelPending={isCancelPending}
                  isRetryPending={isRetryPending}
                  isReorderPending={isReorderPending}
                  isDebugPending={isDebugPending}
                  onRetryOrReorder={onRetryOrReorder}
                  onCancel={onCancel}
                  onDebug={onDebug}
                />
              ))
            ) : (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  {isLoading ? (
                    t('common:loading')
                  ) : isError ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-medium text-destructive">{t('history:table.error_title')}</span>
                      <span className="text-xs text-muted-foreground">{queryErrorMessage || t('common:unknown_error')}</span>
                    </div>
                  ) : (
                    t('history:table.empty')
                  )}
                </td>
              </tr>
            )}
            </tbody>
          </TooltipProvider>
        </table>
      </div>

      {pagination}
    </motion.div>
  );
}

export const HistoryTradesTable = memo(HistoryTradesTableComponent);
