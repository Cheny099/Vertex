import type { TFunction } from 'i18next';
import { motion } from 'framer-motion';
import { Activity, Trophy, TrendingUp, Zap } from 'lucide-react';
import type { PeriodKey, StrategyMetricsItem } from '@/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StrategyPeriodMetricsProps {
  t: TFunction;
  activePeriod: PeriodKey;
  onPeriodChange: (period: PeriodKey) => void;
  metrics?: StrategyMetricsItem;
}

export function StrategyPeriodMetrics({
  t,
  activePeriod,
  onPeriodChange,
  metrics,
}: StrategyPeriodMetricsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        {(['1m', '3m', '6m', '1y', 'all'] as PeriodKey[]).map((p) => (
          <Button
            key={p}
            variant={activePeriod === p ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onPeriodChange(p)}
          >
            {t(`strategies:periods.${p}`) || p.toUpperCase()}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: t('strategies:detail.roi'),
            value: metrics ? `${metrics.return_pct.toFixed(1)}%` : '--',
            icon: TrendingUp,
            positive: (metrics?.return_pct || 0) > 0,
            highlight: true,
          },
          {
            label: t('strategies:detail.max_drawdown'),
            value: metrics ? `${metrics.max_drawdown_pct.toFixed(1)}%` : '--',
            icon: Activity,
            positive: false,
            color: 'text-destructive',
          },
          {
            label: t('strategies:detail.win_rate'),
            value: metrics ? `${metrics.win_rate.toFixed(0)}%` : '--',
            icon: Trophy,
            positive: true,
          },
          {
            label: t('strategies:detail.profit_factor'),
            value: metrics?.profit_factor != null ? metrics.profit_factor.toFixed(1) : '--',
            icon: Zap,
            positive: (metrics?.profit_factor || 0) > 1,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
            className="bg-card glass-card rounded-2xl p-5 border border-border/40 relative overflow-hidden group hover:border-primary/30 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-12 h-12" />
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <div
                className={cn(
                  'p-1.5 rounded-lg',
                  stat.color ? `bg-destructive/10 ${stat.color}` : (stat.positive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'),
                  stat.highlight && 'animate-pulse-soft bg-profit/10 text-profit',
                )}
              >
                <stat.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className={cn('text-xl font-bold font-mono tracking-tight', stat.positive ? 'text-profit' : '', stat.color)}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
