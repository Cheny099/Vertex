import React, { useState, Component, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { adminApi, translateBackendErrorMessage } from '@/api';
import { motion, AnimatePresence } from 'framer-motion';

// Variants for consistent animations
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
} as const;

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
} as const;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { AlertCircle, TrendingUp, TrendingDown, LayoutGrid, ChevronDown, BarChart, RefreshCw, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addDays, startOfDay, endOfDay, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CodeBlock } from "@/components/ui/code-block";
import { cn } from '@/lib/utils';

// =============================================
// Error Boundary Component to catch render errors
// =============================================
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: string;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: '' };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error, errorInfo: error.message };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('OrderStats Error:', error, errorInfo);
        this.setState({ errorInfo: errorInfo?.componentStack || error.message });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 space-y-4">
                    <Card className="border-destructive bg-destructive/10 border-dashed shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2 text-xl">
                                <AlertTriangle className="h-6 w-6" />
                                {i18next.t('admin:render_error_title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm font-medium text-destructive/80 leading-relaxed">
                                {i18next.t('admin:render_error_desc')}
                            </p>
                            <div className="relative group">
                                <pre className="bg-slate-950 text-slate-100 p-4 rounded-md text-xs font-mono overflow-auto max-h-[300px] whitespace-pre-wrap border border-slate-800 shadow-inner">
                                    {this.state.error?.toString()}
                                    {'\n\n'}
                                    {this.state.errorInfo}
                                </pre>
                            </div>
                            <Button variant="destructive" onClick={() => window.location.reload()} className="w-full sm:w-auto shadow-md">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                {i18next.t('admin:refresh_page')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }
        return this.props.children;
    }
}

// Helper for safe translation (preventing Objects as children)
const safeT = (t: any, key: string, fallback?: string): string => {
    try {
        const res = t(key);
        if (typeof res === 'string') return res;
        return fallback || String(key);
    } catch {
        return fallback || String(key);
    }
};

const OrderStats = () => {
    const { t } = useTranslation(['admin', 'common']);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -7),
        to: new Date(),
    });
    const [groupBy, setGroupBy] = useState<'day' | 'user' | 'account' | 'symbol' | 'strategy' | 'subscription'>('day');
    const [exchange, setExchange] = useState('all');

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['orderTurnoverStats', dateRange, groupBy, exchange],
        queryFn: async () => {
            const res = await adminApi.stats.getOrderTurnover({
                start: dateRange?.from ? startOfDay(dateRange.from).toISOString() : undefined,
                end: dateRange?.to ? endOfDay(dateRange.to).toISOString() : undefined,
                group_by: groupBy,
                exchange: exchange === 'all' ? undefined : exchange,
            });
            // Surface schema mismatch as query error instead of pretending it's empty data.
            if (!Array.isArray(res)) throw new Error('Invalid stats payload');
            return res;
        },
        placeholderData: (previousData) => previousData,
    });
    const toErrorText = (err: any) => {
        const msg = (err as any)?.message || '';
        if (msg === 'Invalid stats payload') return t('admin:error_loading_stats');
        return translateBackendErrorMessage(msg) || msg || t('common:error');
    };

    const displayData = Array.isArray(data) ? data : [];

    // Calculate totals
    const totals = (Array.isArray(displayData) && displayData.length > 0) ? displayData.reduce((acc, row) => ({
        turnover: acc.turnover + (row.turnover_usd || 0),
        pnl: acc.pnl + (row.realized_pnl_usd_sum || 0),
        trades: acc.trades + (row.close_cnt || 0),
        wins: acc.wins + (row.win_cnt || 0),
        losses: acc.losses + (row.lose_cnt || 0),
    }), { turnover: 0, pnl: 0, trades: 0, wins: 0, losses: 0 }) : null;

    const overallWinRate = (totals && totals.trades > 0)
        ? (totals.wins / totals.trades * 100).toFixed(1)
        : '0';

    const formatUsd = (val: number | null | undefined) => {
        if (typeof val !== 'number' || isNaN(val)) return '$0.00';
        try {
            return val.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
            });
        } catch (e) {
            return '$0.00';
        }
    };

    const getGroupLabel = (row: any) => {
        switch (groupBy) {
            case 'day': return row.day || '-';
            case 'user': return row.user_id || '-';
            case 'account': return row.account_id || '-';
            case 'symbol': return row.symbol || '-';
            case 'strategy': return row.strategy_id || '-';
            case 'subscription': return row.subscription_id || '-';
            default: return '-';
        }
    };

    const renderQualityWarning = (warning: string) => {
        const w = String(warning || '');
        const coverage = w.match(/coverage\s+is\s+(\d+)\/(\d+)/i);
        if (coverage) {
            return t('admin:warnings_templates.executed_notional_coverage', {
                covered: Number(coverage[1]),
                total: Number(coverage[2]),
            });
        }

        const turboMissing = w.match(/found\s+(\d+).*(turboflow).*(null\s+tf_order_id)/i);
        if (turboMissing) {
            return t('admin:warnings_templates.turboflow_missing_id', { count: Number(turboMissing[1]) });
        }

        const nonTurboMissing = w.match(/found\s+(\d+).*(non-turboflow).*(null\s+ex_order_id)/i);
        if (nonTurboMissing) {
            return t('admin:warnings_templates.non_turboflow_missing_id', { count: Number(nonTurboMissing[1]) });
        }

        const legacyMissingExchange = w.match(/found\s+(\d+).*(null\s+exchange)/i);
        if (legacyMissingExchange) {
            return t('admin:warnings_templates.legacy_missing_exchange', { count: Number(legacyMissingExchange[1]) });
        }

        return safeT(t, `admin:kind_labels.${w}`, w);
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-4 md:p-8 space-y-6 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">{t('admin:trade_performance')}</h1>
                    <p className="text-slate-500 font-medium mt-1">{t('admin:trade_performance_desc', 'View summary and grouped turnover statistics in the selected range.')}</p>
                </div>
                <BarChart className="h-6 w-6 text-primary" />
            </motion.div>

            {/* Summary Cards */}
            {totals && (displayData.length > 0 || isLoading) ? (
                <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card className="bg-gradient-to-br from-card to-muted/20 border-primary/10 shadow-sm transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('admin:total_turnover')}</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground opacity-50" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono tracking-tight">{formatUsd(totals.turnover)}</div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                {t('admin:total_records')}: <span className="font-mono text-foreground font-bold">{displayData.length}</span>
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-card to-muted/20 border-primary/10 shadow-sm transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('admin:total_pnl')}</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground opacity-50" />
                        </CardHeader>
                        <CardContent>
                            <div className={cn(
                                "text-2xl font-bold font-mono tracking-tight",
                                (totals.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {formatUsd(totals.pnl)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('admin:realized_stats')}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-card to-muted/20 border-primary/10 shadow-sm transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('admin:total_trades')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono tracking-tight">{totals.trades || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className="text-green-600 font-bold">{totals.wins || 0}</span> {t('admin:wins_abbr')} / <span className="text-red-500 font-bold">{totals.losses || 0}</span> {t('admin:losses_abbr')}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-card to-muted/20 border-primary/10 shadow-sm transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('admin:overall_win_rate')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono tracking-tight">{overallWinRate}%</div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary"
                                        style={{ width: `${overallWinRate}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : null}

            {!totals && !isLoading && (
                <motion.div variants={itemVariants} className="bg-muted/30 border rounded-lg p-4 text-center text-sm text-muted-foreground">
                    {t('admin:no_summary_data')}
                </motion.div>
            )}

            <motion.div variants={itemVariants}>
                <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4" />
                                {t('admin:stats_breakdown')}
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                {t('admin:refresh')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="w-auto">
                                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                            </div>
                            <div className="w-[150px]">
                                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
                                    <SelectTrigger className="h-10 bg-white/80">
                                        <SelectValue placeholder={t('admin:group_by')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day">{t('admin:group_day')}</SelectItem>
                                        <SelectItem value="user">{t('admin:group_user')}</SelectItem>
                                        <SelectItem value="account">{t('admin:group_account')}</SelectItem>
                                        <SelectItem value="symbol">{t('admin:group_symbol')}</SelectItem>
                                        <SelectItem value="strategy">{t('admin:group_strategy')}</SelectItem>
                                        <SelectItem value="subscription">{t('admin:group_subscription')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-[150px]">
                                <Select value={exchange} onValueChange={setExchange}>
                                    <SelectTrigger className="h-10 bg-white/80">
                                        <SelectValue placeholder={t('admin:exchange')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('admin:status_all')}</SelectItem>
                                        <SelectItem value="binance_futures">{t('common:exchanges.binance_futures')}</SelectItem>
                                        <SelectItem value="gate_futures">{t('common:exchanges.gate_futures')}</SelectItem>
                                        <SelectItem value="week">{t('common:exchanges.week')}</SelectItem>
                                        <SelectItem value="turboflow">{t('common:exchanges.turboflow')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="rounded-md border overflow-hidden">
                            <Table className="[&_td]:py-2 [&_td]:px-3 [&_th]:py-2 [&_th]:px-3 text-xs whitespace-nowrap">
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[150px]">{t('admin:group')}</TableHead>
                                        <TableHead className="text-right w-[160px]">{t('admin:turnover')}</TableHead>
                                        <TableHead className="text-right w-[160px]">{t('admin:pnl')}</TableHead>
                                        <TableHead className="text-right w-[80px]">{t('admin:open_pos')}</TableHead>
                                        <TableHead className="text-right w-[80px]">{t('admin:flat')}</TableHead>
                                        <TableHead className="text-right w-[100px]">{t('admin:trades')}</TableHead>
                                        <TableHead className="text-right w-[100px]">{t('admin:win_rate')}</TableHead>
                                        <TableHead className="text-center w-[150px]">{t('admin:mode')}</TableHead>
                                        <TableHead className="text-center w-[120px]">{t('admin:coverage')}</TableHead>
                                        <TableHead className="text-right min-w-[120px]">{t('admin:actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isError ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-24 text-center text-destructive">
                                                <div className="flex flex-col items-center gap-2">
                                                    <AlertCircle className="h-5 w-5" />
                                                    <span>{t('admin:error_loading_stats')}</span>
                                                    <span className="text-xs opacity-70">{toErrorText(error)}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-24 text-center">
                                                {t('admin:loading')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (!Array.isArray(displayData) || displayData.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-24 text-center">
                                                {t('admin:no_data')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        displayData.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{getGroupLabel(row)}</TableCell>
                                                <TableCell className="text-right font-mono py-4">
                                                    <div className="flex flex-col items-end">
                                                        <span>{formatUsd(row.turnover_usd)}</span>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex items-center gap-1.5 mt-1 cursor-help">
                                                                        <div className="flex h-1 w-20 bg-muted rounded-full overflow-hidden">
                                                                            <div
                                                                                className="h-full bg-emerald-500"
                                                                                style={{ width: `${(row.turnover_usd_executed_notional / (row.turnover_usd || 1)) * 100}%` }}
                                                                            />
                                                                            <div
                                                                                className="h-full bg-amber-400"
                                                                                style={{ width: `${(row.turnover_usd_fallback / (row.turnover_usd || 1)) * 100}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-xs text-muted-foreground leading-none font-bold">
                                                                            {((row.turnover_usd_executed_notional / (row.turnover_usd || 1)) * 100).toFixed(0)}%
                                                                        </span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                                                                    <p className="font-bold mb-1">{t('admin:fidelity_breakdown')}</p>
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-1">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                            <span>{t('admin:fidelity_executed')}: {((row.turnover_usd_executed_notional / (row.turnover_usd || 1)) * 100).toFixed(1)}%</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                                            <span>{t('admin:fidelity_fallback')}: {((row.turnover_usd_fallback / (row.turnover_usd || 1)) * 100).toFixed(1)}%</span>
                                                                        </div>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </TableCell>
                                                <TableCell className={`text-right font-mono py-4 ${(row.realized_pnl_usd_sum || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatUsd(row.realized_pnl_usd_sum)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono py-4">
                                                    <span className="text-blue-600 font-bold">{row.open_cnt || 0}</span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono py-4 text-muted-foreground">
                                                    {row.flat_cnt || 0}
                                                </TableCell>
                                                <TableCell className="text-right font-mono py-4">
                                                    <div className="flex flex-col items-end">
                                                        <span>{row.close_cnt || 0}</span>
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                            {row.win_cnt || 0}{t('admin:wins_abbr')} / {row.lose_cnt || 0}{t('admin:losses_abbr')}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono py-4">
                                                    {(row.close_cnt || 0) > 0 ? (
                                                        <span>{((row.win_rate || 0) * 100).toFixed(1)}%</span>
                                                    ) : (
                                                        <span className="text-muted-foreground/40">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center py-4">
                                                    {row.turnover_mode && (
                                                        <span className="text-xs px-3 py-1 rounded-sm bg-muted text-muted-foreground uppercase font-bold tracking-tighter transition-colors select-none whitespace-nowrap">
                                                            {safeT(t, `admin:turnover_mode_${row.turnover_mode}`)}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center py-4">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-xs font-mono font-bold leading-none">{((row.executed_notional_covered?.pct || 0)).toFixed(0)}%</span>
                                                            <span className="text-xs text-muted-foreground font-mono leading-none">
                                                                ({row.executed_notional_covered?.covered}/{row.executed_notional_covered?.total})
                                                            </span>
                                                        </div>
                                                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary"
                                                                style={{ width: `${row.executed_notional_covered?.pct || 0}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-4">
                                                    {row.quality_warnings && row.quality_warnings.length > 0 && (
                                                        <Collapsible>
                                                            <CollapsibleTrigger className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-colors group">
                                                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                                                <span className="text-xs font-bold leading-none">
                                                                    {t('admin:warnings_count', { count: row.quality_warnings.length })}
                                                                </span>
                                                                <ChevronDown className="h-3 w-3 opacity-50 group-data-[state=open]:rotate-180 transition-transform" />
                                                            </CollapsibleTrigger>
                                                            <CollapsibleContent className="text-xs text-amber-600 mt-2 bg-amber-50/50 p-2 rounded border border-dashed border-amber-200 shadow-inner max-w-[400px]">
                                                                <ul className="text-right list-none space-y-2">
                                                                    {Array.isArray(row.quality_warnings) && row.quality_warnings.map((w: string, i: number) => (
                                                                        <li key={i} className="flex items-start justify-end gap-1.5 leading-relaxed">
                                                                            <span className="text-right">{renderQualityWarning(w)}</span>
                                                                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </CollapsibleContent>
                                                        </Collapsible>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
};

const OrderStatsWrapper = () => (
    <ErrorBoundary>
        <OrderStats />
    </ErrorBoundary>
);

export default OrderStatsWrapper;
