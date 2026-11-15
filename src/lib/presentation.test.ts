import { describe, expect, it } from 'vitest';
import { displayNumber, formatOptionalDate, pnlPresentation } from './presentation';
import { auditMoney, notionalComparison } from '@/pages/admin/turboflow-audit/notional-comparison';

describe('financial presentation', () => {
  it.each([0, -0, 0.004, -0.004])('renders displayed zero neutrally (%s)', value => {
    expect(pnlPresentation(value)).toEqual({ text: '0.00', className: 'text-muted-foreground' });
  });
  it('preserves profit, loss, and missing values', () => {
    expect(pnlPresentation(12.5)).toEqual({ text: '+12.50', className: 'text-profit' });
    expect(pnlPresentation(-12.5)).toEqual({ text: '-12.50', className: 'text-loss' });
    expect(pnlPresentation(null).text).toBe('—');
  });
  it.each([null, undefined, '', ' ', NaN, Infinity, {}, false])('does not coerce invalid/missing values to zero (%s)', value => {
    expect(displayNumber(value)).toBeNull();
  });
  it('uses the quantity field and computes local minus remote in either direction', () => {
    const detail = { local_notional: '200', tf_expected_notional: 100, abs_diff: 100, local_qty: 0, tf_picked_qty: 7, tf_done_size: 999 };
    expect(notionalComparison(detail)).toEqual({ local: 200, remote: 100, difference: 100, localQty: 0, remoteQty: 7 });
    expect(auditMoney(notionalComparison(detail).difference, true)).toBe('+$100.00');
    expect(auditMoney(notionalComparison({ ...detail, local_notional: 0 }).difference, true)).toBe('-$100.00');
  });
  it('distinguishes a real remote zero from an unavailable amount or quantity', () => {
    expect(notionalComparison({ local_notional: 0, tf_expected_notional: 0 }).difference).toBe(0);
    expect(auditMoney(0)).toBe('$0.00');
    expect(notionalComparison({ local_notional: 5, tf_done_size: 100 })).toMatchObject({ remote: null, difference: null, remoteQty: null });
    expect(auditMoney(null)).toBe('—');
  });
  it('does not render Invalid Date for optional publication timestamps', () => {
    expect(formatOptionalDate(undefined, 'zh')).toBe('—');
    expect(formatOptionalDate('invalid', 'en')).toBe('—');
    expect(formatOptionalDate('2026-01-15T12:00:00Z', 'en', true)).toBe('1/15/2026');
  });
});
