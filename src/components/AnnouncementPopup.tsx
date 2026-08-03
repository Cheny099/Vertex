import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Megaphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { announcementApi, PopupAnnouncement } from "@/api";
import { logger } from "@/lib/logger";

type MarkdownNodeProps = {
  node?: unknown;
} & Record<string, unknown>;

const markdownComponents = {
  p: ({ node, ...props }: MarkdownNodeProps) => (
    <p className="mb-4 last:mb-0 whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed" {...props} />
  ),
  li: ({ node, ...props }: MarkdownNodeProps) => (
    <li className="whitespace-pre-wrap text-slate-700 dark:text-slate-300" {...props} />
  ),
  ol: ({ node, ...props }: MarkdownNodeProps) => (
    <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />
  ),
  ul: ({ node, ...props }: MarkdownNodeProps) => (
    <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />
  ),
  h1: ({ node, ...props }: MarkdownNodeProps) => (
    <h1 className="text-2xl font-black mb-6 pb-2 border-b tracking-tight" {...props} />
  ),
  h2: ({ node, ...props }: MarkdownNodeProps) => (
    <h2 className="text-xl font-bold mb-4 tracking-tight" {...props} />
  ),
  h3: ({ node, ...props }: MarkdownNodeProps) => (
    <h3 className="text-lg font-bold mb-3 tracking-tight" {...props} />
  ),
  strong: ({ node, ...props }: MarkdownNodeProps) => (
    <strong className="font-black text-slate-900 dark:text-white" {...props} />
  ),
};

export default function AnnouncementPopup() {
  const { i18n, t } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<PopupAnnouncement | null>(null);

  const languageKey = useMemo(() => (i18n.language.startsWith("zh") ? "zh" : "en"), [i18n.language]);

  // The flag has to be honoured *after* the request resolves too, not only before it is launched.
  // Switching language mid-flight otherwise let the previous language's popup open over the new
  // UI - and dismissing it then wrote that id under the new language's dismissed key, so the real
  // popup for that language was never marked as seen.
  useEffect(() => {
    let cancelled = false;

    const checkPopup = async () => {
      try {
        const result = await announcementApi.getPopup(languageKey);
        if (cancelled || !result?.id) return;

        const dismissedId = localStorage.getItem(`vertex_popup_dismissed_${languageKey}`);
        if (String(result.id) !== dismissedId) {
          setAnnouncement(result);
          setIsOpen(true);
        }
      } catch (error) {
        if (cancelled) return;
        logger.error("Failed to fetch announcement popup:", error);
      }
    };

    const timer = setTimeout(() => {
      if (!cancelled) void checkPopup();
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      // A popup belonging to the language being left must not stay on screen.
      setIsOpen(false);
    };
  }, [languageKey]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (announcement) {
      localStorage.setItem(`vertex_popup_dismissed_${languageKey}`, String(announcement.id));
    }
  }, [announcement, languageKey]);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      handleClose();
    }
  }, [handleClose]);

  if (!announcement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-md md:max-w-2xl bg-white dark:bg-slate-950 border-border shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-4 bg-slate-50/50 dark:bg-slate-900/50 border-b">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Megaphone size={28} className="animate-pulse-slow" />
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              {announcement.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 py-4">
          <ScrollArea className="max-h-[60vh] md:max-h-[500px] w-full pr-4">
            <article className="prose dark:prose-invert prose-sm md:prose-base max-w-none text-slate-700 dark:text-slate-200 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {typeof announcement.content_md === "string" ? announcement.content_md.replace(/\\n/g, "\n") : ""}
              </ReactMarkdown>
            </article>
          </ScrollArea>
        </div>

        <div className="p-6 pt-2 flex justify-end bg-slate-50/50 dark:bg-slate-900/50 border-t">
          <Button onClick={handleClose} className="w-full md:w-auto px-10 h-11 text-base font-bold shadow-lg shadow-primary/20">
            {t("close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
