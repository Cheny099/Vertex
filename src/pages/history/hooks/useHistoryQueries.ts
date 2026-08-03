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
      queryFn: () =>
        turboflowApi.getOrders({
          account_id: Number(selectedTfAccount),
          status: tfStatus === 'all' ? undefined : tfStatus,
          page_num: nextPage,
          page_size: tfPageSize,
        }),
    });
  }, [queryClient, viewMode, selectedTfAccount, tfOrdersQuery.data?.page_count, tfPage, tfPageSize, tfStatus]);

  // keepPreviousData is what makes paging feel smooth, but across a *different account* it
  // would hand back the previous account's fills with isLoading already false — rendering them
  // under the newly selected account's name. Paging within one account still reuses the
  // previous page; switching account falls back to the loading state.
  const tfPlaceholderIsOtherAccount =
    tfOrdersQuery.isPlaceholderData && tfOrdersQuery.data?.account_scope !== selectedTfAccount;

  const allTrades = useMemo<Order[]>(() => {
    if (viewMode === 'system') {
      return (systemOrdersQuery.data?.items || []) as Order[];
    }
    if (tfPlaceholderIsOtherAccount) return [];
    const list = tfOrdersQuery.data?.data || [];
    return list.map((item: TurboFlowOrderItem) => mapTurboFlowOrderToOrder(item, selectedTfAccount));
  }, [viewMode, systemOrdersQuery.data, tfOrdersQuery.data, selectedTfAccount, tfPlaceholderIsOtherAccount]);

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
    tfOrdersData: tfOrdersQuery.data,
    allTrades,
    isLoading,
    isError,
    queryError,
  };
}
