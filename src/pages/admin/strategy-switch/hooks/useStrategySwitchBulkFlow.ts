import { useEffect, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/api';
import { bulkSwitchFormSchema } from '../switch-forms';
import { useSwitchOperation } from './useSwitchOperation';

type UseStrategySwitchBulkFlowParams = {
  isPageVisible: boolean;
  t: TFunction;
  toErrorText: (err: unknown) => string;
};

export function useStrategySwitchBulkFlow({ isPageVisible, t, toErrorText }: UseStrategySwitchBulkFlowParams) {
  const { toast } = useToast();
  const operation = useSwitchOperation({
    kind: 'bulk',
    initialForm: { from_strategy_id: 0, to_strategy_id: 0, symbol: '', handover_mode: 'FLAT_THEN_SWITCH' as const },
    schema: bulkSwitchFormSchema,
    reason: t('admin:strategy_switch.reason_manual_bulk'),
    preview: form => adminApi.strategySwitch.bulkPreview({ ...form, reason: t('admin:strategy_switch.reason_manual_bulk') }),
    execute: adminApi.strategySwitch.bulkExecute,
    invalidFormMessage: t('admin:strategy_switch_invalid_form'),
    storageErrorMessage: t('admin:strategy_switch_storage_failed'),
    onError: (error: unknown) => toast({ title: t('common:error'), description: toErrorText(error), variant: 'destructive' }),
    onSuccess: data => toast({ title: t('common:success'), description: data.idempotent_reused
      ? t('admin:strategy_switch.bulk_idempotent_msg') : t('admin:strategy_switch.bulk_success_msg') }),
  });
  const campaignId = operation.result?.campaign_id;
  const { data: campaignStatus, refetch: refetchCampaignStatus } = useQuery({
    queryKey: ['bulk_switch_campaign', campaignId],
    queryFn: () => adminApi.strategySwitch.getCampaign(campaignId!),
    enabled: !!campaignId,
    refetchInterval: (query) => {
      if (!isPageVisible) return false;
      const status = String(query.state.data?.status || '').toUpperCase();
      return !status || status === 'PENDING' || status === 'RUNNING' ? 3000 : false;
    },
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (isPageVisible && campaignId) void refetchCampaignStatus();
  }, [campaignId, isPageVisible, refetchCampaignStatus]);
  const preview = operation.previewData;
  const bulkPreviewStats = preview ? [
    { label: t('admin:strategy_switch.total_candidates'), value: preview.total_candidates },
    { label: t('admin:strategy_switch.will_create_runs'), value: preview.will_create_runs },
    { label: t('admin:strategy_switch.will_reuse_runs'), value: preview.will_reuse_runs },
    { label: t('admin:strategy_switch.will_create_subs'), value: preview.will_create_to_sub },
    { label: t('admin:strategy_switch.will_update_params'), value: preview.will_update_to_sub_params },
  ] : [];
  const canStartNew = !!campaignStatus && ['SUCCESS', 'FAILED', 'CANCELLED'].includes(campaignStatus.status);

  return {
    form: operation.form,
    campaignStatus,
    bulkPreviewData: preview,
    bulkPreviewStats,
    bulkPreviewPending: operation.previewPending,
    bulkExecutePending: operation.executePending,
    canExecute: operation.canExecute,
    recovering: operation.hasSubmitted && !operation.result,
    canStartNew,
    onStartNew: () => { if (canStartNew) operation.startNew(); },
    onPreview: () => { void operation.preview(); },
    onSubmit: (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void operation.execute(); },
    onFromStrategyChange: (value: string) => operation.patchForm({ from_strategy_id: Number(value) }),
    onToStrategyChange: (value: string) => operation.patchForm({ to_strategy_id: Number(value) }),
    onSymbolChange: (value: string) => operation.patchForm({ symbol: value.toUpperCase() }),
  };
}
