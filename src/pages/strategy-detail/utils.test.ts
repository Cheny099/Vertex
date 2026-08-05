import { describe, expect, it } from 'vitest';
import { clamp, clampAmount } from './utils';

describe('clampAmount', () => {
    it('applies both bounds when the available margin is known', () => {
        expect(clampAmount(50, 1000)).toBe(50);
        expect(clampAmount(5000, 1000)).toBe(1000);
        expect(clampAmount(0, 1000)).toBe(1);
    });

    it('applies no upper bound when the available margin is unknown', () => {
        // The whole bug: a null margin used to become a 10,000 ceiling, so no user could set a
        // fixed position larger than that on any account, while the backend accepts anything >= 1.
        expect(clampAmount(50_000, null)).toBe(50_000);
        expect(clampAmount(1_000_000, null)).toBe(1_000_000);
    });

    it('still applies the backend\'s own lower bound when the margin is unknown', () => {
        // routes/subscriptions.py:48-55 rejects < 1, so this is a real rule rather than an
        // invented one and must survive.
        expect(clampAmount(0, null)).toBe(1);
        expect(clampAmount(-5, null)).toBe(1);
    });

    it('does not treat a zero maximum as unknown', () => {
        // `max === null` rather than `!max`: 0 is a real, if degenerate, ceiling and must not
        // silently reopen the field.
        expect(clampAmount(500, 0)).toBe(0);
    });
});

describe('clamp', () => {
    it('is unchanged and still used for the percentage mode', () => {
        expect(clamp(0.5, 0.02, 1)).toBe(0.5);
        expect(clamp(2, 0.02, 1)).toBe(1);
        expect(clamp(0, 0.02, 1)).toBe(0.02);
    });
});
