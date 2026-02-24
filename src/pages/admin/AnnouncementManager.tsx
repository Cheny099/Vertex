import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, Loader2, Megaphone, Eye, FileEdit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { announcementApi, adminApi } from '@/api';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

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

const AnnouncementManager: React.FC = () => {
    const { t, i18n } = useTranslation(['common', 'admin']);
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content_md: '',
        lang: 'zh',
        show_popup: false,
        is_pinned: false
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [isSimulateOpen, setIsSimulateOpen] = useState(false);

    const { data: announcements, isLoading } = useQuery({
        queryKey: ['announcements', 'all'], // Admin view might need a specific admin list endpoint if public one mimics active only
        queryFn: async () => {
            try {
                // Workaround: Admin API returns 500, so fetch both public lists safely
                const [zhData, enData] = await Promise.all([
                    announcementApi.list('zh', 20).catch(() => []),
                    announcementApi.list('en', 20).catch(() => [])
                ]);

                // Merge and Deduplicate by ID
                const allItems = [...(zhData || []), ...(enData || [])];
                const uniqueMap = new Map();
                allItems.forEach(item => {
                    if (item && item.id) uniqueMap.set(item.id, item);
                });

                const uniqueList = Array.from(uniqueMap.values()) as any[]; // Type assertion if needed

                // Sort by date desc safely
                return uniqueList.sort((a, b) => {
                    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return tB - tA;
                });
            } catch (e) {
                console.error("Failed to fetch announcements", e);
                return [];
            }
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const newAnnouncement = await adminApi.announcements.create({
                title: data.title,
                content_md: data.content_md,
                lang: data.lang,
                show_popup: data.show_popup,
                is_pinned: data.is_pinned,
            });
            // ✅ Immediately publish to make it visible
            await adminApi.announcements.publish(newAnnouncement.id);
            return newAnnouncement;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            setIsCreateOpen(false);
            setFormData({ title: '', content_md: '', lang: 'zh', show_popup: false, is_pinned: false });
            toast.success(t('admin:created_success', 'Announcement created'));
        },
        onError: (e: any) => toast.error(e?.message || 'Failed to create')
    });

    const updateMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            if (!editingId) return;
            return adminApi.announcements.update(editingId, {
                title: data.title,
                content_md: data.content_md,
                lang: data.lang,
                show_popup: data.show_popup,
                is_pinned: data.is_pinned,
                // Ensure it stays published if it was
                is_active: true
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            setIsCreateOpen(false);
            setEditingId(null);
            setFormData({ title: '', content_md: '', lang: 'zh', show_popup: false, is_pinned: false });
            toast.success(t('admin:announcement_updated_success', 'Announcement updated'));
        },
        onError: (e: any) => toast.error(e?.message || 'Failed to update')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => adminApi.announcements.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success(t('admin:deleted_success', 'Announcement deleted'));
        },
        onError: (e: any) => toast.error(e?.message || 'Failed to delete')
    });

    const handleSubmit = () => {
        if (!formData.title || !formData.content_md) return toast.error(t('admin:error_title_content_required'));

        if (editingId) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
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
                <Button className="rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2" onClick={() => {
                    setEditingId(null);
                    setFormData({ title: '', content_md: '', lang: 'zh', show_popup: false, is_pinned: false });
                    setEditorTab('edit');
                    setIsCreateOpen(true);
                }}>
                    <Plus className="w-4 h-4" />
                    {t('admin:create_announcement', 'Create Announcement')}
                </Button>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                    <CardHeader>
                        <CardTitle>{t('admin:active_announcements', 'System Announcements')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <div className="space-y-4">
                                {announcements?.map((item) => (
                                    <div key={item.id}
                                        className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-background/50 cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={async () => {
                                            setEditingId(item.id);
                                            setIsLoadingDetail(true);
                                            setIsCreateOpen(true);
                                            try {
                                                const detail = await adminApi.announcements.get(item.id);
                                                // ✅ 后端字段对齐: content_md
                                                const rawContent = detail.content_md || detail.content || '';
                                                const cleanContent = typeof rawContent === 'string' ? rawContent.replace(/\\n/g, '\n') : '';

                                                setFormData({
                                                    title: detail.title,
                                                    content_md: cleanContent,
                                                    lang: detail.lang as any,
                                                    show_popup: detail.show_popup || false,
                                                    is_pinned: detail.is_pinned || false
                                                });
                                                setEditorTab('edit');
                                            } catch (e) {
                                                console.error("Fetch announcement error:", e);
                                                toast.error('Failed to fetch detail');
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
                                                    {item.is_pinned && <span className="text-[10px] bg-amber-500/10 text-amber-600 px-1 rounded border border-amber-500/20 font-bold uppercase">{t('admin:is_pinned')}</span>}
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
                                    </div>
                                ))}
                                {!announcements?.length && (
                                    <div className="text-center py-12 text-muted-foreground">{t('admin:no_data', 'No announcements')}</div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent>
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
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">{t('admin:form.content')}</label>
                                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                        <button
                                            onClick={() => setEditorTab('edit')}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                                                editorTab === 'edit' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            <FileEdit className="w-3 h-3" />
                                            {t('common:edit')}
                                        </button>
                                        <button
                                            onClick={() => setEditorTab('preview')}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                                                editorTab === 'preview' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            <Eye className="w-3 h-3" />
                                            {t('common:preview')}
                                        </button>
                                        <button
                                            onClick={() => setIsSimulateOpen(true)}
                                            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all text-slate-500 hover:text-primary hover:bg-white"
                                        >
                                            <Megaphone className="w-3 h-3" />
                                            {t('admin:simulate_popup', 'Simulate')}
                                        </button>
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
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_popup"
                                        checked={formData.show_popup}
                                        onChange={(e) => setFormData({ ...formData, show_popup: e.target.checked })}
                                    />
                                    <label htmlFor="is_popup" className="text-sm font-medium">{t('admin:form.popup')}</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_pinned"
                                        checked={formData.is_pinned}
                                        onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                                    />
                                    <label htmlFor="is_pinned" className="text-sm font-medium">{t('admin:form.pin', 'Pin Announcement')}</label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('admin:form.cancel')}</Button>
                            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingId ? t('admin:form.update', 'Update') : t('admin:form.create', 'Create')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* --- Simulate Popup Dialog --- */}
                <Dialog open={isSimulateOpen} onOpenChange={setIsSimulateOpen}>
                    <DialogContent className="max-w-md md:max-w-2xl bg-white dark:bg-slate-950 border-border shadow-2xl p-0 overflow-hidden rounded-2xl">
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
