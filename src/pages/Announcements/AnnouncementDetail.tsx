import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { announcementApi, AnnouncementDetail } from "@/api";

export default function AnnouncementDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { i18n, t } = useTranslation(["common", "announcements"]);
    const [data, setData] = useState<AnnouncementDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            setLoading(true);
            setError("");
            try {
                const lang = i18n.language.startsWith("zh") ? "zh" : "en";
                const res = await announcementApi.get(Number(id), lang);
                setData(res);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load announcement");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, i18n.language]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-destructive font-medium">{error || t("not_found.title")}</p>
                <Button variant="outline" onClick={() => navigate("/announcements")}>
                    {t("back_to_list")}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <Button variant="ghost" className="pl-0 hover:pl-2 transition-all" onClick={() => navigate("/announcements")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("announcements:back")}
            </Button>

            <article className="bg-card glass-card rounded-xl border border-border/50 p-6 md:p-10 shadow-lg">
                <header className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        {data.title}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar size={16} />
                        <time>{new Date(data.published_at).toLocaleString()}</time>
                    </div>
                </header>

                <Separator className="mb-8" />

                <div className="prose dark:prose-invert max-w-none text-foreground/90 leading-7">
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
                        {typeof data.content_md === 'string'
                            ? data.content_md.replace(/\\n/g, '\n')
                            : ''}
                    </ReactMarkdown>
                </div>
            </article>
        </div>
    );
}
