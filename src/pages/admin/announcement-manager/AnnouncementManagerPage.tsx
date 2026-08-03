import React, { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, translateBackendErrorMessage } from '@/api';
import type { ApiError } from '@/api/contracts';
import type { AnnouncementLang } from '@/api/types';
import { enUS, zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';
import { AnnouncementEditorDialog } from './components/AnnouncementEditorDialog';
import { AnnouncementFiltersBar } from './components/AnnouncementFiltersBar';
import { AnnouncementListItem } from './components/AnnouncementListItem';
import { AnnouncementSimulationDialog } from './components/AnnouncementSimulationDialog';
import { useAnnouncementManagerState } from './hooks/useAnnouncementManagerState';
import {
    containerVariants,
    DEFAULT_FORM,
    itemVariants,
    resolveAnnouncementMeta,
    toApiDateTime,
    toAnnouncementCardDate,
    toDatetimeLocalValue,
    type AnnouncementFormData,
} from './utils';

const AnnouncementManager: React.FC = () => {
    const { t, i18n } = useTranslation(['common', 'admin']);
    const queryClient = useQueryClient();
    const calendarLocale = i18n.resolvedLanguage?.startsWith('zh') ? zhCN : enUS;
    const {
        isCreateOpen,
        setIsCreateOpen,
        formData,
        setFormData,
        editingId,
        setEditingId,
        editorTab,
        setEditorTab,
        isLoadingDetail,
        setIsLoadingDetail,
        isSimulateOpen,
        setIsSimulateOpen,
        filters,
        setFilters,
        openCreate,
    } = useAnnouncementManagerState();

    const { data: announcementsResponse, isLoading, isError, error } = useQuery({
        queryKey: ['announcements', 'admin-list', filters],
        queryFn: () => adminApi.announcements.list(filters),
    });
    const toErrorText = useCallback((err: unknown, fallback?: string) => {
        const apiError = err as ApiError;
        const msg = typeof apiError?.message === 'string' ? apiError.message : '';
        return translateBackendErrorMessage(msg) || msg || fallback || t('admin:error_operation_failed');
    }, [t]);

    const announcements = useMemo(
        () => (Array.isArray(announcementsResponse?.items) ? announcementsResponse.items : []),
        [announcementsResponse?.items]
    );
    const total = announcementsResponse?.total ?? 0;
    const { currentPage, totalPages, canPrev, canNext } = resolveAnnouncementMeta(total, filters);

    const createMutation = useMutation({
        mutationFn: async ({ data, publishNow }: { data: AnnouncementFormData; publishNow: boolean }) => {
            const newAnnouncement = await adminApi.announcements.create({
                title: data.title,
                content_md: data.content_md,
                lang: data.lang,
                show_popup: data.show_popup,
                is_pinned: data.is_pinned,
                popup_start_at: toApiDateTime(data.popup_start_at),
                popup_end_at: toApiDateTime(data.popup_end_at),
            });
            // 鉁?Immediately publish to make it visible
            if (publishNow) {
                await adminApi.announcements.publish(newAnnouncement.id);
            }
            return { publishNow };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            setIsCreateOpen(false);
            setFormData(DEFAULT_FORM);
            toast.success(result.publishNow
                ? t('admin:announcements_published_success', 'Announcement published')
                : t('admin:announcements_saved_draft_success', 'Draft saved'));
        },
        onError: (e: unknown) => toast.error(toErrorText(e))
    });

    const updateMutation = useMutation({
        mutationFn: async (data: AnnouncementFormData) => {
            if (!editingId) return;
            return adminApi.announcements.update(editingId, {
                title: data.title,
                content_md: data.content_md,
                lang: data.lang,
                show_popup: data.show_popup,
                is_pinned: data.is_pinned,
                popup_start_at: toApiDateTime(data.popup_start_at),
                popup_end_at: toApiDateTime(data.popup_end_at),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            setIsCreateOpen(false);
            setEditingId(null);
            setFormData(DEFAULT_FORM);
            toast.success(t('admin:announcement_updated_success', 'Announcement updated'));
        },
        onError: (e: unknown) => toast.error(toErrorText(e))
    });

    const publishMutation = useMutation({
        mutationFn: (id: number) => adminApi.announcements.publish(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success(t('admin:announcements_published_success', 'Announcement published'));
        },
        onError: (e: unknown) => toast.error(toErrorText(e))
    });

    const unpublishMutation = useMutation({
        mutationFn: (id: number) => adminApi.announcements.unpublish(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success(t('admin:announcements_unpublished_success', 'Announcement unpublished'));
        },
        onError: (e: unknown) => toast.error(toErrorText(e))
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminApi.announcements.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success(t('admin:deleted_success', 'Announcement deleted'));
        },
        onError: (e: unknown) => toast.error(toErrorText(e))
    });

    // Identifies the most recent open request, so a slow detail response cannot land in a dialog
    // that has since been closed, switched to another announcement, or reset for "create".
    const editRequestRef = useRef(0);

    const handleEditOpen = useCallback(async (itemId: number) => {
        const requestId = ++editRequestRef.current;
        // Clear the previous record before showing the dialog: it opens ahead of the fetch and its
        // footer sits outside the loading overlay, so stale values here let a single click PATCH
        // the newly selected announcement with the previously opened one's title and body.
        setFormData(DEFAULT_FORM);
        setEditingId(itemId);
        setIsLoadingDetail(true);
        setIsCreateOpen(true);
        try {
            const detail = await adminApi.announcements.get(itemId, {
                include_deleted: filters.include_deleted,
            });
            const rawContent = detail.content_md || detail.content || '';
            const cleanContent = typeof rawContent === 'string' ? rawContent.replace(/\\n/g, '\n') : '';

            if (editRequestRef.current !== requestId) return;

            setFormData({
                title: detail.title,
                content_md: cleanContent,
                lang: (detail.lang as AnnouncementLang) || 'zh',
                show_popup: detail.show_popup || false,
                is_pinned: detail.is_pinned || false,
                popup_start_at: toDatetimeLocalValue(detail.popup_start_at),
                popup_end_at: toDatetimeLocalValue(detail.popup_end_at),
            });
            setEditorTab('edit');
        } catch (e) {
            if (editRequestRef.current !== requestId) return;
            logger.error('Fetch announcement error:', e);
            toast.error(toErrorText(e));
            setIsCreateOpen(false);
        } finally {
            if (editRequestRef.current === requestId) setIsLoadingDetail(false);
        }
    }, [filters.include_deleted, setEditingId, setIsLoadingDetail, setIsCreateOpen, setFormData, setEditorTab, toErrorText]);

    const handleSubmit = useCallback((publishNow = false) => {
        // The footer is outside the loading overlay, so block submitting a form whose record has
        // not arrived yet.
        if (isLoadingDetail) return;
        if (!formData.title || !formData.content_md) return toast.error(t('admin:error_title_content_required'));

        if (editingId) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate({ data: formData, publishNow });
        }
    }, [formData, t, editingId, isLoadingDetail, updateMutation, createMutation]);

    const handlePublish = useCallback((id: number) => {
        publishMutation.mutate(id);
    }, [publishMutation]);

    const handleUnpublish = useCallback((id: number) => {
        unpublishMutation.mutate(id);
    }, [unpublishMutation]);

    const handleDelete = useCallback((id: number) => {
        deleteMutation.mutate(id);
    }, [deleteMutation]);

    const handlePrevPage = useCallback(() => {
        setFilters((prev) => ({ ...prev, offset: Math.max(0, (prev.offset || 0) - (prev.limit || 50)) }));
    }, [setFilters]);

    const handleNextPage = useCallback(() => {
        setFilters((prev) => ({ ...prev, offset: (prev.offset || 0) + (prev.limit || 50) }));
    }, [setFilters]);

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-4 md:p-8 space-y-6 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white"
        >
            <motion.div variants={itemVariants} className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">{t('admin:announcements')}</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        {t('admin:announcements_desc', 'Manage system-wide announcements and popups.')}
                    </p>
                </div>
                <Button className="h-10 px-5 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2" onClick={openCreate}>
                    <Plus className="w-4 h-4" />
                    {t('admin:create_announcement', 'Create Announcement')}
                </Button>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                    <CardHeader className="space-y-4">
                        <CardTitle>{t('admin:active_announcements', 'System Announcements')}</CardTitle>
                        <AnnouncementFiltersBar
                            t={t}
                            lang={filters.lang}
                            includeUnpublished={filters.include_unpublished}
                            includeDeleted={filters.include_deleted}
                            onLangChange={(lang) => setFilters((prev) => ({ ...prev, lang, offset: 0 }))}
                            onIncludeUnpublishedChange={(checked) => setFilters((prev) => ({ ...prev, include_unpublished: checked, offset: 0 }))}
                            onIncludeDeletedChange={(checked) => setFilters((prev) => ({ ...prev, include_deleted: checked, offset: 0 }))}
                        />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <div className="space-y-4">
                                {announcements.map((item) => (
                                    <AnnouncementListItem
                                        key={item.id}
                                        t={t}
                                        item={item}
                                        toAnnouncementCardDate={toAnnouncementCardDate}
                                        isPublishPending={publishMutation.isPending}
                                        isUnpublishPending={unpublishMutation.isPending}
                                        isDeletePending={deleteMutation.isPending}
                                        onOpenEdit={handleEditOpen}
                                        onPublish={handlePublish}
                                        onUnpublish={handleUnpublish}
                                        onDelete={handleDelete}
                                    />
                                ))}
                                {!announcements.length && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        {isError
                                            ? toErrorText(error)
                                            : t('admin:no_data', 'No announcements')}
                                    </div>
                                )}
                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <div className="text-xs text-muted-foreground mr-2">
                                        {t('admin:page_info', { page: currentPage, total: totalPages })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!canPrev}
                                        onClick={handlePrevPage}
                                    >
                                        {t('admin:prev')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!canNext}
                                        onClick={handleNextPage}
                                    >
                                        {t('admin:next')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <AnnouncementEditorDialog
                    t={t}
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                    formData={formData}
                    onFormDataChange={setFormData}
                    editingId={editingId}
                    editorTab={editorTab}
                    onEditorTabChange={setEditorTab}
                    isLoadingDetail={isLoadingDetail}
                    onOpenSimulation={() => setIsSimulateOpen(true)}
                    onClose={() => setIsCreateOpen(false)}
                    onSubmit={handleSubmit}
                    isCreatePending={createMutation.isPending}
                    isUpdatePending={updateMutation.isPending}
                    calendarLocale={calendarLocale}
                />

                <AnnouncementSimulationDialog
                    t={t}
                    open={isSimulateOpen}
                    onOpenChange={setIsSimulateOpen}
                    title={formData.title}
                    content={formData.content_md}
                />
            </motion.div>
        </motion.div>
    );
};

export default AnnouncementManager;

