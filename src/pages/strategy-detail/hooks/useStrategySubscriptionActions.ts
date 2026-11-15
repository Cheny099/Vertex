import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { subscriptionApi, type LegalDocKey, type Strategy, type Subscription, type SubscriptionCreateDto } from '@/api';
import { useAsyncScope, type IsCurrent } from '@/hooks/use-async-scope';
import type { StrategySubscriptionDraft } from './useStrategyDetailState';
import { isValidSubscriptionDraft, normalizeLegalDocKey, parseApiError } from '../utils';

type Operation =
  | { kind: 'create'; payload: SubscriptionCreateDto }
  | { kind: 'update'; id: number; payload: Partial<SubscriptionCreateDto> };

type UseStrategySubscriptionActionsParams = {
  strategyId: number;
  strategy: Strategy | undefined;
  fixedAmountMax: number | null;
  editingSub: Subscription | null;
  newSub: StrategySubscriptionDraft;
  editorId: number;
  setIsAddSubOpen: (open: boolean) => void;
  setEditingSub: (sub: Subscription | null) => void;
  setLegalError: (error: { docKey: LegalDocKey; version: string } | null) => void;
  setIsInviteModalOpen: (open: boolean) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export function useStrategySubscriptionActions({
  strategyId, strategy, fixedAmountMax, editingSub, newSub, editorId,
  setIsAddSubOpen, setEditingSub, setLegalError, setIsInviteModalOpen, t,
}: UseStrategySubscriptionActionsParams) {
  const queryClient = useQueryClient();
  const editorKey = `${strategyId}:${editingSub?.id ?? 'new'}:${editorId}`;
  const { capture: capturePage } = useAsyncScope(strategyId);
  const { capture: captureEditor } = useAsyncScope(editorKey);
  const pending = useRef<IsCurrent | null>(null);
  const [submission, setSubmission] = useState<{ key: string; isCurrent: IsCurrent } | null>(null);
  const pendingLegal = useRef<{ operation: Operation; isCurrent: IsCurrent } | null>(null);
  const removing = useRef(new Set<number>());

  const perform = async (operation: Operation) => {
    if (pending.current?.()) return;
    const isCurrent = captureEditor();
    const isPageCurrent = capturePage();
    pending.current = isCurrent;
    setSubmission({ key: editorKey, isCurrent });
    try {
      // Resolve the target and payload before any await. An earlier click must never read
      // the current editor to decide which subscription to modify.
      if (operation.kind === 'create') await subscriptionApi.create(operation.payload);
      else await subscriptionApi.update(operation.id, operation.payload);
      if (isPageCurrent()) void queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      if (!isCurrent()) return;
      pendingLegal.current = null;
      setIsAddSubOpen(false);
      setEditingSub(null);
      toast.success(t(operation.kind === 'create' ? 'strategies:detail.toast_sub_success' : 'strategies:detail.toast_sub_updated'));
    } catch (error) {
      if (!isCurrent()) return;
      const { message, code, detail } = parseApiError(error);
      if (message.includes('LEGAL_ACCEPTANCE_REQUIRED') || code === 'LEGAL_ACCEPTANCE_REQUIRED') {
        if (typeof detail.required_version !== 'string' || !detail.required_version.trim() ||
            !['terms', 'privacy', 'auto_trade_notice'].includes(String(detail.doc_key))) {
          toast.error(t('common:invalid_api_response'));
          return;
        }
        pendingLegal.current = { operation, isCurrent };
        setLegalError({ docKey: normalizeLegalDocKey(detail.doc_key), version: detail.required_version });
        setIsAddSubOpen(false);
      } else if (message.includes('SUBSCRIPTION_ACCESS_DENIED') || code === 'SUBSCRIPTION_ACCESS_DENIED' || message.includes('Invite required')) {
        setIsAddSubOpen(false);
        setIsInviteModalOpen(true);
      } else {
        toast.error(message || t('strategies:detail.toast_error'));
      }
    } finally {
      if (pending.current === isCurrent) {
        pending.current = null;
        if (isPageCurrent()) setSubmission(null);
      }
    }
  };

  const handleSubmitSub = () => {
    if (pending.current?.()) return;
    if (!isValidSubscriptionDraft(newSub, fixedAmountMax) || !Number.isSafeInteger(strategyId) || strategyId <= 0 ||
        !strategy || strategy.id !== strategyId ||
        (editingSub && (editingSub.strategy_id !== strategyId || editingSub.account_id !== Number(newSub.accountId)))) {
      toast.error(t('strategies:invalid_subscription'));
      return;
    }
    const position = newSub.positionMode === 'fixed_amount'
      ? { position_mode: 'fixed_amount' as const, position_value: newSub.positionValue!, leverage: newSub.leverage }
      : { position_mode: 'fixed' as const, position_value: newSub.positionPct, position_pct: newSub.positionPct, leverage: newSub.leverage };
    if (editingSub) {
      // Preserve PATCH serialization: fixed mode sends position_pct, amount mode sends position_value.
      const payload = { ...position, position_value: newSub.positionMode === 'fixed_amount' ? newSub.positionValue! : undefined };
      void perform({ kind: 'update', id: editingSub.id, payload });
    } else {
      void perform({ kind: 'create', payload: { ...position, strategy_id: strategyId, strategy_key: strategy.strategy_key, account_id: Number(newSub.accountId) } });
    }
  };

  const handleLegalAccepted = () => {
    const saved = pendingLegal.current;
    if (!saved?.isCurrent() || pending.current?.()) return;
    pendingLegal.current = null;
    setLegalError(null);
    void perform(saved.operation);
  };
  const handleLegalOpenChange = (open: boolean) => {
    if (open) return;
    pendingLegal.current = null;
    setLegalError(null);
  };
  const handleRemoveSub = async (subId: number) => {
    if (!Number.isSafeInteger(subId) || subId <= 0 || removing.current.has(subId)) return;
    const isCurrent = capturePage();
    removing.current.add(subId);
    try {
      await subscriptionApi.delete(subId);
      if (!isCurrent()) return;
      void queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success(t('strategies:detail.toast_sub_removed'));
    } catch (error) {
      if (isCurrent()) toast.error(parseApiError(error).message || t('strategies:detail.toast_error'));
    } finally { removing.current.delete(subId); }
  };

  return {
    isSubmitting: submission?.key === editorKey && submission.isCurrent(),
    handleLegalAccepted, handleLegalOpenChange, handleRemoveSub, handleSubmitSub,
  };
}
