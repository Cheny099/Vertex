
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, CheckCircle, Clock, AlertCircle, Eye, FileEdit, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { adminApi, translateBackendErrorMessage } from "@/api";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Type definition for form data
interface LegalFormData {
    key: 'terms' | 'privacy' | 'auto_trade_notice';
    lang: 'zh' | 'en';
    version: string;
    title: string;
    content_md: string;
    effective_at?: string;
}

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

const LegalManager = () => {
    const { t } = useTranslation("admin");
    const queryClient = useQueryClient();
    const [createOpen, setCreateOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'auto_trade_notice'>('terms');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<LegalFormData>({
        key: 'terms',
        lang: 'zh',
        version: format(new Date(), 'yyyy-MM-dd'),
        title: '',
        content_md: '',
    });

    const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const { data: docsResponse, isLoading, isError, error } = useQuery({
        queryKey: ["legal-docs", activeTab],
        queryFn: () => adminApi.legal.list({
            key: activeTab,
            limit: 200,
            offset: 0,
        })
    });
    const docs = docsResponse?.items || [];
    const docsErrorText = isError
        ? (translateBackendErrorMessage((error as any)?.message || '') || (error as any)?.message || t("error_operation_failed"))
        : '';

    const activateMutation = useMutation({
        mutationFn: (id: number) => adminApi.legal.activate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["legal-docs"] });
            toast.success(t("activated_success"));
        }
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
                is_active: true // ✅ Auto-activate by default
            };
            return adminApi.legal.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["legal-docs"] });
            toast.success(editingId ? t("updated_success") : t("publish_success"));
            setCreateOpen(false);
            setEditingId(null);
        },
        onError: (err: any) => {
            // Translate common backend errors
            const rawMsg = (err as any)?.message || '';
            let msg = translateBackendErrorMessage(rawMsg) || rawMsg;
            if (rawMsg.includes("already exists")) {
                msg = t("error_version_exists");
            } else if (rawMsg.includes("cannot be edited")) {
                msg = t("active_doc_edit_notice");
            }
            toast.error(msg || t("publish_failed"));
        }
    });

    const generateNextVersion = (currentVersion: string) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        // If it's a date-based version and not from today, use today
        if (/^\d{4}-\d{2}-\d{2}$/.test(currentVersion) && currentVersion !== today) {
            return today;
        }
        // If it's already today or another format, append a suffix
        return `${currentVersion}-v${Math.floor(Math.random() * 1000)}`;
    };

    const openEdit = async (doc: any) => {
        setIsLoadingDetail(true);
        setCreateOpen(true);
        try {
            const detail = await adminApi.legal.get(doc.id);
            const isActive = detail.is_active;

            setEditorTab('edit');

            // 1. 获取内容字符串 2. 移除转义换行符
            const rawContent = detail.content_md || detail.content || '';
            const cleanContent = typeof rawContent === 'string' ? rawContent.replace(/\\n/g, '\n') : '';

            // If active, we don't EDIT, we CREATE NEW VERSION
            if (isActive) {
                setEditingId(null);
                setFormData({
                    key: detail.key,
                    lang: detail.lang as any,
                    version: generateNextVersion(detail.version),
                    title: detail.title,
                    content_md: cleanContent,
                });
                toast.info(t("active_doc_edit_notice"), {
                    description: t("edit_notice"),
                    duration: 5000,
                });
            } else {
                setEditingId(detail.id);
                setFormData({
                    key: detail.key,
                    lang: detail.lang as any,
                    version: detail.version,
                    title: detail.title,
                    content_md: cleanContent,
                });
            }
        } catch (e) {
            console.error("Fetch legal doc error:", e);
            toast.error(translateBackendErrorMessage((e as any)?.message || '') || t("error_operation_failed"));
            setCreateOpen(false);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-4 md:p-8 space-y-6 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">{t("legal")}</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        {t("legal_desc")}
                    </p>
                </div>
                <Button className="h-10 px-5 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2" onClick={() => {
                    setEditingId(null);
                    setFormData({
                        key: activeTab,
                        lang: 'zh',
                        version: format(new Date(), 'yyyy-MM-dd'),
                        title: t(activeTab),
                        content_md: '',
                    });
                    setCreateOpen(true);
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("new_version")}
                </Button>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                    <TabsList className="bg-slate-100/50 border border-slate-200 p-1 rounded-xl">
                        <TabsTrigger value="terms" className="rounded-lg">{t("terms")}</TabsTrigger>
                        <TabsTrigger value="privacy" className="rounded-lg">{t("privacy")}</TabsTrigger>
                        <TabsTrigger value="auto_trade_notice" className="rounded-lg">{t("auto_trade_notice")}</TabsTrigger>
                    </TabsList>
                </Tabs>
            </motion.div>

            <motion.div variants={itemVariants}>
                <div className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="w-[150px] font-bold">{t("version")}</TableHead>
                                <TableHead className="font-bold">{t("form.title")}</TableHead>
                                <TableHead className="font-bold">{t("form.language")}</TableHead>
                                <TableHead className="font-bold">{t("effective_at")}</TableHead>
                                <TableHead className="font-bold">{t("column_status")}</TableHead>
                                <TableHead className="text-right font-bold">{t("column_actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isError ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-destructive gap-3 px-6">
                                            <AlertCircle className="w-12 h-12 opacity-80" />
                                            <p className="font-medium">{docsErrorText}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                            <p className="text-sm font-medium text-slate-400">{t("loading_docs")}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : docs?.map((doc: any) => (
                                <TableRow
                                    key={doc.id}
                                    className="cursor-pointer hover:bg-slate-50/80 transition-colors group"
                                    onClick={() => openEdit(doc)}
                                >
                                    <TableCell className="font-mono text-sm font-semibold text-primary">{doc.version}</TableCell>
                                    <TableCell className="font-medium">{doc.title}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">
                                            {doc.lang === 'zh' ? t("lang_zh") : t("lang_en")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500 font-medium">
                                        {(() => {
                                            try {
                                                const d = new Date(doc.effective_at || doc.created_at || Date.now());
                                                return isNaN(d.getTime()) ? '-' : format(d, 'yyyy-MM-dd HH:mm');
                                            } catch (e) { return '-'; }
                                        })()}
                                    </TableCell>
                                    <TableCell>
                                        {doc.is_active ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none px-3 py-1">
                                                <CheckCircle className="w-3 h-3 mr-1.5" /> {t("is_active")}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-400 border-slate-200">
                                                <Clock className="w-3 h-3 mr-1.5" /> {t("history")}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!doc.is_active && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-lg font-bold"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        activateMutation.mutate(doc.id);
                                                    }}
                                                >
                                                    {t("activate")}
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEdit(doc);
                                                }}
                                            >
                                                <Edit2 className="w-4 h-4 text-slate-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!docs || docs.length === 0) && !isLoading && !isError && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                                            <AlertCircle className="w-12 h-12 opacity-20" />
                                            <p className="font-medium">{t("no_data")}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </motion.div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-2xl p-6 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight">
                            {editingId ? t("title_edit_version") : t("new_version")}: {t(activeTab)}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium text-xs pt-0.5">
                            {t("legal_create_desc")}
                        </DialogDescription>
                    </DialogHeader>

                    {editingId === null && (
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-2.5 mt-1">
                            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                {t("active_doc_edit_notice")}
                            </p>
                        </div>
                    )}

                    <div className="grid gap-4 py-4 relative min-h-[400px]">
                        {isLoadingDetail && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-50 backdrop-blur-[1px]">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-xs font-medium text-slate-500">{t('admin:loading_detail')}</p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 ml-1">{t("version")}</Label>
                                <Input
                                    value={formData.version}
                                    onChange={e => setFormData({ ...formData, version: e.target.value })}
                                    disabled={editingId !== null}
                                    className="h-10 bg-slate-50 border-none rounded-lg focus-visible:ring-primary/20 font-mono text-sm"
                                    placeholder="2024-02-07"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 ml-1">{t("form.language")}</Label>
                                <Select
                                    value={formData.lang}
                                    onValueChange={(val) => setFormData({ ...formData, lang: val as any })}
                                    disabled={editingId !== null}
                                >
                                    <SelectTrigger className="h-10 w-full rounded-lg border-none bg-slate-50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="zh">{t("lang_zh")}</SelectItem>
                                        <SelectItem value="en">{t("lang_en")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 ml-1">{t("form.title")}</Label>
                            <Input
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="h-10 bg-slate-50 border-none rounded-lg focus-visible:ring-primary/20 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <Label className="text-xs font-bold text-slate-700">{t("form.content")}</Label>
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
                                        {t("common:edit")}
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
                                        {t("common:preview")}
                                    </Button>
                                </div>
                            </div>

                            {editorTab === 'edit' ? (
                                <Textarea
                                    className="h-[250px] font-mono text-xs bg-slate-50 border-none rounded-xl focus-visible:ring-primary/20 resize-none p-3"
                                    value={formData.content_md}
                                    onChange={e => setFormData({ ...formData, content_md: e.target.value })}
                                    placeholder={t("content_placeholder")}
                                />
                            ) : (
                                <div
                                    className="h-[250px] overflow-y-auto bg-slate-50 rounded-xl p-4 prose prose-sm dark:prose-invert max-w-none border-t border-slate-100 scrollbar-thin"
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
                                        {formData.content_md || `*${t("admin:no_content_to_preview")}*`}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button variant="ghost" className="h-10 rounded-lg font-bold px-6 text-sm" onClick={() => setCreateOpen(false)}>
                            {t("form.cancel")}
                        </Button>
                        <Button
                            className="h-10 rounded-lg font-bold px-8 gradient-primary shadow-button text-sm"
                            onClick={() => createMutation.mutate(formData)}
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending ? t("creating") : (editingId ? t("form.update") : t("form.create"))}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};

export default LegalManager;
