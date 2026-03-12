import { motion } from 'framer-motion';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ForceCloseCard } from './components/ForceCloseCard';
import { SubscriptionOpsCard } from './components/SubscriptionOpsCard';
import { BatchRequeueCard } from './components/BatchRequeueCard';
import { ActiveOrdersCard } from './components/ActiveOrdersCard';
import { OrderDetailDialog } from './components/OrderDetailDialog';
import { OpsHeader } from './components/OpsHeader';
import { ActionConfirmDialog } from './components/ActionConfirmDialog';
import { useOpsConsoleModel } from './hooks/useOpsConsoleModel';
import { containerVariants, itemVariants } from './motion';

const OpsConsole = () => {
  const {
    t,
    state,
    ordersData,
    totalPages,
    isLoading,
    orderEvents,
    isLoadingEvents,
    closePositionPending,
    batchRequeuePending,
    freezeSubPending,
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
    handleFreezeSub,
    handleUnfreezeSub,
  } = useOpsConsoleModel();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 p-4 md:p-8 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white relative overflow-hidden"
    >
      <div className="absolute top-[-10%] left-[-10%] w-[36%] h-[36%] bg-primary/5 blur-[56px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[5%] right-[-5%] w-[28%] h-[28%] bg-blue-400/5 blur-[48px] rounded-full pointer-events-none" />

      <div className="space-y-6 relative z-10">
        <motion.div variants={itemVariants}>
          <OpsHeader
            t={t}
            isAutoRefresh={state.isAutoRefresh}
            onAutoRefreshChange={state.setIsAutoRefresh}
            onRefresh={handleRefresh}
            isRefreshing={isLoading}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 space-y-6">
            <motion.div variants={itemVariants}>
              <ForceCloseCard
                t={t}
                closeParams={state.closeParams}
                setCloseParams={state.setCloseParams}
                isSubmitting={closePositionPending}
                onRequestConfirm={() => state.setCloseDialogOpen(true)}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <SubscriptionOpsCard
                t={t}
                searchSubId={state.searchSubId}
                setSearchSubId={state.setSearchSubId}
                freezeReason={state.freezeReason}
                setFreezeReason={state.setFreezeReason}
                isSubmitting={freezeSubPending}
                setActionConfirm={state.setActionConfirm}
                onFreeze={handleFreezeSub}
                onUnfreeze={handleUnfreezeSub}
              />
            </motion.div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <motion.div variants={itemVariants}>
              <BatchRequeueCard
                t={t}
                batchParams={state.batchParams}
                setBatchParams={state.setBatchParams}
                isPending={batchRequeuePending}
                onDryRun={handleBatchDryRun}
                onExecute={handleBatchExecuteRequest}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <ActiveOrdersCard
                t={t}
                total={ordersData?.total || 0}
                accountIdFilter={state.accountIdFilter}
                setAccountIdFilter={state.setAccountIdFilter}
                symbolFilter={state.symbolFilter}
                setSymbolFilter={state.setSymbolFilter}
                statusFilter={state.statusFilter}
                setStatusFilter={state.setStatusFilter}
                orderTableBody={orderTableBody}
                page={state.page}
                totalPages={totalPages}
                onPrevPage={handlePrevPage}
                onNextPage={handleNextPage}
              />
            </motion.div>
          </div>
        </div>

        <ConfirmDialog
          open={state.closeDialogOpen}
          onOpenChange={state.setCloseDialogOpen}
          onConfirm={handleClosePositionConfirm}
          title={t('admin:confirm_close')}
          desc={t('admin:force_close_confirm_desc', {
            qty: state.closeParams.qty,
            symbol: state.closeParams.symbol,
            pos_side: state.closeParams.pos_side,
            account_id: state.closeParams.account_id,
          })}
        />

        <OrderDetailDialog
          t={t}
          selectedOrder={state.selectedOrder}
          onClose={handleOrderDetailClose}
          orderEvents={orderEvents}
          isLoadingEvents={isLoadingEvents}
        />

        <ActionConfirmDialog
          t={t}
          open={state.actionConfirm.open}
          title={state.actionConfirm.title}
          desc={state.actionConfirm.desc}
          onOpenChange={handleActionConfirmOpenChange}
          onConfirm={handleActionConfirmConfirm}
        />
      </div>
    </motion.div>
  );
};

export default OpsConsole;
