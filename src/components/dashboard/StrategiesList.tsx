/**
 * @anchor-id STRATEGIES_LIST
 * @module-type component
 * @disposable false
 * @mock-data strategies 数组为临时 Mock，后端对接时替换
 */

import { motion } from 'framer-motion';
import { Play, Pause, Settings2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { subscriptionApi } from '@/api';
import { useTranslation } from 'react-i18next';

const StrategiesList = () => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionApi.list(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

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

  const hasSubscriptions = subscriptions && subscriptions.length > 0;

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
            {hasSubscriptions ? t('strategies_list.subtitle_count', { count: subscriptions.length }) : t('strategies_list.subtitle_empty')}
          </p>
        </div>
        <button
          onClick={() => navigate('/strategies')} // Go to Marketplace
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {t('strategies_list.browse_btn')}
        </button>
      </div>

      <div className="divide-y divide-border">
        {hasSubscriptions ? (
          subscriptions.map((sub, index) => {
            const strategy = sub.strategy;
            if (!strategy) return null; // Should not happen

            const modeText =
              sub.position_mode === 'fixed'
                ? t('strategies_list.mode_ratio', { percent: Math.round((sub.position_pct || 0) * 100) })
                : sub.position_mode === 'fixed_amount'
                  ? t('strategies_list.mode_fixed', { amount: sub.position_value })
                  : t('strategies_list.mode_deprecated');

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                className="p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/strategies/${strategy.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      strategy.status === 'active' ? "bg-profit/10" : "bg-warning/10"
                    )}>
                      {strategy.status === 'active' ? (
                        <Play className="w-4 h-4 text-profit fill-profit" />
                      ) : (
                        <Pause className="w-4 h-4 text-warning" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{strategy.name}</p>
                        <Badge variant={strategy.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {strategy.status === 'active' ? t('strategies_list.status_active') : t('strategies_list.status_maintenance')}
                        </Badge>
                        {sub.position_mode === 'multiplier' && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {t('strategies_list.need_adjust')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className='font-mono text-xs'>
                          {modeText}
                        </span>
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
          })
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p>{t('strategies_list.empty_text')}</p>
            <Button variant="link" onClick={() => navigate('/strategies')}>
              {t('strategies_list.subscribe_link')}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StrategiesList;
