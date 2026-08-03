import { Database, Globe, History } from 'lucide-react';
import { detailText } from '../../utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatSecure, safeT } from '../../utils';
import type { AuditDetailSectionsProps } from './types';

export function ExternalMissingLocalSection({ t, item }: AuditDetailSectionsProps) {
  if (!item.detail) {
    return null;
  }

  if (item.kind === 'EXTERNAL_MISSING_LOCAL') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-destructive">
          <div className="p-1.5 rounded-lg bg-destructive/10">
            <Globe className="h-4 w-4" />
          </div>
          <span>{t('admin:remote_entry_found')}</span>
        </div>
        <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('admin:symbol')}</span>
              <div className="text-xl font-black text-primary tracking-tight">{String(item.detail.symbol || '-')}</div>
            </div>
            <Badge variant="outline" className="h-6 border-destructive/20 text-destructive font-black bg-destructive/5 px-3">
              {safeT(t, `admin:status_labels.${item.detail.tf_order_status}`, String(item.detail.tf_order_status || t('admin:unknown')))}
            </Badge>
          </div>
          <div className="pt-4 border-t border-destructive/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <History className="h-3.5 w-3.5 opacity-60" />
              <span className="font-bold uppercase tracking-tighter">{t('admin:last_updated')}</span>
            </div>
            <span className="font-mono font-bold text-primary/80">
              {formatSecure(item.detail.updated_at, 'yyyy-MM-dd HH:mm:ss')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-amber-600">
        <div className="p-1.5 rounded-lg bg-amber-500/10">
          <Database className="h-4 w-4" />
        </div>
        <span>{t('admin:audit_diagnostic')}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex flex-col gap-2 shadow-sm">
          <span className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('admin:local_status')}</span>
          <Badge variant="outline" className="w-fit text-amber-700 border-amber-500/20 bg-amber-500/5 px-3">
            {safeT(t, `admin:status_labels.${item.detail.local_status}`, String(item.detail.local_status || '-'))}
          </Badge>
        </div>
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex flex-col gap-2 shadow-sm">
          <span className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('admin:audit_mode')}</span>
          <Badge variant="outline" className="w-fit text-primary border-primary/20 bg-primary/5 uppercase px-3">
            {String(item.detail.audit_mode || 'unknown')}
          </Badge>
        </div>
      </div>
      <div className="p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center group">
            <div className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1 group-hover:text-amber-600 transition-colors">{t('admin:scanned')}</div>
            <div className="font-mono text-sm font-black text-slate-700 bg-background/50 rounded-lg py-2 border border-border/30">
              {detailText(item.detail.pages_fetched)} <span className="text-xs opacity-40">/ {detailText(item.detail.max_pages)}</span>
            </div>
          </div>
          <div className="text-center group">
            <div className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1 group-hover:text-amber-600 transition-colors">{t('admin:page_size')}</div>
            <div className="font-mono text-sm font-black text-slate-700 bg-background/50 rounded-lg py-2 border border-border/30">{detailText(item.detail.page_size)}</div>
          </div>
          <div className="text-center group">
            <div className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1 group-hover:text-amber-600 transition-colors">{t('admin:unresolved')}</div>
            <Badge
              variant={item.detail.in_unresolved_needed_ids ? 'destructive' : 'outline'}
              className={cn(
                'text-xs font-black w-full h-8 justify-center rounded-lg',
                !item.detail.in_unresolved_needed_ids && 'text-emerald-600 border-emerald-500/20 bg-emerald-500/5'
              )}
            >
              {item.detail.in_unresolved_needed_ids ? 'TRUE' : 'FALSE'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
