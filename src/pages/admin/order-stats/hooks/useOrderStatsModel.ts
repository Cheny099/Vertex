import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { DateRange } from 'react-day-picker';
import { addDays, endOfDay, startOfDay } from 'date-fns';
import { adminApi, translateBackendErrorMessage } from '@/api';
import type { ApiError } from '@/api/contracts';
import type { OrderTurnoverStatsRow } from '@/api/types';
import {
  calculateTotals,
  formatUsd,
  getGroupLabel,
  type OrderStatsGroupBy,
  renderQualityWarningText,
} from '../utils';

export const useOrderStatsModel = () => {
  const { t } = useTranslation(['admin', 'common']);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  const [groupBy, setGroupBy] = useState<OrderStatsGroupBy>('day');
  const [exchange, setExchange] = useState('all');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orderTurnoverStats', dateRange, groupBy, exchange],
    queryFn: async () => {
      const response = await adminApi.stats.getOrderTurnover({
        start: dateRange?.from ? startOfDay(dateRange.from).toISOString() : undefined,
        end: dateRange?.to ? endOfDay(dateRange.to).toISOString() : undefined,
        group_by: groupBy,
        exchange: exchange === 'all' ? undefined : exchange,
      });
      if (!Array.isArray(response)) throw new Error('Invalid stats payload');
      return response;
    },
    placeholderData: (previousData) => previousData,
  });

  const errorText = useMemo(() => {
    const apiError = error as ApiError;
    const message = typeof apiError?.message === 'string' ? apiError.message : '';
    if (message === 'Invalid stats payload') return t('admin:error_loading_stats');
    return translateBackendErrorMessage(message) || message || t('common:error');
  }, [error, t]);

  const displayData = useMemo<OrderTurnoverStatsRow[]>(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  const totals = useMemo(() => calculateTotals(displayData), [displayData]);

  const overallWinRate = useMemo(
    () => ((totals && totals.trades > 0) ? (totals.wins / totals.trades * 100).toFixed(1) : '0'),
    [totals]
  );

  const getDisplayGroupLabel = useCallback(
    (row: OrderTurnoverStatsRow) => getGroupLabel(row, groupBy),
    [groupBy]
  );

  const renderQualityWarning = useCallback(
    (warning: string) => renderQualityWarningText(warning, t),
    [t]
  );

  const setGroupByValue = useCallback((value: string) => {
    if (
      value === 'day' ||
      value === 'user' ||
      value === 'account' ||
      value === 'symbol' ||
      value === 'strategy' ||
      value === 'subscription'
    ) {
      setGroupBy(value);
    }
  }, []);

  return {
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
    setGroupBy: setGroupByValue,
    t,
    totals,
  };
};
