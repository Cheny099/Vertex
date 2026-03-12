/**
 * @anchor-id DASHBOARD_PAGE
 * @module-type page
 * @disposable false
 * @description 仪表盘 - 只显示后端实际返回的数据
 */

import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import StrategiesList from '@/components/dashboard/StrategiesList';
import RecentTrades from '@/components/dashboard/RecentTrades';
import DashboardStatsGrid from '@/components/dashboard/DashboardStatsGrid';
import DashboardPopularityCard from '@/components/dashboard/DashboardPopularityCard';
import AccountStatusList from '@/components/dashboard/AccountStatusList';
import { useTranslation } from 'react-i18next';
import { useDashboardOverviewModel } from '@/pages/dashboard/hooks/useDashboardOverviewModel';

const Dashboard = () => {
  const { t } = useTranslation(['dashboard', 'common']); // Add namespaces
  const {
    accountsForStatus,
    expiredCount,
    failedCount,
    hasStrategyStats,
    isLoading,
    isStrategiesLoading,
    showFailureAlert,
    stats,
    topStrategies,
  } = useDashboardOverviewModel();

  return (
    <div className="space-y-0 min-h-screen bg-noise">
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="text-2xl font-bold">{t('dashboard:title')}</h1>
          <p className="text-muted-foreground">{t('dashboard:subtitle')}</p>
        </motion.div>

        {/* Stats Grid - 只显示后端实际返回的数据 */}
        <DashboardStatsGrid
          t={t}
          isLoading={isLoading}
          todayTotal={stats?.todayTotal}
          todayCompleted={stats?.todayCompleted}
          todayProcessing={stats?.todayProcessing}
          todayPending={stats?.todayPending}
          totalStrategies={stats?.totalStrategies}
          activeAccounts={stats?.activeAccounts}
          totalAccounts={stats?.totalAccounts}
        />

        {/* ... (Error Alert logic remains unchanged) ... */}

        {/* 今日订单明细提示 */}
        {showFailureAlert && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3"
          >
            <XCircle className="w-5 h-5 text-destructive" />
            <span
              className="text-sm"
              dangerouslySetInnerHTML={{
                __html: t('dashboard:alerts.failed_orders_html', {
                  failed: failedCount,
                  expired: expiredCount
                })
              }}
            />
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-start">
          {/* Left Side: My Subscriptions & Trades */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <StrategiesList />
            <RecentTrades />
          </div>

          {/* Right Side: Accounts & Popularity */}
          <div className="space-y-4 md:space-y-6 h-fit">
            <AccountStatusList accounts={accountsForStatus} isLoading={isLoading} />

            <DashboardPopularityCard
              t={t}
              isLoading={isLoading}
              isStrategiesLoading={isStrategiesLoading}
              hasStats={hasStrategyStats}
              topStrategies={topStrategies}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
