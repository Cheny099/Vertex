import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useToast } from '@/components/ui/use-toast';
import {
  adminApi,
  type StrategySwitchBulkExecuteRequest,
  type StrategySwitchBulkPreviewRequest,
} from '@/api';

type BulkForm = {
  from_strategy_id: number;
  to_strategy_id: number;
  symbol: string;
};

type UseStrategySwitchBulkFlowParams = {
  isPageVisible: boolean;
  t: TFunction;
  toErrorText: (err: unknown) => string;
};

export function useStrategySwitchBulkFlow({
  isPageVisible,
  t,
  toErrorText,
}: UseStrategySwitchBulkFlowParams) {
  const { toast } = useToast();
  const [bulkForm, setBulkForm] = useState<BulkForm>({
    from_strategy_id: 0,
    to_strategy_id: 0,
    symbol: '',
  });

  const patchBulkForm = useCallback((patch: Partial<BulkForm>) => {
    setBulkForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const bulkPreviewMutation = useMutation({
    mutationFn: (data: StrategySwitchBulkPreviewRequest) => adminApi.strategySwitch.bulkPreview(data),
    onError: (err: Error) => {
      toast({ title: t('common:error'), description: toErrorText(err), variant: 'destructive' });
    },
  });

  const bulkExecuteMutation = useMutation({
    mutationFn: (data: StrategySwitchBulkExecuteRequest) => adminApi.strategySwitch.bulkExecute(data),
    onSuccess: (data) => {
      toast({
        title: t('common:success'),
        description: data.idempotent_reused
          ? t('admin:strategy_switch.bulk_idempotent_msg')
          : t('admin:strategy_switch.bulk_success_msg'),
      });
    },
    onError: (err: Error) => {
      toast({ title: t('common:error'), description: toErrorText(err), variant: 'destructive' });
    },
  });

  const campaignId = bulkExecuteMutation.data?.campaign_id;
  const { data: campaignStatus, refetch: refetchCampaignStatus } = useQuery({
    queryKey: ['bulk_switch_campaign', campaignId],
    queryFn: () => adminApi.strategySwitch.getCampaign(campaignId!),
    enabled: !!campaignId,
    refetchInterval: (query) => {
      if (!isPageVisible) return false;
      const current = query.state.data as { status?: string } | undefined;
      const status = String(current?.status || '').toUpperCase();
      return !status || status === 'PENDING' || status === 'RUNNING' ? 3000 : false;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isPageVisible || !campaignId) return;
    void refetchCampaignStatus();
  }, [campaignId, isPageVisible, refetchCampaignStatus]);

  const validateBulkForm = useCallback(() => {
    if (!bulkForm.from_strategy_id || bulkForm.from_strategy_id <= 0) {
      toast({
        title: t('common:error'),
        description: `${t('admin:strategy_switch.from_strategy_id')} ${t('common:required')}`,
        variant: 'destructive',
      });
      return false;
    }
    if (!bulkForm.to_strategy_id || bulkForm.to_strategy_id <= 0) {
      toast({
        title: t('common:error'),
        description: `${t('admin:strategy_switch.to_strategy_id')} ${t('common:required')}`,
        variant: 'destructive',
      });
      return false;
    }
    if (!bulkForm.symbol || bulkForm.symbol.length < 2) {
      toast({
        title: t('common:error'),
        description: `${t('admin:strategy_switch.symbol')} ${t('common:required')}`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  }, [bulkForm, t, toast]);

  const handlePreview = useCallback(() => {
    if (!validateBulkForm()) return;
    bulkPreviewMutation.mutate({
      ...bulkForm,
      handover_mode: 'FLAT_THEN_SWITCH',
      reason: t('admin:strategy_switch.reason_manual_bulk'),
    });
  }, [bulkForm, bulkPreviewMutation, t, validateBulkForm]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!validateBulkForm()) return;

      bulkExecuteMutation.mutate({
        ...bulkForm,
        request_id: crypto.randomUUID(),
        handover_mode: 'FLAT_THEN_SWITCH',
        reason: t('admin:strategy_switch.reason_manual_bulk'),
      });
    },
    [bulkExecuteMutation, bulkForm, t, validateBulkForm]
  );

  const handleFromStrategyChange = useCallback(
    (value: string) => {
      patchBulkForm({ from_strategy_id: Number(value) });
    },
    [patchBulkForm]
  );

  const handleToStrategyChange = useCallback(
    (value: string) => {
      patchBulkForm({ to_strategy_id: Number(value) });
    },
    [patchBulkForm]
  );

  const handleSymbolChange = useCallback(
    (value: string) => {
      patchBulkForm({ symbol: value.toUpperCase() });
    },
    [patchBulkForm]
  );

  const bulkPreviewStats = useMemo(() => {
    if (!bulkPreviewMutation.data) return [];
    return [
      {
        label: t('admin:strategy_switch.total_candidates', 'Total Candidates'),
        value: bulkPreviewMutation.data.total_candidates,
      },
      {
        label: t('admin:strategy_switch.will_create_runs', 'New Runs'),
        value: bulkPreviewMutation.data.will_create_runs,
      },
      {
        label: t('admin:strategy_switch.will_reuse_runs', 'Reused Runs'),
        value: bulkPreviewMutation.data.will_reuse_runs,
      },
      {
        label: t('admin:strategy_switch.will_create_subs', 'New Subs'),
        value: bulkPreviewMutation.data.will_create_to_sub,
      },
      {
        label: t('admin:strategy_switch.will_update_params', 'Update Subs'),
        value: bulkPreviewMutation.data.will_update_to_sub_params,
      },
    ];
  }, [bulkPreviewMutation.data, t]);

  return useMemo(
    () => ({
      form: bulkForm,
      campaignStatus,
      bulkPreviewData: bulkPreviewMutation.data,
      bulkPreviewStats,
      bulkPreviewPending: bulkPreviewMutation.isPending,
      bulkExecutePending: bulkExecuteMutation.isPending,
      onPreview: handlePreview,
      onSubmit: handleSubmit,
      onFromStrategyChange: handleFromStrategyChange,
      onToStrategyChange: handleToStrategyChange,
      onSymbolChange: handleSymbolChange,
    }),
    [
      bulkExecuteMutation.isPending,
      bulkForm,
      bulkPreviewMutation.data,
      bulkPreviewMutation.isPending,
      bulkPreviewStats,
      campaignStatus,
      handleFromStrategyChange,
      handlePreview,
      handleSubmit,
      handleSymbolChange,
      handleToStrategyChange,
    ]
  );
}
