import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { legalApi, type LegalDocKey } from '@/api';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAsyncScope } from '@/hooks/use-async-scope';

interface RiskDisclosureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    docKey: LegalDocKey;
    requiredVersion: string;
    onAccept: () => void;
}

const DisclosureSession: React.FC<RiskDisclosureDialogProps & { lang: string }> = ({
    open,
    onOpenChange,
    docKey = 'auto_trade_notice',
    requiredVersion,
    onAccept,
    lang,
}) => {
    const { t } = useTranslation(['common', 'legal']);
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [accepting, setAccepting] = useState(false);
    const acceptingRef = useRef(false);
    const { capture, invalidate } = useAsyncScope();
    const [hasScrolledBottom, setHasScrolledBottom] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Parent polling must not reload the document or discard consent in the same session.
    useEffect(() => {
        if (!open || !docKey) return;

        const isCurrent = capture();
        let cancelled = false;
        setLoading(true);
        // Default to current language, backend handles fallback
        legalApi
            .getPublicDoc(docKey, lang)
            .then((doc) => {
                if (cancelled || !isCurrent()) return;
                if (doc?.key !== docKey || !requiredVersion || doc.version !== requiredVersion || typeof doc.content_md !== 'string' || !doc.content_md.trim()) {
                    setLoadError('legal:document_version_mismatch');
                    return;
                }
                setContent(doc.content_md);
            })
            .catch(() => {
                if (cancelled || !isCurrent()) return;
                setLoadError('common:error_load_failed');
            })
            .finally(() => {
                if (!cancelled && isCurrent()) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [capture, open, docKey, lang, requiredVersion]);

    // Check if content is scrollable when loaded
    useEffect(() => {
        if (!loading && content && open) {
            // Small delay to ensure render
            const timer = setTimeout(() => {
                if (scrollRef.current) {
                    const { scrollHeight, clientHeight } = scrollRef.current;
                    // If content fits without scrolling, or very close (within 50px tolerance)
                    if (scrollHeight <= clientHeight + 50) {
                        setHasScrolledBottom(true);
                    } else {
                        setHasScrolledBottom(false);
                    }
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [loading, content, open]);

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        if (loading || loadError || !content) return;
        const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
        // Allow 50px tolerance for mobile friendliness
        if (scrollHeight - scrollTop - clientHeight < 50) {
            setHasScrolledBottom(true);
        }
    };

    const handleAccept = async () => {
        if (!agreed || !hasScrolledBottom || loading || loadError || !content || acceptingRef.current) return;
        const isCurrent = capture();
        acceptingRef.current = true;
        setAccepting(true);
        try {
            await legalApi.accept(docKey, requiredVersion);
            if (!isCurrent()) return;
            toast.success(t('legal:accept_success') || 'Signed successfully');
            onAccept();
            onOpenChange(false);
        } catch (error) {
            if (isCurrent()) toast.error(t('common:error_operation_failed'));
        } finally {
            acceptingRef.current = false;
            if (isCurrent()) setAccepting(false);
        }
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) invalidate();
        onOpenChange(nextOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-xl text-destructive">
                        <ShieldCheck className="w-6 h-6" />
                        {t(`legal:titles.${docKey}`) || 'High Risk Warning'}
                    </DialogTitle>
                    <DialogDescription>
                        {t('legal:disclosure_desc', { version: requiredVersion })}
                    </DialogDescription>
                </DialogHeader>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 bg-secondary/5"
                    onScroll={handleScroll}
                >
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : loadError ? (
                        <p role="alert" className="text-destructive">{t(loadError)}</p>
                    ) : (
                        <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground">
                            <ReactMarkdown
                                components={{
                                    p: ({ node, ...props }) => <p className="mb-4 last:mb-0 whitespace-pre-wrap" {...props} />,
                                    li: ({ node, ...props }) => <li className="whitespace-pre-wrap" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-4" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-4" {...props} />,
                                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-3" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2" {...props} />,
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </article>
                    )}
                </div>

                <DialogFooter className="p-6 border-t bg-card/50 backdrop-blur-sm z-10 flex-col sm:flex-col gap-4 items-stretch">
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-secondary/20 border border-border/50">
                        <Checkbox
                            id="agree-risk"
                            checked={agreed}
                            onCheckedChange={(c) => setAgreed(!!c)}
                            disabled={loading || !!loadError || !hasScrolledBottom || accepting}
                        />
                        <label
                            htmlFor="agree-risk"
                            className={cn(
                                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none cursor-pointer",
                                !hasScrolledBottom && "opacity-50"
                            )}
                        >
                            {hasScrolledBottom
                                ? t('legal:i_have_read_and_agree')
                                : t('legal:scroll_to_read_all')}
                        </label>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>
                            {t('common:cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleAccept}
                            disabled={loading || !!loadError || !content || !hasScrolledBottom || !agreed || accepting}
                            className="px-8"
                        >
                            {accepting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {t('legal:accept_and_continue')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const RiskDisclosureDialog: React.FC<RiskDisclosureDialogProps> = props => {
    const { i18n } = useTranslation();
    // Each opening/document/language has its own consent and async lifetime.
    return props.open
        ? <DisclosureSession key={`${props.docKey}:${props.requiredVersion}:${i18n.language}`} {...props} lang={i18n.language} />
        : null;
};

export default RiskDisclosureDialog;
