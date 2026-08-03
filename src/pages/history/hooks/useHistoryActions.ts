import { useCallback } from 'react';
import { useMutation, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { orderApi, type Order } from '@/api';

type UseHistoryActionsParams = {
  queryClient: QueryClient;
  setDebugOrder: (order: Order | null) => void;
  getToastErrorMessage: (error: unknown) => string;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export function useHistoryActions({
  queryClient,
  setDebugOrder,
  getToastErrorMessage,
  t,
}: UseHistoryActionsParams) {
  const cancelMutation = useMutation({
    mutationFn: orderApi.cancel,
    onSuccess: () => {
      toast.success(t('history:actions.cancel_success'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: unknown) => toast.error(getToastErrorMessage(error)),
  });

  const retryMutation = useMutation({
    mutationFn: orderApi.retry,
    onSuccess: () => {
      toast.success(t('history:actions.retry_success'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: unknown) => toast.error(getToastErrorMessage(error)),
  });

  const debugMutation = useMutation({
    mutationFn: orderApi.debug,
    onSuccess: (data) => setDebugOrder(data),
    onError: (error: unknown) => toast.error(getToastErrorMessage(error)),
  });

  const handleRetry = useCallback(
    (trade: Order) => {
      retryMutation.mutate(trade.id as number);
    },
    [retryMutation]
  );

  const handleCancel = useCallback(
    (trade: Order) => {
      cancelMutation.mutate(trade.id as number);
    },
    [cancelMutation]
  );

  const handleDebug = useCallback(
    (trade: Order) => {
      debugMutation.mutate(trade.id as number);
    },
    [debugMutation]
  );

  return {
    cancelMutation,
    retryMutation,
    debugMutation,
    handleRetry,
    handleCancel,
    handleDebug,
  };
}
