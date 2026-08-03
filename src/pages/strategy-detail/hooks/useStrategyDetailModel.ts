import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { usePageVisibility } from '@/hooks/use-page-visibility';
import type { Subscription } from '@/api';
import { useStrategyDetailState } from './useStrategyDetailState';
import { toSubscriptionDraft } from '../utils';
import { useStrategyDetailQueries } from './useStrategyDetailQueries';
import { useStrategySubscriptionActions } from './useStrategySubscriptionActions';

export const useStrategyDetailModel = () => {
  const { id = '' } = useParams();
  const strategyId = Number(id);
  const navigate = useNavigate();
  const { t } = useTranslation(['strategies', 'common']);
  const { user, isAdmin } = useAuth();
  const isPageVisible = usePageVisibility();

  const canQuery = Number.isFinite(strategyId) && strategyId > 0;

  const {
    isAddSubOpen,
    setIsAddSubOpen,
    activePeriod,
    setActivePeriod,
    isSecretOpen,
    setIsSecretOpen,
    isInviteModalOpen,
    setIsInviteModalOpen,
    editingSub,
    setEditingSub,
    newSub,
    setNewSub,
    legalError,
    setLegalError,
  } = useStrategyDetailState();

  const {
    strategy,
    isLoading,
    isError,
    subscriptions,
    isSubsLoading,
    accounts,
    fixedAmountMax,
    availableMargin,
    minNotional,
    isMinNotionalViolated,
    leaderboard,
    metrics,
    parsedConfig,
    parameterLabels,
    getAccountDetail,
    webhookUrl,
    displayParams,
  } = useStrategyDetailQueries({
    strategyId,
    canQuery,
    isPageVisible,
    activePeriod,
    newSub,
  });

  const {
    addSubMutation,
    updateSubMutation,
    handleLegalAccepted,
    handleRemoveSub,
    handleSubmitSub,
  } = useStrategySubscriptionActions({
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
  });

  const currentSubscription = useMemo(
    () => subscriptions?.find((s: Subscription) => s.strategy_id === strategyId) ?? null,
    [subscriptions, strategyId]
  );
  const subscribed = !!currentSubscription;

  const handleEditSub = useCallback(
    (sub: Subscription) => {
      setEditingSub(sub);
      setNewSub(toSubscriptionDraft(sub));

      if (sub.position_mode === 'multiplier') {
        toast.message(t('strategies:detail.multiplier_warning'));
      }

      setIsAddSubOpen(true);
    },
    [setEditingSub, setIsAddSubOpen, setNewSub, t]
  );

  const handleAddSub = useCallback(
    (force = false) => {
      if (!force && !isAdmin && user && !user.can_subscribe) {
        setIsInviteModalOpen(true);
        return;
      }

      setEditingSub(null);
      setNewSub({
        // The dialog's Select filters inactive accounts out, so preselecting accounts[0] blindly
        // could seed a deactivated account that only stays visible via the Select's
        // "or it is the current value" escape hatch. Accepting that default produced a
        // subscription bound to an account that never executes a signal.
        accountId: String(accounts?.find((a) => a.is_active)?.id ?? ''),
        positionMode: 'fixed',
        positionValue: 100,
        positionPct: 0.1,
        leverage: 50,
      });
      setIsAddSubOpen(true);
    },
    [accounts, isAdmin, setEditingSub, setIsAddSubOpen, setIsInviteModalOpen, setNewSub, user]
  );

  const copyWebhook = useCallback(() => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success(t('strategies:detail.webhook_url'));
  }, [t, webhookUrl]);

  const handleBackToList = useCallback(() => navigate('/strategies'), [navigate]);
  const handleOpenSecret = useCallback(() => setIsSecretOpen(true), [setIsSecretOpen]);
  const handleCloseAddSub = useCallback(() => setIsAddSubOpen(false), [setIsAddSubOpen]);
  const handleOpenInviteModal = useCallback(() => handleAddSub(true), [handleAddSub]);
  const handleSignalHistory = useCallback(() => navigate(`/strategies/${id}/signals`), [id, navigate]);
  const handlePrimaryAction = useCallback(() => {
    if (currentSubscription) {
      handleEditSub(currentSubscription);
      return;
    }
    handleAddSub();
  }, [currentSubscription, handleAddSub, handleEditSub]);

  const showWebhook = isAdmin;

  return {
    t,
    id,
    strategyId,
    strategy,
    isLoading,
    isError,
    isAdmin,
    subscribed,
    currentSubscription,
    isAddSubOpen,
    setIsAddSubOpen,
    activePeriod,
    setActivePeriod,
    isSecretOpen,
    setIsSecretOpen,
    isInviteModalOpen,
    setIsInviteModalOpen,
    editingSub,
    newSub,
    setNewSub,
    legalError,
    setLegalError,
    subscriptions,
    isSubsLoading,
    accounts,
    fixedAmountMax,
    availableMargin,
    isMinNotionalViolated,
    minNotional,
    leaderboard,
    metrics,
    parsedConfig,
    parameterLabels,
    getAccountDetail,
    webhookUrl,
    showWebhook,
    displayParams,
    addSubMutation,
    updateSubMutation,
    handleBackToList,
    handleSignalHistory,
    handlePrimaryAction,
    handleAddSub,
    handleEditSub,
    handleRemoveSub,
    handleSubmitSub,
    handleCloseAddSub,
    handleOpenSecret,
    handleOpenInviteModal,
    handleLegalAccepted,
    copyWebhook,
  };
};
