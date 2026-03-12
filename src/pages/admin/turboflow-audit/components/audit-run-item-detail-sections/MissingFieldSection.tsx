import { AlertTriangle, FileWarning, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatSecure, safeT } from '../../utils';
import type { AuditDetailSectionsProps } from './types';

export function MissingFieldSection({ t, item }: AuditDetailSectionsProps) {
  if (!item.detail) {
    return null;
  }

  if (item.kind === 'LOCAL_COMPLETED_MISSING_TF_ORDER_ID') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-destructive">
          <div className="p-1.5 rounded-lg bg-destructive/10">
            <FileWarning className="h-4 w-4" />
          </div>
          <span>{t('admin:mismatch_detected')}</span>
        </div>
        <div className="p-6 rounded-3xl bg-destructive/5 border border-destructive/10 space-y-6 shadow-inner">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <span className="text-xs uppercase font-black text-muted-foreground tracking-widest leading-none">{t('admin:symbol')}</span>
              <div className="text-xl font-black text-primary tracking-tight leading-none">{String(item.detail.symbol || '-')}</div>
            </div>
            <div className="space-y-1.5 text-right">
              <span className="text-xs uppercase font-black text-muted-foreground tracking-widest leading-none">{t('admin:side')}</span>
              <div className="text-xl font-black flex items-center justify-end gap-2 leading-none uppercase tracking-tighter">
                <div
                  className={cn(
                    'h-3 w-3 rounded-full shadow-sm',
                    String(item.detail.side).toLowerCase().includes('long') || String(item.detail.side).toLowerCase().includes('buy')
                      ? 'bg-emerald-500'
                      : 'bg-destructive'
                  )}
                />
                {String(item.detail.side || '-')}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-destructive/10">
            <div className="space-y-1.5">
              <span className="text-xs uppercase font-black text-muted-foreground tracking-widest leading-none">{t('admin:local_qty')}</span>
              <div className="font-mono text-sm font-black text-slate-700 bg-background/50 px-3 py-1.5 rounded border border-border/30 w-fit">{String(item.detail.quantity || '-')}</div>
            </div>
            <div className="space-y-1.5 text-right flex flex-col items-end">
              <span className="text-xs uppercase font-black text-muted-foreground tracking-widest leading-none">{t('admin:column_time')}</span>
              <div className="font-mono text-xs font-bold text-slate-600 bg-background/50 px-3 py-1.5 rounded border border-border/30 w-fit">
                {formatSecure(item.detail.executed_at, 'yyyy-MM-dd HH:mm:ss')}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const missingPrice = item.kind === 'COMPLETED_NO_EXEC_PRICE';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-amber-600">
        <div className="p-1.5 rounded-lg bg-amber-500/10">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <span>{t('admin:missing_fields_detected')}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex flex-col gap-2 shadow-sm">
          <span className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('admin:local_status')}</span>
          <Badge variant="outline" className="w-fit border-border/50 text-muted-foreground font-black px-3 uppercase tracking-tighter">
            {item.detail.local_status ? safeT(t, `admin:status_labels.${item.detail.local_status}`, String(item.detail.local_status)) : t('admin:unknown')}
          </Badge>
        </div>
        <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex flex-col gap-2 shadow-sm">
          <span className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('admin:remote_status')}</span>
          <Badge variant="outline" className="w-fit border-primary/20 text-primary bg-primary/5 font-black px-3 uppercase tracking-tighter">
            {item.detail.tf_order_status
              ? safeT(t, `admin:status_labels.${item.detail.tf_order_status}`, String(item.detail.tf_order_status))
              : t('admin:unknown')}
          </Badge>
        </div>
      </div>
      <div className="p-8 rounded-3xl bg-destructive/[0.03] border border-destructive/10 flex flex-col items-center justify-center gap-5 text-center shadow-inner">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center animate-pulse rotate-3 ring-4 ring-destructive/5">
          <XCircle className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-black text-destructive uppercase tracking-widest">
            {missingPrice ? t('admin:missing_executed_price') : t('admin:missing_realized_pnl')}
          </p>
          <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed italic">
            {missingPrice ? t('admin:missing_price_desc') : t('admin:missing_pnl_desc')}
          </p>
        </div>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-destructive/20 to-transparent" />
        <Badge variant="secondary" className="font-mono text-xl font-black text-destructive/40 italic px-6 py-2 bg-background/50 border border-destructive/10 tracking-widest">
          {t('admin:missing_val')}
        </Badge>
      </div>
    </div>
  );
}
