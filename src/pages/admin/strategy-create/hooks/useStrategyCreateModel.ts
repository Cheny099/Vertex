import { useEffect, useMemo, useState } from 'react';
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
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                ...DEFAULT_STRATEGY_VALUES,
                ...initialData,
                strategyKey: initialData.strategy_key,
                name: isCopyMode ? `${initialData.name} (Copy)` : initialData.name,
                status: initialData.status || 'active',
            });
        }
    }, [form, initialData, isCopyMode]);

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
