import type { TFunction } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { strategyApi, adminApi, getStrategySchema, translateBackendErrorMessage } from '@/api';
import { useToast } from '@/components/ui/use-toast';
import type { ApiError } from '@/api/contracts';
import type { StrategyWebhookSecretResponse } from '@/api';
import {
    buildGeneratedStrategyKey,
    buildStrategyPayload,
    buildWebhookUrl,
    DEFAULT_STRATEGY_VALUES,
    type StrategyFormValues,
    type StrategyMutationResult,
} from '../utils';

interface UseStrategyCreateModelOptions {
    t: TFunction;
}

export const useStrategyCreateModel = ({ t }: UseStrategyCreateModelOptions) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [showWebhookDialog, setShowWebhookDialog] = useState(false);
    const [webhookData, setWebhookData] = useState<{ url: string; secret: string; strategy_key: string } | null>(null);

    const isCopy = searchParams.get('copy') === 'true';
    const isEditMode = !!id && !isCopy;
    const isCopyMode = !!id && isCopy;

    // Required only when editing: create and copy both generate a key when the field is blank.
    const schema = useMemo(
        () => getStrategySchema(t, { requireStrategyKey: isEditMode }),
        [t, isEditMode]
    );

    const form = useForm<StrategyFormValues>({
        resolver: zodResolver(schema),
        defaultValues: DEFAULT_STRATEGY_VALUES,
    });

    const watchStatus = form.watch('status');

    const {
        data: initialData,
        isSuccess,
        isFetchedAfterMount,
        isError: isFetchError,
        error: initialError,
        fetchStatus,
        refetch: refetchInitial,
    } = useQuery({
        queryKey: ['strategy', id],
        queryFn: () => strategyApi.get(parseInt(id!, 10)),
        enabled: !!id,
        // An editor is not a live view: refetching under an open form is pure churn. What actually
        // protects the admin's typing is the seed guard below, so this deliberately does NOT set a
        // staleTime - a fresh mount must still fetch current data, or reopening the editor within
        // the cache window would show pre-edit values and save them back over someone else's change.
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    // True only when `initialData` is a record this mount fetched successfully.
    //
    // Dropping staleTime starts a fetch on every mount but does not make `data` wait for it:
    // query-core hands back the cached object synchronously, so seeding on `initialData` alone
    // seeds from the previous visit's copy and then refuses to re-seed when the real response
    // lands. That is how publishing from the list and reopening the editor produced a form still
    // reading 'inactive', which the next save wrote straight back over the publish.
    //
    // `isFetchedAfterMount` alone does not close it either. query-core sets it from
    // `dataUpdateCount > initial || errorUpdateCount > initial` (queryObserver.js:328), so a failed
    // refetch flips it to true while `data` is still the stale cached object - readmitting exactly
    // the value this guard exists to keep out. `isSuccess` is what distinguishes the two: a refetch
    // that errors leaves the query in the error status even though it kept its data.
    const hasCurrentRecord = isSuccess && isFetchedAfterMount;

    // Seed the form once per record. Re-seeding on later data would overwrite unsaved edits, so it
    // is keyed on the strategy id rather than on the fetched object's identity. This is state and
    // not a ref because the render needs it: a record that has been seeded must keep its form even
    // if a later refetch fails, and a record that has not must not fall through to an empty one.
    const [seededId, setSeededId] = useState<string | null>(null);
    const isSeeded = seededId === String(id ?? '');

    useEffect(() => {
        if (!initialData || !hasCurrentRecord) return;
        const key = String(id ?? '');
        if (seededId === key) return;
        setSeededId(key);

        form.reset({
            ...DEFAULT_STRATEGY_VALUES,
            ...initialData,
            // A copy may not carry the source key: strategy_key is `unique=True` on the model, and
            // the create route answers a duplicate with 400 "strategy_key already exists". Seeding
            // the original's key meant Copy -> Save always failed unless the admin happened to press
            // the regenerate button first. Generate here so the field shows the key it will be saved
            // with, rather than leaving a blank box the admin has to notice.
            strategyKey: isCopyMode ? buildGeneratedStrategyKey() : initialData.strategy_key,
            name: isCopyMode ? `${initialData.name} (Copy)` : initialData.name,
            // Strategy.status is an open string on the wire; the form field is a closed union,
            // so anything unexpected falls back to 'inactive' rather than being forced through.
            status: initialData.status === 'active' ? 'active' : 'inactive',
        });
    }, [form, id, initialData, hasCurrentRecord, seededId, isCopyMode]);

    // Offline is a third terminal state, and the one that is easy to miss. With the default
    // networkMode 'online', query-core does not fail an offline fetch - it pauses it: fetchStatus
    // becomes 'paused' and neither dataUpdateCount nor errorUpdateCount moves (query.js:326-330),
    // so `isSuccess`, `isFetchError` and `isFetchedAfterMount` all stay put. Without this term the
    // loading gate below has no exit at all while the browser is offline, and the editor is a
    // skeleton with no header, no message and no way off the page.
    const isPausedOffline = fetchStatus === 'paused';

    // All three gates hang off `isSeeded` rather than off the query status, so the states are
    // exclusive and none of them can strand the page:
    //  - not seeded, still fetching -> skeleton, never the stale form
    //  - not seeded, failed/paused  -> error branch, so neither a failed load nor an offline
    //                                  browser leaves a skeleton that never resolves
    //  - seeded                     -> the form, and it stays even if a later refetch fails,
    //                                  because the admin may have unsaved edits in it by then
    const isInitialError = !!id && (isFetchError || isPausedOffline) && !isSeeded;
    const isInitialLoading = !!id && !isSeeded && !isInitialError;

    const submitMutation = useMutation({
        mutationFn: async (data: StrategyFormValues): Promise<StrategyMutationResult> => {
            let strategy;
            const payload = buildStrategyPayload({
                form: data,
                isEditMode,
                initialConfig: initialData?.config,
            });

            if (isEditMode && id) {
                strategy = await adminApi.strategies.update(parseInt(id, 10), payload);
            } else {
                strategy = await adminApi.strategies.create(payload);
            }

            if (!isEditMode) {
                const secretData: StrategyWebhookSecretResponse = await adminApi.strategies.getWebhookSecret(strategy.id);
                return { ...strategy, webhookSecret: secretData };
            }

            return strategy;
        },
        onSuccess: (data) => {
            if (data.webhookSecret) {
                setWebhookData({
                    url: buildWebhookUrl(),
                    secret: data.webhookSecret.secret,
                    strategy_key: data.strategy_key,
                });
                setShowWebhookDialog(true);
                return;
            }

            toast({
                title: t('strategies:create.toast_success'),
                description: isEditMode ? t('strategies:create.toast_updated') : t('strategies:create.toast_created'),
            });
            queryClient.invalidateQueries({ queryKey: ['strategies'] });
            // The list key does not cover the single-strategy cache this editor reads, so without
            // this a second visit would re-seed the form from the pre-save copy.
            if (id) queryClient.invalidateQueries({ queryKey: ['strategy', id] });
            navigate('/admin/strategies');
        },
        onError: (error: unknown) => {
            const apiError = error as Partial<ApiError>;
            toast({
                title: t('strategies:detail.toast_error'),
                description: apiError.message || t('strategies:create.toast_error'),
                variant: 'destructive',
            });
        },
    });

    const handleSubmit = (data: StrategyFormValues) => {
        submitMutation.mutate(data);
    };

    const closeWebhookDialog = (open: boolean) => {
        if (!open) {
            setShowWebhookDialog(false);
            navigate('/admin/strategies');
        }
    };

    return {
        navigate,
        id,
        isEditMode,
        isCopyMode,
        isInitialLoading,
        isInitialError,
        // Backend messages go through the same translator every other surface uses, rather than
        // being rendered raw. A paused query has no error object at all, so it needs its own text.
        initialErrorText: isPausedOffline
            ? t('common:offline_hint')
            : translateBackendErrorMessage((initialError as Partial<ApiError> | null)?.message || '') ||
              (initialError as Partial<ApiError> | null)?.message ||
              t('strategies:detail.toast_error'),
        retryInitialLoad: refetchInitial,
        initialData,
        form,
        watchStatus,
        submitMutation,
        handleSubmit,
        showWebhookDialog,
        setShowWebhookDialog,
        closeWebhookDialog,
        webhookData,
        generateStrategyKey: () => form.setValue('strategyKey', buildGeneratedStrategyKey()),
    };
};
