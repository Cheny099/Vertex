/**
 * @anchor-id DASHBOARD_PAGE
 * @module-type page
 * @disposable false
 * @description 仪表盘 - 只显示后端实际返回的数据
 */

import { motion } from 'framer-motion';
import { Activity, CheckCircle, Clock, XCircle, Users, TrendingUp } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import StrategiesList from '@/components/dashboard/StrategiesList';
import RecentTrades from '@/components/dashboard/RecentTrades';
import { Badge } from '@/components/ui/badge';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, strategyApi } from '@/api';
import { Skeleton } from '@/components/ui/skeleton';
import AccountStatusList from '@/components/dashboard/AccountStatusList';
import { useTranslation } from 'react-i18next';
import { usePageVisibility } from '@/hooks/use-page-visibility';

const Dashboard = () => {
  const { t } = useTranslation(['dashboard', 'common']); // Add namespaces
  const isPageVisible = usePageVisibility();
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: isPageVisible ? 5000 : false,
    refetchOnWindowFocus: false,
    staleTime: 4_000,
  });

  const { data: allStrategies, isLoading: isStratsLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => strategyApi.getAll(),
  });

  const isLoading = isStatsLoading;
  const topStrategies = useMemo(() => {
    const ranked = (stats?.strategies || [])
      .slice()
      .sort((a, b) => b.subscription_count - a.subscription_count)
      .slice(0, 5);
    return ranked
      .map((item) => {
        const strategy = (allStrategies || []).find(s => s.id === item.strategy_id);
        if (!strategy) return null;
        return { strategy, subscriptionCount: item.subscription_count };
      })
      .filter(Boolean) as Array<{ strategy: any; subscriptionCount: number }>;
  }, [stats?.strategies, allStrategies]);

  useEffect(() => {
    if (isPageVisible) {
      void refetchStats();
    }
  }, [isPageVisible, refetchStats]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title={t('dashboard:stats.today_orders')}
            value={isLoading ? "..." : `${stats?.todayTotal || 0} ${t('dashboard:stats.unit_orders')}`}
            change={t('dashboard:stats.completed', { count: stats?.todayCompleted || 0 })}
            changeType="profit"
            icon={CheckCircle}
            delay={0}
          />
          <StatCard
            title={t('dashboard:stats.processing')}
            value={isLoading ? "..." : `${stats?.todayProcessing || 0} ${t('dashboard:stats.unit_orders')}`}
            change={t('dashboard:stats.pending', { count: stats?.todayPending || 0 })}
            changeType="neutral"
            icon={Clock}
            delay={0}
          />
          <StatCard
            title={t('dashboard:stats.strategies')}
            value={isLoading ? "..." : `${stats?.totalStrategies || 0} ${t('dashboard:stats.unit_items')}`}
            change={t('dashboard:stats.configured')}
            changeType="neutral"
            icon={Activity}
            delay={0}
          />
          <StatCard
            title={t('dashboard:stats.active_accounts')}
            value={isLoading ? "..." : `${stats?.activeAccounts || 0} ${t('dashboard:stats.unit_items')}`}
            change={t('dashboard:stats.total_accounts', { count: stats?.totalAccounts || 0 })}
            changeType="neutral"
            icon={Users}
            delay={0}
          />
        </div>

        {/* ... (Error Alert logic remains unchanged) ... */}

        {/* 今日订单明细提示 */}
        {!isLoading && ((stats?.todayFailed || 0) > 0 || (stats?.todayExpired || 0) > 0) && (
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
                  failed: stats?.todayFailed || 0,
                  expired: stats?.todayExpired || 0
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
            <AccountStatusList accounts={stats?.accounts || []} isLoading={isLoading} />

            {/* Strategy Popularity Widget */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {t('dashboard:popularity.title')}
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {isLoading || isStratsLoading ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
                ) : (
                  topStrategies
                    .map(({ strategy, subscriptionCount }, index) => {
                      return (
                        <div key={strategy.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}</span>
                            <span className="text-sm font-medium">{strategy.name}</span>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            {t('dashboard:popularity.subscribe_count', { count: subscriptionCount })}
                          </Badge>
                        </div>
                      );
                    })
                )}
                {(!stats?.strategies || stats.strategies.length === 0) && !isLoading && (
                  <p className="text-center text-xs text-muted-foreground py-4">{t('dashboard:popularity.no_data')}</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
