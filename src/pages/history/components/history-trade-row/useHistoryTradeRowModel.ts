import { useCallback } from 'react';
import type { TFunction } from 'i18next';
import { format } from 'date-fns';
import type { Order } from '@/api';
import { toast } from 'sonner';

type ViewMode = 'system' | 'turboflow';

interface UseHistoryTradeRowModelParams {
  t: TFunction;
  trade: Order;
  viewMode: ViewMode;
  getMappedFailureMessage: (trade: Order) => string | undefined;
  getMappedFailureAction: (trade: Order) => string | undefined;
  onRetry: (trade: Order) => void;
  onCancel: (trade: Order) => void;
  onDebug: (trade: Order) => void;
}

const SUCCESS_STATUSES = new Set(['FILLED', 'COMPLETED', 'FINISHED']);
const FAILURE_STATUSES = new Set(['FAILED', 'CANCELED', 'CANCELLED', 'EXPIRED']);
const ERROR_STATUSES = new Set(['FAILED', 'EXPIRED', 'PROCESSING']);
const TURBOFLOW_FILLED_STATUSES = new Set(['filled', 'completed']);
const TURBOFLOW_CANCELED_STATUSES = new Set(['cancelled', 'canceled']);
const TURBOFLOW_PARTIAL_CANCELED_STATUSES = new Set(['partially_canceled', 'partially_cancelled']);
const TURBOFLOW_PENDING_STATUSES = new Set(['pending', 'new']);
const TURBOFLOW_FAILURE_STATUSES = new Set(['rejected', 'failed']);
const SYSTEM_PENDING_STATUSES = new Set(['PROCESSING', 'PENDING', 'NEW']);

const getSystemStatusLabel = (
  t: TFunction,
  trade: Order,
  rawStatus: string,
  isBlocked: boolean
) => {
  if (SUCCESS_STATUSES.has(rawStatus)) return t('history:table.status_map.filled');
  if (rawStatus === 'FAILED') {
    if (isBlocked) return t('history:table.status_map.blocked');

    const errMsg = String(trade.failure_message || trade.error_message || '').toLowerCase();
    if (errMsg.includes('cancelled') || errMsg.includes('canceled')) {
      return t('history:table.status_map.canceled');
    }

    return t('history:table.status_map.failed');
  }

  if (rawStatus === 'EXPIRED') return t('history:table.status_map.expired');
  if (rawStatus === 'CANCELED' || rawStatus === 'CANCELLED') return t('history:table.status_map.canceled');
  if (SYSTEM_PENDING_STATUSES.has(rawStatus)) return t('history:table.status_map.pending');

  return trade.status || '--';
};

const getTurboflowStatusLabel = (t: TFunction, trade: Order) => {
  const status = trade.status?.toLowerCase();
  if (status && TURBOFLOW_FILLED_STATUSES.has(status)) return t('history:table.status_map.filled');
  if (status === 'partially_filled') return t('history:table.status_map.partially_filled');
  if (status && TURBOFLOW_CANCELED_STATUSES.has(status)) return t('history:table.status_map.canceled');
  if (status && TURBOFLOW_PARTIAL_CANCELED_STATUSES.has(status)) return t('history:table.status_map.partially_canceled');
  if (status && TURBOFLOW_PENDING_STATUSES.has(status)) return t('history:table.status_map.pending');
  if (status && TURBOFLOW_FAILURE_STATUSES.has(status)) return t('history:table.status_map.failed');

  const raw = String(trade.status || '').toUpperCase();
  if (!raw || raw === '-' || raw === '--') return '--';
  return raw;
};

export function useHistoryTradeRowModel({
  t,
  trade,
  viewMode,
  getMappedFailureMessage,
  getMappedFailureAction,
  onRetry,
  onCancel,
  onDebug,
}: UseHistoryTradeRowModelParams) {
  const rawStatus = String(trade.status || '').toUpperCase();
  const isSuccess = SUCCESS_STATUSES.has(rawStatus);
  const isFailure = FAILURE_STATUSES.has(rawStatus);
  const isBlocked =
    trade.failure_code === 'SUBSCRIPTION_BLOCKED'
    || trade.public_error?.code === 'SUBSCRIPTION_BLOCKED';
  const canShowError = ERROR_STATUSES.has(rawStatus);

  let rawError: string | undefined;
  if (isBlocked) {
    const details = trade.public_error?.details || {};
    if (details.blocked_by === 'is_frozen' || trade.is_frozen) {
      rawError = t('history:table.errors.blocked_frozen');
    } else if (details.blocked_by === 'block_open' || trade.block_open) {
      rawError = t('history:table.errors.blocked_open');
    } else {
      rawError =
        getMappedFailureMessage(trade)
        || trade.failure_message
        || trade.public_error?.message
        || t('history:table.failure_map.SUBSCRIPTION_BLOCKED');
    }
  } else {
    rawError =
      getMappedFailureMessage(trade)
      || trade.failure_message
      || trade.public_error?.message
      || trade.error_message
      || trade.last_error;
  }

  const normalizedRawError = typeof rawError === 'string' ? rawError : String(rawError ?? '');
  const showTooltip = viewMode === 'system' && (canShowError || isBlocked) && Boolean(normalizedRawError);
  const displayError = !showTooltip
    ? normalizedRawError
    : normalizedRawError.length <= 200
      ? normalizedRawError
      : `${normalizedRawError.slice(0, 200)}${t('history:table.truncated_suffix')}`;
  const displayFailureAction = getMappedFailureAction(trade) || trade.failure_action;

  const statusLabel = viewMode === 'turboflow'
    ? getTurboflowStatusLabel(t, trade)
    : getSystemStatusLabel(t, trade, rawStatus, isBlocked);

  const isCompletedStatus = trade.status === 'COMPLETED';
  const showMissingPrice = isCompletedStatus && (trade.executed_price === undefined || trade.executed_price === null);
  const showMissingNotional =
    isCompletedStatus && (trade.executed_notional_usd === undefined || trade.executed_notional_usd === null);

  const numericPnl = Number(trade.realized_pnl || 0);
  const pnlValue = trade.realized_pnl === undefined || trade.realized_pnl === null
    ? '--'
    : `${numericPnl > 0 ? '+' : ''}${numericPnl.toFixed(2)}`;
  const pnlColorClass = numericPnl > 0
    ? 'text-profit'
    : numericPnl < 0
      ? 'text-loss'
      : 'text-muted-foreground';

  const isBuy = trade.side === 'buy';
  const createdAtText = trade.created_at
    ? format(new Date(trade.created_at), 'yyyy-MM-dd HH:mm:ss')
    : '--';
  const displayPrice = trade.executed_price ?? trade.price ?? '--';
  const displayQuantity = trade.executed_qty ?? trade.quantity ?? '--';
  // The backend rejects anything but FAILED ("Only failed orders can be retried"), and there is
  // no reorder endpoint, so offering this on EXPIRED rows was a button that could not work.
  const canRetry = viewMode === 'system' && trade.status === 'FAILED';
  const canCancel = viewMode === 'system' && (trade.status === 'PENDING' || trade.status === 'PROCESSING');
  const canDebug = viewMode === 'system';
  const statusClass = isSuccess || statusLabel === t('history:table.status_map.filled')
    ? 'bg-profit/10 text-profit'
    : isBlocked
      ? 'bg-orange-500/15 text-orange-600 border border-orange-500/20'
      : isFailure || statusLabel === t('history:table.status_map.failed') || statusLabel === t('history:table.status_map.canceled')
        ? 'bg-destructive/10 text-destructive'
        : 'bg-warning/10 text-warning';

  const handleRetryOrReorder = useCallback(() => {
    onRetry(trade);
  }, [onRetry, trade]);

  const handleDebug = useCallback(() => {
    onDebug(trade);
  }, [onDebug, trade]);

  const handleCancel = useCallback(() => {
    toast(t('history:actions.cancel_confirm_title'), {
      description: t('history:actions.cancel_confirm_desc', { id: trade.id }),
      action: {
        label: t('history:actions.cancel_confirm_btn'),
        onClick: () => onCancel(trade),
      },
      cancel: {
        label: t('history:actions.cancel_cancel_btn'),
        onClick: () => {},
      },
    });
  }, [onCancel, t, trade]);

  return {
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
  };
}
