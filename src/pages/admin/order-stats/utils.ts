import type { TFunction } from 'i18next';
import type { OrderTurnoverStatsRow } from '@/api/types';

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
} as const;

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
} as const;

export type OrderStatsGroupBy = 'day' | 'user' | 'account' | 'symbol' | 'strategy' | 'subscription';

export interface OrderStatsTotals {
  turnover: number;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
}

export const safeT = (translator: (key: string) => unknown, key: string, fallback?: string): string => {
  try {
    const result = translator(key);
    if (typeof result === 'string') return result;
    return fallback || String(key);
  } catch {
    return fallback || String(key);
  }
};

export const formatUsd = (value: number | null | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '$0.00';
  try {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
  } catch {
    return '$0.00';
  }
};

export const getGroupLabel = (row: OrderTurnoverStatsRow, groupBy: OrderStatsGroupBy) => {
  switch (groupBy) {
    case 'day': return row.day || '-';
    case 'user': return row.user_id || '-';
    case 'account': return row.account_id || '-';
    case 'symbol': return row.symbol || '-';
    case 'strategy': return row.strategy_id || '-';
    case 'subscription': return row.subscription_id || '-';
    default: return '-';
  }
};

export const calculateTotals = (rows: OrderTurnoverStatsRow[]): OrderStatsTotals | null => {
  if (rows.length === 0) return null;
  return rows.reduce<OrderStatsTotals>((acc, row) => ({
    turnover: acc.turnover + (row.turnover_usd || 0),
    pnl: acc.pnl + (row.realized_pnl_usd_sum || 0),
    trades: acc.trades + (row.close_cnt || 0),
    wins: acc.wins + (row.win_cnt || 0),
    losses: acc.losses + (row.lose_cnt || 0),
  }), { turnover: 0, pnl: 0, trades: 0, wins: 0, losses: 0 });
};

export const renderQualityWarningText = (
  warning: string,
  t: TFunction<'admin' | 'common'>
) => {
  const value = String(warning || '');
  const coverage = value.match(/coverage\s+is\s+(\d+)\/(\d+)/i);
  if (coverage) {
    return t('admin:warnings_templates.executed_notional_coverage', {
      covered: Number(coverage[1]),
      total: Number(coverage[2]),
    });
  }

  const turboMissing = value.match(/found\s+(\d+).*(turboflow).*(null\s+tf_order_id)/i);
  if (turboMissing) {
    return t('admin:warnings_templates.turboflow_missing_id', { count: Number(turboMissing[1]) });
  }

  const nonTurboMissing = value.match(/found\s+(\d+).*(non-turboflow).*(null\s+ex_order_id)/i);
  if (nonTurboMissing) {
    return t('admin:warnings_templates.non_turboflow_missing_id', { count: Number(nonTurboMissing[1]) });
  }

  const legacyMissingExchange = value.match(/found\s+(\d+).*(null\s+exchange)/i);
  if (legacyMissingExchange) {
    return t('admin:warnings_templates.legacy_missing_exchange', { count: Number(legacyMissingExchange[1]) });
  }

  return safeT(t, `admin:kind_labels.${value}`, value);
};
