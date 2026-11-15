import { useEffect, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useToast } from '@/components/ui/use-toast';
import { adminApi, type StrategySwitchPreviewRequest } from '@/api';
import { singleSwitchFormSchema } from '../switch-forms';
import { useSwitchOperation } from './useSwitchOperation';

type UseStrategySwitchSingleFlowParams = {
  isPageVisible: boolean;
  t: TFunction;
  toErrorText: (err: unknown) => string;
};

export function useStrategySwitchSingleFlow({ isPageVisible, t, toErrorText }: UseStrategySwitchSingleFlowParams) {
  const { toast } = useToast();
  const onError = (error: unknown) => toast({ title: t('common:error'), description: toErrorText(error), variant: 'destructive' });
  const operation = useSwitchOperation({
    kind: 'single',
    initialForm: { account_id: 0, symbol: '', from_subscription_id: 0, to_subscription_id: 0, handover_mode: 'FLAT_THEN_SWITCH' } as StrategySwitchPreviewRequest,
    schema: singleSwitchFormSchema,
    reason: t('admin:strategy_switch.reason_manual_single'),
    preview: adminApi.strategySwitch.preview,
    execute: adminApi.strategySwitch.execute,
    invalidFormMessage: t('admin:strategy_switch_invalid_form'),
    storageErrorMessage: t('admin:strategy_switch_storage_failed'),
    onError,
    onSuccess: () => toast({ title: t('common:success'), description: t('admin:strategy_switch.success_msg') }),
  });
  const cancelRunMutation = useMutation({
    mutationFn: (id: number) => adminApi.strategySwitch.cancelRun(id),
    onSuccess: () => { toast({ title: t('common:success'), description: t('admin:cancel_success') }); },
    onError,
  });
  const runId = operation.result?.run_id;
  const { data: runStatus, refetch: refetchRunStatus } = useQuery({
    queryKey: ['strategy_switch_run', runId],
    queryFn: () => adminApi.strategySwitch.getRun(runId!),
    enabled: !!runId,
    refetchInterval: (query) => {
      if (!isPageVisible) return false;
      const status = String(query.state.data?.status || '').toUpperCase();
      return !status || status === 'PENDING' || status === 'RUNNING' ? 2000 : false;
    },
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (isPageVisible && runId) void refetchRunStatus();
  }, [isPageVisible, refetchRunStatus, runId]);
  const canStartNew = !!runStatus && ['SUCCESS', 'FAILED', 'CANCELLED'].includes(runStatus.status);

  return {
    form: operation.form,
    previewPlan: operation.previewData,
    runStatus,
    singlePreviewPending: operation.previewPending,
    executePending: operation.executePending,
    cancelPending: cancelRunMutation.isPending,
    isCancelableRun: runStatus?.status === 'PENDING' || runStatus?.status === 'RUNNING',
    canExecute: operation.canExecute,
    recovering: operation.hasSubmitted && !operation.result,
    canStartNew,
    onStartNew: () => { if (canStartNew) operation.startNew(); },
    onPreview: () => { void operation.preview(); },
    onCancelRun: () => { if (runStatus?.id) cancelRunMutation.mutate(runStatus.id); },
    onSubmit: (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void operation.execute(); },
    onAccountChange: (value: string) => operation.patchForm({ account_id: Number(value) }),
    onSymbolChange: (value: string) => operation.patchForm({ symbol: value.toUpperCase() }),
    onFromSubChange: (value: string) => operation.patchForm({ from_subscription_id: Number(value) }),
    onToSubChange: (value: string) => operation.patchForm({ to_subscription_id: Number(value) }),
    onHandoverModeChange: (handover_mode: StrategySwitchPreviewRequest['handover_mode']) => operation.patchForm({ handover_mode }),
  };
}
