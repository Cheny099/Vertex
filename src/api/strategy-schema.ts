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

// Dynamic schema generator for i18n
export const getStrategySchema = (t: TFunction) =>
  z.object({
    strategyKey: z.string().optional(),
    name: z.string().min(1, t('strategies:validation.name_required')),
    description: z.string().optional(),
    type: z.string().optional().default('signal'),
    pair: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional().default('active'),
  });

// Deprecated: use getStrategySchema(t) instead
export const strategySchema = strategySchemaBase;
