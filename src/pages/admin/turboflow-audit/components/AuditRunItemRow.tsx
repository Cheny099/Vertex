import { memo, useCallback, useMemo, useState, type ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy, Database, Eye, FileJson, Flag, Hash, Search, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AuditItem } from '@/api';
import { safeT } from '../utils';
import { AuditAdviceSection, AuditKindStructuredSection } from './AuditRunItemDetailSections';

type SeverityBadgeVariant = 'default' | 'destructive' | 'secondary' | 'outline';

interface AuditRunItemRowProps {
    t: TFunction;
    item: AuditItem;
    getSeverityIcon: (severity?: string) => ReactNode;
    getSeverityBadge: (severity?: string) => SeverityBadgeVariant;
    getKindStyling: (kind: string) => string;
}

function AuditRunItemRowComponent({
    t,
    item,
    getSeverityIcon,
    getSeverityBadge,
    getKindStyling,
}: AuditRunItemRowProps) {
    const [open, setOpen] = useState(false);
    const normalizedSeverity = String(item.severity || '').toUpperCase();
    const isError = normalizedSeverity === 'ERROR';
    const isWarn = normalizedSeverity === 'WARN' || normalizedSeverity === 'WARNING';

    const detailJson = useMemo(() => {
        if (!open) {
            return '';
        }
        try {
            return JSON.stringify(item.detail || {}, null, 2);
        } catch {
            return 'Error stringifying detail';
        }
    }, [open, item.detail]);

    const handleCopyJson = useCallback(() => {
        void navigator.clipboard.writeText(detailJson);
        toast.success(t('admin:copy_success'));
    }, [detailJson, t]);

    return (
        <TableRow
            className={cn(
                'group transition-colors border-border/30',
                isError ? 'hover:bg-destructive/[0.03]' : isWarn ? 'hover:bg-amber-50' : 'hover:bg-primary/[0.02]'
            )}
        >
            <TableCell className="pl-6">
                <div className="flex items-center gap-2">{getSeverityIcon(item.severity)}</div>
            </TableCell>
            <TableCell>
                <Badge
                    variant="outline"
                    className={cn('text-xs font-black tracking-tight px-2 py-0.5 border shadow-sm', getKindStyling(item.kind))}
                >
                    {safeT(t, `admin:kind_labels.${item.kind}`, String(item.kind))}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1.5 font-mono text-xs bg-muted/30 w-fit px-2 py-1 rounded border border-border/30 text-muted-foreground group-hover:text-primary transition-colors">
                    <Database className="h-3 w-3 opacity-50" />
                    {String(item.account_id || '-')}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1.5 font-mono text-xs bg-muted/30 w-fit px-2 py-1 rounded border border-border/30 text-muted-foreground group-hover:text-primary transition-colors">
                    <Search className="h-3 w-3 opacity-50" />
                    {String(item.order_id || '-')}
                </div>
            </TableCell>
            <TableCell className="text-right pr-6">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    {open && (
                        <DialogContent className="max-w-2xl p-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden rounded-3xl">
                            <DialogHeader className="p-6 bg-muted/30 border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            'p-2 rounded-lg',
                                            isError ? 'bg-destructive/10 text-destructive' : isWarn ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'
                                        )}
                                    >
                                        {getSeverityIcon(item.severity)}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-bold">
                                            {safeT(t, `admin:kind_labels.${item.kind}`, String(item.kind))}
                                        </DialogTitle>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mt-0.5">
                                            <span>
                                                {t('admin:audit_detail_panel')} · ID {String(item.id)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="p-4 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                                <AuditAdviceSection t={t} item={item} />
                                <AuditKindStructuredSection t={t} item={item} />

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-900/[0.02] border border-slate-200/60 shadow-inner">
                                    <div className="p-4 rounded-xl bg-white/60 hover:bg-white/90 transition-colors space-y-2">
                                        <div className="flex items-center gap-1.5 opacity-40">
                                            <User className="h-3 w-3" />
                                            <span className="text-xs uppercase font-black tracking-widest leading-none">{t('admin:account')}</span>
                                        </div>
                                        <div className="font-mono text-xs font-black text-slate-800 flex items-center h-5">{String(item.account_id || '-')}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/60 hover:bg-white/90 transition-colors space-y-2">
                                        <div className="flex items-center gap-1.5 opacity-40">
                                            <Hash className="h-3 w-3" />
                                            <span className="text-xs uppercase font-black tracking-widest leading-none">{t('admin:order')}</span>
                                        </div>
                                        <div className="font-mono text-xs font-black text-slate-400 flex items-center h-5 italic">{String(item.order_id || '-')}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/60 hover:bg-white/90 transition-colors space-y-2">
                                        <div className="flex items-center gap-1.5 opacity-40">
                                            <Flag className="h-3 w-3" />
                                            <span className="text-xs uppercase font-black tracking-widest leading-none">{t('admin:severity')}</span>
                                        </div>
                                        <div className="flex items-center h-5">
                                            <Badge variant={getSeverityBadge(item.severity)} className="text-xs font-black uppercase tracking-tighter px-2 h-5 rounded-md">
                                                {safeT(
                                                    t,
                                                    `admin:severity_${normalizedSeverity === 'WARN' ? 'warning' : normalizedSeverity.toLowerCase()}`,
                                                    normalizedSeverity
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                            <FileJson className="h-3.5 w-3.5" />
                                            <span>{t('admin:raw_audit_detail')}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs font-black gap-2 hover:bg-slate-100 rounded-lg transition-all active:scale-95"
                                            onClick={handleCopyJson}
                                        >
                                            <Copy className="h-3 w-3 opacity-50" />
                                            {t('admin:copy_json')}
                                        </Button>
                                    </div>
                                    <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.02)] group relative">
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Badge variant="outline" className="bg-slate-900/80 text-white border-none text-xs font-mono h-4">
                                                {t('admin:copy_json')}
                                            </Badge>
                                        </div>
                                        <pre className="p-6 bg-slate-950 font-mono text-xs leading-relaxed text-slate-400 selection:bg-primary/40 selection:text-white max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {detailJson}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-slate-100 flex justify-end">
                                <Button
                                    variant="default"
                                    className="h-10 px-8 font-black uppercase tracking-widest text-xs bg-slate-900 border-none shadow-lg hover:shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95"
                                    onClick={() => setOpen(false)}
                                >
                                    {t('admin:close')}
                                </Button>
                            </div>
                        </DialogContent>
                    )}
                </Dialog>
            </TableCell>
        </TableRow>
    );
}

export const AuditRunItemRow = memo(AuditRunItemRowComponent);
