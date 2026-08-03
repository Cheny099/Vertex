import { useEffect, useMemo } from 'react';
import { keepPreviousData, useQuery, type QueryClient } from '@tanstack/react-query';
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
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountApi.list,
  });

  const turboflowAccounts = useMemo(
    () => accounts.filter((acc) => acc.exchange === 'turboflow'),
    [accounts]
  );

  useEffect(() => {
    if (viewMode !== 'turboflow') return;
    if (turboflowAccounts.length === 0) {
      if (selectedTfAccount !== '') setSelectedTfAccount('');
      return;
    }
    const exists = turboflowAccounts.some((acc) => acc.id.toString() === selectedTfAccount);
    if (!selectedTfAccount || !exists) {
      setSelectedTfAccount(turboflowAccounts[0].id.toString());
      setTfPage(1);
    }
  }, [viewMode, turboflowAccounts, selectedTfAccount, setSelectedTfAccount, setTfPage]);

  const systemOrdersQuery = useQuery({
    queryKey: ['orders', 'history', selectedSystemAccount, systemPage, systemPageSize],
    queryFn: () =>
      orderApi.getHistory({
        include_pnl: true,
        page_num: systemPage,
        page_size: systemPageSize,
        account_id: selectedSystemAccount === 'all' ? undefined : Number(selectedSystemAccount),
      }),
    placeholderData: keepPreviousData,
    enabled: viewMode === 'system',
  });

  const tfOrdersQuery = useQuery({
    queryKey: ['turboflow-orders', selectedTfAccount, tfStatus, tfPage, tfPageSize],
    queryFn: async () => {
      if (!selectedTfAccount) {
        return {
          data: [],
          count: 0,
          page_count: 0,
          page_num: tfPage,
          page_size: tfPageSize,
          account_scope: selectedTfAccount,
        };
      }
      const res = await turboflowApi.getOrders({
        account_id: Number(selectedTfAccount),
        status: tfStatus === 'all' ? undefined : tfStatus,
        page_num: tfPage,
        page_size: tfPageSize,
      });
      // Tag the payload with the account it was fetched for, so a kept-previous result from
      // another account can be told apart from a genuine one.
      return { ...res, account_scope: selectedTfAccount };
    },
    placeholderData: keepPreviousData,
    enabled: viewMode === 'turboflow' && !!selectedTfAccount,
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
    if (!selectedTfAccount) return;
    const pageCount = tfOrdersQuery.data?.page_count ?? 0;
    if (pageCount === 0 || tfPage >= pageCount) return;

    const nextPage = tfPage + 1;
    queryClient.prefetchQuery({
      queryKey: ['turboflow-orders', selectedTfAccount, tfStatus, nextPage, tfPageSize],
      // Must carry account_scope like the main query does, or this prefetched entry is later
      // mistaken for another account's data when it is reused as placeholder data.
      queryFn: async () => {
        const res = await turboflowApi.getOrders({
          account_id: Number(selectedTfAccount),
          status: tfStatus === 'all' ? undefined : tfStatus,
          page_num: nextPage,
          page_size: tfPageSize,
        });
        return { ...res, account_scope: selectedTfAccount };
      },
    });
  }, [queryClient, viewMode, selectedTfAccount, tfOrdersQuery.data?.page_count, tfPage, tfPageSize, tfStatus]);

  // keepPreviousData is what makes paging feel smooth, but query-core applies it to a disabled,
  // never-fetched key too - so when the last TurboFlow account disappears and selectedTfAccount
  // becomes '', the removed account's rows would otherwise stay on screen indefinitely.
  // Data is therefore discarded whenever the placeholder belongs to a different account, while
  // "loading" is only claimed when a fetch can actually resolve it; otherwise the table would spin
  // forever on a key that will never be requested.
  const tfScopeMismatch =
    tfOrdersQuery.isPlaceholderData &&
    tfOrdersQuery.data?.account_scope !== selectedTfAccount;
  const tfPlaceholderIsOtherAccount = tfScopeMismatch && !!selectedTfAccount;

  const allTrades = useMemo<Order[]>(() => {
    if (viewMode === 'system') {
      return systemOrdersQuery.data?.items || [];
    }
    if (tfScopeMismatch) return [];
    const list = tfOrdersQuery.data?.data || [];
    return list.map((item: TurboFlowOrderItem) => mapTurboFlowOrderToOrder(item, selectedTfAccount));
  }, [viewMode, systemOrdersQuery.data, tfOrdersQuery.data, selectedTfAccount, tfScopeMismatch]);

  const isLoading =
    viewMode === 'system'
      ? systemOrdersQuery.isLoading
      : tfOrdersQuery.isLoading || tfPlaceholderIsOtherAccount;
  const isError = viewMode === 'system' ? systemOrdersQuery.isError : tfOrdersQuery.isError;
  const queryError = viewMode === 'system' ? systemOrdersQuery.error : tfOrdersQuery.error;

  return {
    accounts,
    turboflowAccounts,
    systemOrdersData: systemOrdersQuery.data,
    tfOrdersData: tfScopeMismatch ? undefined : tfOrdersQuery.data,
    allTrades,
    isLoading,
    isError,
    queryError,
  };
}
