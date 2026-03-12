import type { ApiError } from '@/api/contracts';
import type { LegalDocKey, Subscription } from '@/api';

export type UiMode = 'fixed_amount' | 'fixed';
export const SUPPORTED_META_EXCHANGES = ['binance_futures', 'gate_futures'] as const;
export const PROMOTED_CONFIG_KEYS = ['risk_level', 'recommended_leverage', 'pair', 'type', 'strategy_key'] as const;

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null;

export const normalizeLegalDocKey = (value: unknown): LegalDocKey => {
  if (value === 'terms' || value === 'privacy' || value === 'auto_trade_notice') {
    return value;
  }
  return 'auto_trade_notice';
};

export const parseApiError = (
  error: unknown
): { message: string; code?: string; detail: Record<string, unknown> } => {
  const apiError = error as ApiError;
  const raw = toRecord(apiError.raw);
  const detail = toRecord(apiError.detail) ?? toRecord(raw?.detail) ?? {};
  const message = typeof apiError.message === 'string' ? apiError.message : '';
  const code = typeof apiError.code === 'string' ? apiError.code : undefined;
  return { message, code, detail };
};

export const toSubscriptionDraft = (sub: Subscription) => {
  let mode: UiMode = 'fixed';
  if (sub.position_mode === 'fixed_amount') mode = 'fixed_amount';
  if (sub.position_mode === 'fixed') mode = 'fixed';

  const safePct =
    sub.position_mode === 'fixed'
      ? (sub.position_pct ?? (sub.position_value > 0 && sub.position_value <= 1 ? sub.position_value : 0.1))
      : 0.1;

  return {
    accountId: String(sub.account_id),
    positionMode: mode,
    positionValue: mode === 'fixed_amount' ? Number(sub.position_value || 1) : 100,
    positionPct: mode === 'fixed' ? safePct : 0.1,
    leverage: sub.leverage || 50,
  };
};
