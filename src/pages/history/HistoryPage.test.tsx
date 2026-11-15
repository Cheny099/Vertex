import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import HistoryPage from './HistoryPage';
import { useHistoryModel } from './hooks/useHistoryModel';

const mocks = vi.hoisted(() => ({ accounts: vi.fn(), history: vi.fn(), orders: vi.fn() }));
vi.mock('@/api', () => ({
  accountApi: { list: mocks.accounts },
  orderApi: { getHistory: mocks.history, cancel: vi.fn(), retry: vi.fn(), debug: vi.fn() },
  turboflowApi: { getOrders: mocks.orders }, translateBackendErrorMessage: (s: string) => s,
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({
  t: (key: string) => key, i18n: { exists: () => false },
}) }));
let client: QueryClient;
const order = { id: 1, account_id: 1, symbol: 'BTCUSDT', side: 'buy', status: 'FAILED' };
const firstPage = { items: [order], total: 21, has_more: true };
function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mocks.accounts.mockResolvedValue([{ id: 1, name: 'Account', exchange: 'turboflow' }]);
  mocks.orders.mockResolvedValue({ data: [], count: 0, page_count: 0 });
  mocks.history.mockImplementation(({ page_num }) => page_num === 1 ? Promise.resolve(firstPage) : new Promise(() => {}));
});
afterEach(() => { cleanup(); client.clear(); });

it('does not skip a page on same-render clicks or advance using the previous page has_more', async () => {
  const { result } = renderHook(useHistoryModel, { wrapper });
  await waitFor(() => expect(result.current.displayedTrades).toHaveLength(1));
  act(() => { result.current.handleNextPage(); result.current.handleNextPage(); });
  expect(result.current.currentPage).toBe(2);
  expect(result.current.isLoading).toBe(true);
  expect(result.current.displayedTrades).toEqual([]);
  act(() => result.current.handleNextPage());
  expect(result.current.currentPage).toBe(2);
  expect(mocks.history.mock.calls.some(([p]) => p.page_num === 3)).toBe(false);
});

it('renders loading and disables next while the requested page is unresolved', async () => {
  render(<HistoryPage />, { wrapper });
  await screen.findByText('history:table.status_map.failed');
  fireEvent.click(screen.getByRole('button', { name: 'history:pagination.next' }));
  await screen.findByText('common:loading');
  expect(screen.queryByText('history:table.status_map.failed')).toBeNull();
  expect((screen.getByRole('button', { name: 'history:pagination.next' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'history:pagination.prev' }));
  await screen.findByText('history:table.status_map.failed');
});

it('shows a background-refetch error alongside cached rows and recovers through Retry', async () => {
  render(<HistoryPage />, { wrapper });
  await screen.findByText('history:table.status_map.failed');
  mocks.history.mockRejectedValue(new Error('history unavailable'));
  await act(async () => { await client.invalidateQueries({ queryKey: ['orders', 'history', 'all', 1, 20], exact: true }); });
  expect((await screen.findByRole('alert')).textContent).toContain('history unavailable');
  expect(screen.getByText('history:table.status_map.failed')).toBeTruthy();
  mocks.history.mockResolvedValue({ ...firstPage, has_more: false });
  fireEvent.click(screen.getByRole('button', { name: 'common:retry' }));
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  expect(screen.getByText('history:table.status_map.failed')).toBeTruthy();
});
