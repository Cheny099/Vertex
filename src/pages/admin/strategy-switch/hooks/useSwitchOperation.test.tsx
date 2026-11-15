import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { singleSwitchFormSchema } from '../switch-forms';
import { useSwitchOperation } from './useSwitchOperation';

const auth = vi.hoisted(() => ({ user: { id: '7' } }));
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => auth }));
const form = { account_id: 7, symbol: 'BTCUSDT', from_subscription_id: 11, to_subscription_id: 12, handover_mode: 'FLAT_THEN_SWITCH' as const };
const receipt = { run_id: 123, status: 'PENDING', idempotent_reused: false };
const preview = vi.fn();
const execute = vi.fn();
const onError = vi.fn();
const onSuccess = vi.fn();
const options = { kind: 'single' as const, initialForm: form, schema: singleSwitchFormSchema,
  reason: 'Original reason', preview, execute, onError, onSuccess,
  invalidFormMessage: 'invalid form', storageErrorMessage: 'storage unavailable' };
beforeEach(() => {
  sessionStorage.clear(); auth.user = { id: '7' }; vi.clearAllMocks();
  preview.mockReset().mockResolvedValue({ plan: 'valid' });
  execute.mockReset().mockResolvedValue(receipt);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('switch operation lifecycle', () => {
  it('requires a current preview for a new execution and invalidates it on edits', async () => {
    const { result } = renderHook(() => useSwitchOperation(options));
    await act(async () => result.current.execute());
    expect(execute).not.toHaveBeenCalled();
    await act(async () => result.current.preview());
    expect(result.current.canExecute).toBe(true);
    act(() => result.current.patchForm({ account_id: 8 }));
    expect(result.current.previewData).toBeUndefined();
    expect(result.current.canExecute).toBe(false);
    await act(async () => result.current.execute());
    expect(execute).not.toHaveBeenCalled();
    await act(async () => result.current.preview());
    await act(async () => result.current.execute());
    expect(execute.mock.calls[0][0].account_id).toBe(8);
  });

  it('discards an old preview response and error after form edits', async () => {
    let resolve!: (value: unknown) => void;
    preview.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    const { result } = renderHook(() => useSwitchOperation(options));
    let pending!: Promise<void>;
    act(() => { pending = result.current.preview(); });
    act(() => result.current.patchForm({ to_subscription_id: 99 }));
    await act(async () => { resolve({ plan: 'stale' }); await pending; });
    expect(result.current.previewData).toBeUndefined();
    expect(result.current.previewPending).toBe(false);
    expect(result.current.canExecute).toBe(false);
    let reject!: (error: unknown) => void;
    preview.mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
    act(() => { pending = result.current.preview(); });
    act(() => result.current.patchForm({ symbol: 'ETHUSDT' }));
    await act(async () => { reject(new Error('stale failure')); await pending; });
    expect(onError).not.toHaveBeenCalled();
  });

  it('locks synchronously and sends only one request before the first rerender', async () => {
    let resolve!: (value: unknown) => void;
    execute.mockReturnValue(new Promise(done => { resolve = done; }));
    const { result } = renderHook(() => useSwitchOperation(options));
    await act(async () => result.current.preview());
    let pending!: Promise<void>;
    act(() => { pending = result.current.execute(); void result.current.execute(); result.current.patchForm({ account_id: 99 }); });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(result.current.form.account_id).toBe(7);
    await act(async () => { resolve(receipt); await pending; });
    await act(async () => result.current.execute());
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('reuses the exact request after a network failure, including across locale changes', async () => {
    execute.mockRejectedValueOnce(new Error('response lost')).mockResolvedValue(receipt);
    const { result, rerender } = renderHook(({ reason }) => useSwitchOperation({ ...options, reason }), { initialProps: { reason: 'Original reason' } });
    await act(async () => result.current.preview());
    await act(async () => result.current.execute());
    expect(result.current.hasSubmitted).toBe(true);
    expect(result.current.canExecute).toBe(true);
    rerender({ reason: '另一种语言' });
    await act(async () => result.current.execute());
    expect(execute.mock.calls[1][0]).toEqual(execute.mock.calls[0][0]);
  });

  it('recovers the submitted form and request after remount without a new preview', async () => {
    execute.mockRejectedValueOnce(new Error('response lost')).mockResolvedValue(receipt);
    const first = renderHook(() => useSwitchOperation(options));
    await act(async () => first.result.current.preview());
    await act(async () => first.result.current.execute());
    const request = execute.mock.calls[0][0];
    first.unmount();
    const next = renderHook(() => useSwitchOperation({ ...options, initialForm: { ...form, account_id: 0 } }));
    expect(next.result.current.form.account_id).toBe(7);
    expect(next.result.current.canExecute).toBe(true);
    await act(async () => next.result.current.execute());
    expect(execute.mock.calls[1][0]).toEqual(request);
    expect(preview).toHaveBeenCalledTimes(1);
  });

  it('retains the original request when changing away from and back to its parameters', async () => {
    execute.mockRejectedValue(new Error('response lost'));
    const { result } = renderHook(() => useSwitchOperation(options));
    await act(async () => result.current.preview());
    await act(async () => result.current.execute());
    act(() => result.current.patchForm({ account_id: 8 }));
    await act(async () => result.current.preview());
    await act(async () => result.current.execute());
    act(() => result.current.patchForm({ account_id: 7 }));
    await act(async () => result.current.execute());
    expect(execute.mock.calls[2][0]).toEqual(execute.mock.calls[0][0]);
    expect(execute.mock.calls[1][0].request_id).not.toBe(execute.mock.calls[0][0].request_id);
  });

  it('does not reuse another user’s journal', async () => {
    execute.mockRejectedValue(new Error('response lost'));
    const first = renderHook(() => useSwitchOperation(options));
    await act(async () => first.result.current.preview());
    await act(async () => first.result.current.execute());
    first.unmount(); auth.user = { id: '8' };
    const next = renderHook(() => useSwitchOperation(options));
    expect(next.result.current.hasSubmitted).toBe(false);
    expect(next.result.current.canExecute).toBe(false);
    await act(async () => next.result.current.preview());
    await act(async () => next.result.current.execute());
    expect(execute.mock.calls[1][0].request_id).not.toBe(execute.mock.calls[0][0].request_id);
  });

  it('does not send an execution when its recovery record cannot be saved', async () => {
    const { result } = renderHook(() => useSwitchOperation(options));
    await act(async () => result.current.preview());
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    await act(async () => result.current.execute());
    expect(execute).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'storage unavailable' }));
  });

  it('creates a new ID only after an explicit new operation and a fresh preview', async () => {
    const { result } = renderHook(() => useSwitchOperation(options));
    await act(async () => result.current.preview());
    await act(async () => result.current.execute());
    act(() => result.current.startNew());
    expect(result.current.canExecute).toBe(false);
    await act(async () => result.current.preview());
    await act(async () => result.current.execute());
    expect(execute.mock.calls[1][0].request_id).not.toBe(execute.mock.calls[0][0].request_id);
  });
});
