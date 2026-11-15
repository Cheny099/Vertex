import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStrategyCreateModel } from './useStrategyCreateModel';
import { DEFAULT_STRATEGY_VALUES } from '../utils';

const mocks = vi.hoisted(() => ({
  get: vi.fn(), create: vi.fn(), update: vi.fn(), secret: vi.fn(), toast: vi.fn(), navigate: vi.fn(),
  route: { id: undefined as string | undefined, search: '' },
}));
vi.mock('@/api', async () => ({
  getStrategySchema: (await vi.importActual<typeof import('@/api/strategy-schema')>('@/api/strategy-schema')).getStrategySchema,
  strategyApi: { get: mocks.get },
  adminApi: { strategies: { create: mocks.create, update: mocks.update, getWebhookSecret: mocks.secret } },
  translateBackendErrorMessage: (value: string) => value,
}));
vi.mock('@/components/ui/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: mocks.route.id }), useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(mocks.route.search)],
}));

const t = ((key: string) => key) as TFunction;
const draft = { ...DEFAULT_STRATEGY_VALUES, name: 'Momentum', pair: 'BTCUSDT' };
const record = { id: 5, name: 'Momentum', strategy_key: 'sk-5', status: 'active', config: { pair: 'BTCUSDT' } };
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
let client: QueryClient;
function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear(); localStorage.clear();
  mocks.route = { id: undefined, search: '' };
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  mocks.create.mockResolvedValue(record);
  mocks.update.mockResolvedValue(record);
  mocks.get.mockResolvedValue(record);
  mocks.secret.mockResolvedValue({ strategy_id: 5, strategy_key: 'sk-5', secret: 'test-secret', hint: '' });
});
afterEach(() => { cleanup(); client.clear(); });

describe('strategy save lifecycle', () => {
  it.each(['5junk', '0', '-2', '1.5', '9007199254740992'])('rejects the invalid strategy route %s before fetching or saving', async (id) => {
    mocks.route.id = id;
    const { result } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
    await act(async () => {});
    expect(mocks.get).not.toHaveBeenCalled();
    expect(result.current.isInitialError).toBe(true);
    act(() => result.current.retryInitialLoad());
    await act(async () => { await result.current.handleSubmit({ ...draft, strategyKey: 'sk-5' }); });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('dispatches one create for two submissions in the same render', async () => {
    const request = deferred<typeof record>();
    mocks.create.mockReturnValue(request.promise);
    const { result } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
    act(() => { result.current.handleSubmit(draft); result.current.handleSubmit(draft); });
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    expect(mocks.create).toHaveBeenCalledTimes(1);
    await act(async () => request.resolve(record));
  });

  it('does not re-create after creation succeeded but reading the secret failed', async () => {
    mocks.secret.mockRejectedValue(new Error('secret unavailable'));
    const { result } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
    await act(async () => { result.current.handleSubmit(draft); });
    await waitFor(() => expect(mocks.secret).toHaveBeenCalledTimes(1));
    await act(async () => { result.current.handleSubmit(draft); });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(result.current.showWebhookDialog).toBe(true);
  });

  it('invalidates the list as soon as a create succeeds, even when the secret cannot load', async () => {
    client.setQueryData(['strategies'], []);
    mocks.secret.mockRejectedValue(new Error('secret unavailable'));
    const { result } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
    await act(async () => { result.current.handleSubmit(draft); });
    await waitFor(() => expect(mocks.secret).toHaveBeenCalledTimes(1));
    expect(client.getQueryState(['strategies'])?.isInvalidated).toBe(true);
  });

  it('does not load credentials after leaving a pending create', async () => {
    const request = deferred<typeof record>();
    mocks.create.mockReturnValue(request.promise);
    const { result, unmount } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
    act(() => { void result.current.handleSubmit(draft); });
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    unmount();
    await act(async () => request.resolve(record));
    expect(mocks.secret).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('does not fetch credentials with a replacement session', async () => {
    localStorage.setItem('auth_token', 'original-session');
    const request = deferred<typeof record>();
    mocks.create.mockReturnValue(request.promise);
    const { result } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
    act(() => { void result.current.handleSubmit(draft); });
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    localStorage.setItem('auth_token', 'replacement-session');
    await act(async () => request.resolve(record));
    expect(mocks.secret).not.toHaveBeenCalled();
    expect(result.current.showWebhookDialog).toBe(false);
  });

  it('does not navigate a new editor when an old update completes', async () => {
    mocks.route.id = '5';
    const request = deferred<typeof record>();
    mocks.update.mockReturnValue(request.promise);
    const { result, rerender } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    act(() => { void result.current.handleSubmit({ ...draft, strategyKey: 'sk-5' }); });
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
    mocks.route.id = '6';
    mocks.get.mockResolvedValue({ ...record, id: 6 });
    rerender();
    await act(async () => request.resolve(record));
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it('refuses an edit response belonging to another strategy', async () => {
    mocks.route.id = '5';
    mocks.get.mockResolvedValue({ ...record, id: 6 });
    const { result } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
    await waitFor(() => expect(result.current.isInitialError).toBe(true));
    await act(async () => { await result.current.handleSubmit({ ...draft, strategyKey: 'sk-5' }); });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('retries just the credential read once, then exposes the saved strategy credentials', async () => {
    mocks.secret.mockRejectedValueOnce(new Error('secret unavailable'));
    const { result } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
    await act(async () => { await result.current.handleSubmit(draft); });
    expect(result.current.isSaved).toBe(true);
    expect(result.current.webhookError).toBe('secret unavailable');
    await act(async () => { result.current.retryWebhook(); result.current.retryWebhook(); });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.secret.mock.calls).toEqual([[5], [5]]);
    expect(result.current.webhookData).toMatchObject({ secret: 'test-secret', strategy_key: 'sk-5' });
    expect(result.current.webhookError).toBe('');
    expect(result.current.isWebhookLoading).toBe(false);
  });

  it('does not accept a secret for another strategy, and does not re-create on retry', async () => {
    mocks.secret.mockResolvedValueOnce({ strategy_id: 6, strategy_key: 'sk-6', secret: 'wrong-secret' });
    const { result } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
    await act(async () => { await result.current.handleSubmit(draft); });
    expect(result.current.isSaved).toBe(true);
    expect(result.current.webhookData).toBeNull();
    expect(result.current.webhookError).toBe('strategies:create.webhook_load_error');
    await act(async () => { result.current.retryWebhook(); });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(result.current.webhookData?.secret).toBe('test-secret');
  });

  it('ignores credentials received after closing the success dialog', async () => {
    const request = deferred<{ strategy_id: number; strategy_key: string; secret: string }>();
    mocks.secret.mockReturnValue(request.promise);
    const { result } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
    act(() => { void result.current.handleSubmit(draft); });
    await waitFor(() => expect(result.current.showWebhookDialog).toBe(true));
    act(() => result.current.closeWebhookDialog(false));
    await act(async () => request.resolve({ strategy_id: 5, strategy_key: 'sk-5', secret: 'late-secret' }));
    expect(result.current.webhookData).toBeNull();
    expect(result.current.showWebhookDialog).toBe(false);
    expect(mocks.navigate).toHaveBeenCalledTimes(1);
  });

  it('allows a corrected submission when the save itself fails', async () => {
    mocks.create.mockRejectedValueOnce({ message: 'invalid strategy name' });
    const { result } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
    await act(async () => { await result.current.handleSubmit(draft); });
    expect(result.current.isSaved).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(mocks.secret).not.toHaveBeenCalled();
    await act(async () => { await result.current.handleSubmit({ ...draft, name: 'Corrected' }); });
    expect(mocks.create).toHaveBeenCalledTimes(2);
    expect(mocks.create.mock.calls[1][0].name).toBe('Corrected');
    expect(mocks.create.mock.calls[1][0].strategy_key).toBe(mocks.create.mock.calls[0][0].strategy_key);
    expect(result.current.form.getValues('strategyKey')).toBe(mocks.create.mock.calls[0][0].strategy_key);
    expect(result.current.isSaved).toBe(true);
  });
});
