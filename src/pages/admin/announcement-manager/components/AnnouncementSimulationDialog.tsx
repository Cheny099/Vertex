import type { TFunction } from 'i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Megaphone } from 'lucide-react';
import { MARKDOWN_RENDERERS } from './markdownRenderers';

interface AnnouncementSimulationDialogProps {
  t: TFunction<'admin' | 'common'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
}

export function AnnouncementSimulationDialog({
  t,
  open,
  onOpenChange,
  title,
  content,
}: AnnouncementSimulationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md md:max-w-2xl p-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden rounded-3xl">
        <DialogHeader className="p-6 pb-4 bg-slate-50/50 dark:bg-slate-900/50 border-b">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Megaphone size={28} />
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              {title || t('admin:form.title_placeholder')}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="max-h-[60vh] md:max-h-[500px] overflow-y-auto w-full pr-2 scrollbar-thin">
            <article className="prose prose-slate dark:prose-invert prose-sm md:prose-base max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_RENDERERS}>
                {content || `*${t('admin:no_content_to_preview')}*`}
              </ReactMarkdown>
            </article>
          </div>
        </div>

        <div className="p-6 pt-2 flex justify-end bg-slate-50/50 dark:bg-slate-900/50 border-t">
          <Button onClick={() => onOpenChange(false)} className="w-full md:w-auto px-10 h-11 text-base font-bold shadow-lg shadow-primary/20">
            {t('common:close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
