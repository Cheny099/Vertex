import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, strategyApi, type Strategy } from '@/api';
import { usePageVisibility } from '@/hooks/use-page-visibility';

export const useDashboardOverviewModel = () => {
  const isPageVisible = usePageVisibility();
  const wasVisibleRef = useRef(isPageVisible);

  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: isPageVisible ? 5000 : false,
    refetchOnWindowFocus: false,
    staleTime: 4_000,
  });

  const { data: allStrategies, isLoading: isStrategiesLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => strategyApi.getAll(),
  });

  useEffect(() => {
    if (!wasVisibleRef.current && isPageVisible) {
      void refetchStats();
    }
    wasVisibleRef.current = isPageVisible;
  }, [isPageVisible, refetchStats]);

  const accountsForStatus = useMemo(() => stats?.accounts ?? [], [stats?.accounts]);

  const topStrategies = useMemo(() => {
    const strategies = allStrategies || [];
    const byId = new Map(strategies.map((strategy) => [strategy.id, strategy]));
    const ranked = (stats?.strategies || [])
      .slice()
      .sort((a, b) => b.subscription_count - a.subscription_count)
      .slice(0, 5);

    const result: Array<{ strategy: Strategy; subscriptionCount: number }> = [];
    for (const item of ranked) {
      const strategy = byId.get(item.strategy_id);
      if (!strategy) continue;
      result.push({ strategy, subscriptionCount: item.subscription_count });
    }
    return result;
  }, [allStrategies, stats?.strategies]);

  const failedCount = stats?.todayFailed || 0;
  const expiredCount = stats?.todayExpired || 0;
  const isLoading = isStatsLoading;
  const showFailureAlert = !isLoading && (failedCount > 0 || expiredCount > 0);

  return {
    accountsForStatus,
    expiredCount,
    failedCount,
    hasStrategyStats: !!stats?.strategies?.length,
    isLoading,
    isStrategiesLoading,
    showFailureAlert,
    stats,
    topStrategies,
  };
};
