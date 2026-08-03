import { useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  adminApi,
  Order,
  Subscription,
  translateBackendErrorMessage,
} from '@/api';
import type { ApiError } from '@/api/contracts';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { usePageVisibility } from '@/hooks/use-page-visibility';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ActiveOrderRow } from '../components/ActiveOrderRow';
import {
  type BatchRequeueParams,
  type CloseParams,
  useOpsConsoleState,
} from './useOpsConsoleState';

type BatchRequeueResult = {
  dry_run: boolean;
  matched: number;
  selected_order_ids: number[];
  requeued: number;
};

export function useOpsConsoleModel() {
  const { t } = useTranslation(['admin', 'common']);
  const isPageVisible = usePageVisibility();
  const state = useOpsConsoleState();

  const debouncedSymbolFilter = useDebouncedValue(state.symbolFilter, 300);
  const debouncedAccountIdFilter = useDebouncedValue(state.accountIdFilter, 300);

  const {
    data: ordersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['adminOrders', state.page, state.statusFilter, debouncedSymbolFilter, debouncedAccountIdFilter],
    queryFn: () =>
      adminApi.ops.listOrders({
        page: state.page,
        limit: 10,
        status: state.statusFilter === 'all' ? undefined : state.statusFilter,
        symbol: debouncedSymbolFilter || undefined,
        account_id: debouncedAccountIdFilter ? parseInt(debouncedAccountIdFilter) : undefined,
      }),
    refetchInterval: state.isAutoRefresh && isPageVisible ? 5000 : false,
    refetchOnWindowFocus: false,
  });

  const totalPages = useMemo(() => Math.ceil((ordersData?.total || 0) / 10), [ordersData?.total]);

  useEffect(() => {
    if (state.isAutoRefresh && isPageVisible) {
      void refetch();
    }
  }, [isPageVisible, refetch, state.isAutoRefresh]);

  const { data: orderEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['adminOrderEvents', state.selectedOrder?.id],
    queryFn: () => (state.selectedOrder ? adminApi.ops.getOrderEvents(state.selectedOrder.id) : null),
    enabled: !!state.selectedOrder,
  });

  const getErrorMessage = useCallback(
    (err: unknown) => {
      const apiError = err as ApiError;
      const detailText =
        typeof apiError?.detail === 'string'
          ? apiError.detail
          : apiError?.detail && typeof apiError.detail === 'object' && 'message' in apiError.detail
            ? String((apiError.detail as { message?: unknown }).message ?? '')
            : '';
      const raw = String(apiError?.message || detailText || '').trim();
      if (!raw) return t('admin:error_operation_failed');
      const translated = translateBackendErrorMessage(raw);
      return translated || raw;
    },
    [t]
  );

  const cancelOrderMutation = useMutation({
    mutationFn: (id: number) => adminApi.ops.cancelOrder(id),
    onSuccess: () => {
      toast.success(t('admin:cancel_success'));
      refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const closePositionMutation = useMutation({
    mutationFn: (data: CloseParams) =>
      adminApi.ops.closePosition({
        account_id: parseInt(data.account_id),
        symbol: data.symbol,
        pos_side: data.pos_side,
        qty: parseFloat(data.qty),
        reason: data.reason,
      }),
    onSuccess: () => {
      state.setCloseDialogOpen(false);
      toast.success(t('admin:close_success'));
      refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const requeueOrderMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      adminApi.ops.requeueOrder(id, reason || 'Admin Manual Requeue'),
    onSuccess: () => {
      toast.success(t('admin:order_requeue_success'));
      refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const batchRequeueMutation = useMutation({
    // An empty limit field means "unspecified", not zero: drop the key and let the backend
    // apply its own default rather than sending null.
    mutationFn: ({ limit, ...data }: BatchRequeueParams) =>
      adminApi.ops.batchRequeue({ ...data, limit: limit ?? undefined }),
    onSuccess: (res: BatchRequeueResult) => {
      if (res.dry_run) {
        toast.info(t('admin:batch_requeue_matched', { matched: res.matched }));
      } else {
        toast.success(t('admin:batch_requeue_success'));
        refetch();
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const freezeSubMutation = useMutation({
    mutationFn: (data: { id: number; frozen: boolean; reason?: string }) =>
      adminApi.subscriptions.freeze(data.id, data.frozen, data.reason),
    onSuccess: (sub: Subscription) => {
      toast.success(
        sub.is_frozen ? t('admin:subscription_frozen_success') : t('admin:subscription_unfrozen_success')
      );
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleRequeueClick = useCallback(
    (orderId: number) => {
      state.setActionConfirm({
        open: true,
        title: t('admin:confirm', 'Confirm'),
        desc: t('admin:requeue_confirm'),
        onConfirm: () => requeueOrderMutation.mutate({ id: orderId }),
      });
    },
    [requeueOrderMutation, state, t]
  );

  const handleCancelClick = useCallback(
    (orderId: number) => {
      state.setActionConfirm({
        open: true,
        title: t('admin:confirm', 'Confirm'),
        desc: t('admin:confirm_cancel'),
        onConfirm: () => cancelOrderMutation.mutate(orderId),
      });
    },
    [cancelOrderMutation, state, t]
  );

  const handleViewOrder = useCallback(
    (order: Order) => {
      state.setSelectedOrder(order);
    },
    [state]
  );

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleClosePositionConfirm = useCallback(() => {
    // A double click can land before the disabled state re-renders, and closePosition sends a
    // market order with no idempotency key - a second one would flip the position, not close it.
    if (closePositionMutation.isPending) return;
    closePositionMutation.mutate(state.closeParams);
  }, [closePositionMutation, state.closeParams]);

  const handleBatchDryRun = useCallback(() => {
    batchRequeueMutation.mutate({ ...state.batchParams, dry_run: true });
  }, [batchRequeueMutation, state.batchParams]);

  const handleBatchExecuteRequest = useCallback(() => {
    state.setActionConfirm({
      open: true,
      title: t('admin:confirm', 'Confirm'),
      desc: t('admin:confirm'),
      onConfirm: () => batchRequeueMutation.mutate({ ...state.batchParams, dry_run: false }),
    });
  }, [batchRequeueMutation, state, t]);

  const handlePrevPage = useCallback(() => {
    state.setPage((p) => Math.max(1, p - 1));
  }, [state]);

  const handleNextPage = useCallback(() => {
    state.setPage((p) => Math.min(totalPages, p + 1));
  }, [state, totalPages]);

  const handleOrderDetailClose = useCallback(() => {
    state.setSelectedOrder(null);
  }, [state]);

  const handleActionConfirmOpenChange = useCallback(
    (open: boolean) => {
      state.setActionConfirm((prev) => ({ ...prev, open }));
    },
    [state]
  );

  const handleActionConfirmConfirm = useCallback(() => {
    state.actionConfirm.onConfirm();
    state.setActionConfirm((prev) => ({ ...prev, open: false }));
  }, [state]);

  const orderTableBody = useMemo(() => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
            {t('admin:loading')}
          </TableCell>
        </TableRow>
      );
    }
    if (isError) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center text-destructive">
            {getErrorMessage(error)}
          </TableCell>
        </TableRow>
      );
    }

    const items = ordersData?.items || [];
    if (items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
            {t('admin:no_data')}
          </TableCell>
        </TableRow>
      );
    }

    return items.map((order: Order) => (
      <ActiveOrderRow
        key={order.id}
        t={t}
        order={order}
        isRequeuePending={
          requeueOrderMutation.isPending && requeueOrderMutation.variables?.id === order.id
        }
        isCancelPending={cancelOrderMutation.isPending}
        onRequeue={handleRequeueClick}
        onCancel={handleCancelClick}
        onView={handleViewOrder}
      />
    ));
  }, [
    cancelOrderMutation.isPending,
    error,
    getErrorMessage,
    handleCancelClick,
    handleRequeueClick,
    handleViewOrder,
    isError,
    isLoading,
    ordersData?.items,
    requeueOrderMutation.isPending,
    requeueOrderMutation.variables,
    t,
  ]);

  return {
    t,
    state,
    ordersData,
    totalPages,
    isLoading,
    orderEvents,
    isLoadingEvents,
    closePositionPending: closePositionMutation.isPending,
    batchRequeuePending: batchRequeueMutation.isPending,
    freezeSubPending: freezeSubMutation.isPending,
    orderTableBody,
    handleRefresh,
    handleClosePositionConfirm,
    handleBatchDryRun,
    handleBatchExecuteRequest,
    handlePrevPage,
    handleNextPage,
    handleOrderDetailClose,
    handleActionConfirmOpenChange,
    handleActionConfirmConfirm,
    handleFreezeSub: (id: number, reason?: string) =>
      freezeSubMutation.mutate({ id, frozen: true, reason }),
    handleUnfreezeSub: (id: number, reason?: string) =>
      freezeSubMutation.mutate({ id, frozen: false, reason }),
  };
}
