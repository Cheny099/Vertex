import type { TFunction } from 'i18next';
import { motion } from 'framer-motion';
import { History, Link as LinkIcon, OctagonAlert, Plus, Settings2, Shield, Snowflake, Trash2, Trophy, Zap } from 'lucide-react';
import type { LeaderboardItem, Subscription } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AccountPreview {
  exchange?: string;
  name?: string;
}

interface StrategyMainInfoGridProps {
  t: TFunction;
  description?: string | null;
  parsedConfig: Record<string, unknown>;
  leaderboardItems?: LeaderboardItem[];
  subscriptions?: Subscription[];
  isSubsLoading: boolean;
  getAccountDetail: (accountId: number) => AccountPreview | undefined;
  onAddSub: () => void;
  onEditSub: (sub: Subscription) => void;
  onRemoveSub: (subId: number) => void;
}

export function StrategyMainInfoGrid({
  t,
  description,
  parsedConfig,
  leaderboardItems,
  subscriptions,
  isSubsLoading,
  getAccountDetail,
  onAddSub,
  onEditSub,
  onRemoveSub,
}: StrategyMainInfoGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="bg-card glass-card rounded-2xl p-6 border border-border/40 h-full flex flex-col"
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">{t('strategies:detail.risk_control')}</h3>
        </div>

        <div className="space-y-3 flex-1">
          {description ? (
            <p className="text-sm text-foreground/90 leading-relaxed font-medium">{description}</p>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('strategies:detail.no_description')}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="bg-secondary/20 p-3 rounded-xl border border-border/20">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{t('strategies:detail.risk_level')}</p>
              <p className="text-sm font-bold text-yellow-500">
                {(() => {
                  const raw = typeof parsedConfig.risk_level === 'string' ? parsedConfig.risk_level : undefined;
                  if (raw && t(`strategies:risk_levels.${raw}`, { defaultValue: '' })) {
                    return t(`strategies:risk_levels.${raw}`);
                  }
                  return raw || t('strategies:detail.risk_none');
                })()}
              </p>
            </div>

            <div className="bg-secondary/20 p-3 rounded-xl border border-border/20">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{t('strategies:detail.recommended_leverage')}</p>
              <p className="text-sm font-bold text-primary">
                {parsedConfig.recommended_leverage != null ? String(parsedConfig.recommended_leverage) : '--'}
              </p>
            </div>
          </div>

          <div className="mt-auto pt-2">
            <p className="text-[11px] text-muted-foreground/80 bg-muted/30 p-2.5 rounded-lg border border-dashed border-border/50 italic">
              {t('strategies:detail.risk_warning')}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.48 }}
        className="bg-card glass-card rounded-2xl p-6 border border-border/40 h-full flex flex-col"
      >
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold">{t('strategies:detail.leaderboard')}</h3>
        </div>

        <div className="space-y-4 flex-1">
          {leaderboardItems?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-xl bg-secondary/5 h-full flex flex-col items-center justify-center">
              <History className="w-8 h-8 mx-auto mb-2 opacity-10" />
              {t('strategies:detail.no_leaderboard')}
            </div>
          ) : (
            leaderboardItems?.slice(0, 3).map((item, idx: number) => (
              <div key={item.user_id} className="flex items-center justify-between group p-1 transition-all">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-7 h-7 flex items-center justify-center rounded-xl text-[10px] font-black shadow-sm transition-transform group-hover:scale-110',
                      idx === 0
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                        : idx === 1
                          ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white'
                          : idx === 2
                            ? 'bg-gradient-to-br from-amber-500 to-amber-800 text-white'
                            : 'bg-muted text-muted-foreground'
                    )}
                  >
                    #{idx + 1}
                  </div>
                  <span className="text-sm font-semibold tracking-tight">{item.display_name}</span>
                </div>
                <div className="text-right">
                  <p className={cn('text-xs font-mono font-bold', item.pnl > 0 ? 'text-profit' : 'text-loss')}>
                    {item.pnl > 0 ? '+' : ''}
                    {Number(item.pnl).toFixed(2)}
                  </p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{t('strategies:detail.total_pnl')} (USDT)</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="bg-card glass-card rounded-2xl p-6 border border-border/40 h-full flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <LinkIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">{t('strategies:detail.my_subscription')}</h3>
          </div>
          {/* Wrapped, not point-free: React passes the click event as the first argument, and this
              handler's first parameter is the flag that skips the invite-code check. */}
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 text-primary" onClick={() => onAddSub()}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4 flex-1">
          {isSubsLoading ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : subscriptions?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-xl bg-secondary/5 h-full flex flex-col items-center justify-center">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-10" />
              {t('strategies:detail.no_subscription')}
            </div>
          ) : (
            subscriptions?.map((sub) => {
              const acc = getAccountDetail(sub.account_id);
              const pctRaw =
                sub.position_pct ??
                (sub.position_value > 0 && sub.position_value <= 1 ? sub.position_value : 0);
              const pct = pctRaw * 100;

              const label =
                sub.position_mode === 'fixed_amount'
                  ? `${sub.position_value} U`
                  : sub.position_mode === 'fixed'
                    ? `${pct.toFixed(0)}%`
                    : t('strategies:hints.multiplier_fallback');

              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40 group hover:border-primary/40 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs group-hover:bg-primary group-hover:text-white transition-colors">
                      {(acc?.exchange || 'TF').toUpperCase().substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-tight uppercase">{acc?.name || `Account #${sub.account_id}`}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] h-4 px-1 px-1.5 font-mono border-primary/20 text-primary">
                          {label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {typeof sub.leverage === 'number' ? `${sub.leverage}x` : '--'}
                        </span>

                        {(sub.is_frozen || sub.block_open) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant={sub.is_frozen ? 'secondary' : 'destructive'}
                                  className={cn(
                                    'text-[9px] h-4 px-1.5 font-bold flex items-center gap-1',
                                    sub.is_frozen ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-red-50 text-red-600 hover:bg-red-100'
                                  )}
                                >
                                  {sub.is_frozen ? <Snowflake className="w-2.5 h-2.5" /> : <OctagonAlert className="w-2.5 h-2.5" />}
                                  {sub.is_frozen ? t('strategies:detail.status_frozen') : t('strategies:detail.status_blocked')}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs font-medium">
                                  {sub.is_frozen
                                    ? (sub.frozen_reason || t('strategies:detail.freeze_reason'))
                                    : (sub.block_open_reason || t('strategies:detail.block_reason'))}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => onEditSub(sub)}
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => onRemoveSub(sub.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
