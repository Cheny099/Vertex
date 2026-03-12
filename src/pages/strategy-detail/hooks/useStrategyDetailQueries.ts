import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  accountApi,
  exchangeApi,
  leaderboardApi,
  strategyApi,
  subscriptionApi,
  type Account,
  type PeriodKey,
  type Subscription,
  type SymbolMeta,
} from '@/api';
import type { StrategySubscriptionDraft } from './useStrategyDetailState';
import { PROMOTED_CONFIG_KEYS, SUPPORTED_META_EXCHANGES, toRecord } from '../utils';

type UseStrategyDetailQueriesParams = {
  strategyId: number;
  canQuery: boolean;
  isPageVisible: boolean;
  activePeriod: PeriodKey;
  newSub: StrategySubscriptionDraft;
};

export function useStrategyDetailQueries({
  strategyId,
  canQuery,
  isPageVisible,
  activePeriod,
  newSub,
}: UseStrategyDetailQueriesParams) {
  const { t } = useTranslation(['strategies', 'common']);

  const { data: strategy, isLoading, isError } = useQuery({
    queryKey: ['strategy', strategyId],
    queryFn: () => strategyApi.get(strategyId),
    enabled: canQuery,
    refetchInterval: isPageVisible ? 5000 : false,
  });

  const { data: subscriptions, isLoading: isSubsLoading } = useQuery({
    queryKey: ['subscriptions', strategyId],
    queryFn: () => subscriptionApi.list(),
    enabled: canQuery,
    select: (data) => data.filter((s: Subscription) => s.strategy_id === strategyId),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountApi.list(),
  });

  const selectedAccount = useMemo(() => {
    const aid = Number(newSub.accountId);
    if (!accounts || !aid) return undefined;
    return accounts.find((a) => a.id === aid);
  }, [accounts, newSub.accountId]);

  const availableMargin = useMemo(() => {
    const accountRecord = toRecord(selectedAccount);
    const detailRecord = toRecord(accountRecord?.detail);
    const raw =
      selectedAccount?.available_margin ??
      accountRecord?.availableMargin ??
      accountRecord?.free_margin ??
      accountRecord?.freeMargin ??
      accountRecord?.balance_available ??
      accountRecord?.balanceAvailable ??
      accountRecord?.margin_available ??
      accountRecord?.marginAvailable ??
      detailRecord?.available_margin ??
      detailRecord?.availableMargin ??
      null;

    if (raw === null || raw === undefined) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [selectedAccount]);

  const fixedAmountMax = useMemo(() => {
    if (availableMargin && availableMargin > 0) return Math.max(1, Math.floor(availableMargin));
    return 10000;
  }, [availableMargin]);

  const { data: exchangeMeta } = useQuery({
    queryKey: ['exchange-meta', strategy?.pair, selectedAccount?.exchange],
    enabled:
      !!strategy?.pair &&
      !!selectedAccount?.exchange &&
      SUPPORTED_META_EXCHANGES.includes(selectedAccount.exchange as (typeof SUPPORTED_META_EXCHANGES)[number]),
    queryFn: async () => {
      const symbol = strategy!.pair!.replace('/', '');
      const exchange = selectedAccount!.exchange as (typeof SUPPORTED_META_EXCHANGES)[number];
      const res = await exchangeApi.getSymbolsMeta(exchange, [symbol]);
      return res.symbols?.find((s: SymbolMeta) => s.symbol === symbol) || null;
    },
    staleTime: 300000,
  });

  const minNotional = exchangeMeta?.min_notional || 0;
  const isMinNotionalViolated =
    newSub.positionMode === 'fixed_amount' && Number(newSub.positionValue || 0) < minNotional;

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', 'strategy', strategyId],
    queryFn: () => leaderboardApi.getByStrategy(strategyId),
    enabled: canQuery,
    refetchInterval: isPageVisible ? 30000 : false,
  });

  const metrics = useMemo(() => strategy?.metrics?.[activePeriod], [strategy, activePeriod]);

  const parsedConfig = useMemo<Record<string, unknown>>(() => {
    if (!strategy?.config) return {};
    try {
      const res = typeof strategy.config === 'string' ? JSON.parse(strategy.config) : strategy.config;
      return res && typeof res === 'object' && !Array.isArray(res) ? (res as Record<string, unknown>) : {};
    } catch {
      return { raw: String(strategy.config) };
    }
  }, [strategy?.config]);

  const parameterLabels = useMemo<Record<string, string>>(
    () => ({
      investment: t('strategies:create.investment_label'),
      strategy_key: t('strategies:detail.strategy_key') || 'Strategy Key',
      pair: t('strategies:detail.pair'),
      type: t('strategies:detail.strategy_type'),
      value: t('strategies:detail.value') || 'Core Value',
      take_profit: t('strategies:create.take_profit'),
      stop_loss: t('strategies:create.stop_loss'),
      timeframe: t('strategies:detail.timeframe') || 'Timeframe',
      threshold: t('strategies:detail.threshold') || 'Threshold',
      risk_level: t('strategies:detail.risk_level'),
      recommended_leverage: t('strategies:detail.recommended_leverage'),
    }),
    [t]
  );

  const accountById = useMemo(() => {
    const map = new Map<number, Account>();
    (accounts ?? []).forEach((account) => {
      map.set(account.id, account);
    });
    return map;
  }, [accounts]);

  const getAccountDetail = useCallback((accountId: number) => accountById.get(accountId), [accountById]);

  const apiBase = useMemo(() => {
    const base = import.meta.env.VITE_API_URL as string | undefined;
    return base ? base.replace(/\/$/, '') : `${window.location.protocol}//${window.location.host}/api/v1`;
  }, []);
  const webhookUrl = useMemo(
    () => `${apiBase.replace(/\/api\/v1$/, '')}/api/v1/tradingview/webhook`,
    [apiBase]
  );

  const displayParams = useMemo(
    () =>
      Object.entries(parsedConfig).filter(
        ([key]) => !PROMOTED_CONFIG_KEYS.includes(key as (typeof PROMOTED_CONFIG_KEYS)[number])
      ),
    [parsedConfig]
  );

  return {
    strategy,
    isLoading,
    isError,
    subscriptions,
    isSubsLoading,
    accounts,
    selectedAccount,
    availableMargin,
    fixedAmountMax,
    minNotional,
    isMinNotionalViolated,
    leaderboard,
    metrics,
    parsedConfig,
    parameterLabels,
    getAccountDetail,
    webhookUrl,
    displayParams,
  };
}
