import type { TFunction } from 'i18next';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { strategyApi, adminApi, getStrategySchema, translateBackendErrorMessage } from '@/api';
import { useToast } from '@/components/ui/use-toast';
import type { ApiError } from '@/api/contracts';
import type { Strategy } from '@/api';
import { useAsyncScope, type IsCurrent } from '@/hooks/use-async-scope';
import {
    buildGeneratedStrategyKey,
    buildStrategyPayload,
    buildWebhookUrl,
    DEFAULT_STRATEGY_VALUES,
    type StrategyFormValues,
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
    const strategyId = Number(id);
    const hasValidId = /^\d+$/.test(id ?? '') && Number.isSafeInteger(strategyId) && strategyId > 0;
    const { capture, invalidate } = useAsyncScope(`${id ?? 'create'}:${isCopy}`);
    const saving = useRef<IsCurrent | null>(null);
    const readingSecret = useRef<IsCurrent | null>(null);
    const saved = useRef<{ strategy: Strategy; isCurrent: IsCurrent } | null>(null);
    const generatedKey = useRef<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isWebhookLoading, setIsWebhookLoading] = useState(false);
    const [webhookError, setWebhookError] = useState('');

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
        queryFn: async () => {
            if (!hasValidId) throw new Error(t('strategies:create.record_load_error'));
            const strategy = await strategyApi.get(strategyId);
            if (strategy.id !== strategyId) throw new Error(t('strategies:create.record_load_error'));
            return strategy;
        },
        enabled: hasValidId,
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
    const isInitialError = !!id && (!hasValidId || isFetchError || isPausedOffline) && !isSeeded;
    const isInitialLoading = !!id && !isSeeded && !isInitialError;

    // A successful save and its credential read have different recovery paths. Retain the
    // confirmed record so a failed read can never turn a retry into another create.
    const loadWebhook = async (strategy: Strategy, isCurrent: IsCurrent) => {
        if (!isCurrent() || readingSecret.current?.()) return;
        readingSecret.current = isCurrent;
        setIsWebhookLoading(true);
        setWebhookError('');
        try {
            const secret = await adminApi.strategies.getWebhookSecret(strategy.id);
            if (!isCurrent()) return;
            if (secret?.strategy_id !== strategy.id || secret.strategy_key !== strategy.strategy_key ||
                typeof secret.secret !== 'string' || !secret.secret.trim()) {
                throw new Error(t('strategies:create.webhook_load_error'));
            }
            setWebhookData({
                url: buildWebhookUrl(), secret: secret.secret, strategy_key: strategy.strategy_key,
            });
        } catch (error: unknown) {
            if (isCurrent()) {
                const message = (error as Partial<ApiError> | null)?.message;
                setWebhookError(translateBackendErrorMessage(message || '') || t('strategies:create.webhook_load_error'));
            }
        } finally {
            if (readingSecret.current === isCurrent) readingSecret.current = null;
            if (isCurrent()) setIsWebhookLoading(false);
        }
    };

    const handleSubmit = async (data: StrategyFormValues) => {
        if (saving.current?.() || saved.current?.isCurrent() || isInitialLoading || isInitialError) return;
        const isCurrent = capture();
        if (!isCurrent()) return;
        // Capture the target, mode and payload before async work can switch routes.
        const targetId = isEditMode && id ? Number(id) : null;
        let snapshot = { ...data };
        if (!isEditMode && !snapshot.strategyKey) {
            // Reuse this draft's identity if a response is lost. This is not server idempotency,
            // but retrying a blank-key draft must not mint a different identity every time.
            generatedKey.current ??= buildGeneratedStrategyKey();
            snapshot = { ...snapshot, strategyKey: generatedKey.current };
            form.setValue('strategyKey', generatedKey.current, { shouldDirty: true });
        }
        const payload = buildStrategyPayload({ form: snapshot, isEditMode, initialConfig: initialData?.config });
        saving.current = isCurrent;
        setIsSubmitting(true);
        try {
            const strategy = targetId === null
                ? await adminApi.strategies.create(payload)
                : await adminApi.strategies.update(targetId, payload);
            if (!isCurrent()) return;
            saved.current = { strategy, isCurrent };
            setIsSaved(true);
            queryClient.invalidateQueries({ queryKey: ['strategies'] });
            queryClient.invalidateQueries({ queryKey: ['strategy', String(targetId ?? strategy.id)] });
            if (targetId === null) {
                setShowWebhookDialog(true);
                await loadWebhook(strategy, isCurrent);
            } else {
                toast({
                    title: t('strategies:create.toast_success'),
                    description: t('strategies:create.toast_updated'),
                });
                navigate('/admin/strategies');
            }
        } catch (error: unknown) {
            if (isCurrent()) {
                const message = (error as Partial<ApiError> | null)?.message;
                toast({
                    title: t('strategies:detail.toast_error'),
                    description: translateBackendErrorMessage(message || '') || t('strategies:create.toast_error'),
                    variant: 'destructive',
                });
            }
        } finally {
            if (saving.current === isCurrent) saving.current = null;
            if (isCurrent()) setIsSubmitting(false);
        }
    };

    const retryWebhook = () => {
        const operation = saved.current;
        if (operation && !webhookData) void loadWebhook(operation.strategy, operation.isCurrent);
    };

    const closeWebhookDialog = (open: boolean) => {
        if (!open) {
            invalidate();
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
        initialErrorText: id && !hasValidId
            ? t('strategies:create.record_load_error')
            : isPausedOffline
            ? t('common:offline_hint')
            : translateBackendErrorMessage((initialError as Partial<ApiError> | null)?.message || '') ||
              (initialError as Partial<ApiError> | null)?.message ||
              t('strategies:detail.toast_error'),
        retryInitialLoad: () => { if (hasValidId) void refetchInitial(); },
        canRetryInitialLoad: hasValidId,
        initialData,
        form,
        watchStatus,
        isSubmitting,
        isSaved,
        handleSubmit,
        showWebhookDialog,
        closeWebhookDialog,
        webhookData,
        isWebhookLoading,
        webhookError,
        retryWebhook,
        // shouldValidate, because the field can now hold an error. setValue does not clear one on
        // its own, so regenerating after a blocked save would fill the box with a valid key and
        // leave the red border and the "key is required" message sitting under it.
        generateStrategyKey: () =>
            form.setValue('strategyKey', buildGeneratedStrategyKey(), { shouldValidate: true }),
    };
};
