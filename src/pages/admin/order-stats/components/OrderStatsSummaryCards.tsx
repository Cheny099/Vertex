import type { TFunction } from 'i18next';
import { TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { OrderStatsTotals } from '../utils';

interface OrderStatsSummaryCardsProps {
  t: TFunction<'admin' | 'common'>;
  totals: OrderStatsTotals;
  totalRecords: number;
  overallWinRate: string;
  formatUsd: (value: number | null | undefined) => string;
}

export function OrderStatsSummaryCards({
  t,
  totals,
  totalRecords,
  overallWinRate,
  formatUsd,
}: OrderStatsSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card className="bg-gradient-to-br from-card to-muted/20 border-primary/10 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('admin:total_turnover')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground opacity-50" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tracking-tight">{formatUsd(totals.turnover)}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {t('admin:total_records')}: <span className="font-mono text-foreground font-bold">{totalRecords}</span>
          </p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-card to-muted/20 border-primary/10 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('admin:total_pnl')}</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground opacity-50" />
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold font-mono tracking-tight",
            (totals.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {formatUsd(totals.pnl)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('admin:realized_stats')}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-card to-muted/20 border-primary/10 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('admin:total_trades')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tracking-tight">{totals.trades || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-green-600 font-bold">{totals.wins || 0}</span> {t('admin:wins_abbr')} / <span className="text-red-500 font-bold">{totals.losses || 0}</span> {t('admin:losses_abbr')}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-card to-muted/20 border-primary/10 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('admin:overall_win_rate')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tracking-tight">{overallWinRate}%</div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${overallWinRate}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
