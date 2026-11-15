import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ChangeEvent, PropsWithChildren } from 'react';
import type { TFunction } from 'i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Account } from '@/api';
import { useSettingsAccountActions } from './useSettingsAccountActions';

const mocks = vi.hoisted(() => ({ create: vi.fn(), error: vi.fn(), status: vi.fn().mockResolvedValue({ status: 'ok' }) }));
vi.mock('@/api', () => ({ accountApi: { create: mocks.create, getStatus: mocks.status } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { exists: () => false } }) }));
vi.mock('sonner', () => ({ toast: { error: mocks.error } }));
const t = ((key: string) => key) as TFunction;
const accounts: Account[] = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1, name: 'existing', exchange: index < 12 ? 'gate_futures' : 'turboflow',
  type: 'real', is_active: index % 2 === 0, created_at: '', updated_at: '',
}));
const clients: QueryClient[] = [];
function wrapper({ children }: PropsWithChildren) {
  const client = clients[clients.length - 1];
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); vi.clearAllMocks(); });

describe('server-owned account limits', () => {
  it('allows a valid form despite other exchanges/inactive accounts, and preserves the server limit response', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    clients.push(client);
    mocks.create.mockRejectedValue(Object.assign(new Error("Accounts limit reached for exchange='week' (max=42)"), { status: 409 }));
    const { result } = renderHook(() => useSettingsAccountActions({ accounts, t, invalidateAccountData: vi.fn() }), { wrapper });
    act(() => result.current.addAccountDialogProps.onExchangeChange('week'));
    act(() => result.current.addAccountDialogProps.onNameChange({ target: { value: 'New account' } } as ChangeEvent<HTMLInputElement>));
    expect(result.current.addAccountDialogProps.canSubmit).toBe(true);
    act(() => result.current.addAccountDialogProps.onCreate());
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ name: 'New account', exchange: 'week' });
    expect(mocks.create.mock.calls[0][0]).not.toHaveProperty('api_secret');
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Accounts limit reached for exchange='week' (max=42)"));
  });
});
