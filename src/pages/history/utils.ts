import type { Order } from '@/api';
import type { TurboFlowOrderItem } from '@/api/types';

const parseNum = (val: unknown) => {
  if (val === undefined || val === null || val === '' || val === '-' || val === '--') return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
};

const toStringSafe = (val: unknown): string | undefined =>
  typeof val === 'string' && val.trim() ? val : undefined;

/**
 * `order_way` is the only direction signal TurboFlow orders carry.
 *
 * The two branches that used to precede it - `item.side` and `item.direction` - were dead:
 * `/turboflow/orders` is declared `response_model=TurboFlowOrderListResponse`
 * (routes/turboflow.py:19), and `TurboFlowOrderItem` (schemas/turboflow_order.py) declares neither
 * field and sets no `extra = "allow"` (its sibling turboflow_position.py:11-12 does, which is what
 * makes the omission look deliberate), so pydantic strips both before the payload leaves the
 * server. Reading them made this look like `order_way` was a last resort rather than the source.
 *
 * The legend is at services/turboflow/adapter.py:22-26 - 1 开多, 2 平空, 3 开空, 4 平多 - and the
 * column this feeds is labelled 买入/卖出, an order side rather than a position direction. Closing a
 * short is a buy: the backend computes exactly that for the same operation on system orders,
 * `SELL if pos_side == "long" else BUY` (routes/admin_ops.py:711). So 1 and 2 are both buys, and
 * `order_way === 1 ? 'buy' : 'sell'` printed every close-short as a sale.
 *
 * Only that one value changes here. `order_way` is `int | None`, and null and unknown values keep
 * resolving to 'sell', absent keeps resolving to 'buy' - unchanged, and not something this has any
 * evidence about.
 */
const resolveSide = (item: TurboFlowOrderItem) => {
  if (item.order_way !== undefined) {
    return item.order_way === 1 || item.order_way === 2 ? 'buy' : 'sell';
  }
  return 'buy';
};

/**
 * TurboFlow does not send a base quantity. It sends notionals, and the base quantity is derived.
 *
 * `done_size / deal_price` is the backend's own derivation and the only one reproduced here.
 * services/exchanges/execution_extractors.py:152-155 computes exactly that as `qty_from_size`
 * (`qty_source = "done_size_div_price"`), and the audit layer consumes it as the base quantity -
 * `_extract_tf_execution_metrics` (audit/turboflow_audit.py:340-380) takes `executed_qty` from the
 * same extractor.
 *
 * Two fields are deliberately NOT used, and both would look reasonable:
 *
 * - `done_vol` is the **margin**, not a notional. `_tf_vol_mode()`
 *   (turboflow/_internal/service_utils.py:595-603) defaults to "margin" - `vol=保证金` - and
 *   service_core.py:886-893 sends `submit_margin = submit_notional / leverage` as `vol` in that
 *   mode. The audit layer names it accordingly: `margin_usd = safe_float(raw_meta.get("done_vol"))`
 *   (turboflow_audit.py:352), kept as a field distinct from the notional. Dividing it by price
 *   yields quantity ÷ leverage - a plausible-looking coin figure that is silently 20x low on a 20x
 *   position, which is worse than the obviously-wrong USD number it would replace. The extractor
 *   never divides it by price either; it uses it only as a last-resort notional and leaves qty
 *   unset.
 * - `done_amount` is ambiguous. The same extractor treats it as either a base quantity or a
 *   notional and disambiguates against `done_size / price` with a 2% tolerance
 *   (execution_extractors.py:162-183). Reproducing that heuristic in the browser is not worth the
 *   chance of reading it backwards.
 *
 * So a row that carries neither a positive `done_size` nor a price renders '--'. That is narrower
 * than what the backend can quantify, and deliberately so: a blank beats a number whose unit this
 * side cannot establish.
 *
 * The column is `history:table.amount`, which is 数量 - a quantity - and is filled for system
 * orders from `executed_qty`, a base quantity. Putting `done_vol` there, as this used to, printed a
 * margin figure in USD under a coin-quantity header.
 */
const resolveQuantity = (item: TurboFlowOrderItem, price: number | undefined) => {
  if (price === undefined || price <= 0) return undefined;
  const notional = parseNum(item.done_size);
  if (notional === undefined || notional <= 0) return undefined;
  // Trimmed to 8 significant digits. The quotient is a derived value, and printing it raw asserts
  // 17 digits of precision it does not have - 100 / 94512.3 renders as 0.0010580633420200333 in a
  // cell with no formatter. 8 is finer than any exchange's lot size.
  return Number((notional / price).toPrecision(8));
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
  const executedPrice = parseNum(item.deal_price ?? item.price ?? item.avg_price);

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
    price: executedPrice,
    quantity: resolveQuantity(item, executedPrice),
    realized_pnl: parseNum(item.done_pnl ?? item.realized_pnl ?? item.profit),
    status: item.order_status || item.status || 'UNKNOWN',
  } as Order;
};
