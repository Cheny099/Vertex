/**
 * @anchor-id HISTORY_PAGE
 * @module-type page
 * @disposable false
 * @mock-data trades and stats are temporary mocks until API data is fully connected.
 */

import { HistoryHeader } from './components/HistoryHeader';
import { HistoryFiltersBar } from './components/HistoryFiltersBar';
import { HistoryPagination } from './components/HistoryPagination';
import { HistoryStatsGrid } from './components/HistoryStatsGrid';
import { HistoryTradesTable } from './components/HistoryTradesTable';
import { HistoryDebugDialog } from './components/HistoryDebugDialog';
import { useHistoryModel } from './hooks/useHistoryModel';

const HistoryPage = () => {
  const {
    t,
    viewMode,
    setViewMode,
    searchInput,
    handleSearchChange,
    selectedSystemAccount,
    selectedTfAccount,
    accounts,
    turboflowAccounts,
    handleAccountChange,
    tfStatus,
    handleTfStatusChange,
    selectedPair,
    handlePairChange,
    selectedType,
    handleTypeChange,
    hasFilters,
    clearFilters,
    pairOptions,
    types,
    stats,
    displayedTrades,
    isLoading,
    isError,
    queryErrorMessage,
    getMappedFailureMessage,
    getMappedFailureAction,
    cancelMutation,
    retryMutation,
    debugMutation,
    handleRetry,
    handleCancel,
    handleDebug,
    showingStart,
    showingEnd,
    showingTotal,
    currentPageSize,
    setCurrentPageSize,
    pageSizeOptions,
    currentPage,
    handlePrevPage,
    tfPageCount,
    systemHasMore,
    setCurrentPage,
    handleNextPage,
    debugOrder,
    setDebugOrder,
  } = useHistoryModel();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <HistoryHeader t={t} viewMode={viewMode} onViewModeChange={setViewMode} />

      <HistoryStatsGrid stats={stats} />

      <HistoryFiltersBar
        t={t}
        viewMode={viewMode}
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        accountValue={viewMode === 'system' ? selectedSystemAccount : selectedTfAccount}
        onAccountChange={handleAccountChange}
        accounts={accounts}
        turboflowAccounts={turboflowAccounts}
        tfStatus={tfStatus}
        onTfStatusChange={handleTfStatusChange}
        selectedPair={selectedPair}
        onPairChange={handlePairChange}
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
        hasFilters={hasFilters}
        onClear={clearFilters}
        pairOptions={pairOptions}
        typeOptions={types}
      />

      <HistoryTradesTable
        t={t}
        viewMode={viewMode}
        displayedTrades={displayedTrades}
        accounts={accounts}
        isLoading={isLoading}
        isError={isError}
        queryErrorMessage={queryErrorMessage}
        getMappedFailureMessage={getMappedFailureMessage}
        getMappedFailureAction={getMappedFailureAction}
        isCancelPending={cancelMutation.isPending}
        isRetryPending={retryMutation.isPending}
        isDebugPending={debugMutation.isPending}
        onRetry={handleRetry}
        onCancel={handleCancel}
        onDebug={handleDebug}
        pagination={(
          <HistoryPagination
            t={t}
            showingStart={showingStart}
            showingEnd={showingEnd}
            showingTotal={showingTotal}
            currentPageSize={currentPageSize}
            onPageSizeChange={setCurrentPageSize}
            pageSizeOptions={pageSizeOptions}
            currentPage={currentPage}
            onPrev={handlePrevPage}
            viewMode={viewMode}
            tfPageCount={tfPageCount}
            systemHasMore={systemHasMore}
            onPageSelect={setCurrentPage}
            onNext={handleNextPage}
          />
        )}
      />

      <HistoryDebugDialog
        t={t}
        debugOrder={debugOrder}
        onOpenChange={() => setDebugOrder(null)}
      />
    </div>
  );
};

export default HistoryPage;
