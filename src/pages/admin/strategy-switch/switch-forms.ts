import { z } from 'zod';

const id = z.number().int().positive().safe();
const symbol = z.string().trim().min(2).transform(value => value.toUpperCase());

export const singleSwitchFormSchema = z.object({
  account_id: id,
  symbol,
  from_subscription_id: id,
  to_subscription_id: id,
  handover_mode: z.enum(['FLAT_THEN_SWITCH', 'KEEP_POSITION_ADOPT']),
});

export const bulkSwitchFormSchema = z.object({
  from_strategy_id: id,
  to_strategy_id: id,
  symbol,
  handover_mode: z.literal('FLAT_THEN_SWITCH'),
});
