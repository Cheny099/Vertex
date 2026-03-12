import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertCircle, Eye, FileEdit, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { legalMarkdownRenderers } from './markdownRenderers';
import type { EditorTab, LegalFormData, LegalLang, LegalKey } from '../utils';

interface LegalEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    activeTab: LegalKey;
    editingId: number | null;
    formData: LegalFormData;
    setFormData: React.Dispatch<React.SetStateAction<LegalFormData>>;
    editorTab: EditorTab;
    setEditorTab: React.Dispatch<React.SetStateAction<EditorTab>>;
    isLoadingDetail: boolean;
    isPending: boolean;
    t: (key: string) => string;
    onSubmit: () => void;
}

export const LegalEditorDialog = React.memo(({
    open,
    onOpenChange,
    activeTab,
    editingId,
    formData,
    setFormData,
    editorTab,
    setEditorTab,
    isLoadingDetail,
    isPending,
    t,
    onSubmit,
}: LegalEditorDialogProps) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-6 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden rounded-3xl">
            <DialogHeader>
                <DialogTitle className="text-xl font-black tracking-tight">
                    {editingId ? t('title_edit_version') : t('new_version')}: {t(activeTab)}
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-medium text-xs pt-0.5">
                    {t('legal_create_desc')}
                </DialogDescription>
            </DialogHeader>

            {editingId === null && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-2.5 mt-1">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 font-medium leading-relaxed">
                        {t('active_doc_edit_notice')}
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
                        <Label className="text-xs font-bold text-slate-700 ml-1">{t('version')}</Label>
                        <Input
                            value={formData.version}
                            onChange={(e) => setFormData((prev) => ({ ...prev, version: e.target.value }))}
                            disabled={editingId !== null}
                            className="h-10 bg-slate-50 border-none rounded-lg focus-visible:ring-primary/20 font-mono text-sm"
                            placeholder="2024-02-07"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 ml-1">{t('form.language')}</Label>
                        <Select
                            value={formData.lang}
                            onValueChange={(val) => {
                                if (val === 'zh' || val === 'en') {
                                    setFormData((prev) => ({ ...prev, lang: val as LegalLang }));
                                }
                            }}
                            disabled={editingId !== null}
                        >
                            <SelectTrigger className="h-10 w-full rounded-lg border-none bg-slate-50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="zh">{t('lang_zh')}</SelectItem>
                                <SelectItem value="en">{t('lang_en')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 ml-1">{t('form.title')}</Label>
                    <Input
                        value={formData.title}
                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        className="h-10 bg-slate-50 border-none rounded-lg focus-visible:ring-primary/20 text-sm"
                    />
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                        <Label className="text-xs font-bold text-slate-700">{t('form.content')}</Label>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg">
                            <Button
                                type="button"
                                variant={editorTab === 'edit' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setEditorTab('edit')}
                                className={cn(
                                    'h-7 gap-1.5 px-2 text-xs font-bold transition-all',
                                    editorTab === 'edit'
                                        ? 'bg-white text-primary shadow-sm hover:bg-white'
                                        : 'text-slate-500 hover:text-slate-700'
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
                                    'h-7 gap-1.5 px-2 text-xs font-bold transition-all',
                                    editorTab === 'preview'
                                        ? 'bg-white text-primary shadow-sm hover:bg-white'
                                        : 'text-slate-500 hover:text-slate-700'
                                )}
                            >
                                <Eye className="w-3 h-3" />
                                {t('common:preview')}
                            </Button>
                        </div>
                    </div>

                    {editorTab === 'edit' ? (
                        <Textarea
                            className="h-[250px] font-mono text-xs bg-slate-50 border-none rounded-xl focus-visible:ring-primary/20 resize-none p-3"
                            value={formData.content_md}
                            onChange={(e) => setFormData((prev) => ({ ...prev, content_md: e.target.value }))}
                            placeholder={t('content_placeholder')}
                        />
                    ) : (
                        <div className="h-[250px] overflow-y-auto bg-slate-50 rounded-xl p-4 prose prose-sm dark:prose-invert max-w-none border-t border-slate-100 scrollbar-thin">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={legalMarkdownRenderers}>
                                {formData.content_md || `*${t('admin:no_content_to_preview')}*`}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button variant="ghost" className="h-10 rounded-lg font-bold px-6 text-sm" onClick={() => onOpenChange(false)}>
                    {t('form.cancel')}
                </Button>
                <Button
                    className="h-10 rounded-lg font-bold px-8 gradient-primary shadow-button text-sm"
                    onClick={onSubmit}
                    disabled={isPending}
                >
                    {isPending ? t('creating') : editingId ? t('form.update') : t('form.create')}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
));

LegalEditorDialog.displayName = 'LegalEditorDialog';
