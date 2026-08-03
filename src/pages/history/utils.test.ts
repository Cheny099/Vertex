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

  it("keeps the row's own account rather than the selected one", () => {
    const row = mapTurboFlowOrderToOrder(item({ id: "1", account_id: 11 }), "22");

    expect(row.account_id).toBe(11);
  });

  it("falls back to the selected account when the row carries none", () => {
    const row = mapTurboFlowOrderToOrder(item({ id: "1" }), "22");

    expect(row.account_id).toBe(22);
  });

  it("does not turn a zero price or pnl into undefined", () => {
    const row = mapTurboFlowOrderToOrder(item({ id: "1", deal_price: 0, done_pnl: 0 }), "22");

    expect(row.price).toBe(0);
    expect(row.realized_pnl).toBe(0);
  });
});
