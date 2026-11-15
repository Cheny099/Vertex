import type { ClosePositionRequest } from '@/api/admin/operations-contracts';

export interface CloseParams {
  account_id: string;
  symbol: string;
  pos_side: 'long' | 'short';
  mode: 'quantity' | 'all';
  qty: string;
  reason: string;
}

/** Shared by the form and the submit path; invalid input must never become another target. */
export function closePositionRequest(form: CloseParams): ClosePositionRequest | null {
  const accountId = Number(form.account_id);
  const symbol = form.symbol.trim().toUpperCase();
  if (!Number.isSafeInteger(accountId) || accountId <= 0 || !symbol) return null;
  if (form.pos_side !== 'long' && form.pos_side !== 'short') return null;
  if (form.mode !== 'quantity' && form.mode !== 'all') return null;
  const qty = Number(form.qty);
  if (form.mode === 'quantity' && (!Number.isFinite(qty) || qty <= 0)) return null;
  return {
    account_id: accountId, symbol, pos_side: form.pos_side,
    ...(form.mode === 'quantity' ? { qty } : {}),
    reason: form.reason.trim(),
  };
}
