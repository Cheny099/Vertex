import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { TFunction } from 'i18next';

import { getStrategySchema } from '@/api/strategy-schema';
import { buildStrategyPayload, type StrategyFormValues } from './utils';

const t = ((key: string) => key) as unknown as TFunction;

const form = (overrides: Partial<StrategyFormValues> = {}): StrategyFormValues => ({
    strategyKey: 'sk_existing_live_key',
    name: 'Momentum',
    description: 'unchanged',
    type: 'signal',
    pair: 'BTCUSDT',
    status: 'active',
    ...overrides,
});

describe('buildStrategyPayload strategy_key', () => {
    it('sends the key the form holds when editing', () => {
        const payload = buildStrategyPayload({ form: form(), isEditMode: true });
        expect(payload.strategy_key).toBe('sk_existing_live_key');
    });

    it('does not mint a replacement key when an edited field is empty', () => {
        // The whole point: '' used to be falsy enough to trigger the generator, which rotated a
        // live strategy's webhook identity. It must now come through as-is so the schema can
        // reject it, rather than being quietly replaced.
        const payload = buildStrategyPayload({ form: form({ strategyKey: '' }), isEditMode: true });
        expect(payload.strategy_key).toBe('');
        expect(payload.strategy_key).not.toMatch(/^sk_/);
    });

    it('generates a key when creating with an empty field', () => {
        const payload = buildStrategyPayload({ form: form({ strategyKey: '' }), isEditMode: false });
        expect(payload.strategy_key).toMatch(/^sk_/);
    });

    it('keeps a key the user typed when creating', () => {
        const payload = buildStrategyPayload({ form: form({ strategyKey: 'sk_typed' }), isEditMode: false });
        expect(payload.strategy_key).toBe('sk_typed');
    });
});

describe('getStrategySchema strategyKey', () => {
    const parse = (schema: z.ZodTypeAny, strategyKey: string) =>
        schema.safeParse({ strategyKey, name: 'Momentum', pair: 'BTCUSDT', status: 'active' });

    it('rejects an empty key when editing', () => {
        const result = parse(getStrategySchema(t, { requireStrategyKey: true }), '');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('strategies:validation.strategy_key_required');
        }
    });

    it('rejects a whitespace-only key when editing', () => {
        expect(parse(getStrategySchema(t, { requireStrategyKey: true }), '   ').success).toBe(false);
    });

    it('accepts an empty key when creating', () => {
        expect(parse(getStrategySchema(t), '').success).toBe(true);
    });
});
