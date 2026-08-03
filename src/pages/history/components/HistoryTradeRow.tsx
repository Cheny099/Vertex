import { memo } from 'react';
import type { TFunction } from 'i18next';
import { motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import type { Order } from '@/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HistoryTradeActionsMenu } from './history-trade-row/HistoryTradeActionsMenu';
import { useHistoryTradeRowModel } from './history-trade-row/useHistoryTradeRowModel';

interface HistoryTradeRowProps {
  t: TFunction;
  trade: Order;
  rowIndex: number;
  viewMode: 'system' | 'turboflow';
  accountName?: string;
  getMappedFailureMessage: (trade: Order) => string | undefined;
  getMappedFailureAction: (trade: Order) => string | undefined;
  isCancelPending: boolean;
  isRetryPending: boolean;
  isDebugPending: boolean;
  onRetry: (trade: Order) => void;
  onCancel: (trade: Order) => void;
  onDebug: (trade: Order) => void;
}

function HistoryTradeRowComponent({
  t,
  trade,
  rowIndex,
  viewMode,
  accountName,
  getMappedFailureMessage,
  getMappedFailureAction,
  isCancelPending,
  isRetryPending,
  isDebugPending,
  onRetry,
  onCancel,
  onDebug,
}: HistoryTradeRowProps) {
  const {
    canCancel,
    canDebug,
    canRetry,
    createdAtText,
    displayError,
    displayFailureAction,
    displayPrice,
    displayQuantity,
    handleCancel,
    handleDebug,
    handleRetryOrReorder,
    isBlocked,
    isBuy,
    isFailure,
    isSuccess,
    pnlColorClass,
    pnlValue,
    showMissingNotional,
    showMissingPrice,
    showTooltip,
    statusClass,
    statusLabel,
  } = useHistoryTradeRowModel({
    t,
    trade,
    viewMode,
    getMappedFailureMessage,
    getMappedFailureAction,
    onRetry,
    onCancel,
    onDebug,
  });

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.05 * rowIndex }}
      className="hover:bg-secondary/30 transition-colors"
    >
      <td className="p-4 text-sm font-mono text-muted-foreground">
        {createdAtText}
      </td>
      <td className="p-4 text-sm font-medium">{trade.symbol}</td>

      <td className="p-4">
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
          isBuy ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss',
        )}>
          {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {isBuy ? t('history:filters.buy') : t('history:filters.sell')}
        </span>
      </td>

      <td className="p-4 text-sm text-muted-foreground font-mono">
        {accountName || trade.account_id}
      </td>

      <td className="p-4 text-sm text-right font-mono">
        <div className="flex flex-col items-end">
          <span>{displayPrice}</span>
          {showMissingPrice && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-[9px] text-warning mt-0.5 cursor-help">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {t('common:audit.missing_price')}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('common:audit.missing_price_desc')}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </td>
      <td className="p-4 text-sm text-right font-mono">
        <div className="flex flex-col items-end">
          <span>{displayQuantity}</span>
          {showMissingNotional && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-[8px] h-3 border-warning/50 text-warning px-1 mt-0.5 font-normal cursor-help">
                  {t('history:table.missing_usd')}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('common:audit.missing_notional_desc')}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </td>

      <td className={cn(
        'p-4 text-sm text-right font-mono font-bold',
        pnlColorClass,
      )}>
        {pnlValue}
      </td>

      <td className="p-4 text-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(
              'inline-flex px-2 py-1 rounded text-xs font-medium items-center',
              showTooltip ? 'cursor-help' : 'cursor-default',
              statusClass,
            )}>
              {statusLabel}
              {showTooltip && <AlertCircle className="w-3 h-3 ml-1" />}
            </span>
          </TooltipTrigger>

          {showTooltip && (
            <TooltipContent>
              <div className="max-w-xs space-y-2">
                <p className="font-semibold text-destructive">{displayError}</p>
                {displayFailureAction && (
                  <p className="text-xs p-2 bg-secondary/50 rounded border-l-2 border-primary">
                    {t('history:actions.suggested_action')}: {displayFailureAction}
                  </p>
                )}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </td>

      <td className="p-4 text-right">
        <HistoryTradeActionsMenu
          t={t}
          canCancel={canCancel}
          canDebug={canDebug}
          canRetry={canRetry}
          isCancelPending={isCancelPending}
          isDebugPending={isDebugPending}
          isRetryPending={isRetryPending}
          onCancel={handleCancel}
          onDebug={handleDebug}
          onRetry={handleRetryOrReorder}
        />
      </td>
    </motion.tr>
  );
}

export const HistoryTradeRow = memo(HistoryTradeRowComponent);
