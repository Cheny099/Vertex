import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { subscriptionApi } from '@/api';
import type { Subscription } from '@/api/types';

interface StrategySubscriptionListItem extends Subscription {
  strategy: NonNullable<Subscription['strategy']>;
}

export const useStrategiesListModel = () => {
  const navigate = useNavigate();

  const goStrategies = useCallback(() => {
    navigate('/strategies');
  }, [navigate]);

  const goStrategyDetail = useCallback((strategyId: number) => {
    navigate(`/strategies/${strategyId}`);
  }, [navigate]);

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: subscriptionApi.list,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const strategySubscriptions = useMemo<StrategySubscriptionListItem[]>(() => {
    return (subscriptions || []).filter((subscription): subscription is StrategySubscriptionListItem => !!subscription.strategy);
  }, [subscriptions]);

  const hasSubscriptions = strategySubscriptions.length > 0;

  return {
    goStrategies,
    goStrategyDetail,
    hasSubscriptions,
    isLoading,
    strategySubscriptions,
  };
};
