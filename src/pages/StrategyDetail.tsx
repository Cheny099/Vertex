/**
 * @anchor-id STRATEGY_DETAIL_PAGE
 * @module-type page
 * @disposable false
 * @mock-data 策略详情数据为 Mock，后端对接时替换
 */

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, ArrowLeft, Copy, Globe, History, Link as LinkIcon, Plus, Settings2, Shield, Trash2, Trophy, TrendingUp, Zap, OctagonAlert, Snowflake } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

import { accountApi, leaderboardApi, strategyApi, subscriptionApi, exchangeApi, type Subscription, type PeriodKey } from '@/api';
import RiskDisclosureDialog from '@/components/RiskDisclosureDialog';
import { WebhookSecretDialog } from '@/components/strategies/WebhookSecretDialog';
import { InviteCodeModal } from '@/components/modals/InviteCodeModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

type UiMode = 'fixed_amount' | 'fixed';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const StrategyDetail = () => {
  const { id = '' } = useParams();
  const strategyId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['strategies', 'common']);
  const { user, isAdmin } = useAuth();

  const canQuery = Number.isFinite(strategyId) && strategyId > 0;

  // 获取策略详情
  const { data: strategy, isLoading, isError } = useQuery({
    queryKey: ['strategy', strategyId],
    queryFn: () => strategyApi.get(strategyId),
    enabled: canQuery,
    refetchInterval: 5000,
  });

  // 状态切换
  const toggleMutation = useMutation({
    mutationFn: async (status: 'active' | 'inactive') => {
      if (!strategy) throw new Error('Strategy not loaded');
      return strategyApi.update(strategy.id, {
        status,
        name: strategy.name,
        strategy_key: strategy.strategy_key,
        description: strategy.description,
        config: strategy.config,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy', strategyId] });
      toast.success(t('strategies:detail.toast_status_updated'));
    },
    onError: (e: any) => {
      toast.error(e?.message || t('strategies:detail.toast_error'));
    },
  });

  // Subscriptions
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState<PeriodKey>('all');
  const [isSecretOpen, setIsSecretOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // ✅ 只保留两种模式：fixed_amount / fixed
  const [newSub, setNewSub] = useState<{
    accountId: string;
    positionMode: UiMode;
    positionValue: number; // fixed_amount 用（USDT）
    positionPct: number;   // fixed 用（0.02 - 1.0）
    leverage: number;
  }>({
    accountId: '',
    positionMode: 'fixed',
    positionValue: 100,
    positionPct: 0.1,
    leverage: 50,
  });

  const [legalError, setLegalError] = useState<{ docKey: string, version: string } | null>(null);

  // handleLegalAccepted removed from here as it is defined later


  const { data: subscriptions, isLoading: isSubsLoading } = useQuery({
    queryKey: ['subscriptions', strategyId],
    queryFn: () => subscriptionApi.list(),
    enabled: canQuery,
    select: (data) => data.filter((s: Subscription) => s.strategy_id === strategyId),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountApi.list(),
  });
  // ====== 可用保证金（前端兜底读取：若后端暂未提供字段，会显示 --，并用 10000 作为上限）======
  const selectedAccount = useMemo(() => {
    const aid = Number(newSub.accountId);
    if (!accounts || !aid) return undefined;
    return accounts.find((a) => a.id === aid);
  }, [accounts, newSub.accountId]);

  const availableMargin = useMemo(() => {
    const anyAcc: any = selectedAccount as any;
    const raw =
      anyAcc?.available_margin ??
      anyAcc?.availableMargin ??
      anyAcc?.free_margin ??
      anyAcc?.freeMargin ??
      anyAcc?.balance_available ??
      anyAcc?.balanceAvailable ??
      anyAcc?.margin_available ??
      anyAcc?.marginAvailable ??
      anyAcc?.detail?.available_margin ??
      anyAcc?.detail?.availableMargin ??
      null;

    if (raw === null || raw === undefined) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [selectedAccount]);

  const fixedAmountMax = useMemo(() => {
    if (availableMargin && availableMargin > 0) return Math.max(1, Math.floor(availableMargin));
    return 10000;
  }, [availableMargin]);

  // ✅ New: Fetch Exchange Meta for min_notional validation
  const { data: exchangeMeta } = useQuery({
    queryKey: ['exchange-meta', strategy?.pair, selectedAccount?.exchange],
    enabled: !!strategy?.pair && !!selectedAccount?.exchange && selectedAccount.exchange !== 'week',
    queryFn: async () => {
      const symbol = strategy!.pair!.replace('/', '');
      const res = await exchangeApi.getSymbolsMeta(selectedAccount!.exchange, [symbol]);
      return res.symbols?.find((s: any) => s.symbol === symbol) || null;
    },
    staleTime: 300_000
  });

  const minNotional = exchangeMeta?.min_notional || 0;
  const isMinNotionalViolated = newSub.positionMode === 'fixed_amount' && Number(newSub.positionValue || 0) < minNotional;

  const addSubMutation = useMutation({
    mutationFn: async (data: typeof newSub) => {
      if (!strategy) throw new Error('Strategy not loaded');
      const leverage = data.leverage > 0 ? data.leverage : undefined;

      if (data.positionMode === 'fixed_amount') {
        const amount = clamp(Number(data.positionValue || 1), 1, fixedAmountMax);
        return subscriptionApi.create({
          strategy_id: strategyId,
          strategy_key: strategy.strategy_key,
          account_id: Number(data.accountId),
          position_mode: 'fixed_amount',
          position_value: amount,
          position_pct: undefined,
          leverage,
        });
      }

      // fixed：账户比例
      const pct = clamp(Number(data.positionPct || 0.1), 0.02, 1.0);
      return subscriptionApi.create({
        strategy_id: strategyId,
        strategy_key: strategy.strategy_key,
        account_id: Number(data.accountId),
        position_mode: 'fixed',
        position_value: pct,
        position_pct: pct,
        leverage,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setIsAddSubOpen(false);
      toast.success(t('strategies:detail.toast_sub_success'));
    },
    onError: (error: any) => {
      // ✅ Handle Legal Acceptance Requirement (409)
      if (error?.message?.includes('LEGAL_ACCEPTANCE_REQUIRED') || error?.code === 'LEGAL_ACCEPTANCE_REQUIRED') {
        const detail = error.detail || error;
        setLegalError({
          docKey: detail.doc_key || 'auto_trade_notice',
          version: detail.required_version || '1.0'
        });
        setIsAddSubOpen(false); // Close subscription dialog
        return;
      }

      // ✅ Handle Invite Required (403 SUBSCRIPTION_ACCESS_DENIED)
      if (error?.message?.includes('SUBSCRIPTION_ACCESS_DENIED') || error?.code === 'SUBSCRIPTION_ACCESS_DENIED' || error?.message?.includes('Invite required')) {
        setIsAddSubOpen(false);
        setIsInviteModalOpen(true);
        return;
      }

      toast.error(error?.message || t('strategies:detail.toast_error'));
    },
  });

  const updateSubMutation = useMutation({
    mutationFn: async (data: typeof newSub) => {
      if (!editingSub) throw new Error('No subscription selected');
      const leverage = data.leverage > 0 ? data.leverage : undefined;

      // ✅ Reuse strict payload logic implicitly via API, but here we just pass data
      // API layer handles the strict filtering based on mode.
      return subscriptionApi.update(editingSub.id, {
        position_mode: data.positionMode, // Ensure camelCase matches DTO if needed using 'as any' or mapping
        position_value: data.positionMode === 'fixed_amount' ? clamp(Number(data.positionValue || 1), 1, fixedAmountMax) : undefined,
        position_pct: data.positionMode === 'fixed' ? clamp(Number(data.positionPct || 0.1), 0.02, 1.0) : undefined,
        leverage,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setIsAddSubOpen(false);
      setEditingSub(null);
      toast.success(t('strategies:detail.toast_sub_updated'));
    },
    onError: (error: any) => {
      if (error?.message?.includes('LEGAL_ACCEPTANCE_REQUIRED') || error?.code === 'LEGAL_ACCEPTANCE_REQUIRED') {
        const detail = error.detail || error;
        setLegalError({
          docKey: detail.doc_key || 'auto_trade_notice',
          version: detail.required_version || '1.0'
        });
        setIsAddSubOpen(false);
        return;
      }

      // ✅ Handle Invite Required (403)
      if (error?.message?.includes('SUBSCRIPTION_ACCESS_DENIED') || error?.code === 'SUBSCRIPTION_ACCESS_DENIED' || error?.message?.includes('Invite required')) {
        setIsAddSubOpen(false);
        setIsInviteModalOpen(true);
        return;
      }

      toast.error(error?.message || t('strategies:detail.toast_error'));
    },
  });

  const removeSubMutation = useMutation({
    mutationFn: (subId: number) => subscriptionApi.delete(subId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success(t('strategies:detail.toast_sub_removed'));
    },
    onError: (e: any) => toast.error(e?.message || t('strategies:detail.toast_error')),
  });

  // ✅ Retry logic after legal acceptance
  const handleLegalAccepted = () => {
    setLegalError(null);
    toast.success(t('legal:auth_success_retry'));

    // Automatically retry the last action
    if (editingSub) {
      updateSubMutation.mutate(newSub);
    } else {
      addSubMutation.mutate(newSub);
    }
  };

  const isSubscribed = useMemo(() => {
    return (sid: number) => subscriptions?.some((s: Subscription) => s.strategy_id === sid);
  }, [subscriptions]);

  const handleEditSub = (sub: Subscription) => {
    setEditingSub(sub);

    // ✅ 重要修复：如果历史是 multiplier/未知模式，不要拿 position_value 当 pct
    let mode: UiMode = 'fixed';
    if (sub.position_mode === 'fixed_amount') mode = 'fixed_amount';
    if (sub.position_mode === 'fixed') mode = 'fixed';

    const safePct =
      sub.position_mode === 'fixed'
        ? (sub.position_pct ?? (sub.position_value > 0 && sub.position_value <= 1 ? sub.position_value : 0.1))
        : 0.1;

    setNewSub({
      accountId: String(sub.account_id),
      positionMode: mode,
      positionValue: mode === 'fixed_amount' ? Number(sub.position_value || 1) : 100,
      positionPct: mode === 'fixed' ? safePct : 0.1,
      leverage: sub.leverage || 50,
    });

    // 如果是历史 multiplier，提示用户需要重新设置
    if (sub.position_mode === 'multiplier') {
      toast.message(t('strategies:detail.multiplier_warning'));
    }

    setIsAddSubOpen(true);
  };

  const handleAddSub = (force = false) => {
    // ✅ Invite Code Interception (Phase 16)
    // If not admin and can_subscribe is false, block and request invite code
    if (!force && !isAdmin && user && !user.can_subscribe) {
      setIsInviteModalOpen(true);
      return;
    }

    setEditingSub(null);
    setNewSub({
      accountId: accounts && accounts.length > 0 ? String(accounts[0].id) : '',
      positionMode: 'fixed',
      positionValue: 100,
      positionPct: 0.1,
      leverage: 50,
    });
    setIsAddSubOpen(true);
  };

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', 'strategy', strategyId],
    queryFn: () => leaderboardApi.getByStrategy(strategyId),
    enabled: canQuery,
    refetchInterval: 30000,
  });

  const strategyTotalPnl = useMemo(() => {
    if (!leaderboard?.items) return 0;
    return leaderboard.items.reduce((acc: number, item: any) => acc + (parseFloat(item.pnl as any) || 0), 0);
  }, [leaderboard]);

  const metrics = useMemo(() => strategy?.metrics?.[activePeriod], [strategy, activePeriod]);

  const parsedConfig = useMemo(() => {
    if (!strategy?.config) return {};
    try {
      const res = typeof strategy.config === 'string' ? JSON.parse(strategy.config) : strategy.config;
      return res && typeof res === 'object' ? res : {};
    } catch {
      return { raw: strategy.config };
    }
  }, [strategy?.config]);

  const parameterLabels: Record<string, string> = {
    investment: t('strategies:create.investment_label'),
    strategy_key: t('strategies:detail.strategy_key') || 'Strategy Key',
    pair: t('strategies:detail.pair'),
    type: t('strategies:detail.strategy_type'),
    value: t('strategies:detail.value') || 'Core Value',
    take_profit: t('strategies:create.take_profit'),
    stop_loss: t('strategies:create.stop_loss'),
    timeframe: t('strategies:detail.timeframe') || 'Timeframe',
    threshold: t('strategies:detail.threshold') || 'Threshold',
    risk_level: t('strategies:detail.risk_level'),
    recommended_leverage: t('strategies:detail.recommended_leverage'),
  };

  const getAccountDetail = (accountId: number) => accounts?.find((a) => a.id === accountId);

  const webhookUrl = `${window.location.protocol}//${window.location.host}/api/v1/tradingview/webhook`;
  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success(t('strategies:detail.webhook_url'));
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <InviteCodeModal open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen} onSuccess={() => handleAddSub(true)} />
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !strategy) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <InviteCodeModal open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen} onSuccess={() => handleAddSub(true)} />
        <div className="p-4 bg-destructive/10 rounded-full">
          <Activity className="w-12 h-12 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">{t('strategies:detail.load_failed')}</h2>
        <p className="text-muted-foreground">{t('strategies:detail.load_failed_desc')}</p>
        <Button onClick={() => navigate('/strategies')}>{t('strategies:detail.back_list')}</Button>
      </div>
    );
  }

  const showWebhook = isAdmin || String(user?.id) === String(strategy?.user_id);

  const promotedKeys = ['risk_level', 'recommended_leverage', 'pair', 'type', 'strategy_key'];
  const displayParams = Object.entries(parsedConfig).filter(([key]) => !promotedKeys.includes(key));

  const ParametersCard = displayParams.length > 0 ? (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-card glass-card rounded-2xl p-6 border border-border/40"
    >
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">{t('strategies:detail.core_params')}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayParams.map(([key, value]) => (
          <div key={key} className="p-3.5 rounded-xl bg-secondary/20 border border-border/30 hover:border-primary/30 hover:bg-secondary/30 transition-all">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">
              {parameterLabels[key] || t(`strategies:detail.${key}`) || key.replace(/_/g, ' ')}
            </span>
            <span className="text-sm font-bold text-primary break-words leading-tight block">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  ) : null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <InviteCodeModal open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen} onSuccess={() => handleAddSub(true)} />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/strategies')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{strategy.name}</h1>
              <Badge variant={strategy.status === 'active' ? 'default' : 'secondary'}>
                {strategy.status === 'active' ? t('strategies:detail.status_active') : t('strategies:detail.status_maintenance')}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
              <span>{strategy.pair || (parsedConfig as any)?.pair || strategy.strategy_key}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{t('strategies:detail.created_at')} {new Date(strategy.created_at).toLocaleDateString()}</span>
              {strategy.updated_at && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-muted-foreground/80">
                    {t('strategies:detail.updated_at')} {new Date(strategy.updated_at).toLocaleDateString()}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" className="h-10" onClick={() => navigate(`/strategies/${id}/signals`)}>
            <History className="w-4 h-4 mr-2" />
            {t('strategies:detail.signal_history')}
          </Button>

          <Button
            className="gradient-primary px-6 h-10 shadow-lg shadow-primary/20"
            onClick={() => {
              if (isSubscribed(strategyId)) {
                const sub = subscriptions?.find((s: Subscription) => s.strategy_id === strategyId);
                if (sub) handleEditSub(sub);
              } else {
                handleAddSub();
              }
            }}
          >
            {isSubscribed(strategyId) ? (
              <>
                <Settings2 className="w-4 h-4 mr-2" />
                {t('strategies:detail.edit_subscription')}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                {t('strategies:detail.subscribe_now')}
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* 策略信息 */}
      {/* Period Selector & Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-2">
          {(['1m', '3m', '6m', '1y', 'all'] as PeriodKey[]).map((p) => (
            <Button
              key={p}
              variant={activePeriod === p ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActivePeriod(p)}
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
              highlight: true
            },
            {
              label: t('strategies:detail.max_drawdown'),
              value: metrics ? `${metrics.max_drawdown_pct.toFixed(1)}%` : '--',
              icon: Activity,
              positive: false,
              color: 'text-destructive'
            },
            {
              label: t('strategies:detail.win_rate'),
              value: metrics ? `${metrics.win_rate.toFixed(0)}%` : '--',
              icon: Trophy,
              positive: true
            },
            {
              label: t('strategies:detail.profit_factor'),
              value: metrics?.profit_factor != null ? metrics.profit_factor.toFixed(1) : '--',
              icon: Zap,
              positive: (metrics?.profit_factor || 0) > 1
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
                    stat.highlight && 'animate-pulse-soft bg-profit/10 text-profit'
                  )}
                >
                  <stat.icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className={cn("text-xl font-bold font-mono tracking-tight", stat.positive ? 'text-profit' : '', stat.color)}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Config & Webhook */}
      {/* Config & Webhook - New Layout */}

      {/* Row 1: Main Info (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Col 1: Risk Control */}
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
            {strategy.description ? (
              <p className="text-sm text-foreground/90 leading-relaxed font-medium">{strategy.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('strategies:detail.risk_desc_placeholder', { type: strategy.type || (parsedConfig as any)?.type || 'Auto', pair: strategy.pair || (parsedConfig as any)?.pair || 'Multi-Asset' }) || strategy.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="bg-secondary/20 p-3 rounded-xl border border-border/20">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{t('strategies:detail.risk_level')}</p>
                <p className="text-sm font-bold text-yellow-500">
                  {(() => {
                    const raw = (parsedConfig as any)?.risk_level;
                    if (raw && t(`strategies:risk_levels.${raw}`, { defaultValue: '' })) {
                      return t(`strategies:risk_levels.${raw}`);
                    }
                    return raw || (strategy.status === 'active' ? t('strategies:detail.risk_medium') : t('strategies:detail.risk_none'));
                  })()}
                </p>
              </div>

              <div className="bg-secondary/20 p-3 rounded-xl border border-border/20">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{t('strategies:detail.recommended_leverage')}</p>
                <p className="text-sm font-bold text-primary">
                  {(parsedConfig as any)?.recommended_leverage || '10x - 50x'}
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

        {/* Col 2: Leaderboard */}
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
            {leaderboard?.items?.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-xl bg-secondary/5 h-full flex flex-col items-center justify-center">
                <History className="w-8 h-8 mx-auto mb-2 opacity-10" />
                {t('strategies:detail.no_leaderboard')}
              </div>
            ) : (
              leaderboard?.items?.slice(0, 3).map((item: any, idx: number) => (
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
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Profit (USDT)</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Col 3: My Subscriptions */}
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
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 text-primary" onClick={handleAddSub}>
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
                          <span className="text-[10px] text-muted-foreground font-mono">{sub.leverage}x</span>

                          {/* ✅ Phase 136: Blocked/Frozen Status */}
                          {(sub.is_frozen || sub.block_open) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant={sub.is_frozen ? "secondary" : "destructive"}
                                    className={cn(
                                      "text-[9px] h-4 px-1.5 font-bold flex items-center gap-1",
                                      sub.is_frozen ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-red-50 text-red-600 hover:bg-red-100"
                                    )}
                                  >
                                    {sub.is_frozen ? <Snowflake className="w-2.5 h-2.5" /> : <OctagonAlert className="w-2.5 h-2.5" />}
                                    {sub.is_frozen ? t('strategies:status_frozen') : t('strategies:status_blocked')}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs font-medium">
                                    {sub.is_frozen
                                      ? (sub.frozen_reason || t('strategies:freeze_reason'))
                                      : (sub.block_open_reason || t('strategies:block_reason'))}
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
                        onClick={() => handleEditSub(sub)}
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => removeSubMutation.mutate(sub.id)}
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

      {/* Row 2: Admin / Parameters */}
      {(showWebhook || ParametersCard) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {showWebhook && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="bg-card glass-card rounded-2xl p-6 border border-border/40"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold">{t('strategies:detail.signal_channel')}</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                  TradingView Webhook
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="group relative">
                  <p className="text-[10px] text-muted-foreground mb-1.5 uppercase font-bold tracking-widest pl-1">
                    {t('strategies:detail.endpoint_label')}
                  </p>
                  <div className="flex items-center gap-2 bg-secondary/30 p-2.5 rounded-xl border border-border/50 group-hover:border-primary/30 transition-colors">
                    <code className="flex-1 text-xs font-mono truncate">{webhookUrl}</code>
                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 hover:text-primary border-none" onClick={copyWebhook}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-between group hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => setIsSecretOpen(true)}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    {t('strategies:detail.webhook_secret_btn')}
                  </span>
                  <Settings2 className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>

                <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <span className="text-primary font-bold mr-1">{t('strategies:detail.usage_guide')}</span>
                    {t('strategies:detail.usage_desc')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {ParametersCard}
        </div>
      )}

      {/* Add/Update Dialog */}
      <Dialog open={isAddSubOpen} onOpenChange={setIsAddSubOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none bg-background">
          <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 pb-4">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              {editingSub ? t('strategies:detail.subscription_dialog_title_edit') : t('strategies:detail.subscription_dialog_title_add')}
            </DialogTitle>
            <DialogDescription className="mt-1">
              {editingSub ? t('strategies:detail.subscription_desc_edit') : t('strategies:detail.subscription_desc_add')}
            </DialogDescription>
          </div>

          <div className="p-6 space-y-6">
            {/* Account Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                {t('strategies:detail.execution_account')}
              </Label>

              <Select
                value={newSub.accountId}
                onValueChange={(val) => setNewSub({ ...newSub, accountId: val })}
                disabled={!!editingSub}
              >
                <SelectTrigger className="w-full bg-secondary/10 border-border h-11">
                  <SelectValue placeholder={t('strategies:detail.select_account')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    ?.filter((a) => a.is_active || String(a.id) === newSub.accountId)
                    .map((acc) => (
                      <SelectItem key={acc.id} value={String(acc.id)}>
                        {acc.name} ({acc.exchange.toUpperCase()})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="opacity-50" />

            {/* Position Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">{t('strategies:detail.position_settings')}</Label>

                <Select
                  value={newSub.positionMode}
                  onValueChange={(val) => {
                    const mode = val as UiMode;
                    if (mode === 'fixed_amount') {
                      setNewSub({
                        ...newSub,
                        positionMode: 'fixed_amount',
                        positionValue: clamp(Number(newSub.positionValue || 1), 1, fixedAmountMax),
                      });
                    } else {
                      setNewSub({
                        ...newSub,
                        positionMode: 'fixed',
                        positionPct: clamp(Number(newSub.positionPct || 0.1), 0.02, 1.0),
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs border-border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">{t('strategies:detail.mode_fixed')}</SelectItem>
                    <SelectItem value="fixed_amount">{t('strategies:detail.mode_amount')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-secondary/20 p-4 rounded-xl space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">
                    {newSub.positionMode === 'fixed_amount' ? t('strategies:detail.amount_label') : t('strategies:detail.ratio_label')}
                  </span>
                  <span className="text-sm font-mono font-bold text-primary">
                    {newSub.positionMode === 'fixed'
                      ? `${Math.round(newSub.positionPct * 100)}%`
                      : `${Number(newSub.positionValue || 0).toFixed(2)} USDT`}
                  </span>
                </div>

                {newSub.positionMode === 'fixed_amount' ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{t('strategies:detail.available_margin')}</span>
                        <span className="font-mono">{availableMargin ? `${availableMargin.toFixed(2)} USDT` : '--'}</span>
                      </div>

                      <Input
                        type="number"
                        inputMode="decimal"
                        min={1}
                        max={fixedAmountMax}
                        step={0.01}
                        value={newSub.positionValue}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isFinite(n)) {
                            setNewSub({ ...newSub, positionValue: 1 });
                            return;
                          }
                          setNewSub({ ...newSub, positionValue: clamp(n, 1, fixedAmountMax) });
                        }}
                      />

                      <div className="text-[10px] text-muted-foreground">{t('strategies:hints.amount_range', { max: fixedAmountMax })}</div>

                      {isMinNotionalViolated && (
                        <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {t('strategies:validation.min_notional_violation', { min: minNotional })}
                        </p>
                      )}
                    </div>

                    <Slider
                      value={[Number(newSub.positionValue || 1)]}
                      min={1}
                      max={fixedAmountMax}
                      step={1}
                      onValueChange={(val) => setNewSub({ ...newSub, positionValue: val[0] })}
                      className="py-2"
                    />

                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                      * {t('strategies:hints.fixed_amount_desc', { amount: Number(newSub.positionValue || 1).toFixed(2) })}
                    </p>
                  </>
                ) : (
                  <>
                    <Slider
                      value={[newSub.positionPct * 100]}
                      min={2}
                      max={100}
                      step={1}
                      onValueChange={(val) => setNewSub({ ...newSub, positionPct: val[0] / 100 })}
                      className="py-4"
                    />
                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                      * {t('strategies:hints.ratio_desc', { percent: Math.round(newSub.positionPct * 100) })}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Leverage */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold">{t('strategies:detail.leverage')}</Label>
                <span className="text-sm font-mono font-bold text-primary">{newSub.leverage}x</span>
              </div>

              <Slider
                value={[newSub.leverage]}
                min={1}
                max={200}
                step={1}
                onValueChange={(val) => setNewSub({ ...newSub, leverage: val[0] })}
                className="py-2"
              />

              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>{t('strategies:risk_levels.conservative')}</span>
                <span>{t('strategies:risk_levels.standard')}</span>
                <span>{t('strategies:risk_levels.aggressive')}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-secondary/10 flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setIsAddSubOpen(false)}>
              {t('common:cancel')}
            </Button>

            <Button
              className="gradient-primary px-8 shadow-lg shadow-primary/20"
              onClick={() => (editingSub ? updateSubMutation.mutate(newSub) : addSubMutation.mutate(newSub))}
              disabled={
                !newSub.accountId ||
                addSubMutation.isPending ||
                updateSubMutation.isPending ||
                (newSub.positionMode === 'fixed_amount' &&
                  (Number(newSub.positionValue || 0) < 1 || Number(newSub.positionValue || 0) > fixedAmountMax)) ||
                (newSub.positionMode === 'fixed' && (newSub.positionPct < 0.02 || newSub.positionPct > 1))
              }
            >
              {(addSubMutation.isPending || updateSubMutation.isPending) && (
                <Activity className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingSub ? t('common:save') : t('strategies:detail.subscribe_now')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      <WebhookSecretDialog
        open={isSecretOpen}
        onOpenChange={setIsSecretOpen}
        strategyId={strategyId}
        strategyName={strategy?.name || ''}
      />

      <RiskDisclosureDialog
        open={!!legalError}
        onOpenChange={(open) => !open && setLegalError(null)}
        docKey={legalError?.docKey as any}
        requiredVersion={legalError?.version || ''}
        onAccept={handleLegalAccepted}
      />
    </div >
  );
};

export default StrategyDetail;
