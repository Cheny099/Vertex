import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import { adminApi, translateBackendErrorMessage } from '@/api';
import type { ApiError } from '@/api/contracts';
import { motion } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { AuditErrorBoundary } from './components/AuditErrorBoundary';
import { AuditRunControlCard } from './components/AuditRunControlCard';
import { AuditRunDetailCard } from './components/AuditRunDetailCard';
import { AuditRunInsightsPanel } from './components/AuditRunInsightsPanel';
import { AuditRunsPanel } from './components/AuditRunsPanel';
import { useTurboFlowAuditState } from './hooks/useTurboFlowAuditState';
import { containerVariants, itemVariants } from './motion';
import { safeT, SUMMARY_KIND_MAP, SUMMARY_ORDER, toRecord } from './utils';

function TurboFlowAuditContent() {
    const { t } = useTranslation(['admin', 'common']);
    const {
        lookbackDays,
        setLookbackDays,
        mode,
        setMode,
        dryRun,
        setDryRun,
        selectedRunId,
        setSelectedRunId,
        kindFilter,
        setKindFilter,
        clickedKey,
        setClickedKey,
        severityFilter,
        setSeverityFilter,
    } = useTurboFlowAuditState();

    // List runs
    const { data: runsData, isLoading: runsLoading, isError: runsError, error: runsErrorObj, refetch: refetchRuns } = useQuery({
        queryKey: ['auditRuns'],
        queryFn: async () => adminApi.auditTurboflow.listRuns({ limit: 50 }),
        staleTime: 10_000,
        refetchOnWindowFocus: false,
    });

    // Run detail
    const { data: runDetail, isLoading: detailLoading, isError: detailError, error: detailErrorObj } = useQuery({
        queryKey: ['auditRunDetail', selectedRunId],
        queryFn: async () => adminApi.auditTurboflow.getRun(selectedRunId!),
        enabled: !!selectedRunId,
        staleTime: 10_000,
        refetchOnWindowFocus: false,
    });

    // Run items
    const severityParam = useMemo(
        () => (severityFilter ? (severityFilter === 'warning' ? 'WARN' : severityFilter.toUpperCase()) : undefined),
        [severityFilter]
    );
    const { data: itemsData, isLoading: itemsLoading, isError: itemsError, error: itemsErrorObj } = useQuery({
        queryKey: ['auditRunItems', selectedRunId, kindFilter, severityFilter],
        queryFn: async () => adminApi.auditTurboflow.getRunItems(selectedRunId!, {
            kind: kindFilter || undefined,
            severity: severityParam,
            limit: 100,
        }),
        enabled: !!selectedRunId,
        staleTime: 8_000,
        refetchOnWindowFocus: false,
        placeholderData: (prev) => prev,
    });
    const toQueryErrorText = useCallback((err: unknown) => {
        const apiError = err as ApiError;
        const msg = typeof apiError?.message === 'string' ? apiError.message : '';
        return (
            translateBackendErrorMessage(msg)
            || msg
            || safeT(t, 'admin:error_operation_failed', 'Operation failed')
        );
    }, [t]);

    const runsErrorText = useMemo(
        () => toQueryErrorText(runsErrorObj),
        [runsErrorObj, toQueryErrorText]
    );
    const detailErrorText = useMemo(
        () => toQueryErrorText(detailErrorObj),
        [detailErrorObj, toQueryErrorText]
    );

    // Start audit mutation
    const runMutation = useMutation({
        mutationFn: () => adminApi.auditTurboflow.run({
            lookback_days: lookbackDays,
            mode,
            dry_run: dryRun,
        }),
        onSuccess: (data) => {
            toast.success(safeT(t, 'admin:audit_started', `Run #${data.id} started`).replace('{{id}}', String(data.id)));
            refetchRuns();
            setSelectedRunId(data.id);
        },
        onError: (err: unknown) => {
            toast.error(toQueryErrorText(err) || safeT(t, 'admin:audit_failed'));
        },
    });

    const getStatusVariant = useCallback((status?: string) => {
        if (!status || typeof status !== 'string') return 'secondary';
        const s = status.toLowerCase();
        if (s === 'success' || s === 'completed') return 'default';
        if (s === 'failed' || s === 'error') return 'destructive';
        if (s === 'running') return 'outline';
        return 'secondary';
    }, []);

    const getStatusLabel = useCallback((status?: string) => {
        if (!status || typeof status !== 'string') return '-';
        const s = status.toLowerCase();
        if (s === 'success' || s === 'completed') return safeT(t, 'admin:status_completed');
        if (s === 'failed' || s === 'error') return safeT(t, 'admin:status_failed');
        if (s === 'running') return safeT(t, 'admin:status_running');
        return status;
    }, [t]);

    const runs = useMemo(
        () => (Array.isArray(runsData?.items) ? runsData.items.filter(Boolean) : []),
        [runsData?.items]
    );

    const handleRun = useCallback(() => {
        runMutation.mutate();
    }, [runMutation]);

    const handleRefreshRuns = useCallback(() => {
        void refetchRuns();
    }, [refetchRuns]);

    const handleSelectRun = useCallback((runId: number) => {
        setSelectedRunId(runId);
    }, [setSelectedRunId]);

    const getSeverityIcon = useCallback((severity?: string) => {
        if (!severity || typeof severity !== 'string') return <Info className="h-4 w-4 text-muted-foreground" />;
        const s = severity.toUpperCase();
        switch (s) {
            case 'ERROR': return <AlertTriangle className="h-4 w-4 text-destructive" />;
            case 'WARN':
            case 'WARNING': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    }, []);

    const getSeverityBadge = useCallback((severity?: string) => {
        if (!severity || typeof severity !== 'string') return 'secondary';
        const s = severity.toUpperCase();
        switch (s) {
            case 'ERROR': return 'destructive';
            case 'WARN':
            case 'WARNING': return 'secondary';
            default: return 'outline';
        }
    }, []);

    const getKindStyling = useCallback((kind: string) => {
        const k = String(kind).toUpperCase();
        if (k.includes('BACKFILLED')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        if (k.includes('MISMATCH')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        if (k.includes('NOT_FOUND')) return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
        if (k.includes('MISSING')) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }, []);

    const kindFilterDisplayValue = useMemo(() => {
        if (!kindFilter) return '';
        const translated = t(`admin:kind_labels.${kindFilter}`);
        return translated && translated !== `admin:kind_labels.${kindFilter}` ? translated : kindFilter;
    }, [kindFilter, t]);

    const handleKindFilterInput = useCallback((value: string) => {
        setKindFilter(value);
    }, [setKindFilter]);

    const clearKindFilter = useCallback(() => {
        setKindFilter('');
    }, [setKindFilter]);

    const handleSeverityFilterChange = useCallback((value: string) => {
        setSeverityFilter(value === 'all' ? '' : value);
    }, [setSeverityFilter]);

    const resetFilters = useCallback(() => {
        setKindFilter('');
        setSeverityFilter('');
    }, [setKindFilter, setSeverityFilter]);

    const summaryRecord = useMemo(() => toRecord(runDetail?.summary), [runDetail?.summary]);
    const paramsRecord = useMemo(() => toRecord(runDetail?.params), [runDetail?.params]);
    const itemsByKind = useMemo(() => toRecord(summaryRecord.items_by_kind), [summaryRecord]);

    const backfillContext = useMemo(() => {
        const backfill = runDetail?.summary?.backfill;
        const backfillEnabledFromSummary = summaryRecord.backfill_enabled === true;
        const backfillEnabled = backfill?.status === 'enabled' || backfillEnabledFromSummary;
        const exists = !!backfill || summaryRecord.backfill_enabled !== undefined;
        return {
            exists,
            enabled: backfillEnabled,
            running: backfill?.status === 'running',
            totalBackfilled: backfill?.total_backfilled ?? Number(summaryRecord.fields_updated ?? 0),
            totalFailed: backfill?.total_failed ?? Number(summaryRecord.query_failed ?? 0),
            lookback: summaryRecord.backfill_lookback_days ?? paramsRecord.lookback_days ?? '-',
            limitCount: summaryRecord.backfill_limit ?? '-',
        };
    }, [paramsRecord.lookback_days, runDetail?.summary?.backfill, summaryRecord]);

    const exchangeStatsRows = useMemo(() => {
        const rawMap = runDetail?.summary?.stats_by_exchange;
        if (!rawMap || Object.keys(rawMap).length === 0) return [];
        return Object.entries(rawMap).map(([exchange, statsRaw]) => {
            const stats = toRecord(statsRaw);
            return {
                exchange,
                scanned: Number(stats.scanned ?? stats.total ?? 0),
                updated: Number(stats.updated ?? 0),
                failed: Number(stats.failed ?? stats.query_failed ?? 0),
                missingExternal: Number(stats.completed_missing_external_id ?? stats.completed_missing_tf_order_id ?? 0),
                missingPrice: Number(stats.completed_missing_price ?? 0),
                missingNotional: Number(stats.completed_missing_notional ?? 0),
                missingExecutedAt: Number(stats.completed_missing_executed_at ?? 0),
            };
        });
    }, [runDetail?.summary?.stats_by_exchange]);

    const summaryCards = useMemo(() => {
        return SUMMARY_ORDER.reduce<Array<{
            key: string;
            displayKey: string;
            count: unknown;
            isAmount: boolean;
            isError: boolean;
            isWarn: boolean;
            filterKind: string;
            isClicked: boolean;
            isRelated: boolean;
        }>>((acc, key) => {
            let count = summaryRecord[key];
            const displayKey = String(key).replace('_count', '').toLowerCase();
            if (count === undefined || count === null) {
                const fallbackKind = SUMMARY_KIND_MAP[key];
                if (fallbackKind && Object.keys(itemsByKind).length > 0) {
                    count = Number(itemsByKind[fallbackKind] ?? 0);
                } else {
                    return acc;
                }
            }

            const filterKind = SUMMARY_KIND_MAP[key] || '';
            const isClicked = clickedKey === key;
            const isRelated = !!(filterKind && kindFilter === filterKind && !isClicked);

            acc.push({
                key,
                displayKey,
                count,
                isAmount: displayKey.includes('notional'),
                isError: displayKey.includes('error') || displayKey.includes('not_found') || displayKey.includes('missing'),
                isWarn: displayKey.includes('warn') || displayKey.includes('mismatch') || displayKey.includes('backfilled'),
                filterKind,
                isClicked,
                isRelated,
            });
            return acc;
        }, []);
    }, [clickedKey, itemsByKind, kindFilter, summaryRecord]);

    const handleSummaryCardClick = useCallback((key: string, filterKind: string) => {
        if (!filterKind) return;
        if (clickedKey === key) {
            setKindFilter('');
            setClickedKey(null);
            return;
        }
        setKindFilter(filterKind);
        setClickedKey(key);
    }, [clickedKey, setClickedKey, setKindFilter]);

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
                <AuditRunControlCard
                    t={t}
                    lookbackDays={lookbackDays}
                    setLookbackDays={setLookbackDays}
                    mode={mode}
                    setMode={setMode}
                    dryRun={dryRun}
                    setDryRun={setDryRun}
                    isRunning={runMutation.isPending}
                    onRun={handleRun}
                />
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AuditRunsPanel
                    t={t}
                    runsLoading={runsLoading}
                    runsError={runsError}
                    runsErrorText={runsErrorText}
                    runs={runs}
                    selectedRunId={selectedRunId}
                    onSelectRun={handleSelectRun}
                    onRefresh={handleRefreshRuns}
                    getStatusVariant={getStatusVariant}
                    getStatusLabel={getStatusLabel}
                />

                <AuditRunDetailCard
                    t={t}
                    selectedRunId={selectedRunId}
                    detailLoading={detailLoading}
                    detailError={detailError}
                    detailErrorText={detailErrorText}
                >
                    <AuditRunInsightsPanel
                        t={t}
                        runDetail={runDetail}
                        backfillContext={backfillContext}
                        exchangeStatsRows={exchangeStatsRows}
                        summaryCards={summaryCards}
                        kindFilter={kindFilter}
                        kindFilterDisplayValue={kindFilterDisplayValue}
                        severityFilter={severityFilter}
                        itemsLoading={itemsLoading}
                        itemsError={itemsError}
                        itemsErrorObj={itemsErrorObj}
                        itemsData={itemsData}
                        onSummaryCardClick={handleSummaryCardClick}
                        onKindFilterInput={handleKindFilterInput}
                        onClearKindFilter={clearKindFilter}
                        onSeverityFilterChange={handleSeverityFilterChange}
                        onResetFilters={resetFilters}
                        toQueryErrorText={toQueryErrorText}
                        getSeverityIcon={getSeverityIcon}
                        getSeverityBadge={getSeverityBadge}
                        getKindStyling={getKindStyling}
                    />
                </AuditRunDetailCard>
            </motion.div>
        </motion.div>
    );
}

// Wrap with ErrorBoundary for production stability
export default function TurboFlowAudit() {
    return (
        <AuditErrorBoundary>
            <TurboFlowAuditContent />
        </AuditErrorBoundary>
    );
}

