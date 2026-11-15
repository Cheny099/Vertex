import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Strategy, Subscription } from '@/api';
import type { StrategySubscriptionDraft } from './useStrategyDetailState';
import { useStrategySubscriptionActions } from './useStrategySubscriptionActions';

const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), delete: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/api', () => ({ subscriptionApi: mocks }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));
let client: QueryClient;
const props = () => ({ strategyId: 5, strategy: { id: 5, strategy_key: 'strategy-5' } as Strategy,
  fixedAmountMax: null, editingSub: null as Subscription | null, editorId: 0,
  newSub: { accountId: '7', positionMode: 'fixed_amount', positionValue: 100, positionPct: 0.1, leverage: 50 } as StrategySubscriptionDraft,
  setIsAddSubOpen: vi.fn(), setEditingSub: vi.fn(), setLegalError: vi.fn(), setIsInviteModalOpen: vi.fn(), t: (key: string) => key });
function wrapper({ children }: PropsWithChildren) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
beforeEach(() => { vi.clearAllMocks(); Object.values(mocks).slice(0, 3).forEach(mock => mock.mockReset().mockReturnValue(new Promise(() => {}))); client = new QueryClient(); });
afterEach(() => { cleanup(); client.clear(); });

it('submits only once for a same-render double confirmation', async () => {
  const { result } = renderHook(() => useStrategySubscriptionActions(props()), { wrapper });
  act(() => { result.current.handleSubmitSub(); result.current.handleSubmitSub(); });
  await waitFor(() => expect(mocks.create).toHaveBeenCalled());
  expect(mocks.create).toHaveBeenCalledTimes(1);
});

it('keeps the originally selected subscription when the editor changes before dispatch', async () => {
  const initial = { ...props(), editingSub: { id: 11, strategy_id: 5, account_id: 7 } as Subscription };
  const { result, rerender } = renderHook(value => useStrategySubscriptionActions(value), { wrapper, initialProps: initial });
  act(() => result.current.handleSubmitSub());
  rerender({ ...initial, editingSub: { id: 12, strategy_id: 5, account_id: 8 } as Subscription });
  await waitFor(() => expect(mocks.update).toHaveBeenCalled());
  expect(mocks.update.mock.calls[0][0]).toBe(11);
});

it('does not close a newly selected editor when an earlier save completes', async () => {
  let resolve!: (value: unknown) => void;
  mocks.update.mockReturnValue(new Promise(done => { resolve = done; }));
  const initial = { ...props(), editingSub: { id: 11, strategy_id: 5, account_id: 7 } as Subscription };
  const { result, rerender } = renderHook(value => useStrategySubscriptionActions(value), { wrapper, initialProps: initial });
  act(() => result.current.handleSubmitSub());
  await waitFor(() => expect(mocks.update).toHaveBeenCalled());
  rerender({ ...initial, editingSub: { id: 12, strategy_id: 5, account_id: 8 } as Subscription });
  await act(async () => resolve({ id: 11 }));
  expect(initial.setIsAddSubOpen).not.toHaveBeenCalled();
  expect(initial.setEditingSub).not.toHaveBeenCalled();
});

const legalError = { code: 'LEGAL_ACCEPTANCE_REQUIRED', message: 'Read disclosure', detail: { doc_key: 'auto_trade_notice', required_version: '2' } };

it('retries the original immutable request after legal acceptance', async () => {
  mocks.create.mockRejectedValueOnce(legalError).mockResolvedValue({ id: 20 });
  const initial = props();
  const { result, rerender } = renderHook(value => useStrategySubscriptionActions(value), { wrapper, initialProps: initial });
  act(() => result.current.handleSubmitSub());
  await waitFor(() => expect(initial.setLegalError).toHaveBeenCalledWith({ docKey: 'auto_trade_notice', version: '2' }));
  rerender({ ...initial, newSub: { ...initial.newSub, positionValue: 900 } });
  act(() => { result.current.handleLegalAccepted(); result.current.handleLegalAccepted(); });
  await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(2));
  expect(mocks.create.mock.calls[1][0]).toEqual(mocks.create.mock.calls[0][0]);
  expect(mocks.create.mock.calls[1][0].position_value).toBe(100);
});

it.each(['cancel', 'new-editor'])('cannot resume an obsolete legal request after %s', async reason => {
  mocks.create.mockRejectedValue(legalError);
  const initial = props();
  const { result, rerender } = renderHook(value => useStrategySubscriptionActions(value), { wrapper, initialProps: initial });
  act(() => result.current.handleSubmitSub());
  await waitFor(() => expect(initial.setLegalError).toHaveBeenCalled());
  if (reason === 'cancel') act(() => result.current.handleLegalOpenChange(false));
  else rerender({ ...initial, editorId: 1 });
  act(() => result.current.handleLegalAccepted());
  expect(mocks.create).toHaveBeenCalledTimes(1);
});

it('does not invent a document version when the server omitted it', async () => {
  mocks.create.mockRejectedValue({ ...legalError, detail: { doc_key: 'auto_trade_notice' } });
  const initial = props();
  const { result } = renderHook(() => useStrategySubscriptionActions(initial), { wrapper });
  act(() => result.current.handleSubmitSub());
  await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('common:invalid_api_response'));
  expect(initial.setLegalError).not.toHaveBeenCalled();
});

it.each([null, 0, -1, NaN, Infinity])('rejects invalid fixed amounts (%s) instead of silently submitting a fallback', async positionValue => {
  const initial = props();
  initial.newSub.positionValue = positionValue;
  const { result } = renderHook(() => useStrategySubscriptionActions(initial), { wrapper });
  act(() => result.current.handleSubmitSub());
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.error).toHaveBeenCalledWith('strategies:invalid_subscription');
});

it('rejects an edit belonging to a different strategy', () => {
  const initial = { ...props(), editingSub: { id: 11, strategy_id: 4, account_id: 7 } as Subscription };
  const { result } = renderHook(() => useStrategySubscriptionActions(initial), { wrapper });
  act(() => result.current.handleSubmitSub());
  expect(mocks.update).not.toHaveBeenCalled();
});

it('suppresses late errors after cancellation while allowing a later submission', async () => {
  let reject!: (error: unknown) => void;
  mocks.create.mockReturnValueOnce(new Promise((_, fail) => { reject = fail; })).mockResolvedValue({ id: 20 });
  const initial = props();
  const { result, rerender } = renderHook(value => useStrategySubscriptionActions(value), { wrapper, initialProps: initial });
  act(() => result.current.handleSubmitSub());
  rerender({ ...initial, editorId: 1 });
  await act(async () => reject(legalError));
  expect(initial.setLegalError).not.toHaveBeenCalled();
  expect(result.current.isSubmitting).toBe(false);
  act(() => result.current.handleSubmitSub());
  await waitFor(() => expect(mocks.success).toHaveBeenCalled());
});

it('synchronously prevents duplicate deletions of the same subscription', async () => {
  const { result } = renderHook(() => useStrategySubscriptionActions(props()), { wrapper });
  act(() => { void result.current.handleRemoveSub(11); void result.current.handleRemoveSub(11); });
  expect(mocks.delete).toHaveBeenCalledExactlyOnceWith(11);
});
