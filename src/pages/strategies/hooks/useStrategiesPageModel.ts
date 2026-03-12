import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { strategyApi, subscriptionApi, type Strategy } from '@/api';
import { usePageVisibility } from '@/hooks/use-page-visibility';

export type TabType = 'running' | 'library' | 'my';
export type SortField = 'newest' | 'roi' | 'drawdown' | 'win_rate' | 'profit_factor';
export type SortOrder = 'asc' | 'desc';
export type StatusTone = 'active' | 'warning' | 'danger' | 'muted';

export function useStrategiesPageModel() {
  const { t } = useTranslation(['strategies']);
  const isPageVisible = usePageVisibility();
  const [activeTab, setActiveTab] = useState<TabType>('running');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('newest');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data: allStrategies = [], isLoading: isStrategiesLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => strategyApi.getAll(),
    refetchInterval: isPageVisible ? 5000 : false,
  });

  const { data: subscriptions = [], isLoading: isSubscriptionsLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionApi.list(),
  });

  const subscribedStrategyIds = useMemo(() => {
    const ids = new Set<number>();
    for (const subscription of subscriptions) {
      ids.add(subscription.strategy_id);
    }
    return ids;
  }, [subscriptions]);

  const normalizeStatus = useCallback((statusRaw?: string) => String(statusRaw || '').trim().toLowerCase(), []);
  const isActiveStatus = useCallback((statusRaw?: string) => normalizeStatus(statusRaw) === 'active', [normalizeStatus]);
  const isSubscribed = useCallback((strategyId: number) => subscribedStrategyIds.has(strategyId), [subscribedStrategyIds]);

  const getStatusLabel = useCallback((statusRaw?: string) => {
    const status = normalizeStatus(statusRaw);
    if (status === 'active') return t('strategies:card.online');
    if (status) return t(`strategies:detail.status_${status}`, { defaultValue: statusRaw });
    return t('strategies:detail.status_inactive');
  }, [normalizeStatus, t]);

  const getStatusTone = useCallback((statusRaw?: string): StatusTone => {
    const status = normalizeStatus(statusRaw);
    if (status === 'active') return 'active';
    if (status === 'inactive' || status === 'paused' || status === 'maintenance') return 'warning';
    if (status === 'blocked' || status === 'frozen' || status === 'error') return 'danger';
    return 'muted';
  }, [normalizeStatus]);

  const getTypeLabel = useCallback((strategy: Strategy) => {
    const rawType = String(strategy.type || strategy.config?.type || '').toLowerCase();
    if (!rawType) return '-';

    switch (rawType) {
      case 'grid':
        return t('strategies:types.grid');
      case 'trend':
        return t('strategies:types.trend');
      case 'dca':
      case 'martingale':
        return t('strategies:types.dca');
      case 'arbitrage':
        return t('strategies:types.arbitrage');
      case 'signal':
        return t('strategies:types.signal');
      default:
        return rawType;
    }
  }, [t]);

  const runningCount = useMemo(
    () => allStrategies.filter((strategy) => isSubscribed(strategy.id) && isActiveStatus(strategy.status)).length,
    [allStrategies, isActiveStatus, isSubscribed]
  );
  const myCount = useMemo(
    () => allStrategies.filter((strategy) => isSubscribed(strategy.id)).length,
    [allStrategies, isSubscribed]
  );
  const libraryCount = allStrategies.length;

  const filteredStrategies = useMemo(() => {
    let result = [...allStrategies];

    if (activeTab === 'running') {
      result = result.filter((strategy) => isSubscribed(strategy.id) && isActiveStatus(strategy.status));
    } else if (activeTab === 'my') {
      result = result.filter((strategy) => isSubscribed(strategy.id));
    }

    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase();
      result = result.filter((strategy) =>
        strategy.name.toLowerCase().includes(normalizedQuery)
        || (strategy.description || '').toLowerCase().includes(normalizedQuery)
      );
    }

    result.sort((left, right) => {
      let comparison = 0;

      switch (sortBy) {
        case 'newest':
          comparison = new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
          break;
        case 'roi':
          comparison = (left.metrics?.all?.return_pct || 0) - (right.metrics?.all?.return_pct || 0);
          break;
        case 'drawdown':
          comparison = (left.metrics?.all?.max_drawdown_pct || 0) - (right.metrics?.all?.max_drawdown_pct || 0);
          break;
        case 'win_rate':
          comparison = (left.metrics?.all?.win_rate || 0) - (right.metrics?.all?.win_rate || 0);
          break;
        case 'profit_factor':
          comparison = (left.metrics?.all?.profit_factor || 0) - (right.metrics?.all?.profit_factor || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [activeTab, allStrategies, isActiveStatus, isSubscribed, searchQuery, sortBy, sortOrder]);

  const isLoading = isStrategiesLoading || isSubscriptionsLoading;

  return {
    activeTab,
    filteredStrategies,
    getStatusLabel,
    getStatusTone,
    getTypeLabel,
    isActiveStatus,
    isLoading,
    isSubscribed,
    libraryCount,
    myCount,
    runningCount,
    searchQuery,
    setActiveTab,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    sortBy,
    sortOrder,
  };
}
