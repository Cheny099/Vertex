import { ArrowRight, Coins, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AuditDetailSectionsProps } from './types';

export function NotionalMismatchSection({ t, item }: AuditDetailSectionsProps) {
  if (!item.detail) {
    return null;
  }

  const isMissingRemote = !item.detail.tf_expected_notional || Number(item.detail.tf_expected_notional) === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 text-sm font-bold text-blue-600">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10">
            <Coins className="h-4 w-4" />
          </div>
          <span>{t('admin:amount_comparison')}</span>
        </div>
        <div className="text-xs font-bold text-muted-foreground/40 uppercase tracking-tighter">
          {t('admin:tolerance_hint', { abs: '1.0', rel: '0.01' })}
        </div>
      </div>
      <div className="grid grid-cols-3 items-stretch gap-0 p-1 rounded-2xl bg-muted/20 border border-border/50 overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-1 py-4 px-2 hover:bg-background/40 transition-colors">
          <span className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('admin:local')}</span>
          <span className="font-mono text-sm font-black text-emerald-600">
            ${Number(item.detail.local_notional || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 py-4 px-2 bg-background/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] border-x border-border/50 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Badge variant="destructive" className="text-xs font-black h-4 px-1 rounded-sm shadow-sm">{t('admin:difference')}</Badge>
          </div>
          <span className="font-mono text-sm font-black text-destructive">
            -${Number(item.detail.abs_diff || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs font-bold text-destructive/40 uppercase">Mismatch</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 py-4 px-2 hover:bg-background/40 transition-colors relative">
          <div className="absolute top-0 right-2 -translate-y-1/2">
            <Badge variant="outline" className="text-xs font-black h-4 px-1 border-primary/30 text-primary bg-primary/5">{t('admin:truth')}</Badge>
          </div>
          <span className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('admin:remote')}</span>
          {isMissingRemote ? (
            <Badge variant="outline" className="text-xs text-amber-600 bg-amber-500/5 border-amber-500/10 py-0 animate-pulse">
              {t('admin:unknown')}
            </Badge>
          ) : (
            <span className="font-mono text-sm font-black text-primary">
              ${Number(item.detail.tf_expected_notional || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-white/40 border border-border/40 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-muted/50">
              <Layers className="h-3 w-3 text-muted-foreground" />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase">{t('admin:local_qty')}</span>
          </div>
          <span className="font-mono text-xs font-black text-slate-700">{String(item.detail.local_qty || '-')}</span>
        </div>
        <div className="p-3 rounded-xl bg-white/40 border border-border/40 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-primary/10">
              <ArrowRight className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase">{t('admin:remote_qty')}</span>
          </div>
          <span className="font-mono text-xs font-black text-primary">{String(item.detail.tf_done_size || '-')}</span>
        </div>
      </div>
    </div>
  );
}
