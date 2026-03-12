/**
 * @anchor-id STRATEGIES_LIST
 * @module-type component
 * @disposable false
 * @mock-data strategies 数组为临时 Mock，后端对接时替换
 */

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { memo } from 'react';
import { StrategySubscriptionRow } from './StrategySubscriptionRow';
import { useTranslation } from 'react-i18next';
import { useStrategiesListModel } from './hooks/useStrategiesListModel';

const StrategiesList = () => {
  const { t } = useTranslation('dashboard');
  const {
    goStrategies,
    goStrategyDetail,
    hasSubscriptions,
    isLoading,
    strategySubscriptions,
  } = useStrategiesListModel();

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-card border border-border/50 p-6 space-y-4">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-20 w-full bg-muted/50 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="glass-card rounded-xl overflow-hidden flex flex-col h-full"
    >
      <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <div>
          <h3 className="text-lg font-semibold">{t('strategies_list.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {hasSubscriptions ? t('strategies_list.subtitle_count', { count: strategySubscriptions.length }) : t('strategies_list.subtitle_empty')}
          </p>
        </div>
        <button
          onClick={goStrategies} // Go to Marketplace
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {t('strategies_list.browse_btn')}
        </button>
      </div>

      <div className="divide-y divide-border">
        {hasSubscriptions ? (
          strategySubscriptions.map((sub, index) => {
            const strategy = sub.strategy;
            return (
              <StrategySubscriptionRow
                key={sub.id}
                t={t}
                id={sub.id}
                index={index}
                strategyId={strategy.id}
                strategyName={strategy.name}
                strategyStatus={strategy.status}
                positionMode={sub.position_mode}
                positionPct={sub.position_pct}
                positionValue={sub.position_value}
                onOpenStrategy={goStrategyDetail}
              />
            );
          })
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p>{t('strategies_list.empty_text')}</p>
            <Button variant="link" onClick={goStrategies}>
              {t('strategies_list.subscribe_link')}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default memo(StrategiesList);
