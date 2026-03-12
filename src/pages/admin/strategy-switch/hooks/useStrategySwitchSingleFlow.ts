import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useToast } from '@/components/ui/use-toast';
import {
  adminApi,
  type StrategySwitchPreviewRequest,
  type StrategySwitchRequest,
} from '@/api';

type UseStrategySwitchSingleFlowParams = {
  isPageVisible: boolean;
  t: TFunction;
  toErrorText: (err: unknown) => string;
};

export function useStrategySwitchSingleFlow({
  isPageVisible,
  t,
  toErrorText,
}: UseStrategySwitchSingleFlowParams) {
  const { toast } = useToast();
  const [singleForm, setSingleForm] = useState<StrategySwitchPreviewRequest>({
    account_id: 0,
    symbol: '',
    from_subscription_id: 0,
    to_subscription_id: 0,
    handover_mode: 'FLAT_THEN_SWITCH',
  });

  const patchSingleForm = useCallback((patch: Partial<StrategySwitchPreviewRequest>) => {
    setSingleForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const singlePreviewMutation = useMutation({
    mutationFn: (data: StrategySwitchPreviewRequest) => adminApi.strategySwitch.preview(data),
    onError: (err: Error) => {
      toast({ title: t('common:error'), description: toErrorText(err), variant: 'destructive' });
    },
  });

  const executeMutation = useMutation({
    mutationFn: (data: StrategySwitchRequest) => adminApi.strategySwitch.execute(data),
    onSuccess: () => {
      toast({ title: t('common:success'), description: t('admin:strategy_switch.success_msg') });
    },
    onError: (err: Error) => {
      toast({ title: t('common:error'), description: toErrorText(err), variant: 'destructive' });
    },
  });

  const cancelRunMutation = useMutation({
    mutationFn: (id: number) => adminApi.strategySwitch.cancelRun(id),
    onSuccess: () => {
      toast({ title: t('common:success'), description: t('admin:cancel_success') });
    },
    onError: (err: Error) => {
      toast({ title: t('common:error'), description: toErrorText(err), variant: 'destructive' });
    },
  });

  const runId = executeMutation.data?.run_id;
  const { data: runStatus, refetch: refetchRunStatus } = useQuery({
    queryKey: ['strategy_switch_run', runId],
    queryFn: () => adminApi.strategySwitch.getRun(runId!),
    enabled: !!runId,
    refetchInterval: (query) => {
      if (!isPageVisible) return false;
      const current = query.state.data as { status?: string } | undefined;
      const status = String(current?.status || '').toUpperCase();
      return !status || status === 'PENDING' || status === 'RUNNING' ? 2000 : false;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isPageVisible || !runId) return;
    void refetchRunStatus();
  }, [isPageVisible, refetchRunStatus, runId]);

  const isCancelableRun = runStatus?.status === 'PENDING' || runStatus?.status === 'RUNNING';

  const validateSingleForm = useCallback((): boolean => {
    if (!singleForm.account_id || singleForm.account_id <= 0) {
      toast({
        title: t('common:error'),
        description: `${t('admin:strategy_switch.account_id')} ${t('common:required')}`,
        variant: 'destructive',
      });
      return false;
    }
    if (!singleForm.symbol || singleForm.symbol.length < 2) {
      toast({
        title: t('common:error'),
        description: `${t('admin:strategy_switch.symbol')} ${t('common:required')}`,
        variant: 'destructive',
      });
      return false;
    }
    if (!singleForm.from_subscription_id || singleForm.from_subscription_id <= 0) {
      toast({
        title: t('common:error'),
        description: `${t('admin:strategy_switch.from_sub_id')} ${t('common:required')}`,
        variant: 'destructive',
      });
      return false;
    }
    if (!singleForm.to_subscription_id || singleForm.to_subscription_id <= 0) {
      toast({
        title: t('common:error'),
        description: `${t('admin:strategy_switch.to_sub_id')} ${t('common:required')}`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  }, [singleForm, t, toast]);

  const handlePreview = useCallback(() => {
    if (!validateSingleForm()) return;
    singlePreviewMutation.mutate(singleForm);
  }, [singleForm, singlePreviewMutation, validateSingleForm]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!validateSingleForm()) return;

      executeMutation.mutate({
        ...singleForm,
        request_id: crypto.randomUUID(),
        reason: t('admin:strategy_switch.reason_manual_single'),
      });
    },
    [executeMutation, singleForm, t, validateSingleForm]
  );

  const handleAccountChange = useCallback(
    (value: string) => {
      patchSingleForm({ account_id: Number(value) });
    },
    [patchSingleForm]
  );

  const handleSymbolChange = useCallback(
    (value: string) => {
      patchSingleForm({ symbol: value.toUpperCase() });
    },
    [patchSingleForm]
  );

  const handleFromSubChange = useCallback(
    (value: string) => {
      patchSingleForm({ from_subscription_id: Number(value) });
    },
    [patchSingleForm]
  );

  const handleToSubChange = useCallback(
    (value: string) => {
      patchSingleForm({ to_subscription_id: Number(value) });
    },
    [patchSingleForm]
  );

  const handleHandoverModeChange = useCallback(
    (mode: 'FLAT_THEN_SWITCH' | 'KEEP_POSITION_ADOPT') => {
      patchSingleForm({ handover_mode: mode });
    },
    [patchSingleForm]
  );

  const handleCancelRun = useCallback(() => {
    if (!runStatus?.id) return;
    cancelRunMutation.mutate(runStatus.id);
  }, [cancelRunMutation, runStatus?.id]);

  return useMemo(
    () => ({
      form: singleForm,
      previewPlan: singlePreviewMutation.data,
      runStatus,
      singlePreviewPending: singlePreviewMutation.isPending,
      executePending: executeMutation.isPending,
      cancelPending: cancelRunMutation.isPending,
      isCancelableRun,
      onPreview: handlePreview,
      onCancelRun: handleCancelRun,
      onSubmit: handleSubmit,
      onAccountChange: handleAccountChange,
      onSymbolChange: handleSymbolChange,
      onFromSubChange: handleFromSubChange,
      onToSubChange: handleToSubChange,
      onHandoverModeChange: handleHandoverModeChange,
    }),
    [
      cancelRunMutation.isPending,
      executeMutation.isPending,
      handleAccountChange,
      handleCancelRun,
      handleFromSubChange,
      handleHandoverModeChange,
      handlePreview,
      handleSubmit,
      handleSymbolChange,
      handleToSubChange,
      isCancelableRun,
      runStatus,
      singleForm,
      singlePreviewMutation.data,
      singlePreviewMutation.isPending,
    ]
  );
}
