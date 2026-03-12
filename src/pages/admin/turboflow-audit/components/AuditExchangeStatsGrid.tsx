import type { TFunction } from 'i18next';
import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExchangeStatsRow } from './audit-run-insights-panel-types';

type Props = {
  exchangeStatsRows: ExchangeStatsRow[];
  t: TFunction;
};

export function AuditExchangeStatsGrid({ exchangeStatsRows, t }: Props) {
  if (exchangeStatsRows.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
        <Database className="h-3.5 w-3.5" />
        <span>{t('admin:stats_by_exchange')}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {exchangeStatsRows.map((stats) => (
          <div
            key={stats.exchange}
            className="p-4 rounded-3xl bg-white border border-border/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <Badge className="bg-slate-900 border-none px-3 py-1 rounded-full uppercase text-xs font-black tracking-widest">
                {stats.exchange}
              </Badge>
              <div className="text-xs font-bold text-muted-foreground opacity-60">EXCHANGE_NODE</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-0.5">
                <div className="text-xs font-black text-muted-foreground leading-tight">{t('admin:scanned')}</div>
                <div className="text-sm font-bold">{stats.scanned}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-black text-emerald-600 leading-tight">{t('admin:updated')}</div>
                <div className="text-sm font-bold text-emerald-700">{stats.updated}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-black text-destructive leading-tight">{t('admin:failed')}</div>
                <div className="text-sm font-bold text-destructive">{stats.failed}</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">{t('admin:completed_missing_external_id')}</span>
                <span className={cn('text-xs font-mono font-bold', stats.missingExternal > 0 ? 'text-amber-600' : 'text-muted-foreground/40')}>
                  {stats.missingExternal}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">{t('admin:completed_missing_price')}</span>
                <span className={cn('text-xs font-mono font-bold', stats.missingPrice > 0 ? 'text-amber-600' : 'text-muted-foreground/40')}>
                  {stats.missingPrice}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">{t('admin:completed_missing_notional')}</span>
                <span className={cn('text-xs font-mono font-bold', stats.missingNotional > 0 ? 'text-amber-600' : 'text-muted-foreground/40')}>
                  {stats.missingNotional}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">{t('admin:completed_missing_executed_at')}</span>
                <span className={cn('text-xs font-mono font-bold', stats.missingExecutedAt > 0 ? 'text-amber-600' : 'text-muted-foreground/40')}>
                  {stats.missingExecutedAt}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
