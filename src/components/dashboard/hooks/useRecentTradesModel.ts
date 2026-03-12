import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { accountApi, orderApi, translateBackendErrorMessage, turboflowApi } from '@/api';
import type { ApiError } from '@/api/contracts';

export interface NormalizedTradeRow {
  key: number | string;
  timeText: string;
  symbolText: string;
  side: 'buy' | 'sell';
  priceValue: string | number | null | undefined;
  volumeValue: string | number | null | undefined;
  profit: number | null;
  isFilledWithoutPrice: boolean;
}

export const useRecentTradesModel = () => {
  const { t } = useTranslation(['dashboard', 'common', 'history']);

  const { data: accounts, isLoading: isAccountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountApi.list,
    staleTime: 60_000,
  });

  const firstTurboflowAccountId = useMemo(
    () => accounts?.find((account) => account.exchange === 'turboflow' && account.is_active && !account.deleted_at)?.id,
    [accounts]
  );

  const hasActiveAccount = useMemo(
    () => (accounts || []).some((account) => account.is_active && !account.deleted_at),
    [accounts]
  );

  const { data: trades = [], isError, error, isLoading, isFetching } = useQuery({
    queryKey: ['recentTrades', firstTurboflowAccountId, hasActiveAccount],
    queryFn: async () => {
      if (!hasActiveAccount) return [];
      if (firstTurboflowAccountId) {
        const response = await turboflowApi.getOrders({ account_id: firstTurboflowAccountId, page_size: 5 });
        return response.data || [];
      }
      const response = await orderApi.list({ page_num: 1, page_size: 5, include_pnl: true });
      return response.items || [];
    },
    enabled: Array.isArray(accounts),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    placeholderData: (previous) => previous ?? [],
  });

  const errorText = useMemo(() => {
    if (!isError) return '';
    return translateBackendErrorMessage((error as Partial<ApiError>)?.message || t('common:unknown_error'));
  }, [error, isError, t]);

  const normalizedTrades = useMemo<NormalizedTradeRow[]>(() => {
    return trades.map((trade, index) => {
      const sideRaw = String(trade.side || '').toLowerCase();
      const side: 'buy' | 'sell' =
        sideRaw === 'buy'
          ? 'buy'
          : sideRaw === 'sell'
            ? 'sell'
            : trade.order_way === 1
              ? 'buy'
              : 'sell';
      const rawPnl = trade.done_pnl ?? trade.realized_pnl ?? trade.profit;
      const parsed = rawPnl != null && rawPnl !== '' ? parseFloat(String(rawPnl)) : null;
      const profit = parsed !== null && Number.isFinite(parsed) ? parsed : null;
      const priceValue = trade.deal_price ?? trade.executed_price ?? trade.price;
      const volumeValue = trade.done_vol ?? trade.executed_qty ?? trade.quantity ?? trade.vol;
      const normalizedStatus = String(trade.order_status || trade.status || '').toLowerCase();
      const isFilledWithoutPrice = ['filled', 'finished', 'completed'].includes(normalizedStatus) && !priceValue;
      const timeText = new Date(trade.created_at || trade.updated_at || Date.now()).toLocaleString();
      const symbolText = String(trade.symbol || trade.pair_id || '--');

      return {
        key: trade.id || index,
        timeText,
        symbolText,
        side,
        priceValue,
        volumeValue,
        profit,
        isFilledWithoutPrice,
      };
    });
  }, [trades]);

  return {
    errorText,
    hasActiveAccount,
    isAccountsLoading,
    isFetching,
    isLoading,
    isError,
    normalizedTrades,
  };
};
