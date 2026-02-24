import { useState, Component, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/api';
import { motion, AnimatePresence } from 'framer-motion';

// Variants for consistent animations
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    }
} as const;

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 120,
            damping: 18
        }
    }
} as const;
import type { AuditRunResponse, AuditItem } from '@/api';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Play, RefreshCw, Eye, ChevronRight, AlertTriangle, CheckCircle, XCircle,
    Info, Activity, History, Search, Filter, Database, Globe, Zap,
    FileText, Copy, ArrowRight, Layers, Coins, FileWarning, ShieldAlert,
    User, Hash, Flag, FileJson
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
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
        console.error('TurboFlowAudit Error:', error, errorInfo);
        this.setState({ errorInfo: errorInfo?.componentStack || error.message });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 space-y-4">
                    <Card className="border-destructive bg-destructive/10">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                页面渲染错误 (Render Error)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                页面遇到了一个渲染错误，请将以下信息反馈给开发者：
                            </p>
                            <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-[300px] whitespace-pre-wrap">
                                {this.state.error?.toString()}
                                {'\n\n'}
                                {this.state.errorInfo}
                            </pre>
                            <Button onClick={() => window.location.reload()}>
                                刷新页面
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }
        return this.props.children;
    }
}

// Helper for extreme safety in date formatting
const formatSecure = (dateValue: any, fmt: string) => {
    if (!dateValue) return '-';
    try {
        const d = new Date(dateValue);
        if (isNaN(d.getTime())) return '-';
        return format(d, fmt);
    } catch (e) {
        return '-';
    }
};

// =============================================
// Dashboard Order & Kind Mapping
// =============================================
const SUMMARY_ORDER = [
    // 1st Tier: Basic Info
    'mode',
    'accounts_scanned',
    'orders_scanned',
    'items_total',
    // 2nd Tier: Missing Data
    'local_not_found_count',
    'completed_missing_tf_order_id_count',
    'external_missing_local',
    'legacy_missing_exchange',
    // 3rd Tier: Quality Issues
    'completed_no_exec_price',
    'close_no_pnl',
    // 4th Tier: Discrepancies & Recovered
    'status_mismatch_count',
    'mismatch_notional_count',
    'backfilled_orders_count',
    'backfilled_notional_count',
];

// Maps summary keys to AuditItemKind for filtering
const SUMMARY_KIND_MAP: Record<string, string> = {
    'local_not_found': 'LOCAL_NOT_FOUND_IN_ORDER_LIST',
    'local_not_found_count': 'LOCAL_NOT_FOUND_IN_ORDER_LIST',
    'completed_missing_tf_order_id': 'LOCAL_COMPLETED_MISSING_TF_ORDER_ID',
    'completed_missing_tf_order_id_count': 'LOCAL_COMPLETED_MISSING_TF_ORDER_ID',
    'external_missing_local': 'EXTERNAL_MISSING_LOCAL',
    'completed_no_exec_price': 'COMPLETED_NO_EXEC_PRICE',
    'close_no_pnl': 'CLOSE_NO_PNL',
    'status_mismatch': 'STATUS_MISMATCH',
    'status_mismatch_count': 'STATUS_MISMATCH',
    'mismatch_notional': 'NOTIONAL_MISMATCH',
    'mismatch_notional_count': 'NOTIONAL_MISMATCH',
    'backfilled_orders_count': 'FIELDS_BACKFILLED',
    'backfilled_notional_count': 'FIELDS_BACKFILLED',
    'legacy_missing_exchange': 'LEGACY_MISSING_EXCHANGE',
};


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

function TurboFlowAuditContent() {
    const { t } = useTranslation(['admin', 'common']);
    const queryClient = useQueryClient();


    // Run params
    const [lookbackDays, setLookbackDays] = useState(7);
    const [mode, setMode] = useState<'local_only' | 'full'>('local_only');
    const [scope, setScope] = useState<'users' | 'exchanges'>('users');
    const [dryRun, setDryRun] = useState(false);

    // Selected run for detail view
    const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
    const [kindFilter, setKindFilter] = useState<string>('');
    const [clickedKey, setClickedKey] = useState<string | null>(null);
    const [severityFilter, setSeverityFilter] = useState<string>('all');

    // List runs
    const { data: runsData, isLoading: runsLoading, refetch: refetchRuns } = useQuery({
        queryKey: ['auditRuns'],
        queryFn: async () => adminApi.auditTurboflow.listRuns({ limit: 50 }),
    });

    // Run detail
    const { data: runDetail, isLoading: detailLoading } = useQuery({
        queryKey: ['auditRunDetail', selectedRunId],
        queryFn: async () => adminApi.auditTurboflow.getRun(selectedRunId!),
        enabled: !!selectedRunId,
    });

    // Run items
    const { data: itemsData, isLoading: itemsLoading } = useQuery({
        queryKey: ['auditRunItems', selectedRunId, kindFilter, severityFilter],
        queryFn: async () => adminApi.auditTurboflow.getRunItems(selectedRunId!, {
            kind: kindFilter || undefined,
            severity: severityFilter || undefined,
            limit: 100,
        }),
        enabled: !!selectedRunId,
    });

    // Start audit mutation
    const runMutation = useMutation({
        mutationFn: () => adminApi.auditTurboflow.run({
            lookback_days: lookbackDays,
            mode,
            scope,
            dry_run: dryRun,
        }),
        onSuccess: (data) => {
            toast.success(safeT(t, 'admin:audit_started', `Run #${data.id} started`).replace('{{id}}', String(data.id)));
            refetchRuns();
            setSelectedRunId(data.id);
        },
        onError: (err: any) => {
            toast.error(err.message || safeT(t, 'admin:audit_failed'));
        },
    });

    const getStatusVariant = (status?: any) => {
        if (!status || typeof status !== 'string') return 'secondary';
        const s = status.toLowerCase();
        if (s === 'success' || s === 'completed') return 'default';
        if (s === 'failed' || s === 'error') return 'destructive';
        if (s === 'running') return 'outline';
        return 'secondary';
    };

    const getStatusLabel = (status?: any) => {
        if (!status || typeof status !== 'string') return '-';
        const s = status.toLowerCase();
        if (s === 'success' || s === 'completed') return safeT(t, 'admin:status_completed');
        if (s === 'failed' || s === 'error') return safeT(t, 'admin:status_failed');
        if (s === 'running') return safeT(t, 'admin:status_running');
        return status;
    };

    const getSeverityIcon = (severity?: any) => {
        if (!severity || typeof severity !== 'string') return <Info className="h-4 w-4 text-muted-foreground" />;
        const s = severity.toUpperCase();
        switch (s) {
            case 'ERROR': return <AlertTriangle className="h-4 w-4 text-destructive" />;
            case 'WARN':
            case 'WARNING': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const getSeverityBadge = (severity?: any) => {
        if (!severity || typeof severity !== 'string') return 'secondary';
        const s = severity.toUpperCase();
        switch (s) {
            case 'ERROR': return 'destructive';
            case 'WARN':
            case 'WARNING': return 'secondary';
            default: return 'outline';
        }
    };

    const getKindStyling = (kind: string) => {
        const k = String(kind).toUpperCase();
        if (k.includes('BACKFILLED')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        if (k.includes('MISMATCH')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        if (k.includes('NOT_FOUND')) return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
        if (k.includes('MISSING')) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6 p-4 md:p-8 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white"
        >
            <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tight text-slate-900">{t('admin:trade_audit')}</h1>
                <p className="text-slate-500 font-medium">{t('admin:trade_audit_desc')}</p>
            </motion.div>

            {/* Run Control */}
            <motion.div variants={itemVariants}>
                <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
                    <CardHeader className="pb-3">
                        <CardTitle>{t('admin:start_audit')}</CardTitle>
                        <CardDescription>{t('admin:start_audit_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('admin:lookback_days')}</label>
                                <Input
                                    type="number"
                                    value={lookbackDays}
                                    onChange={(e) => setLookbackDays(Number(e.target.value))}
                                    className="w-24 border-border/50"
                                    min={1}
                                    max={30}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('admin:audit_mode')}</label>
                                <Select value={mode} onValueChange={(v) => setMode(v as 'local_only' | 'full')}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="local_only">{t('admin:mode_local_only')}</SelectItem>
                                        <SelectItem value="full">{t('admin:mode_full')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('admin:audit_scope')}</label>
                                <Select value={scope} onValueChange={(v) => setScope(v as 'users' | 'exchanges')}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="users">{t('admin:scope_users')}</SelectItem>
                                        <SelectItem value="exchanges">{t('admin:scope_exchanges')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="dryRun"
                                    checked={dryRun}
                                    onChange={(e) => setDryRun(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <label htmlFor="dryRun" className="text-sm">{t('admin:dry_run')}</label>
                            </div>
                            <Button onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
                                <Play className="mr-2 h-4 w-4" />
                                {runMutation.isPending ? t('admin:running') : t('admin:run_audit')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 border-none shadow-md bg-card/60 backdrop-blur-sm">
                    <CardHeader className="pb-3 border-b border-border/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">{t('admin:audit_runs')}</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => refetchRuns()} className="hover:rotate-180 transition-transform duration-500">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[600px]">
                            {runsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                                    <Activity className="h-8 w-8 animate-pulse text-primary/40" />
                                    <span className="text-sm font-medium animate-pulse">{t('admin:loading')}</span>
                                </div>
                            ) : (runsData?.items?.length ?? 0) === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 opacity-60">
                                    <Layers className="h-10 w-10 text-muted-foreground/20" />
                                    <span className="text-sm">{t('admin:no_runs')}</span>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/30">
                                    {Array.isArray(runsData?.items) ? runsData.items.filter(Boolean).map((run) => {
                                        // Calculate brief stats for the card
                                        const s = run.summary as any;
                                        const errCount = s?.error || s?.ERROR || 0;
                                        const warnCount = (s?.warning || s?.WARN || s?.WARNING || 0);

                                        return (
                                            <div
                                                key={String(run.id)}
                                                onClick={() => setSelectedRunId(run.id)}
                                                className={cn(
                                                    "group p-4 cursor-pointer transition-all relative overflow-hidden",
                                                    selectedRunId === run.id
                                                        ? 'bg-primary/5'
                                                        : 'hover:bg-muted/30'
                                                )}
                                            >
                                                {selectedRunId === run.id && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                                )}

                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-sm font-bold text-primary">#{String(run.id)}</span>
                                                        <Badge
                                                            variant={getStatusVariant(run.status)}
                                                            className={cn(
                                                                "text-[10px] uppercase font-bold px-1.5 py-0",
                                                                run.status === 'running' && "animate-pulse"
                                                            )}
                                                        >
                                                            {getStatusLabel(run.status)}
                                                        </Badge>
                                                    </div>
                                                    <ChevronRight className={cn(
                                                        "h-4 w-4 transition-transform text-muted-foreground/50",
                                                        selectedRunId === run.id ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                                                    )} />
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                                    <Globe className="h-3 w-3" />
                                                    {formatSecure(run.started_at, 'MM-dd HH:mm:ss')}
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge variant="outline" className="text-[10px] bg-background/50 border-border/50 text-muted-foreground">
                                                            {(run.params as any)?.mode === 'full' ? <Zap className="h-2.5 w-2.5 mr-1 text-amber-500" /> : <Layers className="h-2.5 w-2.5 mr-1 text-blue-500" />}
                                                            {safeT(t, (run.params as any)?.mode === 'full' ? 'admin:mode_full' : 'admin:mode_local_only')}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {Number(errCount) > 0 && (
                                                            <div className="flex items-center gap-1 text-[11px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                                                <AlertTriangle className="h-3 w-3" />
                                                                {String(errCount)}
                                                            </div>
                                                        )}
                                                        {Number(warnCount) > 0 && (
                                                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                                                <AlertTriangle className="h-3 w-3" />
                                                                {String(warnCount)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }) : null}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-none shadow-md bg-card/60 backdrop-blur-sm flex flex-col">
                    <CardHeader className="pb-3 border-b border-border/50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                {selectedRunId ? t('admin:run_detail', { id: selectedRunId }) : t('admin:select_run')}
                            </CardTitle>
                            {selectedRunId && (
                                <Badge variant="outline" className="font-mono text-[10px] bg-muted/50">
                                    ID: {String(selectedRunId)}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-6">
                        {!selectedRunId ? (
                            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground gap-4">
                                <div className="p-4 rounded-full bg-muted/30">
                                    <Search className="h-10 w-10 text-muted-foreground/30" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="font-semibold text-lg">{t('admin:select_run')}</p>
                                    <p className="text-sm opacity-60">{t('admin:select_run_to_view')}</p>
                                </div>
                            </div>
                        ) : detailLoading ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-3">
                                <Activity className="h-8 w-8 animate-spin text-primary" />
                                <span className="text-sm font-medium animate-pulse">{t('admin:loading')}</span>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* Extended Stats Context */}
                                {runDetail && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Backfill Progress Card */}
                                        {(runDetail.summary?.backfill || (runDetail.summary as any)?.backfill_enabled !== undefined) && (
                                            <Card className="bg-emerald-500/5 border-emerald-500/10 shadow-sm overflow-hidden border-l-4 border-l-emerald-500">
                                                <CardHeader className="pb-2 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                                                    <div className="flex items-center gap-2">
                                                        <RefreshCw className={cn("h-4 w-4 text-emerald-600", runDetail.summary?.backfill?.status === 'running' && "animate-spin")} />
                                                        <CardTitle className="text-sm font-bold text-emerald-800 uppercase tracking-wider">{t('admin:backfill_status')}</CardTitle>
                                                    </div>
                                                    <Badge variant="outline" className={cn(
                                                        "px-2 py-0.5",
                                                        (runDetail.summary?.backfill?.status === 'enabled' || (runDetail.summary as any)?.backfill_enabled) ? "bg-emerald-100/50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground border-border"
                                                    )}>
                                                        {(runDetail.summary?.backfill?.status === 'enabled' || (runDetail.summary as any)?.backfill_enabled) ? t('admin:enabled') : t('admin:disabled')}
                                                    </Badge>
                                                </CardHeader>
                                                <CardContent className="px-4 pb-3">
                                                    <div className="flex justify-between items-end mb-3">
                                                        <div className="space-y-1">
                                                            <div className="text-xs text-emerald-600/70 font-bold uppercase tracking-widest">{t('admin:total_backfilled')}</div>
                                                            <div className="text-2xl font-black text-emerald-700 tracking-tighter">
                                                                {runDetail.summary?.backfill?.total_backfilled || (runDetail.summary as any)?.fields_updated || 0}
                                                            </div>
                                                        </div>
                                                        <div className="text-right space-y-1">
                                                            <div className="text-[10px] text-destructive font-bold uppercase tracking-widest">{t('admin:failed')}</div>
                                                            <div className="text-lg font-black text-destructive tracking-tighter">
                                                                {runDetail.summary?.backfill?.total_failed || (runDetail.summary as any)?.query_failed || 0}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Config Snapshot */}
                                                    <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] uppercase font-bold text-emerald-600/60 leading-none mb-1">{t('admin:lookback_days')}</span>
                                                            <span className="text-xs font-mono font-bold text-emerald-700">{(runDetail.summary as any)?.backfill_lookback_days || (runDetail.params as any)?.lookback_days || '-'} d</span>
                                                        </div>
                                                        <div className="flex flex-col border-l border-emerald-500/10 pl-2">
                                                            <span className="text-[8px] uppercase font-bold text-emerald-600/60 leading-none mb-1">{t('admin:limit_count')}</span>
                                                            <span className="text-xs font-mono font-bold text-emerald-700">{(runDetail.summary as any)?.backfill_limit || '-'} items</span>
                                                        </div>
                                                    </div>

                                                    {!(runDetail.summary?.backfill?.status === 'enabled' || (runDetail.summary as any)?.backfill_enabled) && (
                                                        <div className="mt-2 text-[10px] text-amber-600 font-medium flex items-center gap-1 opacity-80">
                                                            <Info className="h-3 w-3" />
                                                            {t('admin:stats_only_no_backfill_hint')}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )}
                                        {/* Run Scope Info */}
                                        <div className="flex flex-col justify-center p-4 rounded-3xl bg-primary/5 border border-primary/10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    {runDetail.scope === 'exchanges' ? <Globe className="h-4 w-4 text-primary" /> : <Layers className="h-4 w-4 text-primary" />}
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-tight">{t('admin:audit_scope')}</div>
                                                    <div className="text-sm font-bold text-primary capitalize">{t(`admin:scope_${runDetail.scope || 'users'}`)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Exchange Stats Matrix */}
                                {runDetail?.summary?.stats_by_exchange && Object.keys(runDetail.summary.stats_by_exchange).length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
                                            <Database className="h-3.5 w-3.5" />
                                            <span>{t('admin:stats_by_exchange')}</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {Object.entries(runDetail.summary.stats_by_exchange).map(([ex, stats]: [string, any]) => (
                                                <div key={ex} className="p-4 rounded-3xl bg-white border border-border/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <Badge className="bg-slate-900 border-none px-3 py-1 rounded-full uppercase text-[10px] font-black tracking-widest">
                                                            {ex}
                                                        </Badge>
                                                        <div className="text-[10px] font-bold text-muted-foreground opacity-60">EXCHANGE_NODE</div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="space-y-0.5">
                                                            <div className="text-[8px] font-black text-muted-foreground leading-tight">{t('admin:scanned')}</div>
                                                            <div className="text-sm font-bold">{stats.scanned || stats.total || 0}</div>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <div className="text-[8px] font-black text-emerald-600 leading-tight">{t('admin:updated')}</div>
                                                            <div className="text-sm font-bold text-emerald-700">{stats.updated || 0}</div>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <div className="text-[8px] font-black text-destructive leading-tight">{t('admin:failed')}</div>
                                                            <div className="text-sm font-bold text-destructive">{stats.failed || stats.query_failed || 0}</div>
                                                        </div>
                                                    </div>

                                                    {/* Missing Fields Breakdown */}
                                                    <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-2 gap-x-4 gap-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[8px] font-bold text-muted-foreground">{t('admin:completed_missing_external_id')}</span>
                                                            <span className={cn("text-xs font-mono font-bold", (stats.completed_missing_external_id || stats.completed_missing_tf_order_id) > 0 ? "text-amber-600" : "text-muted-foreground/40")}>
                                                                {stats.completed_missing_external_id || stats.completed_missing_tf_order_id || 0}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[8px] font-bold text-muted-foreground">{t('admin:completed_missing_price')}</span>
                                                            <span className={cn("text-xs font-mono font-bold", stats.completed_missing_price > 0 ? "text-amber-600" : "text-muted-foreground/40")}>
                                                                {stats.completed_missing_price || 0}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[8px] font-bold text-muted-foreground">{t('admin:completed_missing_notional')}</span>
                                                            <span className={cn("text-xs font-mono font-bold", stats.completed_missing_notional > 0 ? "text-amber-600" : "text-muted-foreground/40")}>
                                                                {stats.completed_missing_notional || 0}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[8px] font-bold text-muted-foreground">{t('admin:completed_missing_executed_at')}</span>
                                                            <span className={cn("text-xs font-mono font-bold", stats.completed_missing_executed_at > 0 ? "text-amber-600" : "text-muted-foreground/40")}>
                                                                {stats.completed_missing_executed_at || 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Dashboard Grid */}
                                {runDetail?.summary && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {SUMMARY_ORDER.map((key) => {
                                            const summary = runDetail.summary as any;
                                            let count = summary[key];

                                            const displayKey = String(key).replace('_count', '').toLowerCase();

                                            // Fallback: If direct key is missing, look into items_by_kind
                                            if (count === undefined || count === null) {
                                                const kind = SUMMARY_KIND_MAP[key];
                                                if (kind && summary.items_by_kind) {
                                                    count = summary.items_by_kind[kind] || 0;
                                                } else {
                                                    return null;
                                                }
                                            }

                                            const isError = displayKey.includes('error') || displayKey.includes('not_found') || displayKey.includes('missing');
                                            const isWarn = displayKey.includes('warn') || displayKey.includes('mismatch') || displayKey.includes('backfilled');
                                            const isPrimary = displayKey.includes('total') || displayKey.includes('scanned');

                                            // Determine if this card is "filterable" (represents a Kind)
                                            const filterKind = SUMMARY_KIND_MAP[key];
                                            const isSameKind = filterKind && kindFilter === filterKind;
                                            const isClicked = clickedKey === key;
                                            const isActive = isClicked; // Only the clicked one is "Primarily Active"
                                            const isRelated = isSameKind && !isClicked; // Related cards of the same kind

                                            const isAmount = displayKey.includes('notional');

                                            return (
                                                <div
                                                    key={key}
                                                    onClick={() => {
                                                        // Only allow filtering for certain categories
                                                        if (filterKind) {
                                                            if (isClicked) {
                                                                setKindFilter('');
                                                                setClickedKey(null);
                                                            } else {
                                                                setKindFilter(filterKind);
                                                                setClickedKey(key);
                                                            }
                                                        }
                                                    }}
                                                    className={cn(
                                                        "p-3 rounded-xl border bg-background/40 transition-all duration-300",
                                                        filterKind ? "cursor-pointer hover:shadow-md hover:-translate-y-1" : "cursor-default",
                                                        isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary bg-primary/5 shadow-lg shadow-primary/10" :
                                                            isRelated ? "border-primary/30 bg-primary/[0.02]" :
                                                                isError ? "border-destructive/20 hover:bg-destructive/5" :
                                                                    isWarn ? "border-amber-500/20 hover:bg-amber-50" :
                                                                        "border-border/50 hover:bg-primary/5"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
                                                        {isActive && !isAmount ? <Zap className="h-3.5 w-3.5 text-primary animate-bounce" /> :
                                                            isRelated && !isAmount ? <Zap className="h-3.5 w-3.5 text-primary/40" /> :
                                                                isAmount ? <Coins className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-blue-500")} /> :
                                                                    isError ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> :
                                                                        isWarn ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> :
                                                                            <CheckCircle className="h-3.5 w-3.5 text-blue-500" />}
                                                        <span className={cn(
                                                            "text-[9px] uppercase font-bold tracking-wider truncate",
                                                            isActive ? "text-primary" : "text-muted-foreground"
                                                        )}>
                                                            {safeT(t, `admin:summary_${key}`, displayKey)}
                                                        </span>
                                                    </div>
                                                    <div className={cn(
                                                        "text-xl font-black tracking-tighter truncate",
                                                        isActive || isRelated ? "text-primary" :
                                                            isError ? "text-destructive" :
                                                                isWarn ? "text-amber-600" : "text-foreground"
                                                    )}>
                                                        {displayKey === 'mode'
                                                            ? safeT(t, `admin:mode_${count}`, String(count))
                                                            : String(count)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Filter Bar */}
                                <div className="flex flex-wrap gap-3 items-center p-3 rounded-lg bg-muted/20 border border-border/50">
                                    <div className="flex items-center gap-2 mr-2">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('admin:filter_data')}</span>
                                    </div>
                                    <div className="relative flex-1 min-w-[200px]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                        <Input
                                            placeholder={t('admin:filter_kind')}
                                            value={(() => {
                                                if (!kindFilter) return "";
                                                const translated = t(`admin:kind_labels.${kindFilter}`);
                                                // If translation returns the key itself, it's either missing or kindFilter IS the translated text
                                                return (translated && translated !== `admin:kind_labels.${kindFilter}`) ? translated : kindFilter;
                                            })()}
                                            onChange={(e) => setKindFilter(e.target.value)}
                                            className="h-9 pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/20 transition-all font-medium"
                                        />
                                        {kindFilter && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-50 hover:opacity-100"
                                                onClick={() => setKindFilter('')}
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select value={severityFilter || 'all'} onValueChange={(v) => setSeverityFilter(v === 'all' ? '' : v)}>
                                            <SelectTrigger className="h-9 w-[120px] bg-background/50 border-border/50">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        !severityFilter ? "bg-muted-foreground/30" :
                                                            severityFilter === 'error' ? "bg-destructive" :
                                                                severityFilter === 'warning' ? "bg-amber-500" : "bg-blue-500"
                                                    )} />
                                                    <SelectValue placeholder={t('admin:severity')} />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="backdrop-blur-md">
                                                <SelectItem value="all">{t('admin:severity_all')}</SelectItem>
                                                <SelectItem value="info">{t('admin:severity_info')}</SelectItem>
                                                <SelectItem value="warning">{t('admin:severity_warning')}</SelectItem>
                                                <SelectItem value="error">{t('admin:severity_error')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 bg-background/50 border-border/50"
                                            onClick={() => { setKindFilter(''); setSeverityFilter(''); }}
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="hover:bg-transparent border-border/50">
                                                <TableHead className="w-24 pl-6">{t('admin:severity')}</TableHead>
                                                <TableHead>{t('admin:kind')}</TableHead>
                                                <TableHead>{t('admin:account')}</TableHead>
                                                <TableHead>{t('admin:order')}</TableHead>
                                                <TableHead className="w-20 text-right pr-6">{t('admin:detail')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(() => {
                                                if (itemsLoading) {
                                                    return (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="h-32 text-center">
                                                                <div className="flex flex-col items-center gap-2 opacity-50">
                                                                    <Activity className="h-6 w-6 animate-spin" />
                                                                    <span className="text-xs font-medium">{t('admin:loading')}</span>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }

                                                const items = itemsData?.items;
                                                if (!Array.isArray(items) || items.length === 0) {
                                                    return (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="h-32 text-center">
                                                                <div className="flex flex-col items-center gap-2 opacity-30">
                                                                    <Layers className="h-8 w-8" />
                                                                    <span className="text-sm font-medium">{t('admin:no_items')}</span>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }

                                                return items.filter(Boolean).map((item) => {
                                                    const isError = item.severity === 'error';
                                                    const isWarn = item.severity === 'warning';

                                                    return (
                                                        <TableRow
                                                            key={String(item.id)}
                                                            className={cn(
                                                                "group transition-colors border-border/30",
                                                                isError ? "hover:bg-destructive/[0.03]" :
                                                                    isWarn ? "hover:bg-amber-50" : "hover:bg-primary/[0.02]"
                                                            )}
                                                        >
                                                            <TableCell className="pl-6">
                                                                <div className="flex items-center gap-2">
                                                                    {getSeverityIcon(item.severity)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "text-[10px] font-black tracking-tight px-2 py-0.5 border shadow-sm",
                                                                        getKindStyling(item.kind)
                                                                    )}
                                                                >
                                                                    {safeT(t, `admin:kind_labels.${item.kind}`, String(item.kind))}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1.5 font-mono text-xs bg-muted/30 w-fit px-2 py-1 rounded border border-border/30 text-muted-foreground group-hover:text-primary transition-colors">
                                                                    <Database className="h-3 w-3 opacity-50" />
                                                                    {String(item.account_id || '-')}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1.5 font-mono text-xs bg-muted/30 w-fit px-2 py-1 rounded border border-border/30 text-muted-foreground group-hover:text-primary transition-colors">
                                                                    <Search className="h-3 w-3 opacity-50" />
                                                                    {String(item.order_id || '-')}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6">
                                                                <Dialog>
                                                                    <DialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon">
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="max-w-2xl border-none shadow-2xl bg-card/95 backdrop-blur-md p-0 overflow-hidden">
                                                                        <DialogHeader className="p-6 bg-muted/30 border-b border-border/50">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={cn(
                                                                                    "p-2 rounded-lg",
                                                                                    isError ? "bg-destructive/10 text-destructive" :
                                                                                        isWarn ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
                                                                                )}>
                                                                                    {getSeverityIcon(item.severity)}
                                                                                </div>
                                                                                <div>
                                                                                    <DialogTitle className="text-xl font-bold">
                                                                                        {safeT(t, `admin:kind_labels.${item.kind}`, String(item.kind))}
                                                                                    </DialogTitle>
                                                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mt-0.5">
                                                                                        <span>{t('admin:audit_detail_panel')} • ID {String(item.id)}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </DialogHeader>
                                                                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                                                            {/* Consolidated Advice/Diagnosis Header */}
                                                                            {item.detail?.advice && (
                                                                                <div className="p-4 rounded-2xl bg-primary/[0.03] border border-dashed border-primary/20 flex items-start gap-4 shadow-inner group transition-all hover:bg-primary/[0.05]">
                                                                                    <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                                                                                        <ShieldAlert className="h-5 w-5" />
                                                                                    </div>
                                                                                    <div className="text-xs space-y-1.5 flex-1">
                                                                                        <div className="flex items-center justify-between">
                                                                                            <span className="font-black text-primary uppercase tracking-widest text-[9px] opacity-70">{t('admin:audit_advice')}</span>
                                                                                            <Badge variant="outline" className="text-[8px] h-4 px-1.5 opacity-40 border-primary/20 pointer-events-none uppercase font-bold">Recommended Action</Badge>
                                                                                        </div>
                                                                                        <p className="leading-relaxed font-bold text-slate-700 italic">"{item.detail.advice}"</p>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Structured Comparison View */}
                                                                            {(() => {
                                                                                if (item.kind === 'STATUS_MISMATCH' && item.detail) {
                                                                                    return (
                                                                                        <div className="space-y-4">
                                                                                            <div className="flex items-center gap-2 text-sm font-bold text-amber-600">
                                                                                                <div className="p-1.5 rounded-lg bg-amber-500/10">
                                                                                                    <RefreshCw className="h-4 w-4" />
                                                                                                </div>
                                                                                                <span>{t('admin:status_comparison')}</span>
                                                                                            </div>
                                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                                <div className="p-5 rounded-2xl bg-muted/20 border border-border/50 flex flex-col items-center justify-center gap-3 relative group transition-all hover:bg-muted/30">
                                                                                                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t('admin:local')}</span>
                                                                                                    <Badge variant="outline" className="text-sm font-black border-amber-500/30 text-amber-700 bg-amber-50 px-6 py-1 shadow-sm uppercase tracking-tighter">
                                                                                                        {safeT(t, `admin:status_labels.${item.detail.local_status}`, String(item.detail.local_status || '-'))}
                                                                                                    </Badge>
                                                                                                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 hidden sm:block">
                                                                                                        <div className="p-1 rounded-full bg-background border border-border shadow-sm">
                                                                                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col items-center justify-center gap-3 relative shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                                                                                    <div className="flex items-center gap-1.5">
                                                                                                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t('admin:remote')}</span>
                                                                                                        <Badge variant="default" className="h-4 px-1 text-[8px] font-black uppercase bg-amber-500 text-white">{t('admin:truth')}</Badge>
                                                                                                    </div>
                                                                                                    <Badge variant="default" className="text-sm font-black bg-amber-500 px-6 py-1 shadow-md uppercase tracking-tighter ring-4 ring-amber-500/10">
                                                                                                        {safeT(t, `admin:status_labels.${item.detail.tf_order_status}`, String(item.detail.tf_order_status || '-'))}
                                                                                                    </Badge>
                                                                                                </div>
                                                                                            </div>

                                                                                            {Array.isArray((item.detail as any).expected_local_statuses) && (
                                                                                                <div className="p-4 rounded-xl bg-white/40 border border-dashed border-border flex flex-col gap-3">
                                                                                                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                                                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                                                                                        <span>{t('admin:expected_statuses')}</span>
                                                                                                    </div>
                                                                                                    <div className="flex flex-wrap gap-2">
                                                                                                        {(item.detail as any).expected_local_statuses.map((s: string) => (
                                                                                                            <Badge key={s} variant="secondary" className="text-[10px] font-bold bg-background/80 text-muted-foreground border-border/50 px-2.5">
                                                                                                                {safeT(t, `admin:status_labels.${s}`, s)}
                                                                                                            </Badge>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                }

                                                                                if (item.kind === 'NOTIONAL_MISMATCH' && item.detail) {
                                                                                    const isMissingRemote = !item.detail.tf_expected_notional || Number(item.detail.tf_expected_notional) === 0;
                                                                                    return (
                                                                                        <div className="space-y-4">
                                                                                            <div className="flex items-center justify-between gap-2 text-sm font-bold text-blue-600">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div className="p-1.5 rounded-lg bg-blue-500/10">
                                                                                                        <Coins className="h-4 w-4" />
                                                                                                    </div>
                                                                                                    <span>{t('admin:amount_comparison')}</span>
                                                                                                </div>
                                                                                                <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                                                                                                    {t('admin:tolerance_hint', { abs: '1.0', rel: '0.01' })}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="grid grid-cols-3 items-stretch gap-0 p-1 rounded-2xl bg-muted/20 border border-border/50 overflow-hidden">
                                                                                                <div className="flex flex-col items-center justify-center gap-1 py-4 px-2 hover:bg-background/40 transition-colors">
                                                                                                    <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">{t('admin:local')}</span>
                                                                                                    <span className="font-mono text-sm font-black text-emerald-600">
                                                                                                        ${Number(item.detail.local_notional || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div className="flex flex-col items-center justify-center gap-1 py-4 px-2 bg-background/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] border-x border-border/50 relative">
                                                                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                                                                                        <Badge variant="destructive" className="text-[8px] font-black h-4 px-1 rounded-sm shadow-sm">{t('admin:difference')}</Badge>
                                                                                                    </div>
                                                                                                    <span className="font-mono text-sm font-black text-destructive">
                                                                                                        -${Number(item.detail.abs_diff || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                                    </span>
                                                                                                    <span className="text-[8px] font-bold text-destructive/40 uppercase">Mismatch</span>
                                                                                                </div>
                                                                                                <div className="flex flex-col items-center justify-center gap-1 py-4 px-2 hover:bg-background/40 transition-colors relative">
                                                                                                    <div className="absolute top-0 right-2 -translate-y-1/2">
                                                                                                        <Badge variant="outline" className="text-[8px] font-black h-4 px-1 border-primary/30 text-primary bg-primary/5">{t('admin:truth')}</Badge>
                                                                                                    </div>
                                                                                                    <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">{t('admin:remote')}</span>
                                                                                                    {isMissingRemote ? (
                                                                                                        <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-500/5 border-amber-500/10 py-0 animate-pulse">
                                                                                                            {t('admin:unknown')}
                                                                                                        </Badge>
                                                                                                    ) : (
                                                                                                        <span className="font-mono text-sm font-black text-primary">
                                                                                                            ${Number(item.detail.tf_expected_notional || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                                <div className="p-3 rounded-xl bg-white/40 border border-border/40 shadow-sm flex items-center justify-between">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <div className="p-1 rounded-md bg-muted/50">
                                                                                                            <Layers className="h-3 w-3 text-muted-foreground" />
                                                                                                        </div>
                                                                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('admin:local_qty')}</span>
                                                                                                    </div>
                                                                                                    <span className="font-mono text-xs font-black text-slate-700">{String(item.detail.local_qty || '-')}</span>
                                                                                                </div>
                                                                                                <div className="p-3 rounded-xl bg-white/40 border border-border/40 shadow-sm flex items-center justify-between">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <div className="p-1 rounded-md bg-primary/10">
                                                                                                            <ArrowRight className="h-3 w-3 text-primary" />
                                                                                                        </div>
                                                                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('admin:remote_qty')}</span>
                                                                                                    </div>
                                                                                                    <span className="font-mono text-xs font-black text-primary">{String(item.detail.tf_done_size || '-')}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }

                                                                                if (item.kind === 'EXTERNAL_MISSING_LOCAL' && item.detail) {
                                                                                    return (
                                                                                        <div className="space-y-4">
                                                                                            <div className="flex items-center gap-2 text-sm font-bold text-destructive">
                                                                                                <div className="p-1.5 rounded-lg bg-destructive/10">
                                                                                                    <Globe className="h-4 w-4" />
                                                                                                </div>
                                                                                                <span>{t('admin:remote_entry_found')}</span>
                                                                                            </div>
                                                                                            <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10 space-y-4">
                                                                                                <div className="flex items-center justify-between">
                                                                                                    <div className="space-y-1">
                                                                                                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t('admin:symbol')}</span>
                                                                                                        <div className="text-xl font-black text-primary tracking-tight">{String(item.detail.symbol || '-')}</div>
                                                                                                    </div>
                                                                                                    <Badge variant="outline" className="h-6 border-destructive/20 text-destructive font-black bg-destructive/5 px-3">
                                                                                                        {safeT(t, `admin:status_labels.${item.detail.tf_order_status}`, String(item.detail.tf_order_status || t('admin:unknown')))}
                                                                                                    </Badge>
                                                                                                </div>
                                                                                                <div className="pt-4 border-t border-destructive/10 flex items-center justify-between text-xs">
                                                                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                                                                        <History className="h-3.5 w-3.5 opacity-60" />
                                                                                                        <span className="font-bold uppercase tracking-tighter">{t('admin:last_updated')}</span>
                                                                                                    </div>
                                                                                                    <span className="font-mono font-bold text-primary/80">
                                                                                                        {formatSecure(item.detail.updated_at, 'yyyy-MM-dd HH:mm:ss')}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }

                                                                                if (item.kind === 'LOCAL_NOT_FOUND_IN_ORDER_LIST' && item.detail) {
                                                                                    return (
                                                                                        <div className="space-y-4">
                                                                                            <div className="flex items-center gap-2 text-sm font-bold text-amber-600">
                                                                                                <div className="p-1.5 rounded-lg bg-amber-500/10">
                                                                                                    <Database className="h-4 w-4" />
                                                                                                </div>
                                                                                                <span>{t('admin:audit_diagnostic')}</span>
                                                                                            </div>
                                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex flex-col gap-2 shadow-sm">
                                                                                                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t('admin:local_status')}</span>
                                                                                                    <Badge variant="outline" className="w-fit text-amber-700 border-amber-500/20 bg-amber-500/5 px-3">
                                                                                                        {safeT(t, `admin:status_labels.${item.detail.local_status}`, String(item.detail.local_status || '-'))}
                                                                                                    </Badge>
                                                                                                </div>
                                                                                                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex flex-col gap-2 shadow-sm">
                                                                                                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t('admin:audit_mode')}</span>
                                                                                                    <Badge variant="outline" className="w-fit text-primary border-primary/20 bg-primary/5 uppercase px-3">
                                                                                                        {String(item.detail.audit_mode || 'unknown')}
                                                                                                    </Badge>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 space-y-4">
                                                                                                <div className="grid grid-cols-3 gap-4">
                                                                                                    <div className="text-center group">
                                                                                                        <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1 group-hover:text-amber-600 transition-colors">{t('admin:scanned')}</div>
                                                                                                        <div className="font-mono text-sm font-black text-slate-700 bg-background/50 rounded-lg py-2 border border-border/30">{item.detail.pages_fetched} <span className="text-[10px] opacity-40">/ {item.detail.max_pages}</span></div>
                                                                                                    </div>
                                                                                                    <div className="text-center group">
                                                                                                        <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1 group-hover:text-amber-600 transition-colors">{t('admin:page_size')}</div>
                                                                                                        <div className="font-mono text-sm font-black text-slate-700 bg-background/50 rounded-lg py-2 border border-border/30">{item.detail.page_size}</div>
                                                                                                    </div>
                                                                                                    <div className="text-center group">
                                                                                                        <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1 group-hover:text-amber-600 transition-colors">{t('admin:unresolved')}</div>
                                                                                                        <Badge variant={item.detail.in_unresolved_needed_ids ? "destructive" : "outline"} className={cn("text-[10px] font-black w-full h-8 justify-center rounded-lg", !item.detail.in_unresolved_needed_ids && "text-emerald-600 border-emerald-500/20 bg-emerald-500/5")}>
                                                                                                            {item.detail.in_unresolved_needed_ids ? 'TRUE' : 'FALSE'}
                                                                                                        </Badge>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }

                                                                                if (item.kind === 'LOCAL_COMPLETED_MISSING_TF_ORDER_ID' && item.detail) {
                                                                                    return (
                                                                                        <div className="space-y-4">
                                                                                            <div className="flex items-center gap-2 text-sm font-bold text-destructive">
                                                                                                <div className="p-1.5 rounded-lg bg-destructive/10">
                                                                                                    <FileWarning className="h-4 w-4" />
                                                                                                </div>
                                                                                                <span>{t('admin:mismatch_detected')}</span>
                                                                                            </div>
                                                                                            <div className="p-6 rounded-3xl bg-destructive/5 border border-destructive/10 space-y-6 shadow-inner">
                                                                                                <div className="grid grid-cols-2 gap-6">
                                                                                                    <div className="space-y-1.5">
                                                                                                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none">{t('admin:symbol')}</span>
                                                                                                        <div className="text-xl font-black text-primary tracking-tight leading-none">{String(item.detail.symbol || '-')}</div>
                                                                                                    </div>
                                                                                                    <div className="space-y-1.5 text-right">
                                                                                                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none">{t('admin:side')}</span>
                                                                                                        <div className="text-xl font-black flex items-center justify-end gap-2 leading-none uppercase tracking-tighter">
                                                                                                            <div className={cn("h-3 w-3 rounded-full shadow-sm", String(item.detail.side).toLowerCase().includes('long') || String(item.detail.side).toLowerCase().includes('buy') ? "bg-emerald-500" : "bg-destructive")} />
                                                                                                            {String(item.detail.side || '-')}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-destructive/10">
                                                                                                    <div className="space-y-1.5">
                                                                                                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none">{t('admin:local_qty')}</span>
                                                                                                        <div className="font-mono text-sm font-black text-slate-700 bg-background/50 px-3 py-1.5 rounded border border-border/30 w-fit">{String(item.detail.quantity || '-')}</div>
                                                                                                    </div>
                                                                                                    <div className="space-y-1.5 text-right flex flex-col items-end">
                                                                                                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none">{t('admin:column_time')}</span>
                                                                                                        <div className="font-mono text-[10px] font-bold text-slate-600 bg-background/50 px-3 py-1.5 rounded border border-border/30 w-fit">{formatSecure(item.detail.executed_at, 'yyyy-MM-dd HH:mm:ss')}</div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }

                                                                                if ((item.kind === 'COMPLETED_NO_EXEC_PRICE' || item.kind === 'CLOSE_NO_PNL') && item.detail) {
                                                                                    const missingPrice = item.kind === 'COMPLETED_NO_EXEC_PRICE';
                                                                                    return (
                                                                                        <div className="space-y-4">
                                                                                            <div className="flex items-center gap-2 text-sm font-bold text-amber-600">
                                                                                                <div className="p-1.5 rounded-lg bg-amber-500/10">
                                                                                                    <AlertTriangle className="h-4 w-4" />
                                                                                                </div>
                                                                                                <span>{t('admin:missing_fields_detected')}</span>
                                                                                            </div>
                                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex flex-col gap-2 shadow-sm">
                                                                                                    <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">{t('admin:local_status')}</span>
                                                                                                    <Badge variant="outline" className="w-fit border-border/50 text-muted-foreground font-black px-3 uppercase tracking-tighter">
                                                                                                        {item.detail.local_status ? safeT(t, `admin:status_labels.${item.detail.local_status}`, String(item.detail.local_status)) : t('admin:unknown')}
                                                                                                    </Badge>
                                                                                                </div>
                                                                                                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex flex-col gap-2 shadow-sm">
                                                                                                    <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">{t('admin:remote_status')}</span>
                                                                                                    <Badge variant="outline" className="w-fit border-primary/20 text-primary bg-primary/5 font-black px-3 uppercase tracking-tighter">
                                                                                                        {item.detail.tf_order_status ? safeT(t, `admin:status_labels.${item.detail.tf_order_status}`, String(item.detail.tf_order_status)) : t('admin:unknown')}
                                                                                                    </Badge>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="p-8 rounded-3xl bg-destructive/[0.03] border border-destructive/10 flex flex-col items-center justify-center gap-5 text-center shadow-inner">
                                                                                                <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center animate-pulse rotate-3 ring-4 ring-destructive/5">
                                                                                                    <XCircle className="h-7 w-7 text-destructive" />
                                                                                                </div>
                                                                                                <div className="space-y-1.5">
                                                                                                    <p className="text-sm font-black text-destructive uppercase tracking-widest">
                                                                                                        {missingPrice ? t('admin:missing_executed_price') : t('admin:missing_realized_pnl')}
                                                                                                    </p>
                                                                                                    <p className="text-[11px] text-muted-foreground max-w-[280px] leading-relaxed italic">
                                                                                                        {missingPrice ? t('admin:missing_price_desc') : t('admin:missing_pnl_desc')}
                                                                                                    </p>
                                                                                                </div>
                                                                                                <div className="w-full h-px bg-gradient-to-r from-transparent via-destructive/20 to-transparent" />
                                                                                                <Badge variant="secondary" className="font-mono text-xl font-black text-destructive/40 italic px-6 py-2 bg-background/50 border border-destructive/10 tracking-widest">
                                                                                                    LOST_DATA
                                                                                                </Badge>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }

                                                                                if (item.kind === 'FIELDS_BACKFILLED' && item.detail?.fields) {
                                                                                    return (
                                                                                        <div className="space-y-4">
                                                                                            <div className="flex items-center justify-between gap-2 text-sm font-bold text-emerald-600">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div className="p-1.5 rounded-lg bg-emerald-500/10">
                                                                                                        <Zap className="h-4 w-4" />
                                                                                                    </div>
                                                                                                    <span>{safeT(t, 'admin:backfilled_fields')}</span>
                                                                                                </div>
                                                                                                {(item.detail as any).fields_updated && (
                                                                                                    <Badge variant="outline" className="text-[9px] font-black border-emerald-500/30 text-emerald-600 bg-emerald-500/5 px-2.5 shadow-sm">
                                                                                                        {t('admin:backfill_update_msg', { count: (item.detail as any).fields_updated.length })}
                                                                                                    </Badge>
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                                                {Object.entries(item.detail.fields || {}).map(([field, value]: [string, any]) => (
                                                                                                    <div key={field} className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/40 border border-border/50 shadow-sm group transition-all hover:border-emerald-500/30 hover:shadow-md">
                                                                                                        <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest leading-none">
                                                                                                            {safeT(t, `admin:field_labels.${String(field).toLowerCase()}`, String(field))}
                                                                                                        </span>
                                                                                                        <div className="flex items-center justify-between gap-2 overflow-hidden">
                                                                                                            <span className="font-mono text-sm font-black text-emerald-600 truncate">{String(value)}</span>
                                                                                                            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                                                                                <CheckCircle className="h-3.5 w-3.5" />
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }

                                                                                return null;
                                                                            })()}

                                                                            {/* Data Context Header - Premium Grid */}
                                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-900/[0.02] border border-slate-200/60 shadow-inner">
                                                                                <div className="p-4 rounded-xl bg-white/60 hover:bg-white/90 transition-colors space-y-2">
                                                                                    <div className="flex items-center gap-1.5 opacity-40">
                                                                                        <User className="h-3 w-3" />
                                                                                        <span className="text-[9px] uppercase font-black tracking-widest leading-none">{t('admin:account')}</span>
                                                                                    </div>
                                                                                    <div className="font-mono text-xs font-black text-slate-800 flex items-center h-5">
                                                                                        {String(item.account_id || '-')}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="p-4 rounded-xl bg-white/60 hover:bg-white/90 transition-colors space-y-2">
                                                                                    <div className="flex items-center gap-1.5 opacity-40">
                                                                                        <Hash className="h-3 w-3" />
                                                                                        <span className="text-[9px] uppercase font-black tracking-widest leading-none">{t('admin:order')}</span>
                                                                                    </div>
                                                                                    <div className="font-mono text-xs font-black text-slate-400 flex items-center h-5 italic">
                                                                                        {String(item.order_id || '-')}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="p-4 rounded-xl bg-white/60 hover:bg-white/90 transition-colors space-y-2">
                                                                                    <div className="flex items-center gap-1.5 opacity-40">
                                                                                        <Flag className="h-3 w-3" />
                                                                                        <span className="text-[9px] uppercase font-black tracking-widest leading-none">{t('admin:severity')}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center h-5">
                                                                                        <Badge variant={getSeverityBadge(item.severity)} className="text-[9px] font-black uppercase tracking-tighter px-2 h-5 rounded-md">
                                                                                            {safeT(t, `admin:severity_${String(item.severity).toLowerCase()}`, String(item.severity).toUpperCase())}
                                                                                        </Badge>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Raw JSON Block - Professional Debugger Style */}
                                                                            <div className="space-y-3 pt-2">
                                                                                <div className="flex items-center justify-between px-1">
                                                                                    <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                                                                        <FileJson className="h-3.5 w-3.5" />
                                                                                        <span>{t('admin:raw_audit_detail')}</span>
                                                                                    </div>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-8 text-[10px] font-black gap-2 hover:bg-slate-100 rounded-lg transition-all active:scale-95"
                                                                                        onClick={() => {
                                                                                            navigator.clipboard.writeText(JSON.stringify(item.detail || {}, null, 2));
                                                                                            toast.success(t('admin:copy_success'));
                                                                                        }}
                                                                                    >
                                                                                        <Copy className="h-3 w-3 opacity-50" />
                                                                                        {t('admin:copy_json')}
                                                                                    </Button>
                                                                                </div>
                                                                                <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.02)] group relative">
                                                                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                        <Badge variant="outline" className="bg-slate-900/80 text-white border-none text-[8px] font-mono h-4">JSON</Badge>
                                                                                    </div>
                                                                                    <pre className="p-6 bg-slate-950 font-mono text-[11px] leading-relaxed text-slate-400 selection:bg-primary/40 selection:text-white max-h-[300px] overflow-y-auto custom-scrollbar">
                                                                                        {(() => {
                                                                                            try {
                                                                                                return JSON.stringify(item.detail || {}, null, 2);
                                                                                            } catch (e) {
                                                                                                return "Error stringifying detail";
                                                                                            }
                                                                                        })()}
                                                                                    </pre>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-slate-100 flex justify-end">
                                                                            <Button
                                                                                variant="default"
                                                                                className="h-10 px-8 font-black uppercase tracking-widest text-[11px] bg-slate-900 border-none shadow-lg hover:shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95"
                                                                                onClick={() => (document.querySelector('[data-radix-collection-item]') as any)?.click()}
                                                                            >
                                                                                {t('admin:close')}
                                                                            </Button>
                                                                        </div>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                });
                                            })()}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}

// Wrap with ErrorBoundary for production stability
export default function TurboFlowAudit() {
    return (
        <ErrorBoundary>
            <TurboFlowAuditContent />
        </ErrorBoundary>
    );
}
