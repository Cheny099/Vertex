import { useEffect, useMemo } from 'react';
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { accountApi, orderApi, turboflowApi, type Order } from '@/api';
import type { TurboFlowOrderItem } from '@/api/types';
import { mapTurboFlowOrderToOrder } from '../utils';
import type { HistoryViewMode, TfOrderStatus } from './useHistoryState';

type UseHistoryQueriesParams = {
  viewMode: HistoryViewMode;
  selectedSystemAccount: string;
  selectedTfAccount: string;
  tfStatus: TfOrderStatus;
  systemPage: number;
  systemPageSize: number;
  tfPage: number;
  tfPageSize: number;
  setSelectedTfAccount: (value: string) => void;
  setTfPage: (value: number) => void;
  queryClient: QueryClient;
};

export function useHistoryQueries({
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
}: UseHistoryQueriesParams) {
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: accountApi.list,
  });
  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);

  const turboflowAccounts = useMemo(
    () => accounts.filter((acc) => acc.exchange === 'turboflow'),
    [accounts]
  );

  useEffect(() => {
    if (viewMode !== 'turboflow' || !accountsQuery.isSuccess) return;
    if (turboflowAccounts.length === 0) {
      if (selectedTfAccount !== '') setSelectedTfAccount('');
      return;
    }
    const exists = turboflowAccounts.some((acc) => acc.id.toString() === selectedTfAccount);
    if (!selectedTfAccount || !exists) {
      setSelectedTfAccount(turboflowAccounts[0].id.toString());
      setTfPage(1);
    }
  }, [viewMode, accountsQuery.isSuccess, turboflowAccounts, selectedTfAccount, setSelectedTfAccount, setTfPage]);

  const systemOrdersQuery = useQuery({
    queryKey: ['orders', 'history', selectedSystemAccount, systemPage, systemPageSize],
    queryFn: () =>
      orderApi.getHistory({
        include_pnl: true,
        page_num: systemPage,
        page_size: systemPageSize,
        account_id: selectedSystemAccount === 'all' ? undefined : Number(selectedSystemAccount),
      }),
    enabled: viewMode === 'system',
  });

  // Only data belonging to this exact account/status/page/size may be actionable. Cached
  // pages and prefetching still work; an unresolved key no longer borrows another key's rows.
  const hasTfAccount = turboflowAccounts.some((account) => String(account.id) === selectedTfAccount);
  const tfOrdersQuery = useQuery({
    queryKey: ['turboflow-orders', selectedTfAccount, tfStatus, tfPage, tfPageSize],
    queryFn: () => turboflowApi.getOrders({
      account_id: Number(selectedTfAccount),
      status: tfStatus === 'all' ? undefined : tfStatus,
      page_num: tfPage,
      page_size: tfPageSize,
    }),
    enabled: viewMode === 'turboflow' && hasTfAccount,
  });

  useEffect(() => {
    if (viewMode !== 'system') return;
    if (!systemOrdersQuery.data?.has_more) return;

    const nextPage = systemPage + 1;
    queryClient.prefetchQuery({
      queryKey: ['orders', 'history', selectedSystemAccount, nextPage, systemPageSize],
      queryFn: () =>
        orderApi.getHistory({
          include_pnl: true,
          page_num: nextPage,
          page_size: systemPageSize,
          account_id: selectedSystemAccount === 'all' ? undefined : Number(selectedSystemAccount),
        }),
    });
  }, [queryClient, viewMode, systemOrdersQuery.data?.has_more, systemPage, systemPageSize, selectedSystemAccount]);

  useEffect(() => {
    if (viewMode !== 'turboflow') return;
    if (!hasTfAccount) return;
    const pageCount = tfOrdersQuery.data?.page_count ?? 0;
    if (pageCount === 0 || tfPage >= pageCount) return;

    const nextPage = tfPage + 1;
    queryClient.prefetchQuery({
      queryKey: ['turboflow-orders', selectedTfAccount, tfStatus, nextPage, tfPageSize],
      queryFn: () => turboflowApi.getOrders({
        account_id: Number(selectedTfAccount),
        status: tfStatus === 'all' ? undefined : tfStatus,
        page_num: nextPage,
        page_size: tfPageSize,
      }),
    });
  }, [queryClient, viewMode, hasTfAccount, selectedTfAccount, tfOrdersQuery.data?.page_count, tfPage, tfPageSize, tfStatus]);

  const allTrades = useMemo<Order[]>(() => {
    if (viewMode === 'system') return systemOrdersQuery.data?.items ?? [];
    if (!hasTfAccount) return [];
    return (tfOrdersQuery.data?.data ?? []).map((item: TurboFlowOrderItem) =>
      mapTurboFlowOrderToOrder(item, selectedTfAccount));
  }, [viewMode, systemOrdersQuery.data, tfOrdersQuery.data, selectedTfAccount, hasTfAccount]);

  const activeQuery = viewMode === 'system' ? systemOrdersQuery : tfOrdersQuery;
  const isPaused = accountsQuery.isPaused || activeQuery.isPaused;
  const isError = accountsQuery.isError || activeQuery.isError || isPaused;
  const isLoading = !isError && (viewMode === 'system'
    ? systemOrdersQuery.isLoading
    : accountsQuery.isLoading || (hasTfAccount && tfOrdersQuery.isLoading));
  const queryError = activeQuery.error ?? accountsQuery.error;
  const retry = () => {
    if (accountsQuery.isError || accountsQuery.isPaused) void accountsQuery.refetch();
    if (viewMode === 'system') void systemOrdersQuery.refetch();
    else if (hasTfAccount) void tfOrdersQuery.refetch();
  };

  return {
    accounts,
    turboflowAccounts,
    systemOrdersData: systemOrdersQuery.data,
    tfOrdersData: hasTfAccount ? tfOrdersQuery.data : undefined,
    allTrades,
    isLoading,
    isError,
    isPaused,
    queryError,
    retry,
  };
}
