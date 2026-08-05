import { z } from 'zod';
import type { TFunction } from 'i18next';

// Zod Schema (Frontend Validation)
const strategySchemaBase = z.object({
  strategyKey: z.string().optional(),
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  type: z.string().optional().default('signal'),
  pair: z.string().min(1, 'Required'),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export type StrategyFormData = z.infer<typeof strategySchemaBase>;

interface StrategySchemaOptions {
  /**
   * Edit only. Creating a strategy may leave the key blank - the payload builder generates one -
   * but editing may not: a blank key there used to be read as "generate a replacement", which
   * rotated a live strategy's webhook identity and broke every TradingView alert pointing at it.
   */
  requireStrategyKey?: boolean;
}

// Dynamic schema generator for i18n
export const getStrategySchema = (t: TFunction, { requireStrategyKey = false }: StrategySchemaOptions = {}) =>
  z.object({
    // `refine`, not `.trim().min(1)`. zodResolver hands react-hook-form the *parsed* object
    // (`values: s.raw ? t : e`, and `raw` defaults to false), so a transforming schema rewrites what
    // gets submitted. `.trim()` would therefore silently strip a stored key that has surrounding
    // whitespace - which the create branch does not prevent and the backend does not normalise - and
    // saving an unrelated edit would rotate that strategy's identity. That is the exact failure this
    // field is being guarded against. Validate on the trimmed value; submit the value as typed.
    strategyKey: requireStrategyKey
      ? z
          .string()
          .refine((value) => value.trim().length > 0, {
            message: t('strategies:validation.strategy_key_required'),
          })
      : z.string().optional(),
    name: z.string().min(1, t('strategies:validation.name_required')),
    description: z.string().optional(),
    type: z.string().optional().default('signal'),
    pair: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional().default('active'),
  });

// Deprecated: use getStrategySchema(t) instead
export const strategySchema = strategySchemaBase;
