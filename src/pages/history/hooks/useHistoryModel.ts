import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { translateBackendErrorMessage, type ApiError, type Order } from '@/api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { historyPageSizeOptions, historyTypes } from '../constants';
import { useHistoryQueries } from './useHistoryQueries';
import { useHistoryActions } from './useHistoryActions';
import { useHistoryState, type TfOrderStatus } from './useHistoryState';

export function useHistoryModel() {
  const { t, i18n } = useTranslation(['history', 'common']);
  const {
    searchInput,
    setSearchInput,
    selectedPair,
    setSelectedPair,
    selectedType,
    setSelectedType,
    viewMode,
    setViewMode,
    selectedSystemAccount,
    setSelectedSystemAccount,
    selectedTfAccount,
    setSelectedTfAccount,
    tfStatus,
    setTfStatus,
    systemPage,
    setSystemPage,
    systemPageSize,
    setSystemPageSize,
    tfPage,
    setTfPage,
    tfPageSize,
    setTfPageSize,
    debugOrder,
    setDebugOrder,
  } = useHistoryState();

  const searchTerm = useDebouncedValue(searchInput, 300);
  const queryClient = useQueryClient();

  const getToastErrorMessage = useCallback(
    (error: unknown) => {
      const apiError = error as ApiError;
      const rawMessage = typeof apiError?.message === 'string' ? apiError.message : t('common:unknown_error');
      return translateBackendErrorMessage(rawMessage);
    },
    [t]
  );

  const getFailureCode = useCallback((trade: Order): string | undefined => {
    return trade.failure_code || trade.public_error?.code;
  }, []);

  const getMappedFailureMessage = useCallback(
    (trade: Order): string | undefined => {
      const code = getFailureCode(trade);
      if (!code) return undefined;
      const key = `history:table.failure_map.${code}`;
      return i18n.exists(key) ? t(key) : undefined;
    },
    [getFailureCode, i18n, t]
  );

  const getMappedFailureAction = useCallback(
    (trade: Order): string | undefined => {
      const code = getFailureCode(trade);
      if (!code) return undefined;
      const key = `history:table.failure_action_map.${code}`;
      return i18n.exists(key) ? t(key) : undefined;
    },
    [getFailureCode, i18n, t]
  );

  const {
    accounts,
    turboflowAccounts,
    systemOrdersData,
    tfOrdersData,
    allTrades,
    isLoading,
    isError,
    queryError,
  } = useHistoryQueries({
    viewMode,
    selectedSystemAccount,
    selectedTfAccount,
    tfStatus,
    systemPage,
    systemPageSize,
    tfPage,
    tfPageSize,
    setSelectedTfAccount,
    setTfPage,
    queryClient,
  });

  const {
    cancelMutation,
    retryMutation,
    debugMutation,
    handleRetry,
    handleCancel,
    handleDebug,
  } = useHistoryActions({
    queryClient,
    setDebugOrder,
    getToastErrorMessage,
    t,
  });

  const queryErrorMessage = useMemo(() => {
    if (!isError) return '';
    return getToastErrorMessage(queryError);
  }, [getToastErrorMessage, isError, queryError]);

  const filteredTrades = useMemo(() => {
    const activeAccount = viewMode === 'system' ? selectedSystemAccount : selectedTfAccount;
    const normalizedPair = selectedPair.replace('/', '');
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    return allTrades.filter((trade: Order) => {
      const matchAccount = activeAccount === 'all' || activeAccount === '' || trade.account_id === Number(activeAccount);
      const matchPair = selectedPair === 'all' || String(trade.symbol).replace('/', '').includes(normalizedPair);
      const matchType =
        selectedType === 'all' ||
        (selectedType === 'buy' && trade.side === 'buy') ||
        (selectedType === 'sell' && trade.side === 'sell');
      const matchSearch =
        normalizedSearchTerm === '' || String(trade.symbol).toLowerCase().includes(normalizedSearchTerm);
      return matchAccount && matchPair && matchType && matchSearch;
    });
  }, [allTrades, selectedSystemAccount, selectedTfAccount, selectedPair, selectedType, searchTerm, viewMode]);

  const displayedTrades = filteredTrades;

  // Derived from the unfiltered page: building this from displayedTrades would drop every option
  // except the one already selected, leaving no way to switch pair without clearing the filter.
  const pairOptions = useMemo(() => {
    const set = new Set<string>();
    allTrades.forEach((trade) => {
      const symbol = String(trade.symbol || '').trim();
      if (symbol && symbol !== '--') set.add(symbol);
    });
    return ['all', ...Array.from(set)];
  }, [allTrades]);

  const hasLocalFilters = selectedPair !== 'all' || selectedType !== 'all' || searchTerm.trim() !== '';

  const stats = useMemo(() => {
    const tfServerTotal = tfOrdersData?.count ?? 0;
    const totalCount =
      viewMode === 'turboflow'
        ? hasLocalFilters
          ? displayedTrades.length
          : tfServerTotal
        : displayedTrades.length;
    const totalScope =
      viewMode === 'turboflow'
        ? hasLocalFilters
          ? t('history:stats.scope_filtered_page')
          : t('history:stats.scope_server_total')
        : t('history:stats.scope_page');

    let buyCount = 0;
    let totalProfit = 0;
    for (const trade of displayedTrades) {
      if (trade.side === 'buy') buyCount += 1;
      totalProfit += Number(trade.realized_pnl) || 0;
    }
    const sellCount = displayedTrades.length - buyCount;

    return [
      { label: t('history:stats.total_orders'), value: `${totalCount} ${t('history:stats.count')}`, subValue: totalScope },
      { label: t('history:stats.buy'), value: `${buyCount} ${t('history:stats.count')}`, subValue: t('history:stats.scope_page') },
      { label: t('history:stats.sell'), value: `${sellCount} ${t('history:stats.count')}`, subValue: t('history:stats.scope_page') },
      {
        label: t('history:stats.pnl'),
        value: totalProfit.toFixed(2),
        subValue: t('history:stats.pnl_closed'),
        color: totalProfit > 0 ? 'text-profit' : totalProfit < 0 ? 'text-loss' : '',
      },
    ];
  }, [displayedTrades, hasLocalFilters, tfOrdersData?.count, viewMode, t]);

  const clearFilters = useCallback(() => {
    setSelectedPair('all');
    setSelectedType('all');
    setSearchInput('');
    if (viewMode === 'system') {
      setSystemPage(1);
    } else {
      setTfPage(1);
    }
  }, [setSelectedPair, setSelectedType, setSearchInput, viewMode, setSystemPage, setTfPage]);

  const hasFilters = selectedPair !== 'all' || selectedType !== 'all' || searchInput !== '';

  const currentPage = viewMode === 'system' ? systemPage : tfPage;
  const currentPageSize = viewMode === 'system' ? systemPageSize : tfPageSize;
  const setCurrentPage = useCallback(
    (value: number | ((prev: number) => number)) => {
      if (viewMode === 'system') {
        setSystemPage((prev) => (typeof value === 'function' ? value(prev) : value));
      } else {
        setTfPage((prev) => (typeof value === 'function' ? value(prev) : value));
      }
    },
    [viewMode, setSystemPage, setTfPage]
  );

  const setCurrentPageSize = useCallback(
    (size: number) => {
      if (viewMode === 'system') {
        setSystemPageSize(size);
        setSystemPage(1);
      } else {
        setTfPageSize(size);
        setTfPage(1);
      }
    },
    [viewMode, setSystemPageSize, setSystemPage, setTfPageSize, setTfPage]
  );

  const tfTotal = tfOrdersData?.count ?? 0;
  const tfPageCount = tfOrdersData?.page_count ?? 0;
  const systemHasMore = !!systemOrdersData?.has_more;
  // The server range only describes the page when no local filter has removed rows from it.
  // With a filter active the offset is meaningless, so report a plain 1..n count of what is shown.
  const showingStart = displayedTrades.length === 0 ? 0 : hasLocalFilters ? 1 : (currentPage - 1) * currentPageSize + 1;
  const showingEnd = displayedTrades.length === 0 ? 0 : showingStart + displayedTrades.length - 1;
  const showingTotal = hasLocalFilters
    ? displayedTrades.length
    : viewMode === 'turboflow'
      ? tfTotal
      : systemHasMore
        ? `${showingEnd}+`
        : showingEnd;

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      setCurrentPage(1);
    },
    [setSearchInput, setCurrentPage]
  );

  const handleAccountChange = useCallback(
    (value: string) => {
      if (viewMode === 'system') {
        setSelectedSystemAccount(value);
        setSystemPage(1);
      } else {
        setSelectedTfAccount(value);
        setTfPage(1);
      }
    },
    [viewMode, setSelectedSystemAccount, setSystemPage, setSelectedTfAccount, setTfPage]
  );

  const handleTfStatusChange = useCallback(
    (value: string) => {
      setTfStatus(value as TfOrderStatus);
      setTfPage(1);
    },
    [setTfStatus, setTfPage]
  );

  const handlePairChange = useCallback(
    (value: string) => {
      setSelectedPair(value);
      setCurrentPage(1);
    },
    [setSelectedPair, setCurrentPage]
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      setSelectedType(value);
      setCurrentPage(1);
    },
    [setSelectedType, setCurrentPage]
  );

  const handlePrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, [setCurrentPage]);

  const handleNextPage = useCallback(() => {
    setCurrentPage((p) => p + 1);
  }, [setCurrentPage]);

  return {
    t,
    viewMode,
    setViewMode,
    searchInput,
    handleSearchChange,
    selectedSystemAccount,
    selectedTfAccount,
    accounts,
    turboflowAccounts,
    handleAccountChange,
    tfStatus,
    handleTfStatusChange,
    selectedPair,
    handlePairChange,
    selectedType,
    handleTypeChange,
    hasFilters,
    clearFilters,
    pairOptions,
    types: [...historyTypes],
    stats,
    displayedTrades,
    isLoading,
    isError,
    queryErrorMessage,
    getMappedFailureMessage,
    getMappedFailureAction,
    cancelMutation,
    retryMutation,
    debugMutation,
    handleRetry,
    handleCancel,
    handleDebug,
    showingStart,
    showingEnd,
    showingTotal,
    currentPageSize,
    setCurrentPageSize,
    pageSizeOptions: [...historyPageSizeOptions],
    currentPage,
    handlePrevPage,
    tfPageCount,
    systemHasMore,
    setCurrentPage,
    handleNextPage,
    debugOrder,
    setDebugOrder,
  };
}
