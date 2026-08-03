import type { TFunction } from 'i18next';
import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi, strategyApi, translateBackendErrorMessage } from '@/api';
import type { ApiError } from '@/api/contracts';
import type { Strategy, StrategyWebhookSecretResponse } from '@/api/types';
import { DEFAULT_ACTION_CONFIRM, type ActionConfirmState } from '../utils';

interface UseStrategyManagerModelOptions {
    t: TFunction;
}

export const useStrategyManagerModel = ({ t }: UseStrategyManagerModelOptions) => {
    const queryClient = useQueryClient();
    const [secretDialogOpen, setSecretDialogOpen] = useState(false);
    const [currentSecret, setCurrentSecret] = useState<StrategyWebhookSecretResponse | null>(null);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [actionConfirm, setActionConfirm] = useState<ActionConfirmState>(DEFAULT_ACTION_CONFIRM);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);

    const toErrorText = useCallback((err: unknown) => {
        const apiError = err as ApiError;
        const msg = typeof apiError?.message === 'string' ? apiError.message : '';
        return translateBackendErrorMessage(msg) || msg || t('common:error');
    }, [t]);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['strategies'],
        queryFn: strategyApi.getAll,
    });

    const strategies = useMemo<Strategy[]>(() => (Array.isArray(data) ? data : []), [data]);
    const strategyErrorText = isError ? toErrorText(error) : '';

    const publishMutation = useMutation({
        mutationFn: (id: number) => adminApi.strategies.publish(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategies'] });
            toast.success(t('strategies:create.toast_success'));
        },
        onError: (err: unknown) => toast.error(toErrorText(err)),
    });

    const unpublishMutation = useMutation({
        mutationFn: (id: number) => adminApi.strategies.unpublish(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategies'] });
            toast.success(t('strategies:create.toast_success'));
        },
        onError: (err: unknown) => toast.error(toErrorText(err)),
    });

    const rotateSecretMutation = useMutation({
        mutationFn: (id: number) => adminApi.strategies.rotateWebhookSecret(id),
        onSuccess: (response) => {
            setCurrentSecret(response);
            setSecretDialogOpen(true);
            toast.success(t('secret_rotated'));
        },
        onError: (err: unknown) => toast.error(toErrorText(err)),
    });

    const getSecretMutation = useMutation({
        mutationFn: (id: number) => adminApi.strategies.getWebhookSecret(id),
        onSuccess: (response) => {
            setCurrentSecret(response);
            setSecretDialogOpen(true);
        },
        onError: (err: unknown) => toast.error(toErrorText(err)),
    });

    const importStatsMutation = useMutation({
        mutationFn: ({ id, file }: { id: number; file: File }) => adminApi.strategies.importStats(id, file),
        onError: (err: unknown) => toast.error(toErrorText(err)),
        onSuccess: () => {
            setImportDialogOpen(false);
            setCsvFile(null);
            toast.success(t('stats_imported'));
            queryClient.invalidateQueries({ queryKey: ['strategies'] });
        },
    });

    const handleImport = useCallback(() => {
        if (selectedStrategyId && csvFile) {
            importStatsMutation.mutate({ id: selectedStrategyId, file: csvFile });
        }
    }, [csvFile, importStatsMutation, selectedStrategyId]);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.name.toLowerCase().endsWith('.csv')) {
            setCsvFile(file);
        } else {
            toast.error(t('only_csv_allowed', 'Only CSV files are allowed'));
        }
    }, [t]);

    const requestRotateSecret = useCallback((id: number) => {
        setActionConfirm({
            open: true,
            title: t('admin:confirm', 'Confirm'),
            desc: t('rotate_warning'),
            onConfirm: () => rotateSecretMutation.mutate(id),
        });
    }, [rotateSecretMutation, t]);

    const openImportDialog = useCallback((id: number) => {
        setSelectedStrategyId(id);
        setImportDialogOpen(true);
    }, []);

    return {
        strategies,
        isLoading,
        isError,
        strategyErrorText,
        secretDialogOpen,
        setSecretDialogOpen,
        currentSecret,
        csvFile,
        setCsvFile,
        importDialogOpen,
        setImportDialogOpen,
        actionConfirm,
        setActionConfirm,
        isDragging,
        importStatsMutation,
        publishStrategy: publishMutation.mutate,
        unpublishStrategy: unpublishMutation.mutate,
        viewSecret: getSecretMutation.mutate,
        requestRotateSecret,
        openImportDialog,
        handleImport,
        onDragOver,
        onDragLeave,
        onDrop,
    };
};
