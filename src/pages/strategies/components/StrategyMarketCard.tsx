import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, History as HistoryIcon, MoreVertical, Pause, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { parseStrategyConfig } from '@/api/strategy-utils';
import type { JsonValue } from '@/api/contracts';
import type { Strategy } from '@/api';

// config values are free-form JSON; only primitives are renderable.
const toDisplayText = (value: JsonValue | undefined): string | undefined =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
import type { StatusTone } from '../hooks/useStrategiesPageModel';

interface StrategyMarketCardProps {
  getStatusLabel: (statusRaw?: string) => string;
  getStatusTone: (statusRaw?: string) => StatusTone;
  getTypeLabel: (strategy: Strategy) => string;
  index: number;
  isAdmin: boolean;
  isSubscribed: boolean;
  strategy: Strategy;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function StrategyMarketCardComponent({
  getStatusLabel,
  getStatusTone,
  getTypeLabel,
  index,
  isAdmin,
  isSubscribed,
  strategy,
  t,
}: StrategyMarketCardProps) {
  const navigate = useNavigate();
  const tone = getStatusTone(strategy.status);

  const iconBgClass = useMemo(() => cn(
    'w-10 h-10 rounded-lg flex items-center justify-center',
    tone === 'active' && 'bg-profit/10',
    tone === 'warning' && 'bg-warning/10',
    tone === 'danger' && 'bg-destructive/10',
    tone === 'muted' && 'bg-muted'
  ), [tone]);

  const badgeClass = useMemo(() => cn(
    'text-xs',
    tone === 'active' && 'bg-profit/10 text-profit border-profit/20',
    tone === 'warning' && 'bg-warning/10 text-warning border-warning/20',
    tone === 'danger' && 'bg-destructive/10 text-destructive border-destructive/20',
    tone === 'muted' && 'bg-muted/50 text-muted-foreground border-border'
  ), [tone]);

  const handleOpenDetail = () => {
    navigate(`/strategies/${strategy.id}`);
  };

  const handleOpenSignals = (event: Event) => {
    event.stopPropagation();
    navigate(`/strategies/${strategy.id}/signals`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.05 }}
      className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleOpenDetail}
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={iconBgClass}>
              {tone === 'active' ? (
                <Play className="w-4 h-4 text-profit fill-profit" />
              ) : tone === 'danger' ? (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              ) : (
                <Pause className="w-4 h-4 text-warning" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{strategy.name}</h3>
                {isSubscribed && (
                  <Badge variant="outline" className="text-[10px] bg-profit/5 text-profit border-profit/20">
                    {t('strategies:card.subscribed')}
                  </Badge>
                )}
                <Badge
                  variant={tone === 'active' ? 'default' : 'secondary'}
                  className={badgeClass}
                >
                  {getStatusLabel(strategy.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{strategy.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(isAdmin || isSubscribed) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                  <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                  <DropdownMenuItem onClick={handleOpenSignals}>
                    <HistoryIcon className="w-4 h-4 mr-2" />
                    {t('strategies:card.menu.history')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 bg-secondary/10 rounded-lg p-2.5 border border-border/50">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{t('strategies:card.labels.roi_all')}</span>
            <span className={cn(
              'font-mono text-lg font-bold tracking-tight',
              (strategy.metrics?.all?.return_pct || 0) >= 0 ? 'text-profit' : 'text-destructive'
            )}>
              {strategy.metrics?.all ? `${strategy.metrics.all.return_pct.toFixed(1)}%` : '--'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{t('strategies:card.labels.max_drawdown')}</span>
            <span className="font-mono text-lg font-bold text-foreground tracking-tight">
              {strategy.metrics?.all ? `${strategy.metrics.all.max_drawdown_pct.toFixed(1)}%` : '--'}
            </span>
          </div>
          <div className="flex flex-col pt-2 border-t border-border/40">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{t('strategies:card.labels.win_rate')}</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {strategy.metrics?.all ? `${strategy.metrics.all.win_rate.toFixed(0)}%` : '--'}
            </span>
          </div>
          <div className="flex flex-col pt-2 border-t border-border/40">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{t('strategies:card.labels.profit_factor')}</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {strategy.metrics?.all?.profit_factor != null ? strategy.metrics.all.profit_factor.toFixed(1) : '--'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 bg-secondary/20 p-2 rounded-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            {/* config may still be a JSON string for a strategy that skipped strategyApi's
                normalisation; reading `.pair` off it directly would silently render "-". */}
            <span>{strategy.pair || toDisplayText(parseStrategyConfig(strategy.config).pair) || '-'}</span>
          </div>
          <div className="w-px h-3 bg-border"></div>
          <div>{getTypeLabel(strategy)}</div>
          <div className="w-px h-3 bg-border"></div>
          <div>{new Date(strategy.created_at).toLocaleDateString()}</div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-border">
          <div className="flex gap-2 items-center">
            {!isSubscribed ? (
              <Button
                size="sm"
                className="gradient-primary h-8"
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpenDetail();
                }}
              >
                {t('strategies:card.actions.subscribe')}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenDetail();
                  }}
                >
                  {t('strategies:card.actions.manage')}
                </Button>
              </div>
            )}

            <div className="md:hidden">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpenDetail();
                }}
              >
                {t('strategies:card.actions.view')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const StrategyMarketCard = memo(StrategyMarketCardComponent);
