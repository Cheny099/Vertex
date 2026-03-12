import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { TFunction } from 'i18next';
import type { PublicStrategyCard } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HotStrategiesSectionProps {
  hotStrategies: PublicStrategyCard[];
  isLoading: boolean;
  onGoStrategies: () => void;
  onOpenStrategy: (id: number) => void;
  t: TFunction;
}

export function HotStrategiesSection({
  hotStrategies,
  isLoading,
  onGoStrategies,
  onOpenStrategy,
  t,
}: HotStrategiesSectionProps) {
  return (
    <section className="px-6 md:px-10 py-24 border-t border-border/40 bg-secondary/5 backdrop-blur-[2px] relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('hot_strategies.title')}</h2>
          </div>

          <Button variant="link" className="text-muted-foreground hover:text-primary p-0 h-auto" onClick={onGoStrategies}>
            {t('leaderboard.view_full')} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3].map((key) => (
              <div key={key} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))
          ) : hotStrategies.map((strategy, index) => (
            <motion.div
              key={strategy.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="h-full glass-card border-white/5 hover:border-primary/50 transition-all duration-500 group hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <CardHeader className="pb-4 relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors flex items-center gap-2">
                        {strategy.name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-secondary/50 text-secondary-foreground border border-border/50 font-medium backdrop-blur-sm">
                          {strategy.status === 'active' ? t('hot_strategies.metrics.active') : strategy.status}
                        </span>
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-secondary/50 text-secondary-foreground border border-border/50 font-medium backdrop-blur-sm flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          {t('hot_strategies.metrics.protected')}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] opacity-50 group-hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm">
                      {strategy.strategy_key}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 mt-auto">
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wide">{t('hot_strategies.metrics.roi_all')}</div>
                      <div className={`text-xl font-bold font-mono tracking-tight ${(strategy.metrics?.all?.return_pct || 0) >= 0 ? 'text-profit' : 'text-destructive'}`}>
                        {strategy.metrics?.all ? `${strategy.metrics.all.return_pct.toFixed(2)}%` : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wide">{t('hot_strategies.metrics.drawdown')}</div>
                      <div className="text-sm font-bold text-foreground font-mono tracking-tight">
                        {strategy.metrics?.all ? `${strategy.metrics.all.max_drawdown_pct.toFixed(2)}%` : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wide">{t('hot_strategies.metrics.subscribers')}</div>
                      <div className="text-sm font-bold text-primary font-mono tracking-tight">{strategy.subscribers}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wide">{t('hot_strategies.metrics.last_signal')}</div>
                      <div className="text-sm font-bold text-foreground font-mono tracking-tight truncate">
                        {strategy.last_signal_at ? new Date(strategy.last_signal_at).toLocaleDateString() : '--'}
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-6 rounded-xl bg-secondary/50 hover:bg-primary hover:text-white transition-all duration-300 text-muted-foreground border border-transparent hover:border-primary/20 hover:shadow-lg hover:shadow-primary/20" onClick={() => onOpenStrategy(strategy.id)}>
                    {t('hot_strategies.view_detail_btn')}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
