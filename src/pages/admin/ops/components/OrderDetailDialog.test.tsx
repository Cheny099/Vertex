import { cleanup, render, screen } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderDetailDialog } from './OrderDetailDialog';

const summary = { id: 12, account_id: 7, symbol: 'BTCUSDT', side: 'buy', status: 'COMPLETED', quantity: 2 };
const props = {
  t: ((key: string) => key) as TFunction,
  selectedOrder: summary, isLoadingDetail: false, detailFailed: false, eventsFailed: false,
  onRetryDetail: vi.fn(), onClose: vi.fn(), isLoadingEvents: false, orderEvents: { events: [] },
};
const executionText = () => screen.getByText('admin:exec_price_label').parentElement?.textContent;
beforeEach(() => vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('admin order display', () => {
  it('does not invent a filled quantity or execution price from a summary', () => {
    render(<OrderDetailDialog {...props} />);
    expect(screen.getByText('admin:planned_qty')).toBeDefined();
    expect(screen.queryByText('admin:qty_plan_exec')).toBeNull();
    expect(executionText()).toContain('—');
    expect(screen.queryByText('0')).toBeNull();
  });
  it('uses the detail price, including a real zero', () => {
    render(<OrderDetailDialog {...props} orderDetail={{ ...summary, executed_price: 0 }} />);
    expect(executionText()).toBe('admin:exec_price_label0');
  });
  it('does not display another order or a cached price after a failed refresh', () => {
    const view = render(<OrderDetailDialog {...props} orderDetail={{ ...summary, id: 13, executed_price: 999 }} />);
    expect(executionText()).toContain('—');
    view.rerender(<OrderDetailDialog {...props} detailFailed orderDetail={{ ...summary, executed_price: 999 }} />);
    expect(executionText()).toContain('—');
    expect(screen.getByRole('alert').textContent).toContain('admin:order_detail_failed');
  });
});
