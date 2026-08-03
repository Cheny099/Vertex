import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { strategyApi, adminApi, getStrategySchema } from '@/api';
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
    t: (key: string) => string;
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

    const schema = useMemo(() => getStrategySchema(t), [t]);

    const form = useForm<StrategyFormValues>({
        resolver: zodResolver(schema),
        defaultValues: DEFAULT_STRATEGY_VALUES,
    });

    const watchStatus = form.watch('status');

    const { data: initialData, isLoading: isInitialLoading } = useQuery({
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

    // Seed the form once per record. Re-seeding on later data would overwrite unsaved edits, so it
    // is keyed on the strategy id rather than on the fetched object's identity.
    const seededIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (!initialData) return;
        const key = String(id ?? '');
        if (seededIdRef.current === key) return;
        seededIdRef.current = key;

        form.reset({
            ...DEFAULT_STRATEGY_VALUES,
            ...initialData,
            strategyKey: initialData.strategy_key,
            name: isCopyMode ? `${initialData.name} (Copy)` : initialData.name,
            status: initialData.status || 'active',
        });
    }, [form, id, initialData, isCopyMode]);

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
