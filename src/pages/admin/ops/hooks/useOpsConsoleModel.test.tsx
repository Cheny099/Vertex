import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOpsConsoleModel } from './useOpsConsoleModel';

const mocks = vi.hoisted(() => ({ list: vi.fn(), detail: vi.fn(), events: vi.fn(), close: vi.fn() }));
vi.mock('@/api', () => ({
  adminApi: { ops: { listOrders: mocks.list, getOrder: mocks.detail, getOrderEvents: mocks.events, closePosition: mocks.close } },
  translateBackendErrorMessage: (message: string) => message,
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const clients: QueryClient[] = [];
function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  clients.push(client);
  return ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
const summary = { id: 12, account_id: 7, symbol: 'BTCUSDT', side: 'buy', status: 'COMPLETED', quantity: 2 };
beforeEach(() => {
  Object.values(mocks).forEach(mock => mock.mockReset());
  mocks.list.mockResolvedValue({ items: [], total: 0 });
  mocks.events.mockResolvedValue({ events: [] });
});
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });

describe('operations workflows', () => {
  it('loads details on selection and never substitutes a previous order response', async () => {
    let resolveFirst!: (value: unknown) => void;
    mocks.detail.mockImplementation((id: number) => id === 12
      ? new Promise(resolve => { resolveFirst = resolve; })
      : Promise.resolve({ ...summary, id, executed_price: 999 }));
    const { result } = renderHook(useOpsConsoleModel, { wrapper: createWrapper() });
    expect(mocks.detail).not.toHaveBeenCalled();
    act(() => result.current.state.setSelectedOrder(summary));
    await waitFor(() => expect(mocks.detail).toHaveBeenCalledWith(12));
    expect(result.current.orderDetailQuery.data).toBeUndefined();
    act(() => result.current.state.setSelectedOrder({ ...summary, id: 13 }));
    await waitFor(() => expect(result.current.orderDetailQuery.data?.id).toBe(13));
    await act(async () => resolveFirst({ ...summary, executed_price: 123 }));
    expect(result.current.orderDetailQuery.data).toMatchObject({ id: 13, executed_price: 999 });
  });

  it('reports detail failure rather than converting it into a zero execution', async () => {
    mocks.detail.mockRejectedValue(new Error('unavailable'));
    const { result } = renderHook(useOpsConsoleModel, { wrapper: createWrapper() });
    act(() => result.current.state.setSelectedOrder(summary));
    await waitFor(() => expect(result.current.orderDetailQuery.isError).toBe(true));
    expect(result.current.orderDetailQuery.data).toBeUndefined();
  });

  it('submits one full close even if confirmation is clicked twice before rerender', async () => {
    mocks.close.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(useOpsConsoleModel, { wrapper: createWrapper() });
    act(() => result.current.state.setCloseParams({ account_id: '7', symbol: 'BTCUSDT', pos_side: 'long', qty: '', mode: 'all', reason: 'test' }));
    act(() => {
      result.current.handleClosePositionConfirm();
      result.current.handleClosePositionConfirm();
    });
    await waitFor(() => expect(mocks.close).toHaveBeenCalledTimes(1));
    expect(mocks.close).toHaveBeenCalledWith({ account_id: 7, symbol: 'BTCUSDT', pos_side: 'long', reason: 'test' });
  });

  it('does not submit an empty quantity in quantity mode', () => {
    const { result } = renderHook(useOpsConsoleModel, { wrapper: createWrapper() });
    act(() => result.current.state.setCloseParams({ account_id: '7', symbol: 'BTCUSDT', pos_side: 'long', qty: '', mode: 'quantity', reason: 'test' }));
    act(() => result.current.handleClosePositionConfirm());
    expect(mocks.close).not.toHaveBeenCalled();
  });
});
