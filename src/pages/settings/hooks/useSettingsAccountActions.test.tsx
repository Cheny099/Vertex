import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ChangeEvent, PropsWithChildren } from 'react';
import type { TFunction } from 'i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Account } from '@/api';
import { useSettingsAccountActions } from './useSettingsAccountActions';

const mocks = vi.hoisted(() => ({ create: vi.fn(), verify: vi.fn(), error: vi.fn(), success: vi.fn(), promise: vi.fn(), status: vi.fn().mockResolvedValue({ status: 'ok' }) }));
vi.mock('@/api', () => ({ accountApi: { create: mocks.create, verify: mocks.verify, getStatus: mocks.status } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { exists: () => false } }) }));
vi.mock('sonner', () => ({ toast: { error: mocks.error, success: mocks.success, promise: mocks.promise } }));
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
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); mocks.create.mockReset(); });
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); vi.clearAllMocks(); localStorage.clear(); sessionStorage.clear(); });

describe('server-owned account limits', () => {
  it('keeps a reopened form intact when the previous create completes and prevents duplicate confirmation', async () => {
    clients.push(new QueryClient());
    let resolve!: (value: unknown) => void;
    mocks.create.mockReturnValue(new Promise(done => { resolve = done; }));
    const { result } = renderHook(() => useSettingsAccountActions({ accounts: [], t, invalidateAccountData: vi.fn() }), { wrapper });
    act(() => { result.current.handleOpenAddAccount(); result.current.addAccountDialogProps.onExchangeChange('week'); });
    act(() => result.current.addAccountDialogProps.onNameChange({ target: { value: 'Account A' } } as ChangeEvent<HTMLInputElement>));
    act(() => { result.current.addAccountDialogProps.onCreate(); result.current.addAccountDialogProps.onCreate(); });
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    act(() => result.current.addAccountDialogProps.onClose());
    act(() => result.current.handleOpenAddAccount());
    act(() => result.current.addAccountDialogProps.onNameChange({ target: { value: 'Draft B' } } as ChangeEvent<HTMLInputElement>));
    await act(async () => resolve({ id: 7, name: 'Account A', exchange: 'week' }));
    expect(result.current.addAccountDialogProps.open).toBe(true);
    expect(result.current.addAccountDialogProps.newAccount.name).toBe('Draft B');
  });

  it('does not dispatch a create under a replacement session before the mutation starts', async () => {
    clients.push(new QueryClient());
    const { result } = renderHook(() => useSettingsAccountActions({ accounts: [], t, invalidateAccountData: vi.fn() }), { wrapper });
    act(() => result.current.addAccountDialogProps.onExchangeChange('week'));
    act(() => result.current.addAccountDialogProps.onNameChange({ target: { value: 'Account A' } } as ChangeEvent<HTMLInputElement>));
    act(() => { result.current.addAccountDialogProps.onCreate(); localStorage.setItem('auth_token', 'new-session'); });
    await act(async () => {});
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it('does not automatically verify an old account after its page unmounts', async () => {
    clients.push(new QueryClient());
    let resolve!: (value: unknown) => void;
    mocks.create.mockReturnValue(new Promise(done => { resolve = done; }));
    mocks.verify.mockResolvedValue({ status: 'ok' });
    const { result, unmount } = renderHook(() => useSettingsAccountActions({ accounts: [], t, invalidateAccountData: vi.fn() }), { wrapper });
    act(() => result.current.addAccountDialogProps.onNameChange({ target: { value: 'Account A' } } as ChangeEvent<HTMLInputElement>));
    act(() => result.current.addAccountDialogProps.onApiKeyChange({ target: { value: 'fixture-key' } } as ChangeEvent<HTMLInputElement>));
    act(() => result.current.addAccountDialogProps.onApiSecretChange({ target: { value: 'fixture-secret' } } as ChangeEvent<HTMLInputElement>));
    act(() => result.current.addAccountDialogProps.onCreate());
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    unmount();
    await act(async () => resolve({ id: 7, name: 'Account A', exchange: 'turboflow' }));
    expect(mocks.verify).not.toHaveBeenCalled();
  });
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
