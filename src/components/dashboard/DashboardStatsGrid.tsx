import { memo } from 'react';
import type { TFunction } from 'i18next';
import { Activity, CheckCircle, Clock, Users } from 'lucide-react';
import StatCard from './StatCard';

interface DashboardStatsGridProps {
  t: TFunction;
  isLoading: boolean;
  todayTotal?: number;
  todayCompleted?: number;
  todayProcessing?: number;
  todayPending?: number;
  totalStrategies?: number;
  activeAccounts?: number;
  totalAccounts?: number;
}

function DashboardStatsGrid({
  t,
  isLoading,
  todayTotal,
  todayCompleted,
  todayProcessing,
  todayPending,
  totalStrategies,
  activeAccounts,
  totalAccounts,
}: DashboardStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard
        title={t('dashboard:stats.today_orders')}
        value={isLoading ? '...' : `${todayTotal || 0} ${t('dashboard:stats.unit_orders')}`}
        change={t('dashboard:stats.completed', { count: todayCompleted || 0 })}
        changeType="profit"
        icon={CheckCircle}
        delay={0}
      />
      <StatCard
        title={t('dashboard:stats.processing')}
        value={isLoading ? '...' : `${todayProcessing || 0} ${t('dashboard:stats.unit_orders')}`}
        change={t('dashboard:stats.pending', { count: todayPending || 0 })}
        changeType="neutral"
        icon={Clock}
        delay={0}
      />
      <StatCard
        title={t('dashboard:stats.strategies')}
        value={isLoading ? '...' : `${totalStrategies || 0} ${t('dashboard:stats.unit_items')}`}
        change={t('dashboard:stats.configured')}
        changeType="neutral"
        icon={Activity}
        delay={0}
      />
      <StatCard
        title={t('dashboard:stats.active_accounts')}
        value={isLoading ? '...' : `${activeAccounts || 0} ${t('dashboard:stats.unit_items')}`}
        change={t('dashboard:stats.total_accounts', { count: totalAccounts || 0 })}
        changeType="neutral"
        icon={Users}
        delay={0}
      />
    </div>
  );
}

export default memo(DashboardStatsGrid);
