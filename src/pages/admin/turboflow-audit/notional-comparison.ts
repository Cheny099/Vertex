import { displayNumber } from '@/lib/presentation';

export function notionalComparison(detail: Record<string, unknown>) {
  const local = displayNumber(detail.local_notional);
  const remote = displayNumber(detail.tf_expected_notional);
  return {
    local,
    remote,
    difference: local === null || remote === null ? null : displayNumber(local - remote),
    localQty: displayNumber(detail.local_qty),
    remoteQty: displayNumber(detail.tf_picked_qty),
  };
}

export function auditMoney(value: number | null, signed = false): string {
  if (value === null) return '—';
  const rounded = Number(value.toFixed(2));
  const sign = rounded < 0 ? '-' : signed && rounded > 0 ? '+' : '';
  return `${sign}$${Math.abs(rounded).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
