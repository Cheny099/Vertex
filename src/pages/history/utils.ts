import type { Order } from '@/api';
import type { TurboFlowOrderItem } from '@/api/types';

const parseNum = (val: unknown) => {
  if (val === undefined || val === null || val === '' || val === '-' || val === '--') return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
};

const toStringSafe = (val: unknown): string | undefined =>
  typeof val === 'string' && val.trim() ? val : undefined;

const resolveSide = (item: TurboFlowOrderItem) => {
  const side = toStringSafe(item.side);
  if (side === 'buy' || side === 'sell') return side;
  const direction = toStringSafe(item.direction);
  if (direction) return direction === 'long' ? 'buy' : 'sell';
  if (item.order_way !== undefined) return item.order_way === 1 ? 'buy' : 'sell';
  return 'buy';
};

export const mapTurboFlowOrderToOrder = (
  item: TurboFlowOrderItem,
  selectedTfAccount: string
): Order => {
  const tfIdRaw = item.id ?? item.order_id;
  const tfId = Number(tfIdRaw);
  // TurboFlow ids are 18-19 digit snowflake *strings*: Number() loses precision past 2^53, so
  // two adjacent ids collapse onto one value. `id` stays numeric for the Order contract, but the
  // original string is preserved for anything that needs to tell two rows apart (React keys).
  const tfRowKey = toStringSafe(tfIdRaw) ?? (tfIdRaw != null ? String(tfIdRaw) : undefined);

  return {
    ...item,
    tf_row_key: tfRowKey,
    id: Number.isFinite(tfId) ? tfId : 0,
    created_at: item.created_at || item.open_time,
    updated_at: item.updated_at || item.open_time,
    symbol: toStringSafe(item.symbol) || toStringSafe(item.pair) || toStringSafe(item.pair_id) || '--',
    side: resolveSide(item),
    // Deliberately the *selected local* account id, not item.account_id: the backend route keys on
    // accounts.id (turboflow.py: `account_id: int`) while TurboFlow's own account_id field is the
    // exchange UID, which verify_service compares against account.name. Those are different id
    // spaces, and every consumer here - the account filter in useHistoryModel and the name lookup
    // in HistoryTradesTable - expects the local one. Stale rows from a previously selected account
    // are handled by the account_scope guard in useHistoryQueries, not here.
    account_id: parseNum(selectedTfAccount) ?? parseNum(item.account_id) ?? 0,
    price: parseNum(item.deal_price ?? item.price ?? item.avg_price),
    quantity: parseNum(item.done_vol ?? item.quantity ?? item.amount ?? item.done_amount),
    realized_pnl: parseNum(item.done_pnl ?? item.realized_pnl ?? item.profit),
    status: item.order_status || item.status || 'UNKNOWN',
  } as Order;
};
