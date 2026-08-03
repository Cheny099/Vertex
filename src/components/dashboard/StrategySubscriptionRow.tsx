import { memo, useMemo, useCallback } from 'react';
import type { TFunction } from 'i18next';
import { motion } from 'framer-motion';
import { AlertCircle, Pause, Play, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StrategySubscriptionRowProps {
  t: TFunction<'dashboard'>;
  id: number;
  index: number;
  strategyId: number;
  strategyName: string;
  strategyStatus: string;
  positionMode: string;
  positionPct: number | null | undefined;
  positionValue: number;
  onOpenStrategy: (strategyId: number) => void;
}

function StrategySubscriptionRowBase({
  t,
  id,
  index,
  strategyId,
  strategyName,
  strategyStatus,
  positionMode,
  positionPct,
  positionValue,
  onOpenStrategy,
}: StrategySubscriptionRowProps) {
  const modeText = useMemo(() => {
    if (positionMode === 'fixed') {
      // position_pct is optional and legacy rows carry only position_value. `|| 0` reported a live
      // subscription as allocating 0% of the account; fall back the same way the strategy detail
      // page does, and show a placeholder rather than a fabricated number when neither is usable.
      const pct =
        positionPct ??
        (positionValue > 0 && positionValue <= 1 ? positionValue : undefined);
      if (pct === undefined) return t('strategies_list.mode_ratio', { percent: '--' });
      return t('strategies_list.mode_ratio', { percent: Math.round(pct * 100) });
    }
    if (positionMode === 'fixed_amount') {
      return t('strategies_list.mode_fixed', { amount: positionValue });
    }
    return t('strategies_list.mode_deprecated');
  }, [positionMode, positionPct, positionValue, t]);

  const handleOpen = useCallback(() => {
    onOpenStrategy(strategyId);
  }, [onOpenStrategy, strategyId]);

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
      className="p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
      onClick={handleOpen}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              strategyStatus === 'active' ? 'bg-profit/10' : 'bg-warning/10'
            )}
          >
            {strategyStatus === 'active' ? (
              <Play className="w-4 h-4 text-profit fill-profit" />
            ) : (
              <Pause className="w-4 h-4 text-warning" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{strategyName}</p>
              <Badge variant={strategyStatus === 'active' ? 'default' : 'secondary'} className="text-xs">
                {strategyStatus === 'active'
                  ? t('strategies_list.status_active')
                  : t('strategies_list.status_maintenance')}
              </Badge>
              {positionMode === 'multiplier' && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {t('strategies_list.need_adjust')}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-mono text-xs">{modeText}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export const StrategySubscriptionRow = memo(StrategySubscriptionRowBase);

