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

interface RiskDisclosureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    docKey: LegalDocKey;
    requiredVersion: string;
    onAccept: () => void;
}

const RiskDisclosureDialog: React.FC<RiskDisclosureDialogProps> = ({
    open,
    onOpenChange,
    docKey = 'auto_trade_notice',
    requiredVersion,
    onAccept,
}) => {
    const { t, i18n } = useTranslation(['common', 'legal']);
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [hasScrolledBottom, setHasScrolledBottom] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && docKey) {
            loadDoc();
        }
    }, [open, docKey, i18n.language]);

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

    const loadDoc = async () => {
        setLoading(true);
        try {
            // Default to current language, backend handles fallback
            const doc = await legalApi.getPublicDoc(docKey, i18n.language);
            setContent(doc.content_md);
        } catch (error) {
            toast.error(t('common:error.load_failed'));
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
        // Allow 50px tolerance for mobile friendliness
        if (scrollHeight - scrollTop - clientHeight < 50) {
            setHasScrolledBottom(true);
        }
    };

    const handleAccept = async () => {
        if (!agreed) return;
        setAccepting(true);
        try {
            await legalApi.accept(docKey, requiredVersion);
            toast.success(t('legal:accept_success') || 'Signed successfully');
            onAccept();
            onOpenChange(false);
        } catch (error) {
            toast.error(t('common:error.operation_failed'));
        } finally {
            setAccepting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                            disabled={!hasScrolledBottom}
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
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            {t('common:cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleAccept}
                            disabled={!agreed || accepting}
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

export default RiskDisclosureDialog;
