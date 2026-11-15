import { z } from 'zod';
import i18n from '../i18n';
import { createApiError } from './contracts';

// Do not expose the rejected payload: it can contain account data or API credentials.
export function decodeResponse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw createApiError(i18n.t('common:invalid_api_response'), { code: 'INVALID_API_RESPONSE' });
  }
  return result.data;
}

export const finiteNumber = z.union([
  z.number().finite(),
  z.string().trim().min(1).refine(value => Number.isFinite(Number(value))).transform(Number),
]);
