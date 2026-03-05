import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Trash2, Loader2, Megaphone, Eye, FileEdit, CalendarDays, Clock3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { adminApi, translateBackendErrorMessage } from '@/api';
import type { AnnouncementLang } from '@/api/types';
import { format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';

// Variants for consistent animations
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
} as const;

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
} as const;

type AnnouncementFormData = {
    title: string;
    content_md: string;
    lang: AnnouncementLang;
    show_popup: boolean;
    is_pinned: boolean;
    popup_start_at: string;
    popup_end_at: string;
};

type AnnouncementFilters = {
    lang: AnnouncementLang;
    include_unpublished: boolean;
    include_deleted: boolean;
    limit: number;
    offset: number;
};

const DEFAULT_FORM: AnnouncementFormData = {
    title: '',
    content_md: '',
    lang: 'zh',
    show_popup: false,
    is_pinned: false,
    popup_start_at: '',
    popup_end_at: ''
};

const toDatetimeLocalValue = (raw?: string | null): string => {
    if (!raw) return '';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toApiDateTime = (raw: string): string | null => {
    if (!raw.trim()) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
};

const parseLocalDateTime = (raw: string): Date | null => {
    if (!raw.trim()) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d;
};

type DateTimeFieldProps = {
    value: string;
    onChange: (next: string) => void;
    placeholder: string;
    timeLabel: string;
    clearLabel: string;
    calendarLocale: any;
};

const DateTimeField: React.FC<DateTimeFieldProps> = ({
    value,
    onChange,
    placeholder,
    timeLabel,
    clearLabel,
    calendarLocale,
}) => {
    const current = parseLocalDateTime(value);
    const timeValue = current ? format(current, 'HH:mm') : '09:00';

    const updateDatePart = (selected: Date | undefined) => {
        if (!selected) return;
        const next = new Date(selected);
        if (current) {
            next.setHours(current.getHours(), current.getMinutes(), 0, 0);
        } else {
            next.setHours(9, 0, 0, 0);
        }
        onChange(format(next, "yyyy-MM-dd'T'HH:mm"));
    };

    const updateTimePart = (nextTime: string) => {
        const [h, m] = nextTime.split(':').map((n) => Number(n || 0));
        const base = current ? new Date(current) : new Date();
        base.setHours(h || 0, m || 0, 0, 0);
        onChange(format(base, "yyyy-MM-dd'T'HH:mm"));
    };

    return (
        <div className="space-y-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full justify-start bg-white/80 border-slate-200/70 font-medium"
                    >
                        <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                        {current ? format(current, 'yyyy-MM-dd HH:mm') : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 bg-white/95 backdrop-blur-xl border border-slate-200/70 rounded-xl shadow-xl" align="start">
                    <Calendar
                        locale={calendarLocale}
                        mode="single"
                        selected={current ?? undefined}
                        onSelect={updateDatePart}
                        initialFocus
                    />
                    <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock3 className="h-3.5 w-3.5" />
                            {timeLabel}
                        </div>
                        <Input
                            type="time"
                            className="h-9 w-[120px] bg-white"
                            value={timeValue}
                            onChange={(e) => updateTimePart(e.target.value)}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9"
                            onClick={() => onChange('')}
                        >
                            {clearLabel}
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

const AnnouncementManager: React.FC = () => {
    const { t, i18n } = useTranslation(['common', 'admin']);
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const calendarLocale = i18n.resolvedLanguage?.startsWith('zh') ? zhCN : enUS;

    const [formData, setFormData] = useState<AnnouncementFormData>(DEFAULT_FORM);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isSimulateOpen, setIsSimulateOpen] = useState(false);
    const [filters, setFilters] = useState<AnnouncementFilters>({
        lang: 'all',
        include_unpublished: true,
        include_deleted: false,
        limit: 50,
        offset: 0
    });

    const { data: announcementsResponse, isLoading, isError, error } = useQuery({
        queryKey: ['announcements', 'admin-list', filters],
        queryFn: () => adminApi.announcements.list(filters),
    });
    const toErrorText = (err: any, fallback?: string) =>
        translateBackendErrorMessage((err as any)?.message || '') ||
        (err as any)?.message ||
        fallback ||
        t('admin:error_operation_failed');

    const announcements = announcementsResponse?.items || [];
    const total = announcementsResponse?.total ?? 0;
    const pageSize = filters.limit || 50;
    const offset = filters.offset || 0;
    const currentPage = Math.floor(offset / pageSize) + 1;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const canPrev = offset > 0;
    const canNext = offset + pageSize < total;

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
            // ✅ Immediately publish to make it visible
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
        onError: (e: any) => toast.error(toErrorText(e))
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
        onError: (e: any) => toast.error(toErrorText(e))
    });

    const publishMutation = useMutation({
        mutationFn: (id: number) => adminApi.announcements.publish(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success(t('admin:announcements_published_success', 'Announcement published'));
        },
        onError: (e: any) => toast.error(toErrorText(e))
    });

    const unpublishMutation = useMutation({
        mutationFn: (id: number) => adminApi.announcements.unpublish(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success(t('admin:announcements_unpublished_success', 'Announcement unpublished'));
        },
        onError: (e: any) => toast.error(toErrorText(e))
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminApi.announcements.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success(t('admin:deleted_success', 'Announcement deleted'));
        },
        onError: (e: any) => toast.error(toErrorText(e))
    });

    const handleSubmit = (publishNow = false) => {
        if (!formData.title || !formData.content_md) return toast.error(t('admin:error_title_content_required'));

        if (editingId) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate({ data: formData, publishNow });
        }
    };

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
                <Button className="h-10 px-5 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2" onClick={() => {
                    setEditingId(null);
                    setFormData(DEFAULT_FORM);
                    setEditorTab('edit');
                    setIsCreateOpen(true);
                }}>
                    <Plus className="w-4 h-4" />
                    {t('admin:create_announcement', 'Create Announcement')}
                </Button>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                    <CardHeader className="space-y-4">
                        <CardTitle>{t('admin:active_announcements', 'System Announcements')}</CardTitle>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Select
                                value={filters.lang}
                                onValueChange={(v) => setFilters((prev) => ({ ...prev, lang: v as AnnouncementLang, offset: 0 }))}
                            >
                                <SelectTrigger className="h-10 bg-white/80">
                                    <SelectValue placeholder={t('admin:announcements_filter_lang', 'Language')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('admin:announcements_lang_all', 'All languages')}</SelectItem>
                                    <SelectItem value="zh">{t('admin:lang_zh')}</SelectItem>
                                    <SelectItem value="en">{t('admin:lang_en')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="h-10 flex items-center justify-between rounded-lg border border-slate-200/70 bg-white/70 px-3">
                                <Label htmlFor="include-unpublished" className="text-sm font-medium">
                                    {t('admin:announcements_filter_include_unpublished', 'Include unpublished')}
                                </Label>
                                <Switch
                                    id="include-unpublished"
                                    checked={filters.include_unpublished}
                                    onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, include_unpublished: checked, offset: 0 }))}
                                />
                            </div>
                            <div className="h-10 flex items-center justify-between rounded-lg border border-slate-200/70 bg-white/70 px-3">
                                <Label htmlFor="include-deleted" className="text-sm font-medium">
                                    {t('admin:announcements_filter_include_deleted', 'Include deleted')}
                                </Label>
                                <Switch
                                    id="include-deleted"
                                    checked={filters.include_deleted}
                                    onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, include_deleted: checked, offset: 0 }))}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <div className="space-y-4">
                                {announcements?.map((item) => (
                                    <div key={item.id}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-lg border border-border/40 bg-background/50 transition-colors",
                                            item.deleted_at
                                                ? "cursor-not-allowed opacity-70"
                                                : "cursor-pointer hover:bg-muted/50"
                                        )}
                                        onClick={async () => {
                                            if (item.deleted_at) return;
                                            setEditingId(item.id);
                                            setIsLoadingDetail(true);
                                            setIsCreateOpen(true);
                                            try {
                                                const detail = await adminApi.announcements.get(item.id, {
                                                    include_deleted: filters.include_deleted,
                                                });
                                                // ✅ 后端字段对齐: content_md
                                                const rawContent = detail.content_md || detail.content || '';
                                                const cleanContent = typeof rawContent === 'string' ? rawContent.replace(/\\n/g, '\n') : '';

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
                                                console.error("Fetch announcement error:", e);
                                                toast.error(toErrorText(e));
                                                setIsCreateOpen(false);
                                            } finally {
                                                setIsLoadingDetail(false);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${item.show_popup ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                                <Megaphone className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold">{item.title}</h4>
                                                    {item.is_pinned && <span className="text-xs bg-amber-500/10 text-amber-600 px-1 rounded border border-amber-500/20 font-bold uppercase">{t('admin:is_pinned')}</span>}
                                                    {item.deleted_at ? (
                                                        <span className="text-xs bg-destructive/10 text-destructive px-1 rounded border border-destructive/20 font-bold uppercase">
                                                            {t('admin:announcements_status_deleted', 'Deleted')}
                                                        </span>
                                                    ) : item.is_published ? (
                                                        <span className="text-xs bg-emerald-500/10 text-emerald-600 px-1 rounded border border-emerald-500/20 font-bold uppercase">
                                                            {t('admin:published', 'Published')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-slate-500/10 text-slate-600 px-1 rounded border border-slate-500/20 font-bold uppercase">
                                                            {t('admin:draft', 'Draft')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                                    <span className="uppercase bg-secondary px-1.5 rounded">{item.lang}</span>
                                                    <span>
                                                        {(() => {
                                                            try {
                                                                const d = new Date(item.created_at || item.updated_at || Date.now());
                                                                return isNaN(d.getTime()) ? '-' : format(d, 'yyyy-MM-dd HH:mm');
                                                            } catch (e) { return '-'; }
                                                        })()}
                                                    </span>
                                                    {item.show_popup && <span className="text-red-500 font-bold">{t('admin:popup_badge')}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!item.deleted_at && (item.is_published ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        unpublishMutation.mutate(item.id);
                                                    }}
                                                    disabled={unpublishMutation.isPending}
                                                >
                                                    {t('admin:announcements_unpublish', 'Unpublish')}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        publishMutation.mutate(item.id);
                                                    }}
                                                    disabled={publishMutation.isPending}
                                                >
                                                    {t('admin:announcements_publish', 'Publish')}
                                                </Button>
                                            ))}
                                            {!item.deleted_at && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteMutation.mutate(item.id);
                                                    }}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {!announcements?.length && (
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
                                        onClick={() => setFilters((prev) => ({ ...prev, offset: Math.max(0, (prev.offset || 0) - (prev.limit || 50)) }))}
                                    >
                                        {t('admin:prev')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!canNext}
                                        onClick={() => setFilters((prev) => ({ ...prev, offset: (prev.offset || 0) + (prev.limit || 50) }))}
                                    >
                                        {t('admin:next')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="p-6 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden rounded-3xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingId ? t('admin:edit_announcement', 'Edit Announcement') : t('admin:new_announcement', 'New Announcement')}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4 relative min-h-[300px]">
                            {isLoadingDetail && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-50 backdrop-blur-[1px]">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <p className="text-xs font-medium text-slate-500">{t('admin:loading_detail', 'Loading details...')}</p>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('admin:form.title')}</label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder={t('admin:form.title_placeholder')}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('admin:form.language')}</label>
                                <Select
                                    value={formData.lang}
                                    onValueChange={(v) => setFormData({ ...formData, lang: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="zh">{t('admin:lang_zh')}</SelectItem>
                                        <SelectItem value="en">{t('admin:lang_en')}</SelectItem>
                                        <SelectItem value="all">{t('admin:announcements_lang_all', 'All languages')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">{t('admin:form.content')}</label>
                                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                        <Button
                                            type="button"
                                            variant={editorTab === 'edit' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setEditorTab('edit')}
                                            className={cn(
                                                "h-7 gap-1.5 px-2 text-xs font-bold transition-all",
                                                editorTab === 'edit' ? "bg-white text-primary shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            <FileEdit className="w-3 h-3" />
                                            {t('common:edit')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={editorTab === 'preview' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setEditorTab('preview')}
                                            className={cn(
                                                "h-7 gap-1.5 px-2 text-xs font-bold transition-all",
                                                editorTab === 'preview' ? "bg-white text-primary shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            <Eye className="w-3 h-3" />
                                            {t('common:preview')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsSimulateOpen(true)}
                                            className="h-7 gap-1.5 px-2 text-xs font-bold text-slate-500 hover:text-primary hover:bg-white"
                                        >
                                            <Megaphone className="w-3 h-3" />
                                            {t('admin:simulate_popup', 'Simulate')}
                                        </Button>
                                    </div>
                                </div>

                                {editorTab === 'edit' ? (
                                    <Textarea
                                        value={formData.content_md}
                                        onChange={(e) => setFormData({ ...formData, content_md: e.target.value })}
                                        placeholder={t('admin:form.content_placeholder')}
                                        className="h-48"
                                    />
                                ) : (
                                    <div
                                        className="h-[400px] overflow-y-auto bg-white rounded-xl p-6 prose prose-slate dark:prose-invert max-w-none border border-slate-200 shadow-inner scrollbar-thin"
                                    >
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({ node, ...props }) => <p className="mb-4 last:mb-0 whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed" {...props} />,
                                                li: ({ node, ...props }) => <li className="whitespace-pre-wrap text-slate-700 dark:text-slate-300" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                                                h1: ({ node, ...props }) => <h1 className="text-2xl font-black mb-6 pb-2 border-b tracking-tight" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-4 tracking-tight" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-3 tracking-tight" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-black text-slate-900 dark:text-white" {...props} />
                                            }}
                                        >
                                            {formData.content_md || `*${t('admin:no_content_to_preview', 'No content to preview')}*`}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('admin:announcements_popup_start_at', 'Popup start time')}</label>
                                    <DateTimeField
                                        value={formData.popup_start_at}
                                        onChange={(next) => setFormData({ ...formData, popup_start_at: next })}
                                        placeholder={t('admin:announcements_popup_start_at', 'Popup start time')}
                                        timeLabel={t('admin:time', 'Time')}
                                        clearLabel={t('common:clear', 'Clear')}
                                        calendarLocale={calendarLocale}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('admin:announcements_popup_end_at', 'Popup end time')}</label>
                                    <DateTimeField
                                        value={formData.popup_end_at}
                                        onChange={(next) => setFormData({ ...formData, popup_end_at: next })}
                                        placeholder={t('admin:announcements_popup_end_at', 'Popup end time')}
                                        timeLabel={t('admin:time', 'Time')}
                                        clearLabel={t('common:clear', 'Clear')}
                                        calendarLocale={calendarLocale}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white/70 px-3 py-2">
                                    <Label htmlFor="is_popup" className="text-sm font-medium">{t('admin:form.popup')}</Label>
                                    <Switch
                                        id="is_popup"
                                        checked={formData.show_popup}
                                        onCheckedChange={(checked) => setFormData({ ...formData, show_popup: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white/70 px-3 py-2">
                                    <Label htmlFor="is_pinned" className="text-sm font-medium">{t('admin:form.pin', 'Pin Announcement')}</Label>
                                    <Switch
                                        id="is_pinned"
                                        checked={formData.is_pinned}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('admin:form.cancel')}</Button>
                            {editingId ? (
                                <Button onClick={() => handleSubmit(false)} disabled={updateMutation.isPending}>
                                    {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {t('admin:form.update', 'Update')}
                                </Button>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={() => handleSubmit(false)} disabled={createMutation.isPending}>
                                        {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {t('admin:announcements_save_draft', 'Save Draft')}
                                    </Button>
                                    <Button onClick={() => handleSubmit(true)} disabled={createMutation.isPending}>
                                        {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {t('admin:announcements_save_and_publish', 'Save & Publish')}
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* --- Simulate Popup Dialog --- */}
                <Dialog open={isSimulateOpen} onOpenChange={setIsSimulateOpen}>
                    <DialogContent className="max-w-md md:max-w-2xl p-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden rounded-3xl">
                        <DialogHeader className="p-6 pb-4 bg-slate-50/50 dark:bg-slate-900/50 border-b">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                    <Megaphone size={28} />
                                </div>
                                <DialogTitle className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                                    {formData.title || t('admin:form.title_placeholder')}
                                </DialogTitle>
                            </div>
                        </DialogHeader>

                        <div className="px-6 py-4">
                            <div className="max-h-[60vh] md:max-h-[500px] overflow-y-auto w-full pr-2 scrollbar-thin">
                                <article className="prose prose-slate dark:prose-invert prose-sm md:prose-base max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ node, ...props }) => <p className="mb-4 last:mb-0 whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed" {...props} />,
                                            li: ({ node, ...props }) => <li className="whitespace-pre-wrap text-slate-700 dark:text-slate-300" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                                            h1: ({ node, ...props }) => <h1 className="text-2xl font-black mb-6 pb-2 border-b tracking-tight" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-4 tracking-tight" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-3 tracking-tight" {...props} />,
                                            strong: ({ node, ...props }) => <strong className="font-black text-slate-900 dark:text-white" {...props} />
                                        }}
                                    >
                                        {formData.content_md || `*${t('admin:no_content_to_preview')}*`}
                                    </ReactMarkdown>
                                </article>
                            </div>
                        </div>

                        <div className="p-6 pt-2 flex justify-end bg-slate-50/50 dark:bg-slate-900/50 border-t">
                            <Button onClick={() => setIsSimulateOpen(false)} className="w-full md:w-auto px-10 h-11 text-base font-bold shadow-lg shadow-primary/20">
                                {t("common:close")}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </motion.div>
        </motion.div>
    );
};

export default AnnouncementManager;
