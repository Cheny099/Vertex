import { ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { safeT } from '../../utils';
import type { AuditDetailSectionsProps } from './types';

export function StatusMismatchSection({ t, item }: AuditDetailSectionsProps) {
  if (!item.detail) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-amber-600">
        <div className="p-1.5 rounded-lg bg-amber-500/10">
          <RefreshCw className="h-4 w-4" />
        </div>
        <span>{t('admin:status_comparison')}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-5 rounded-2xl bg-muted/20 border border-border/50 flex flex-col items-center justify-center gap-3 relative group transition-all hover:bg-muted/30">
          <span className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('admin:local')}</span>
          <Badge variant="outline" className="text-sm font-black border-amber-500/30 text-amber-700 bg-amber-50 px-6 py-1 shadow-sm uppercase tracking-tighter">
            {safeT(t, `admin:status_labels.${item.detail.local_status}`, String(item.detail.local_status || '-'))}
          </Badge>
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 hidden sm:block">
            <div className="p-1 rounded-full bg-background border border-border shadow-sm">
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col items-center justify-center gap-3 relative shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-1.5">
            <span className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('admin:remote')}</span>
            <Badge variant="default" className="h-4 px-1 text-xs font-black uppercase bg-amber-500 text-white">{t('admin:truth')}</Badge>
          </div>
          <Badge variant="default" className="text-sm font-black bg-amber-500 px-6 py-1 shadow-md uppercase tracking-tighter ring-4 ring-amber-500/10">
            {safeT(t, `admin:status_labels.${item.detail.tf_order_status}`, String(item.detail.tf_order_status || '-'))}
          </Badge>
        </div>
      </div>

      {Array.isArray(item.detail.expected_local_statuses) && (
        <div className="p-4 rounded-xl bg-white/40 border border-dashed border-border flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span>{t('admin:expected_statuses')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(item.detail.expected_local_statuses as string[]).map((status: string) => (
              <Badge key={status} variant="secondary" className="text-xs font-bold bg-background/80 text-muted-foreground border-border/50 px-2.5">
                {safeT(t, `admin:status_labels.${status}`, status)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
