import { z } from 'zod';
import type { Account, UserProfile } from './types';
import { finiteNumber } from './response-validation';

const optionalText = z.string().nullish().transform(value => value ?? undefined);
const optionalNumber = finiteNumber.nullish().transform(value => value ?? undefined);

export const accountSchema: z.ZodType<Account, z.ZodTypeDef, unknown> = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  type: z.string(),
  exchange: z.string().min(1),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  description: optionalText,
  week_mode: optionalText,
  week_status: optionalText,
  week_last_ok_at: optionalText,
  api_key: optionalText,
  base_url: optionalText,
  lang: optionalText,
  is_ready: z.boolean().nullish().transform(value => value ?? undefined),
  last_login_at: optionalText,
  last_verified_at: optionalText,
  last_error: optionalText,
  deleted_at: optionalText,
  available_margin: optionalNumber,
  equity: optionalNumber,
  wallet_balance: optionalNumber,
  currency: optionalText,
});

export const profileSchema: z.ZodType<UserProfile, z.ZodTypeDef, unknown> = z.object({
  id: z.number().int().positive(),
  email: z.string().min(1),
  full_name: optionalText,
  is_active: z.boolean(),
  is_admin: z.boolean().optional(),
  can_subscribe: z.boolean().optional(),
  external_key: optionalText,
  invite_code_id: z.number().int().nullish(),
  invite_channel: z.string().nullish(),
  username: optionalText,
  phone: optionalText,
  avatar: optionalText,
  timezone: optionalText,
  created_at: z.string(),
  updated_at: z.string(),
});

export const authResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string(),
});
