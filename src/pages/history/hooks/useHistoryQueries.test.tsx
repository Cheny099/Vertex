import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHistoryQueries } from './useHistoryQueries';

const mocks = vi.hoisted(() => ({ accounts: vi.fn(), history: vi.fn(), orders: vi.fn() }));
vi.mock('@/api', () => ({
  accountApi: { list: mocks.accounts }, orderApi: { getHistory: mocks.history },
  turboflowApi: { getOrders: mocks.orders },
}));
let client: QueryClient;
function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
const order = { id: 1, account_id: 1, symbol: 'BTCUSDT', side: 'buy', status: 'FAILED' };
const params = () => ({
  viewMode: 'system' as 'system' | 'turboflow', selectedSystemAccount: 'all', selectedTfAccount: '1',
  tfStatus: 'all' as 'all' | 'Filled', systemPage: 1, systemPageSize: 20, tfPage: 1, tfPageSize: 20,
  setSelectedTfAccount: vi.fn(), setTfPage: vi.fn(), queryClient: client,
});
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mocks.accounts.mockResolvedValue([{ id: 1, name: 'Account', exchange: 'turboflow' }]);
  mocks.orders.mockResolvedValue({ data: [], count: 0, page_count: 0, page_num: 1, page_size: 20 });
});
afterEach(() => { cleanup(); client.clear(); onlineManager.setOnline(true); });

describe('history query identity', () => {
  it('does not display page 1 records and has_more as the still-loading page 2', async () => {
    mocks.history.mockImplementation(({ page_num }) => page_num === 1
      ? Promise.resolve({ items: [order], total: 21, has_more: true }) : new Promise(() => {}));
    const { result, rerender } = renderHook(useHistoryQueries, { wrapper, initialProps: params() });
    await waitFor(() => expect(result.current.allTrades).toHaveLength(1));
    rerender({ ...params(), systemPage: 2 });
    expect(result.current.allTrades).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.systemOrdersData?.has_more).not.toBe(true);
    await act(async () => {});
    expect(mocks.history.mock.calls.some(([p]) => p.page_num === 3)).toBe(false);
  });

  it('does not show another account\'s rows while switching the system account filter', async () => {
    mocks.history.mockImplementation(({ account_id }) => account_id === undefined
      ? Promise.resolve({ items: [order], total: 1, has_more: false }) : new Promise(() => {}));
    const { result, rerender } = renderHook(useHistoryQueries, { wrapper, initialProps: params() });
    await waitFor(() => expect(result.current.allTrades).toHaveLength(1));
    rerender({ ...params(), selectedSystemAccount: '2' });
    expect(result.current.allTrades).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('surfaces an account-load error in the real-accounts view instead of an empty history', async () => {
    const error = new Error('account list unavailable');
    mocks.accounts.mockRejectedValue(error);
    const { result } = renderHook(useHistoryQueries, {
      wrapper, initialProps: { ...params(), viewMode: 'turboflow', selectedTfAccount: '' },
    });
    await waitFor(() => expect(client.getQueryState(['accounts'])?.status).toBe('error'));
    expect(result.current.isError).toBe(true);
    expect(result.current.queryError).toBe(error);
  });

  it('does not show unfiltered TurboFlow rows as a pending status filter', async () => {
    mocks.orders.mockImplementation(({ status }) => !status
      ? Promise.resolve({ data: [{ id: 'tf-1', symbol: 'BTCUSDT', status: 'Pending' }], count: 1, page_count: 1 })
      : new Promise(() => {}));
    const initialProps = { ...params(), viewMode: 'turboflow' as const };
    const { result, rerender } = renderHook(useHistoryQueries, { wrapper, initialProps });
    await waitFor(() => expect(result.current.allTrades).toHaveLength(1));
    rerender({ ...initialProps, tfStatus: 'Filled' });
    expect(result.current.allTrades).toEqual([]);
    expect(result.current.tfOrdersData).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('removes cached orders when their last TurboFlow account is removed without spinning forever', async () => {
    mocks.orders.mockResolvedValue({ data: [{ id: 'tf-1', symbol: 'BTCUSDT' }], count: 1, page_count: 1 });
    const { result } = renderHook(useHistoryQueries, { wrapper, initialProps: { ...params(), viewMode: 'turboflow' } });
    await waitFor(() => expect(result.current.allTrades).toHaveLength(1));
    act(() => { client.setQueryData(['accounts'], []); });
    await waitFor(() => expect(result.current.allTrades).toEqual([]));
    expect(result.current.tfOrdersData).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('reports offline rather than an empty dataset or an endless loading state', () => {
    onlineManager.setOnline(false);
    const { result } = renderHook(useHistoryQueries, { wrapper, initialProps: params() });
    expect(result.current.isPaused).toBe(true);
    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(mocks.history).not.toHaveBeenCalled();
  });

  it('uses a prefetched page with its own rows and metadata', async () => {
    mocks.history.mockImplementation(({ page_num }) => Promise.resolve({
      items: [{ ...order, id: page_num }], total: 21, has_more: page_num === 1,
    }));
    const { result, rerender } = renderHook(useHistoryQueries, { wrapper, initialProps: params() });
    await waitFor(() => expect(client.getQueryData(['orders', 'history', 'all', 2, 20])).toBeDefined());
    rerender({ ...params(), systemPage: 2 });
    expect(result.current.allTrades[0].id).toBe(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.systemOrdersData?.has_more).toBe(false);
  });
});
