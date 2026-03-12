import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ApiError } from '@/api/contracts';
import {
  subscriptionApi,
  type LegalDocKey,
  type Strategy,
  type Subscription,
  type SubscriptionCreateDto,
} from '@/api';
import type { StrategySubscriptionDraft } from './useStrategyDetailState';
import { clamp, normalizeLegalDocKey, parseApiError } from '../utils';

type UseStrategySubscriptionActionsParams = {
  strategyId: number;
  strategy: Strategy | undefined;
  fixedAmountMax: number;
  editingSub: Subscription | null;
  newSub: StrategySubscriptionDraft;
  setIsAddSubOpen: (open: boolean) => void;
  setEditingSub: (sub: Subscription | null) => void;
  setLegalError: (error: { docKey: LegalDocKey; version: string } | null) => void;
  setIsInviteModalOpen: (open: boolean) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export function useStrategySubscriptionActions({
  strategyId,
  strategy,
  fixedAmountMax,
  editingSub,
  newSub,
  setIsAddSubOpen,
  setEditingSub,
  setLegalError,
  setIsInviteModalOpen,
  t,
}: UseStrategySubscriptionActionsParams) {
  const queryClient = useQueryClient();

  const handleSubscriptionError = useCallback(
    (error: unknown) => {
      const { message, code, detail } = parseApiError(error);
      if (message.includes('LEGAL_ACCEPTANCE_REQUIRED') || code === 'LEGAL_ACCEPTANCE_REQUIRED') {
        setLegalError({
          docKey: normalizeLegalDocKey(detail.doc_key),
          version: typeof detail.required_version === 'string' ? detail.required_version : '1.0',
        });
        setIsAddSubOpen(false);
        return;
      }

      if (
        message.includes('SUBSCRIPTION_ACCESS_DENIED') ||
        code === 'SUBSCRIPTION_ACCESS_DENIED' ||
        message.includes('Invite required')
      ) {
        setIsAddSubOpen(false);
        setIsInviteModalOpen(true);
        return;
      }

      toast.error(message || t('strategies:detail.toast_error'));
    },
    [setIsAddSubOpen, setIsInviteModalOpen, setLegalError, t]
  );

  const addSubMutation = useMutation({
    mutationFn: async (data: StrategySubscriptionDraft) => {
      if (!strategy) throw new Error('Strategy not loaded');
      const leverage = data.leverage > 0 ? data.leverage : undefined;

      if (data.positionMode === 'fixed_amount') {
        const amount = clamp(Number(data.positionValue || 1), 1, fixedAmountMax);
        return subscriptionApi.create({
          strategy_id: strategyId,
          strategy_key: strategy.strategy_key,
          account_id: Number(data.accountId),
          position_mode: 'fixed_amount',
          position_value: amount,
          position_pct: undefined,
          leverage,
        });
      }

      const pct = clamp(Number(data.positionPct || 0.1), 0.02, 1.0);
      return subscriptionApi.create({
        strategy_id: strategyId,
        strategy_key: strategy.strategy_key,
        account_id: Number(data.accountId),
        position_mode: 'fixed',
        position_value: pct,
        position_pct: pct,
        leverage,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setIsAddSubOpen(false);
      toast.success(t('strategies:detail.toast_sub_success'));
    },
    onError: handleSubscriptionError,
  });

  const updateSubMutation = useMutation({
    mutationFn: async (data: StrategySubscriptionDraft) => {
      if (!editingSub) throw new Error('No subscription selected');
      const leverage = data.leverage > 0 ? data.leverage : undefined;
      const payload: Partial<SubscriptionCreateDto> = {
        position_mode: data.positionMode,
        position_value:
          data.positionMode === 'fixed_amount'
            ? clamp(Number(data.positionValue || 1), 1, fixedAmountMax)
            : undefined,
        position_pct:
          data.positionMode === 'fixed'
            ? clamp(Number(data.positionPct || 0.1), 0.02, 1.0)
            : undefined,
        leverage,
      };
      return subscriptionApi.update(editingSub.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setIsAddSubOpen(false);
      setEditingSub(null);
      toast.success(t('strategies:detail.toast_sub_updated'));
    },
    onError: handleSubscriptionError,
  });

  const removeSubMutation = useMutation({
    mutationFn: (subId: number) => subscriptionApi.delete(subId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success(t('strategies:detail.toast_sub_removed'));
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast.error(apiError?.message || t('strategies:detail.toast_error'));
    },
  });

  const handleLegalAccepted = useCallback(() => {
    setLegalError(null);
    toast.success(
      t('strategies:detail.toast_auth_success', { defaultValue: 'Re-authenticating via credentials' })
    );

    if (editingSub) {
      updateSubMutation.mutate(newSub);
      return;
    }
    addSubMutation.mutate(newSub);
  }, [addSubMutation, editingSub, newSub, setLegalError, t, updateSubMutation]);

  const handleRemoveSub = useCallback(
    (subId: number) => removeSubMutation.mutate(subId),
    [removeSubMutation]
  );

  const handleSubmitSub = useCallback(() => {
    if (editingSub) {
      updateSubMutation.mutate(newSub);
      return;
    }
    addSubMutation.mutate(newSub);
  }, [addSubMutation, editingSub, newSub, updateSubMutation]);

  return {
    addSubMutation,
    updateSubMutation,
    handleLegalAccepted,
    handleRemoveSub,
    handleSubmitSub,
  };
}
