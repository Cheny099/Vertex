import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, Megaphone } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { announcementApi, PopupAnnouncement } from "@/api";

export default function AnnouncementPopup() {
    const { i18n, t } = useTranslation("common");
    const [isOpen, setIsOpen] = useState(false);
    const [announcement, setAnnouncement] = useState<PopupAnnouncement | null>(null);

    useEffect(() => {
        // 缩短检查延迟，实现“立刻弹”
        const checkPopup = async () => {
            try {
                // 当前语言 (simple mapping: zh-CN -> zh, en-US -> en)
                const lang = i18n.language.startsWith("zh") ? "zh" : "en";
                const result = await announcementApi.getPopup(lang);

                if (result && result.id) {
                    const dismissedId = localStorage.getItem(`vertex_popup_dismissed_${lang}`);
                    // 如果是新公告 (ID 不匹配)，则弹出
                    if (String(result.id) !== dismissedId) {
                        setAnnouncement(result);
                        setIsOpen(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch announcement popup:", error);
            }
        };

        const timer = setTimeout(checkPopup, 200); // 几乎立刻弹出 (200ms 为了平滑生命周期)
        return () => clearTimeout(timer);
    }, [i18n.language]);

    const handleClose = () => {
        setIsOpen(false);
        if (announcement) {
            const lang = i18n.language.startsWith("zh") ? "zh" : "en";
            localStorage.setItem(`vertex_popup_dismissed_${lang}`, String(announcement.id));
        }
    };

    if (!announcement) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            {/* 去除 glass-card，使用纯净白色/深色背景，消除黄灰感 */}
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
                                {typeof announcement.content_md === 'string'
                                    ? announcement.content_md.replace(/\\n/g, '\n')
                                    : ''}
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
