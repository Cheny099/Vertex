
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2, AlertTriangle, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { strategyApi, webhookEventsApi, WebhookEventRead } from '@/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const StrategySignals = () => {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation(['strategies', 'common']);

    // 1. 获取策略元数据（为了拿到 strategy_key）
    const { data: strategyData, isLoading: isStrategyLoading } = useQuery({
        queryKey: ['strategy', id],
        queryFn: () => strategyApi.get(Number(id)),
        enabled: !!id,
    });

    // 2. 获取 Webhook 信号数据 (Real API)
    const { data: events, isLoading: isEventsLoading, isError } = useQuery({
        queryKey: ['webhook-events', strategyData?.strategy_key],
        queryFn: () => webhookEventsApi.list({ strategy_key: strategyData?.strategy_key || '' }),
        enabled: !!strategyData?.strategy_key,
        refetchInterval: 5000,
    });

    // 计算统计数据
    const stats = useMemo(() => {
        if (!events) return { total: 0, distinct: 0, dups: 0, skipped: 0, frozen: 0, blocked: 0 };
        return {
            total: events.length,
            distinct: events.filter(e => e.duplicate_count === 0).length,
            dups: events.reduce((acc, curr) => acc + (curr.duplicate_count || 0), 0),
            // ✅ Phase 133: Count skipped items across all events
            skipped: events.reduce((acc, curr) => acc + (curr.skipped?.length || 0), 0),
            // ✅ Phase 140: New metrics
            frozen: events.reduce((acc, curr) => acc + (curr.skipped_frozen || 0), 0),
            blocked: events.reduce((acc, curr) => acc + (curr.skipped_block_open || 0), 0)
        };
    }, [events]);

    if (isStrategyLoading || (strategyData && isEventsLoading)) {
        return (
            <div className="p-6 lg:p-8 space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="flex gap-4">
                    <Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <AlertTriangle className="w-12 h-12 text-destructive" />
                <h2 className="text-xl font-bold">{t('strategies:signals.load_failed')}</h2>
                <Button onClick={() => navigate(-1)}>{t('common:back')}</Button>
            </div>
        );
    }

    // 如果还没有 strategyData 说明 ID 错误或者 404
    if (!strategyData) {
        return (
            <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground">{t('strategies:signals.not_found_error')}</p>
                <Button variant="link" onClick={() => navigate('/strategies')}>{t('strategies:detail.back_list')}</Button>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
            >
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{t('strategies:signals.title')}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <span>{strategyData.name}</span>
                        <Badge variant="outline" className="font-mono text-xs">{strategyData.strategy_key}</Badge>
                    </div>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase">{t('strategies:signals.total_signals')}</p>
                    <p className="text-2xl font-bold font-mono mt-1">{stats.total}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase">{t('strategies:signals.distinct_events')}</p>
                    <p className="text-2xl font-bold font-mono mt-1 text-primary">{stats.distinct}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase">{t('strategies:signals.duplicate_filtered')}</p>
                    <p className="text-2xl font-bold font-mono mt-1 text-yellow-500">{stats.dups}</p>
                </div>
                {/* ✅ Phase 133 & 140: Skipped Stats Breakdown */}
                <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase">{t('strategies:signals.skipped_validations')}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className={cn("text-2xl font-bold font-mono", stats.skipped > 0 ? "text-orange-500" : "text-muted-foreground")}>
                            {stats.skipped}
                        </p>
                        {(stats.frozen > 0 || stats.blocked > 0) && (
                            <div className="flex gap-1.5 ml-auto">
                                {stats.frozen > 0 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-orange-500/20 text-orange-600 bg-orange-500/5">
                                                    {stats.frozen}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('strategies:signals.skipped_frozen')}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                                {stats.blocked > 0 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-rose-500/20 text-rose-600 bg-rose-500/5">
                                                    {stats.blocked}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('strategies:signals.skipped_block_open')}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {t('strategies:signals.event_log')}
                </h3>

                {events && events.length > 0 ? (
                    <div className="rounded-xl border border-border/40 overflow-hidden bg-card/50">
                        {events.map((event, idx) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group flex flex-col p-4 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            event.duplicate_count > 0 ? "bg-yellow-500" : "bg-green-500"
                                        )} />

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-muted-foreground">ID: {event.id}</span>
                                                {event.duplicate_count > 0 && (
                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1 text-yellow-600 bg-yellow-500/10 border-yellow-500/20">
                                                        {event.duplicate_count} {t('strategies:signals.dups_abbr')}
                                                    </Badge>
                                                )}
                                                {/* ✅ Phase 133: Matched / Created Badges */}
                                                {event.subscriptions_matched !== undefined && (
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 text-blue-500 border-blue-500/20">
                                                        {t('strategies:signals.matched')}: {event.subscriptions_matched}
                                                    </Badge>
                                                )}
                                                {event.orders_created !== undefined && (
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 text-green-500 border-green-500/20">
                                                        {t('strategies:signals.ordered')}: {event.orders_created}
                                                    </Badge>
                                                )}
                                                {/* ✅ Phase 140: New Badges */}
                                                {(event.skipped_frozen || 0) > 0 && (
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 text-orange-500 border-orange-500/20">
                                                        {t('strategies:signals.skipped_frozen')}: {event.skipped_frozen}
                                                    </Badge>
                                                )}
                                                {(event.skipped_block_open || 0) > 0 && (
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 text-rose-500 border-rose-500/20">
                                                        {t('strategies:signals.skipped_block_open')}: {event.skipped_block_open}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Payload Hash">
                                                <Fingerprint className="w-3 h-3" />
                                                <span className="font-mono">{event.payload_hash.substring(0, 8)}...</span>
                                            </div>
                                            {/* ✅ Phase 140: Visual Hints */}
                                            {((event.skipped_frozen || 0) > 0 || (event.skipped_block_open || 0) > 0) && (
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {(event.skipped_frozen || 0) > 0 && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-orange-600 bg-orange-500/5 px-2 py-0.5 rounded-sm">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            {t('strategies:signals.skipped_frozen_hint')}
                                                        </div>
                                                    )}
                                                    {(event.skipped_block_open || 0) > 0 && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-rose-600 bg-rose-500/5 px-2 py-0.5 rounded-sm">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            {t('strategies:signals.skipped_block_open_hint')}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right space-y-1">
                                        <p className="text-sm font-medium font-mono">
                                            {new Date(event.created_at).toLocaleTimeString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(event.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {/* ✅ Phase 133: Skipped Details */}
                                {event.skipped && event.skipped.length > 0 && (
                                    <div className="mt-3 ml-6 p-2 bg-orange-500/5 border border-orange-500/10 rounded-md text-xs">
                                        <div className="flex items-center gap-2 mb-1 text-orange-600 font-medium">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span>{t('strategies:signals.skipped_subs')} ({event.skipped.length})</span>
                                        </div>
                                        <div className="space-y-1 pl-5">
                                            {event.skipped.map((skip: any, i: number) => (
                                                <div key={i} className="text-muted-foreground font-mono">
                                                    {t('strategies:signals.sub_prefix')}{skip.subscription_id || skip.id || '?'}: {skip.reason || t('strategies:signals.no_reason')}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground">
                        <p>{t('strategies:signals.no_events')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StrategySignals;
