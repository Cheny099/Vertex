import { describe, expect, it } from "vitest";

import type { TurboFlowOrderItem } from "@/api/types";
import { mapTurboFlowOrderToOrder } from "./utils";

const item = (extra: Record<string, unknown>) => extra as unknown as TurboFlowOrderItem;

describe("mapTurboFlowOrderToOrder", () => {
  it("keeps adjacent snowflake ids distinguishable as list keys", () => {
    const a = mapTurboFlowOrderToOrder(item({ id: "485145261101887488" }), "11");
    const b = mapTurboFlowOrderToOrder(item({ id: "485145261101887489" }), "11");

    // Number() cannot separate these two - they both land on 485145261101887500.
    expect(a.id).toBe(b.id);
    // ...so the row key has to come from the original string.
    expect(a.tf_row_key).toBe("485145261101887488");
    expect(b.tf_row_key).toBe("485145261101887489");
    expect(a.tf_row_key).not.toBe(b.tf_row_key);
  });

  // The row's own account_id is TurboFlow's exchange UID, a different id space from accounts.id.
  // The account filter and the account-name lookup both key on the local id, so the selected local
  // account must win.
  it("stamps the selected local account, not the exchange uid on the row", () => {
    const row = mapTurboFlowOrderToOrder(item({ id: "1", account_id: "90183726" }), "22");

    expect(row.account_id).toBe(22);
  });

  it("falls back to the row's value only when no account is selected", () => {
    const row = mapTurboFlowOrderToOrder(item({ id: "1", account_id: 11 }), "");

    expect(row.account_id).toBe(11);
  });

  it("does not turn a zero price or pnl into undefined", () => {
    const row = mapTurboFlowOrderToOrder(item({ id: "1", deal_price: 0, done_pnl: 0 }), "22");

    expect(row.price).toBe(0);
    expect(row.realized_pnl).toBe(0);
  });

  // adapter.py:22-26 - 1 开多, 2 平空, 3 开空, 4 平多 - read as an order side, which is what the
  // 买入/卖出 column shows and what the backend computes for the same operation on system orders
  // (admin_ops.py:711: SELL if pos_side == "long" else BUY).
  describe("side", () => {
    const sideOf = (order_way: unknown) =>
      mapTurboFlowOrderToOrder(item({ id: "1", order_way }), "22").side;

    it("reads a close-short as a buy", () => {
      // The one this fixes. `order_way === 1 ? 'buy' : 'sell'` printed every close-short as a sale,
      // which also hid those rows behind the Buy filter and counted them on the wrong stat card.
      expect(sideOf(2)).toBe("buy");
    });

    it("leaves the other three directions alone", () => {
      expect(sideOf(1)).toBe("buy");
      expect(sideOf(3)).toBe("sell");
      expect(sideOf(4)).toBe("sell");
    });

    it("keeps its existing answer for null and for an absent field", () => {
      // order_way is `int | None`. Nothing here is evidence about what an unknown value means, so
      // those answers are deliberately unchanged rather than tidied.
      expect(sideOf(null)).toBe("sell");
      expect(sideOf(99)).toBe("sell");
      expect(mapTurboFlowOrderToOrder(item({ id: "1" }), "22").side).toBe("buy");
    });
  });

  // The column is history:table.amount = 数量, filled from executed_qty for system orders. TurboFlow
  // sends notionals, not quantities: execution_extractors.py:140-200 takes done_size as the notional
  // and derives quantity as done_size / deal_price.
  describe("quantity", () => {
    it("derives a base quantity from the notional and the fill price", () => {
      const row = mapTurboFlowOrderToOrder(
        item({ id: "1", done_size: "600", deal_price: "60000" }),
        "22"
      );

      expect(row.quantity).toBeCloseTo(0.01, 10);
    });

    it("does not print the notional as if it were a quantity", () => {
      // 600 USDT of BTC is 0.01 BTC, not 600 BTC. That is the whole defect.
      const row = mapTurboFlowOrderToOrder(
        item({ id: "1", done_vol: "600", deal_price: "60000" }),
        "22"
      );

      expect(row.quantity).not.toBe(600);
      expect(row.quantity).toBeCloseTo(0.01, 10);
    });

    it("prefers done_size over done_vol, as the extractor does", () => {
      const row = mapTurboFlowOrderToOrder(
        item({ id: "1", done_size: "600", done_vol: "999", deal_price: "60000" }),
        "22"
      );

      expect(row.quantity).toBeCloseTo(0.01, 10);
    });

    it("skips a zero notional rather than treating it as a fill", () => {
      const row = mapTurboFlowOrderToOrder(
        item({ id: "1", done_size: "0", done_vol: "600", deal_price: "60000" }),
        "22"
      );

      expect(row.quantity).toBeCloseTo(0.01, 10);
    });

    it("renders nothing rather than a wrong number when it cannot derive one", () => {
      // No price to divide by, or nothing filled yet. A blank beats a figure in the wrong unit.
      expect(mapTurboFlowOrderToOrder(item({ id: "1", done_size: "600" }), "22").quantity).toBeUndefined();
      expect(
        mapTurboFlowOrderToOrder(item({ id: "1", done_size: "600", deal_price: "0" }), "22").quantity
      ).toBeUndefined();
      expect(
        mapTurboFlowOrderToOrder(item({ id: "1", deal_price: "60000" }), "22").quantity
      ).toBeUndefined();
    });

    it("ignores done_amount, which the backend treats as ambiguous", () => {
      // execution_extractors.py disambiguates done_amount against done_size/price with a 2%
      // tolerance because it can be either a quantity or a notional. Guessing in the browser is
      // how it gets read backwards.
      const row = mapTurboFlowOrderToOrder(
        item({ id: "1", done_amount: "0.5", deal_price: "60000" }),
        "22"
      );

      expect(row.quantity).toBeUndefined();
    });
  });
});
