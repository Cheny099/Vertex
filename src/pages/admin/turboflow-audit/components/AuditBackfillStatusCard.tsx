import type { TFunction } from 'i18next';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Info, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BackfillContext } from './audit-run-insights-panel-types';

type Props = {
  backfillContext: BackfillContext;
  t: TFunction;
};

export function AuditBackfillStatusCard({ backfillContext, t }: Props) {
  return (
    <Card className="bg-emerald-500/5 border-emerald-500/10 shadow-sm overflow-hidden border-l-4 border-l-emerald-500">
      <CardHeader className="pb-2 py-3 px-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <RefreshCw className={cn('h-4 w-4 text-emerald-600', backfillContext.running && 'animate-spin')} />
          <CardTitle className="text-sm font-bold text-emerald-800 uppercase tracking-wider">
            {t('admin:backfill_status')}
          </CardTitle>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'px-2 py-0.5',
            backfillContext.enabled
              ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200'
              : 'bg-muted text-muted-foreground border-border'
          )}
        >
          {backfillContext.enabled ? t('admin:enabled') : t('admin:disabled')}
        </Badge>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="flex justify-between items-end mb-3">
          <div className="space-y-1">
            <div className="text-xs text-emerald-600/70 font-bold uppercase tracking-widest">
              {t('admin:total_backfilled')}
            </div>
            <div className="text-2xl font-black text-emerald-700 tracking-tighter">
              {backfillContext.totalBackfilled}
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-xs text-destructive font-bold uppercase tracking-widest">
              {t('admin:failed')}
            </div>
            <div className="text-lg font-black text-destructive tracking-tighter">
              {backfillContext.totalFailed}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold text-emerald-600/60 leading-none mb-1">
              {t('admin:lookback_days')}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {String(backfillContext.lookback)} d
            </span>
          </div>
          <div className="flex flex-col border-l border-emerald-500/10 pl-2">
            <span className="text-xs uppercase font-bold text-emerald-600/60 leading-none mb-1">
              {t('admin:limit_count')}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {String(backfillContext.limitCount)} items
            </span>
          </div>
        </div>

        {!backfillContext.enabled && (
          <div className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1 opacity-80">
            <Info className="h-3 w-3" />
            {t('admin:stats_only_no_backfill_hint')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
