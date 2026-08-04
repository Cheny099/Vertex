import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { useStrategyCreateModel } from './useStrategyCreateModel';

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    navigate: vi.fn(),
    toast: vi.fn(),
}));

vi.mock('@/api', () => ({
    strategyApi: { get: mocks.get },
    adminApi: { strategies: { create: vi.fn(), update: vi.fn(), getWebhookSecret: vi.fn() } },
    getStrategySchema: () => z.object({}).passthrough(),
}));

vi.mock('@/components/ui/use-toast', () => ({
    useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ id: '5' }),
        useNavigate: () => mocks.navigate,
        useSearchParams: () => [new URLSearchParams(''), vi.fn()] as const,
    };
});

const t = ((key: string) => key) as unknown as TFunction;

// `name` is the "has it seeded" signal throughout, never `status`. DEFAULT_STRATEGY_VALUES.status is
// 'active' (strategy-create/utils.ts:32), so asserting status === 'active' can be satisfied by the
// unseeded defaults - it would pass before any fetch resolved and make the rest of a test a race.
// The default name is '', which no record here uses.
const strategy = (status: string, name: string) => ({
    id: 5,
    strategy_key: 'sk-5',
    name,
    description: 'first version',
    status,
    config: { type: 'signal', pair: 'BTCUSDT' },
});

// One client across both visits: this is the whole point. The editor is remounted inside the
// default 5-minute gcTime, so the second visit starts with the first visit's copy already cached.
let queryClient: QueryClient;

function wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useStrategyCreateModel seeding', () => {
    beforeEach(() => {
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('seeds a reopened editor from the current record, not the cached one', async () => {
        mocks.get.mockResolvedValue(strategy('inactive', 'Momentum'));
        const first = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
        await waitFor(() => expect(first.result.current.form.getValues('name')).toBe('Momentum'));
        expect(first.result.current.form.getValues('status')).toBe('inactive');
        first.unmount();

        // Published from the strategy list while the editor was closed, and renamed so that the
        // seed can be attributed to the fetch rather than to the defaults. The cached
        // ['strategy','5'] entry still says 'inactive' / 'Momentum'.
        mocks.get.mockResolvedValue(strategy('active', 'Momentum renamed'));

        const second = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
        await waitFor(() =>
            expect(second.result.current.form.getValues('name')).toBe('Momentum renamed')
        );

        // Without this the next save would send status: 'inactive' and silently unpublish.
        expect(second.result.current.form.getValues('status')).toBe('active');
    });

    it('holds the loading state until this mount has fetched, so the stale form never paints', async () => {
        mocks.get.mockResolvedValue(strategy('inactive', 'Momentum'));
        const first = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
        await waitFor(() => expect(first.result.current.isInitialLoading).toBe(false));
        first.unmount();

        mocks.get.mockResolvedValue(strategy('active', 'Momentum renamed'));
        const second = renderHook(() => useStrategyCreateModel({ t }), { wrapper });

        expect(second.result.current.isInitialLoading).toBe(true);
        await waitFor(() => expect(second.result.current.isInitialLoading).toBe(false));
    });

    it('leaves the loading state when the fetch fails instead of waiting forever', async () => {
        mocks.get.mockRejectedValue(new Error('boom'));
        const { result } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });

        await waitFor(() => expect(result.current.isInitialError).toBe(true));
        expect(result.current.isInitialLoading).toBe(false);
    });

    it('does not fall back to the stale cache when the reopening fetch fails', async () => {
        mocks.get.mockResolvedValue(strategy('inactive', 'Momentum'));
        const first = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
        await waitFor(() => expect(first.result.current.form.getValues('name')).toBe('Momentum'));
        first.unmount();

        // Published elsewhere, then the reopening fetch fails. `data` is still the cached
        // 'inactive' object and isFetchedAfterMount is true - query-core flips it on
        // errorUpdateCount as well as dataUpdateCount - so a guard built on isFetchedAfterMount
        // alone would seed the stale record right back in.
        mocks.get.mockRejectedValue(new Error('offline'));

        const second = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
        await waitFor(() => expect(second.result.current.isInitialError).toBe(true));

        expect(second.result.current.isInitialLoading).toBe(false);
        expect(second.result.current.form.getValues('name')).toBe('');
    });

    it('keeps a seeded form when a later refetch fails', async () => {
        mocks.get.mockResolvedValue(strategy('active', 'Momentum'));
        const { result } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
        await waitFor(() => expect(result.current.form.getValues('name')).toBe('Momentum'));

        result.current.form.setValue('description', 'half-typed edit');
        mocks.get.mockRejectedValue(new Error('offline'));
        await queryClient.invalidateQueries({ queryKey: ['strategy', '5'] });

        await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
        // The editor must not swap itself for an error screen and discard what is being typed.
        expect(result.current.isInitialError).toBe(false);
        expect(result.current.form.getValues('description')).toBe('half-typed edit');
    });

    it('does not re-seed over unsaved edits when the record is refetched', async () => {
        mocks.get.mockResolvedValue(strategy('active', 'Momentum'));
        const { result } = renderHook(() => useStrategyCreateModel({ t }), { wrapper });
        await waitFor(() => expect(result.current.form.getValues('name')).toBe('Momentum'));

        result.current.form.setValue('name', 'Momentum v2');
        mocks.get.mockResolvedValue(strategy('active', 'Renamed elsewhere'));
        await queryClient.invalidateQueries({ queryKey: ['strategy', '5'] });

        await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
        expect(result.current.form.getValues('name')).toBe('Momentum v2');
    });
});
