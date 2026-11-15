import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FormEvent, PropsWithChildren } from 'react';
import type { TFunction } from 'i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStrategySwitchSingleFlow } from './useStrategySwitchSingleFlow';
import { useStrategySwitchBulkFlow } from './useStrategySwitchBulkFlow';

const mocks = vi.hoisted(() => ({ preview: vi.fn(), execute: vi.fn(), bulkPreview: vi.fn(), bulkExecute: vi.fn(), getRun: vi.fn(), getCampaign: vi.fn(), toast: vi.fn() }));
vi.mock('@/api', () => ({ adminApi: { strategySwitch: mocks } }));
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ user: { id: '7' } }) }));
vi.mock('@/components/ui/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
const t = ((key: string) => key) as TFunction;
const params = { t, isPageVisible: false, toErrorText: String };
const event = () => ({ preventDefault: vi.fn() }) as unknown as FormEvent<HTMLFormElement>;
let client: QueryClient;
function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  sessionStorage.clear(); Object.values(mocks).forEach(mock => mock.mockReset());
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mocks.preview.mockResolvedValue({ plan: { account_id: 7 } });
  mocks.bulkPreview.mockResolvedValue({ total_candidates: 5 });
  mocks.getRun.mockResolvedValue({ id: 123, status: 'RUNNING' });
  mocks.getCampaign.mockResolvedValue({ campaign_id: 456, status: 'RUNNING' });
});
afterEach(() => { cleanup(); client.clear(); });

describe('single and bulk switch integrations', () => {
  it('invalidates the displayed single preview and blocks execution until changed parameters are previewed', async () => {
    mocks.execute.mockResolvedValue({ run_id: 123, status: 'PENDING', idempotent_reused: false });
    const { result } = renderHook(() => useStrategySwitchSingleFlow(params), { wrapper });
    act(() => { result.current.onAccountChange('7'); result.current.onSymbolChange('BTCUSDT'); result.current.onFromSubChange('11'); result.current.onToSubChange('12'); });
    act(() => result.current.onPreview());
    await waitFor(() => expect(result.current.previewPlan?.plan).toEqual({ account_id: 7 }));
    act(() => result.current.onAccountChange('8'));
    expect(result.current.previewPlan).toBeUndefined();
    act(() => result.current.onSubmit(event()));
    expect(mocks.execute).not.toHaveBeenCalled();
    act(() => result.current.onPreview());
    await waitFor(() => expect(result.current.canExecute).toBe(true));
    act(() => { result.current.onSubmit(event()); result.current.onSubmit(event()); });
    await waitFor(() => expect(result.current.runStatus?.id).toBe(123));
    expect(mocks.execute).toHaveBeenCalledTimes(1);
    expect(mocks.execute.mock.calls[0][0].account_id).toBe(8);
    expect(result.current.canStartNew).toBe(false);
    act(() => result.current.onStartNew());
    expect(result.current.canExecute).toBe(false);
    act(() => client.setQueryData(['strategy_switch_run', 123], { id: 123, status: 'SUCCESS' }));
    await waitFor(() => expect(result.current.canStartNew).toBe(true));
    act(() => result.current.onStartNew());
    expect(result.current.runStatus).toBeUndefined();
    expect(result.current.previewPlan).toBeUndefined();
  });

  it('discards a pending bulk preview after target edits, and preserves the request across failed retries', async () => {
    let resolvePreview!: (value: unknown) => void;
    mocks.bulkPreview.mockReturnValueOnce(new Promise(resolve => { resolvePreview = resolve; }));
    mocks.bulkExecute.mockRejectedValueOnce(new Error('response lost')).mockResolvedValue({ campaign_id: 456, status: 'PENDING', idempotent_reused: true });
    const { result } = renderHook(() => useStrategySwitchBulkFlow(params), { wrapper });
    act(() => { result.current.onFromStrategyChange('10'); result.current.onToStrategyChange('20'); result.current.onSymbolChange('BTCUSDT'); });
    act(() => result.current.onPreview());
    act(() => result.current.onToStrategyChange('30'));
    await act(async () => resolvePreview({ total_candidates: 500 }));
    expect(result.current.bulkPreviewData).toBeUndefined();
    expect(result.current.bulkPreviewStats).toEqual([]);
    act(() => result.current.onSubmit(event()));
    expect(mocks.bulkExecute).not.toHaveBeenCalled();
    act(() => result.current.onPreview());
    await waitFor(() => expect(result.current.canExecute).toBe(true));
    act(() => { result.current.onSubmit(event()); result.current.onSubmit(event()); });
    await waitFor(() => expect(result.current.recovering).toBe(true));
    expect(mocks.bulkExecute).toHaveBeenCalledTimes(1);
    act(() => result.current.onSubmit(event()));
    await waitFor(() => expect(result.current.campaignStatus?.campaign_id).toBe(456));
    expect(mocks.bulkExecute.mock.calls[1][0]).toEqual(mocks.bulkExecute.mock.calls[0][0]);
    expect(mocks.bulkExecute.mock.calls[0][0]).toMatchObject({ to_strategy_id: 30, handover_mode: 'FLAT_THEN_SWITCH' });
    expect(result.current.canStartNew).toBe(false);
    act(() => client.setQueryData(['bulk_switch_campaign', 456], { campaign_id: 456, status: 'FAILED' }));
    await waitFor(() => expect(result.current.canStartNew).toBe(true));
    act(() => result.current.onStartNew());
    expect(result.current.campaignStatus).toBeUndefined();
    expect(result.current.canExecute).toBe(false);
  });
});
