import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import ParticleBackground from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { legalApi, PublicLegalDoc } from "@/api";

export default function Terms() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation(['common', 'auth']);
  const [doc, setDoc] = useState<PublicLegalDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      try {
        const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
        const res = await legalApi.getPublicDoc('terms', lang);
        setDoc(res);
      } catch (err) {
        console.error("Failed to load Terms", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [i18n.language]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0" style={{ background: "var(--gradient-background)" }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full bg-primary/5 blur-3xl animate-pulse-glow pointer-events-none" />
      <ParticleBackground />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-border/50 bg-card/50"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2" size={18} />
              {t('common:back')}
            </Button>
            <Link to="/register" state={(location as any).state}>
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                {t('auth:login.register_btn')}
              </Button>
            </Link>
          </div>

          <Link to="/login" state={(location as any).state}>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              {t('auth:login.go_login')}
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative bg-card rounded-2xl shadow-card p-6 md:p-8 overflow-hidden min-h-[400px]"
        >
          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent scanner-line opacity-60" />

          {loading ? (
            <div className="flex justify-center items-center h-60">
              <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
          ) : doc ? (
            <>
              <div className="flex items-start gap-3">
                <div className="mt-1 text-primary">
                  <FileText size={22} />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-semibold">{doc.title}</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('common:version')}: {doc.version} • {t('common:effective_at')}: {new Date(doc.effective_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-5 text-sm leading-7 text-foreground/90 prose dark:prose-invert max-w-none">
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
                  {doc.content_md.replace(/\\n/g, '\n')}
                </ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              {t('common:not_found.title')}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
