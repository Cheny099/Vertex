import { useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { adminApi, translateBackendErrorMessage } from '@/api';
import type { ApiError } from '@/api/contracts';
import type { AdminLegalDocResponse } from '@/api/types';
import {
    createDefaultLegalFormData,
    DEFAULT_ACTIVE_TAB,
    generateNextVersion,
    type EditorTab,
    type LegalFormData,
    type LegalKey,
} from '../utils';

interface UseLegalManagerModelOptions {
    t: (key: string) => string;
}

export const useLegalManagerModel = ({ t }: UseLegalManagerModelOptions) => {
    const queryClient = useQueryClient();
    const [createOpen, setCreateOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<LegalKey>(DEFAULT_ACTIVE_TAB);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<LegalFormData>(
        createDefaultLegalFormData(DEFAULT_ACTIVE_TAB, '')
    );
    const [editorTab, setEditorTab] = useState<EditorTab>('edit');
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    const toErrorText = useCallback((err: unknown, fallback?: string) => {
        const apiError = err as ApiError;
        const msg = typeof apiError?.message === 'string' ? apiError.message : '';
        return translateBackendErrorMessage(msg) || msg || fallback || t('error_operation_failed');
    }, [t]);

    const { data: docsResponse, isLoading, isError, error } = useQuery({
        queryKey: ['legal-docs', activeTab],
        queryFn: () => adminApi.legal.list({
            key: activeTab,
            limit: 200,
            offset: 0,
        }),
    });

    const docs = useMemo(
        () => (Array.isArray(docsResponse?.items) ? docsResponse.items : []),
        [docsResponse?.items]
    );

    const docsErrorText = isError ? toErrorText(error) : '';

    const activateMutation = useMutation({
        mutationFn: (id: number) => adminApi.legal.activate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['legal-docs'] });
            toast.success(t('activated_success'));
        },
        onError: (err: unknown) => {
            toast.error(toErrorText(err));
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: LegalFormData) => {
            if (editingId) {
                const updatePayload = {
                    title: data.title,
                    content_md: data.content_md,
                    effective_at: data.effective_at || new Date().toISOString(),
                };
                return adminApi.legal.update(editingId, updatePayload);
            }

            const payload = {
                ...data,
                effective_at: data.effective_at || new Date().toISOString(),
                is_active: true,
            };
            return adminApi.legal.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['legal-docs'] });
            toast.success(editingId ? t('updated_success') : t('publish_success'));
            setCreateOpen(false);
            setEditingId(null);
        },
        onError: (err: unknown) => {
            const apiError = err as ApiError;
            const rawMsg = typeof apiError?.message === 'string' ? apiError.message : '';
            let msg = translateBackendErrorMessage(rawMsg) || rawMsg;
            if (rawMsg.includes('already exists')) {
                msg = t('error_version_exists');
            } else if (rawMsg.includes('cannot be edited')) {
                msg = t('active_doc_edit_notice');
            }
            toast.error(msg || t('publish_failed'));
        },
    });

    const openCreate = useCallback(() => {
        setEditingId(null);
        setFormData(createDefaultLegalFormData(activeTab, t(activeTab)));
        setCreateOpen(true);
    }, [activeTab, t]);

    const openEdit = useCallback(async (doc: AdminLegalDocResponse) => {
        setIsLoadingDetail(true);
        setCreateOpen(true);
        try {
            const detail = await adminApi.legal.get(doc.id);
            const isActive = detail.is_active;

            setEditorTab('edit');

            const rawContent = detail.content_md || detail.content || '';
            const cleanContent = typeof rawContent === 'string' ? rawContent.replace(/\\n/g, '\n') : '';

            if (isActive) {
                setEditingId(null);
                setFormData({
                    key: detail.key,
                    lang: detail.lang === 'en' ? 'en' : 'zh',
                    version: generateNextVersion(detail.version),
                    title: detail.title,
                    content_md: cleanContent,
                });
                toast.info(t('active_doc_edit_notice'), {
                    description: t('edit_notice'),
                    duration: 5000,
                });
            } else {
                setEditingId(detail.id);
                setFormData({
                    key: detail.key,
                    lang: detail.lang === 'en' ? 'en' : 'zh',
                    version: detail.version,
                    title: detail.title,
                    content_md: cleanContent,
                });
            }
        } catch (err) {
            logger.error('Fetch legal doc error:', err);
            toast.error(toErrorText(err));
            setCreateOpen(false);
        } finally {
            setIsLoadingDetail(false);
        }
    }, [t, toErrorText]);

    return {
        activeTab,
        setActiveTab,
        createOpen,
        setCreateOpen,
        editingId,
        setEditingId,
        formData,
        setFormData,
        editorTab,
        setEditorTab,
        isLoadingDetail,
        docs,
        docsErrorText,
        isLoading,
        isError,
        activateMutation,
        createMutation,
        openCreate,
        openEdit,
        resetForActiveTab: useCallback(() => {
            setEditingId(null);
            setFormData({
                key: activeTab,
                lang: 'zh',
                version: format(new Date(), 'yyyy-MM-dd'),
                title: t(activeTab),
                content_md: '',
            });
            setCreateOpen(true);
        }, [activeTab, t]),
    };
};
