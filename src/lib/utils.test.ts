import { describe, expect, it } from 'vitest';
import { parseNumberInput } from './utils';

describe('parseNumberInput', () => {
    it('returns null for an empty or mid-edit field', () => {
        // This is what lets a controlled number input be cleared at all. Returning a fallback
        // instead writes it straight back into the box, so the next digit appends to it:
        // "" -> 1 -> typing 5 gives 15. That was #30.
        expect(parseNumberInput('')).toBeNull();
        expect(parseNumberInput('   ')).toBeNull();
        expect(parseNumberInput('-')).toBeNull();
        expect(parseNumberInput('1e')).toBeNull();
        expect(parseNumberInput('abc')).toBeNull();
    });

    it('keeps a deliberate zero', () => {
        expect(parseNumberInput('0')).toBe(0);
    });

    it('clamps only real numbers, never an empty field', () => {
        expect(parseNumberInput('5', { min: 10 })).toBe(10);
        expect(parseNumberInput('50', { max: 20 })).toBe(20);
        expect(parseNumberInput('', { min: 10 })).toBeNull();
    });

    it('truncates only when the caller opts in', () => {
        expect(parseNumberInput('2.5')).toBe(2.5);
        expect(parseNumberInput('2.5', { integer: true })).toBe(2);
    });
});
