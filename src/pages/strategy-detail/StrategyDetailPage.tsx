/**
 * @anchor-id STRATEGY_DETAIL_PAGE
 * @module-type page
 * @disposable false
 * @mock-data 策略详情数据�?Mock，后端对接时替换
 */

import { lazy, Suspense } from 'react';
import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StrategyDetailHeader } from './components/StrategyDetailHeader';
import { StrategyPeriodMetrics } from './components/StrategyPeriodMetrics';
import { StrategyMainInfoGrid } from './components/StrategyMainInfoGrid';
import { StrategySubscriptionDialog } from './components/StrategySubscriptionDialog';
import { StrategyConfigWebhookPanel } from './components/StrategyConfigWebhookPanel';
import { useStrategyDetailModel } from './hooks/useStrategyDetailModel';

const InviteCodeModal = lazy(() =>
  import('@/components/modals/InviteCodeModal').then((mod) => ({ default: mod.InviteCodeModal }))
);
const WebhookSecretDialog = lazy(() =>
  import('@/components/strategies/WebhookSecretDialog').then((mod) => ({ default: mod.WebhookSecretDialog }))
);
const RiskDisclosureDialog = lazy(() => import('@/components/RiskDisclosureDialog'));

const StrategyDetail = () => {
  const {
    t,
    strategy,
    isLoading,
    isError,
    isAdmin,
    subscribed,
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
  } = useStrategyDetailModel();

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Suspense fallback={null}>
          <InviteCodeModal open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen} onSuccess={handleOpenInviteModal} />
        </Suspense>
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !strategy) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Suspense fallback={null}>
          <InviteCodeModal open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen} onSuccess={() => handleAddSub(true)} />
        </Suspense>
        <div className="p-4 bg-destructive/10 rounded-full">
          <Activity className="w-12 h-12 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">{t('strategies:detail.load_failed')}</h2>
        <p className="text-muted-foreground">{t('strategies:detail.load_failed_desc')}</p>
        <Button onClick={handleBackToList}>{t('strategies:detail.back_list')}</Button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Suspense fallback={null}>
        <InviteCodeModal open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen} onSuccess={handleOpenInviteModal} />
      </Suspense>

      <StrategyDetailHeader
        t={t}
        strategy={strategy}
        pairText={strategy.pair || (typeof parsedConfig.pair === 'string' ? parsedConfig.pair : '-')}
        onBack={handleBackToList}
        showSignalHistory={isAdmin || subscribed}
        onSignalHistory={handleSignalHistory}
        isSubscribed={subscribed}
        onPrimaryAction={handlePrimaryAction}
      />

      <StrategyPeriodMetrics t={t} activePeriod={activePeriod} onPeriodChange={setActivePeriod} metrics={metrics} />

      <StrategyMainInfoGrid
        t={t}
        description={strategy.description}
        parsedConfig={parsedConfig}
        leaderboardItems={leaderboard?.items}
        subscriptions={subscriptions}
        isSubsLoading={isSubsLoading}
        getAccountDetail={getAccountDetail}
        onAddSub={handleAddSub}
        onEditSub={handleEditSub}
        onRemoveSub={handleRemoveSub}
      />

      <StrategyConfigWebhookPanel
        t={t}
        showWebhook={showWebhook}
        webhookUrl={webhookUrl}
        onCopyWebhook={copyWebhook}
        onOpenSecret={handleOpenSecret}
        displayParams={displayParams}
        parameterLabels={parameterLabels}
      />

      <StrategySubscriptionDialog
        t={t}
        open={isAddSubOpen}
        onOpenChange={setIsAddSubOpen}
        editingSub={editingSub}
        newSub={newSub}
        setNewSub={setNewSub}
        accounts={accounts}
        fixedAmountMax={fixedAmountMax}
        availableMargin={availableMargin}
        isMinNotionalViolated={isMinNotionalViolated}
        minNotional={minNotional}
        isSubmitting={addSubMutation.isPending || updateSubMutation.isPending}
        onSubmit={handleSubmitSub}
        onCancel={handleCloseAddSub}
      />

      <Suspense fallback={null}>
        <WebhookSecretDialog
          open={isSecretOpen}
          onOpenChange={setIsSecretOpen}
          strategyId={strategy.id}
          strategyName={strategy.name}
          isAdmin={isAdmin}
        />
      </Suspense>

      <Suspense fallback={null}>
        <RiskDisclosureDialog
          open={!!legalError}
          onOpenChange={(open) => !open && setLegalError(null)}
          docKey={legalError?.docKey ?? 'auto_trade_notice'}
          requiredVersion={legalError?.version || ''}
          onAccept={handleLegalAccepted}
        />
      </Suspense>
    </div>
  );
};

export default StrategyDetail;
