import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRecentTradesModel } from './useRecentTradesModel';

const mocks = vi.hoisted(() => ({
  listAccounts: vi.fn(),
  listOrders: vi.fn(),
  getTfOrders: vi.fn(),
}));

vi.mock('@/api', () => ({
  accountApi: { list: mocks.listAccounts },
  orderApi: { list: mocks.listOrders },
  turboflowApi: { getOrders: mocks.getTfOrders },
  translateBackendErrorMessage: (message: string) => message,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

let queryClient: QueryClient;

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const tfAccount = { id: 7, exchange: 'turboflow', is_active: true, deleted_at: null };

describe('useRecentTradesModel with TurboFlow rows', () => {
  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mocks.listAccounts.mockResolvedValue([tfAccount]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const firstRow = async () => {
    const { result } = renderHook(() => useRecentTradesModel(), { wrapper });
    await waitFor(() => expect(result.current.normalizedTrades).toHaveLength(1));
    return result.current.normalizedTrades[0];
  };

  it('reads a close-short as a buy, like the history view', async () => {
    // order_way 2 is 平空 - closing a short, which the exchange executes as a buy. This hook used
    // to carry its own `order_way === 1 ? 'buy' : 'sell'`, so it printed the row as a sale.
    mocks.getTfOrders.mockResolvedValue({
      data: [{ id: '485145261101887488', order_way: 2, done_size: '600', deal_price: '60000' }],
    });

    expect((await firstRow()).side).toBe('buy');
  });

  it('shows a base quantity, not the USD notional', async () => {
    // 600 USDT of BTC at 60000 is 0.01 BTC. The volume column used to read done_vol straight out.
    mocks.getTfOrders.mockResolvedValue({
      data: [{ id: '1', order_way: 1, done_vol: '600', deal_price: '60000' }],
    });

    const row = await firstRow();
    expect(row.volumeValue).not.toBe('600');
    expect(Number(row.volumeValue)).toBeCloseTo(0.01, 10);
  });

  it('keys rows on the snowflake string so adjacent ids stay distinct', async () => {
    // Number() collapses these two onto the same value; the mapper keeps the original string.
    mocks.getTfOrders.mockResolvedValue({
      data: [
        { id: '485145261101887488', order_way: 1, done_size: '600', deal_price: '60000' },
        { id: '485145261101887489', order_way: 1, done_size: '600', deal_price: '60000' },
      ],
    });

    const { result } = renderHook(() => useRecentTradesModel(), { wrapper });
    await waitFor(() => expect(result.current.normalizedTrades).toHaveLength(2));

    const [a, b] = result.current.normalizedTrades;
    expect(a.key).toBe('485145261101887488');
    expect(a.key).not.toBe(b.key);
  });

  it('still reads system orders when no TurboFlow account is present', async () => {
    mocks.listAccounts.mockResolvedValue([{ id: 3, exchange: 'binance_futures', is_active: true, deleted_at: null }]);
    mocks.listOrders.mockResolvedValue({
      items: [
        {
          id: 42,
          side: 'sell',
          symbol: 'ETHUSDT',
          executed_price: 3000,
          executed_qty: 2,
          realized_pnl: -12.5,
          status: 'COMPLETED',
          created_at: '2026-08-05T00:00:00+00:00',
        },
      ],
    });

    const row = await firstRow();
    expect(row.side).toBe('sell');
    expect(row.symbolText).toBe('ETHUSDT');
    expect(row.volumeValue).toBe(2);
    expect(row.profit).toBe(-12.5);
    expect(mocks.getTfOrders).not.toHaveBeenCalled();
  });
});
