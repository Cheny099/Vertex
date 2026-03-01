
import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, AlertTriangle, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { strategyApi, webhookEventsApi, WebhookEventRead } from '@/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

const StrategySignals = () => {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation(['strategies', 'common']);

    // 1. 获取策略元数据（为了拿到 strategy_key）
    const {
        data: strategyData,
        isLoading: isStrategyLoading,
        isError: isStrategyError,
        error: strategyError,
    } = useQuery({
        queryKey: ['strategy', id],
        queryFn: () => strategyApi.get(Number(id)),
        enabled: !!id,
    });

    // 2. 获取 Webhook 信号数据 (Real API)
    const {
        data: events,
        isLoading: isEventsLoading,
        isError: isEventsError,
        error: eventsError,
    } = useQuery({
        queryKey: ['webhook-events', strategyData?.strategy_key],
        queryFn: () => webhookEventsApi.list({ strategy_key: strategyData?.strategy_key || '' }),
        enabled: !!strategyData?.strategy_key,
        refetchInterval: 5000,
    });

    // 计算统计数据
    const stats = useMemo(() => {
        if (!events) return { total: 0, distinct: 0, dups: 0 };
        const distinctCount = events.length;
        const dupsCount = events.reduce((acc, curr) => acc + (curr.duplicate_count || 0), 0);
        return {
            total: distinctCount + dupsCount,
            distinct: distinctCount,
            dups: dupsCount
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

    const pageError = (eventsError || strategyError) as (Error & { status?: number }) | null;
    const httpStatus = Number((pageError as any)?.status || 0);
    const isUnauthorized = httpStatus === 401;
    const isForbidden = httpStatus === 403;
    const isNotFound = httpStatus === 404;

    if (isStrategyError || isEventsError) {
        if (isNotFound) {
            return (
                <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[50vh]">
                    <p className="text-muted-foreground">{t('strategies:signals.not_found_error')}</p>
                    <Button variant="link" onClick={() => navigate('/strategies')}>{t('strategies:detail.back_list')}</Button>
                </div>
            );
        }

        if (isUnauthorized || isForbidden) {
            return (
                <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <AlertTriangle className="w-12 h-12 text-destructive" />
                    <h2 className="text-xl font-bold">{t('strategies:signals.permission_title')}</h2>
                    <p className="text-muted-foreground">{t('strategies:signals.permission_desc')}</p>
                    <Button onClick={() => navigate('/strategies')}>{t('strategies:detail.back_list')}</Button>
                </div>
            );
        }

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
                                            (event.is_duplicate || event.duplicate_count > 0) ? "bg-yellow-500" : "bg-green-500"
                                        )} />

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-muted-foreground">{t('strategies:signals.event_id', 'ID')}: {event.id}</span>
                                                {event.duplicate_count > 0 && (
                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1 text-yellow-600 bg-yellow-500/10 border-yellow-500/20">
                                                        {event.duplicate_count} {t('strategies:signals.dups_abbr')}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground" title={t('strategies:signals.payload_hash_title', 'Payload Hash')}>
                                                <Fingerprint className="w-3 h-3" />
                                                <span className="font-mono">{event.payload_hash.substring(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right space-y-1">
                                        <p className="text-sm font-medium font-mono">
                                            {new Date(event.created_at).toLocaleTimeString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(event.created_at).toLocaleDateString()}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {t('strategies:signals.last_seen', { defaultValue: 'Last seen' })}: {new Date(event.last_seen_at || event.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground">
                        <p>{t('strategies:signals.no_events')}</p>
                    </div>
                )}
            </div>
        </div >
    );
};

export default StrategySignals;
