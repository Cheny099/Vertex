import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useAccountStatusListModel } from './useAccountStatusListModel';
const getStatus = vi.hoisted(() => vi.fn());
vi.mock('@/api', () => ({ accountApi: { getStatus }, translateBackendErrorMessage: (value: string) => value }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
let client: QueryClient;
function wrapper({ children }: PropsWithChildren) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
beforeEach(() => { getStatus.mockReset(); client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); });
afterEach(() => { cleanup(); client.clear(); });
it.each(['not_ready', 'failed', 'expired', 'session_busy', 'profile_locked', 'unrecognized_future_status', '', undefined])('never marks %s as healthy', async status => {
  getStatus.mockResolvedValue({ status, last_error: null, detail: {} });
  const { result } = renderHook(() => useAccountStatusListModel([{ id: 7, name: 'Account', is_active: true }]), { wrapper });
  await waitFor(() => expect(result.current.isStatusFetching).toBe(false));
  expect(result.current.accountRows[0].derived.level).not.toBe('ok');
});

it.each(['ok', 'connected', 'api_ready', ' APIREADY '])('recognizes the supported ready status %s', async status => {
  getStatus.mockResolvedValue({ status, last_error: null, detail: { is_ready: true } });
  const { result } = renderHook(() => useAccountStatusListModel([{ id: 7, name: 'Account', is_active: true }]), { wrapper });
  await waitFor(() => expect(result.current.isStatusFetching).toBe(false));
  expect(result.current.accountRows[0].derived.level).toBe('ok');
});

it('does not hide an explicit readiness failure behind ok status', async () => {
  getStatus.mockResolvedValue({ status: 'ok', last_error: null, detail: { is_ready: false } });
  const { result } = renderHook(() => useAccountStatusListModel([{ id: 7, name: 'Account', is_active: true }]), { wrapper });
  await waitFor(() => expect(result.current.isStatusFetching).toBe(false));
  expect(result.current.accountRows[0].derived.level).toBe('warning');
});
