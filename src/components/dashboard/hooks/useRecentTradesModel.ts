import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { accountApi, orderApi, translateBackendErrorMessage, turboflowApi } from '@/api';
import type { ApiError } from '@/api/contracts';
import { mapTurboFlowOrderToOrder } from '@/pages/history/utils';

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
        // Mapped rather than normalised inline. This used to read TurboFlow's raw fields with its
        // own ?? chains, which meant it carried its own copy of two defects the history mapper had:
        // `order_way === 1 ? 'buy' : 'sell'` printed close-shorts as sales, and `done_vol` - a USD
        // notional - was shown as a quantity. One mapper, one answer.
        return (response.data || []).map((row) =>
          mapTurboFlowOrderToOrder(row, String(firstTurboflowAccountId))
        );
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
    // Both branches now hand back Order rows, so this reads Order fields only. The exchange-native
    // spellings it used to fall back through (order_way, done_pnl, deal_price, done_vol, vol,
    // order_status, pair_id) are all resolved by the mapper, and none of them existed on the
    // union's Order side anyway - they were eight of the errors in #40.
    return trades.map((trade, index) => {
      const side: 'buy' | 'sell' = trade.side === 'sell' ? 'sell' : 'buy';
      // `Order.realized_pnl` is a number, and the mapper already ran TurboFlow's string through
      // parseNum, so the old parseFloat(String(...)) round trip and its `!== ''` guard - which the
      // type checker now rejects outright - have nothing left to defend against.
      const profit = Number.isFinite(trade.realized_pnl) ? (trade.realized_pnl as number) : null;
      const priceValue = trade.executed_price ?? trade.price;
      const volumeValue = trade.executed_qty ?? trade.quantity;
      const normalizedStatus = String(trade.status || '').toLowerCase();
      const isFilledWithoutPrice = ['filled', 'finished', 'completed'].includes(normalizedStatus) && !priceValue;
      const timeText = new Date(trade.created_at || trade.updated_at || Date.now()).toLocaleString();
      const symbolText = String(trade.symbol || '--');

      return {
        // tf_row_key, not id: TurboFlow snowflake ids collapse onto one another through Number(),
        // which is why the mapper preserves the original string (see #34).
        key: trade.tf_row_key ?? trade.id ?? index,
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
