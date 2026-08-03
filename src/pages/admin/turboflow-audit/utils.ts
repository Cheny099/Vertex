import { format } from 'date-fns';

export const SUMMARY_ORDER = [
  'mode',
  'accounts_scanned',
  'orders_scanned',
  'items_total',
  'local_not_found_count',
  'completed_missing_tf_order_id_count',
  'external_missing_local',
  'legacy_missing_exchange',
  'completed_no_exec_price',
  'close_no_pnl',
  'status_mismatch_count',
  'mismatch_notional_count',
  'backfilled_orders_count',
  'backfilled_notional_count',
] as const;

export const SUMMARY_KIND_MAP: Record<string, string> = {
  local_not_found: 'LOCAL_NOT_FOUND_IN_ORDER_LIST',
  local_not_found_count: 'LOCAL_NOT_FOUND_IN_ORDER_LIST',
  completed_missing_tf_order_id: 'LOCAL_COMPLETED_MISSING_TF_ORDER_ID',
  completed_missing_tf_order_id_count: 'LOCAL_COMPLETED_MISSING_TF_ORDER_ID',
  external_missing_local: 'EXTERNAL_MISSING_LOCAL',
  completed_no_exec_price: 'COMPLETED_NO_EXEC_PRICE',
  close_no_pnl: 'CLOSE_NO_PNL',
  status_mismatch: 'STATUS_MISMATCH',
  status_mismatch_count: 'STATUS_MISMATCH',
  mismatch_notional: 'NOTIONAL_MISMATCH',
  mismatch_notional_count: 'NOTIONAL_MISMATCH',
  backfilled_orders_count: 'FIELDS_BACKFILLED',
  backfilled_notional_count: 'FIELDS_BACKFILLED',
  legacy_missing_exchange: 'LEGACY_MISSING_EXCHANGE',
};

export const formatSecure = (dateValue: unknown, fmt: string) => {
  if (!dateValue) return '-';
  try {
    const d = new Date(dateValue as string | number | Date);
    if (isNaN(d.getTime())) return '-';
    return format(d, fmt);
  } catch {
    return '-';
  }
};

export const safeT = (
  translator: (key: string) => unknown,
  key: string,
  fallback?: string
): string => {
  try {
    const res = translator(key);
    if (typeof res === 'string') return res;
    return fallback || String(key);
  } catch {
    return fallback || String(key);
  }
};

export const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

/**
 * `AuditItem.detail` is `Record<string, unknown>` because its shape varies by item kind, so every
 * field read out of it is `unknown` — which React cannot render. This narrows to the primitives
 * that can be, and yields a dash for anything else rather than crashing on an object.
 */
export const detailText = (value: unknown, fallback = '-'): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value || fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : fallback;
  if (typeof value === 'boolean') return String(value);
  return fallback;
};
