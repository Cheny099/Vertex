import { z } from 'zod';
import { finiteNumber } from '../response-validation';

// Admin list items are summaries, not user trade records. In particular, they do not
// provide executed quantities or execution prices (see issue #47's contract evidence).
export const adminOrderSummarySchema = z.object({
  id: z.number().int().positive(),
  account_id: z.number().int().positive(),
  symbol: z.string(),
  side: z.string(),
  status: z.string(),
  quantity: finiteNumber,
  price: finiteNumber.nullish(),
  exchange: z.string().nullish(),
  action: z.string().nullish(),
  strategy_id: z.number().nullish(),
  error_message: z.string().nullish(),
  last_error: z.string().nullish(),
});

export const adminOrderDetailSchema = adminOrderSummarySchema.extend({
  executed_price: finiteNumber.nullish(),
  tf_order_id: z.union([z.string(), z.number()]).nullish(),
});

export const adminOrderListSchema = z.object({
  items: z.array(adminOrderSummarySchema),
  total: z.number().int().nonnegative(),
});

export type AdminOrderSummary = z.infer<typeof adminOrderSummarySchema>;
export type AdminOrderDetail = z.infer<typeof adminOrderDetailSchema>;

export interface ClosePositionRequest {
  account_id: number;
  symbol: string;
  pos_side: 'long' | 'short';
  position_id?: string;
  qty?: number;
  reason?: string;
}
