import { memo } from 'react';
import type { TFunction } from 'i18next';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import type { Strategy } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardPopularityCardProps {
  t: TFunction;
  isLoading: boolean;
  isStrategiesLoading: boolean;
  hasStats: boolean;
  topStrategies: Array<{ strategy: Strategy; subscriptionCount: number }>;
}

function DashboardPopularityCard({
  t,
  isLoading,
  isStrategiesLoading,
  hasStats,
  topStrategies,
}: DashboardPopularityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {t('dashboard:popularity.title')}
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {isLoading || isStrategiesLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
        ) : (
          topStrategies.map(({ strategy, subscriptionCount }, index) => (
            <div key={strategy.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}</span>
                <span className="text-sm font-medium">{strategy.name}</span>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {t('dashboard:popularity.subscribe_count', { count: subscriptionCount })}
              </Badge>
            </div>
          ))
        )}
        {!hasStats && !isLoading && (
          <p className="text-center text-xs text-muted-foreground py-4">{t('dashboard:popularity.no_data')}</p>
        )}
      </div>
    </motion.div>
  );
}

export default memo(DashboardPopularityCard);
