import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import StrategyCreatePage from './StrategyCreatePage';

const mocks = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn(), update: vi.fn(), secret: vi.fn(), toast: vi.fn() }));
vi.mock('@/api', async () => ({
  getStrategySchema: (await vi.importActual<typeof import('@/api/strategy-schema')>('@/api/strategy-schema')).getStrategySchema,
  strategyApi: { get: mocks.get },
  adminApi: { strategies: { create: mocks.create, update: mocks.update, getWebhookSecret: mocks.secret } },
  translateBackendErrorMessage: (value: string) => value,
}));
vi.mock('@/components/ui/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
let client: QueryClient;
const record = { id: 5, name: 'Original', strategy_key: 'source-key', status: 'active', pair: 'BTCUSDT', type: 'signal' };
beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear(); localStorage.clear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mocks.get.mockResolvedValue(record);
  mocks.create.mockResolvedValue({ ...record, id: 10, strategy_key: 'created-key' });
  mocks.secret.mockResolvedValue({ strategy_id: 10, strategy_key: 'created-key', secret: 'test-secret', hint: '' });
});
afterEach(() => { cleanup(); client.clear(); });

function openEditor() {
  const router = createMemoryRouter([
    { path: '/admin/strategies/:id/edit', element: <StrategyCreatePage /> },
    { path: '/admin/strategies/create', element: <StrategyCreatePage /> },
    { path: '/admin/strategies', element: <p>strategy-list</p> },
  ], { initialEntries: ['/admin/strategies/5/edit'] });
  render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>);
  return router;
}

it('seeds a fresh copy when only the copy query parameter changes', async () => {
  const router = openEditor();
  await screen.findByDisplayValue('Original');
  await act(async () => { await router.navigate('/admin/strategies/5/edit?copy=true'); });
  await screen.findByDisplayValue('Original (Copy)');
  expect(screen.queryByDisplayValue('source-key')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'strategies:create.save_btn' }));
  await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
  expect(mocks.create.mock.calls[0][0].strategy_key).not.toBe('source-key');
  expect(mocks.update).not.toHaveBeenCalled();
});

it('clears the previous editor when navigating to create', async () => {
  const router = openEditor();
  await screen.findByDisplayValue('Original');
  await act(async () => { await router.navigate('/admin/strategies/create'); });
  expect(screen.queryByDisplayValue('Original')).toBeNull();
  expect(screen.queryByDisplayValue('source-key')).toBeNull();
  expect((screen.getByPlaceholderText('strategies:create.name_placeholder') as HTMLInputElement).value).toBe('');
});

it('keeps creation successful while the credential dialog retries only the failed read', async () => {
  mocks.secret.mockRejectedValueOnce(new Error('credential service unavailable'));
  const router = openEditor();
  await screen.findByDisplayValue('Original');
  await act(async () => { await router.navigate('/admin/strategies/create'); });
  fireEvent.change(screen.getByPlaceholderText('strategies:create.name_placeholder'), { target: { value: 'New strategy' } });
  fireEvent.click(screen.getByRole('button', { name: 'strategies:create.save_btn' }));
  expect((await screen.findByRole('alert')).textContent).toBe('credential service unavailable');
  expect(screen.getByText('strategies:create.webhook_created_title')).toBeTruthy();
  expect(screen.queryByText('strategies:create.secret_json_label')).toBeNull();
  expect((screen.getByRole('button', { name: 'strategies:create.save_btn', hidden: true }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'common:retry' }));
  await screen.findByText('strategies:create.secret_json_label');
  expect(screen.queryByRole('alert')).toBeNull();
  expect(mocks.create).toHaveBeenCalledTimes(1);
  expect(mocks.secret.mock.calls).toEqual([[10], [10]]);
  fireEvent.click(screen.getByRole('button', { name: 'common:done' }));
  await screen.findByText('strategy-list');
});
