import type { Locale } from 'date-fns';
import type { TFunction } from 'i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Eye, FileEdit, Loader2, Megaphone } from 'lucide-react';
import { DateTimeField } from './DateTimeField';
import { MARKDOWN_RENDERERS } from './markdownRenderers';
import type { AnnouncementFormData } from '../utils';

interface AnnouncementEditorDialogProps {
  t: TFunction<'admin' | 'common'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: AnnouncementFormData;
  onFormDataChange: (next: AnnouncementFormData) => void;
  editingId: number | null;
  editorTab: 'edit' | 'preview';
  onEditorTabChange: (tab: 'edit' | 'preview') => void;
  isLoadingDetail: boolean;
  onOpenSimulation: () => void;
  onClose: () => void;
  onSubmit: (publishNow?: boolean) => void;
  isCreatePending: boolean;
  isUpdatePending: boolean;
  calendarLocale: Locale;
}

export function AnnouncementEditorDialog({
  t,
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  editingId,
  editorTab,
  onEditorTabChange,
  isLoadingDetail,
  onOpenSimulation,
  onClose,
  onSubmit,
  isCreatePending,
  isUpdatePending,
  calendarLocale,
}: AnnouncementEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
              placeholder={t('admin:form.title_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('admin:form.language')}</label>
            <Select
              value={formData.lang}
              onValueChange={(value) => onFormDataChange({ ...formData, lang: value })}
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
                  onClick={() => onEditorTabChange('edit')}
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
                  onClick={() => onEditorTabChange('preview')}
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
                  onClick={onOpenSimulation}
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
                onChange={(e) => onFormDataChange({ ...formData, content_md: e.target.value })}
                placeholder={t('admin:form.content_placeholder')}
                className="h-48"
              />
            ) : (
              <div className="h-[400px] overflow-y-auto bg-white rounded-xl p-6 prose prose-slate dark:prose-invert max-w-none border border-slate-200 shadow-inner scrollbar-thin">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_RENDERERS}>
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
                onChange={(next) => onFormDataChange({ ...formData, popup_start_at: next })}
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
                onChange={(next) => onFormDataChange({ ...formData, popup_end_at: next })}
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
                onCheckedChange={(checked) => onFormDataChange({ ...formData, show_popup: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white/70 px-3 py-2">
              <Label htmlFor="is_pinned" className="text-sm font-medium">{t('admin:form.pin', 'Pin Announcement')}</Label>
              <Switch
                id="is_pinned"
                checked={formData.is_pinned}
                onCheckedChange={(checked) => onFormDataChange({ ...formData, is_pinned: checked })}
              />
            </div>
          </div>
        </div>
        {/* handleSubmit refuses while the record is still loading, so the footer has to reflect
            that - otherwise the click is a silent no-op with no toast and no error. */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('admin:form.cancel')}</Button>
          {editingId ? (
            <Button onClick={() => onSubmit(false)} disabled={isUpdatePending || isLoadingDetail}>
              {isUpdatePending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('admin:form.update', 'Update')}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onSubmit(false)} disabled={isCreatePending || isLoadingDetail}>
                {isCreatePending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('admin:announcements_save_draft', 'Save Draft')}
              </Button>
              <Button onClick={() => onSubmit(true)} disabled={isCreatePending || isLoadingDetail}>
                {isCreatePending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('admin:announcements_save_and_publish', 'Save & Publish')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
