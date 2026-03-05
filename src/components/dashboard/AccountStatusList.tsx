import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, AlertCircle, Clock, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { accountApi, translateBackendErrorMessage } from '@/api';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

interface AccountStatusListProps {
    accounts: any[];
    isLoading: boolean;
}



const AccountStatusList = ({ accounts: rawAccounts, isLoading }: AccountStatusListProps) => {
    const { t } = useTranslation(['dashboard', 'common']);
    const navigate = useNavigate();
    const toLocalizedError = (raw?: string | null) => {
        if (!raw) return '';
        return translateBackendErrorMessage(raw);
    };

    const visibleAccounts = useMemo(
        // Some backend endpoints may return `account_id` instead of `id`.
        // We filter out soft-deleted items and anything without a usable identifier.
        () => (rawAccounts || []).filter(a => !a.deleted_at && (a?.id ?? a?.account_id) != null),
        [rawAccounts]
    );

    const accountIdsKey = useMemo(
        () => visibleAccounts.map(a => (a.id ?? a.account_id)).join(','),
        [visibleAccounts]
    );

    const { data: statusMap, isFetching: isStatusFetching } = useQuery({
        queryKey: ['account-status-map', accountIdsKey],
        enabled: visibleAccounts.length > 0,
        staleTime: 10_000,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            const results = await Promise.all(
                visibleAccounts.map(async (a) => {
                    const id = (a.id ?? a.account_id) as number;
                    try {
                        const resp = await accountApi.getStatus(id);
                        return [id, resp] as const;
                    } catch (e: any) {
                        return [id, { status: 'ERROR', last_error: e?.message || t('common:unknown_error'), detail: {} }] as const;
                    }
                })
            );
            return Object.fromEntries(results) as Record<number, any>;
        }
    });

    if (isLoading) {
        return (
            <div className="bg-card rounded-xl shadow-card border border-border/50 p-6 space-y-4">
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="h-12 w-full bg-muted/50 animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="glass-card rounded-xl overflow-hidden h-fit"
        >
            <div className="p-4 sm:p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    {t('account_status.title')}
                    {isStatusFetching && (
                        <span className="text-xs text-muted-foreground ml-2">{t('account_status.refreshing')}</span>
                    )}
                </h3>
            </div>

            <div className="divide-y divide-border">
                {visibleAccounts.length > 0 ? (
                    visibleAccounts.map((account) => {
                        const accountId = (account.id ?? account.account_id) as number;
                        // statusMap is keyed by `account.id` (see queryFn). Using `account_id` here would
                        // make status always undefined (UI shows "未知/尚未获取状态").
                        const resp = statusMap?.[accountId];
                        // Helper to derive status with translation
                        const getDerivedStatus = (resp: any) => {
                            const status = resp?.status;
                            const detail = resp?.detail || {};
                            const localizedHint = toLocalizedError(detail?.hint);
                            const localizedMessage = toLocalizedError(detail?.message);

                            // High Priority: Explicit Backend Status
                            if (status === 'uid_mismatch') {
                                return {
                                    level: 'error',
                                    label: t('account_status.derived.uid_mismatch'),
                                    hint: detail?.db_uid && detail?.api_uid
                                        ? `${t('account_status.hints.uid_mismatch')} (DB ${detail.db_uid} / API ${detail.api_uid})`
                                        : (localizedMessage || t('account_status.hints.uid_mismatch'))
                                };
                            }
                            if (status === 'need_verify') {
                                return {
                                    level: 'warning',
                                    label: t('account_status.derived.need_verify'),
                                    hint: localizedHint || t('account_status.hints.need_verify')
                                };
                            }
                            if (status === 'config_missing') {
                                return {
                                    level: 'warning',
                                    label: t('account_status.derived.config_missing'),
                                    hint: localizedHint || toLocalizedError(resp?.last_error) || t('account_status.hints.config_missing')
                                };
                            }
                            if (status === 'disabled') {
                                return {
                                    level: 'error',
                                    label: t('account_status.derived.disabled'),
                                    hint: localizedHint
                                };
                            }
                            if (status === 'need_login') {
                                return {
                                    level: 'warning',
                                    label: t('account_status.derived.need_login'),
                                    hint: localizedHint || localizedMessage || toLocalizedError(resp?.last_error) || t('account_status.hints.need_login')
                                };
                            }
                            if (status === 'unknown_exchange') {
                                return {
                                    level: 'error',
                                    label: t('account_status.derived.unknown_exchange'),
                                    hint: localizedHint || localizedMessage || toLocalizedError(resp?.last_error) || t('account_status.hints.unknown_exchange')
                                };
                            }
                            if (status === 'unknown') {
                                return {
                                    level: 'warning',
                                    label: t('account_status.derived.unknown'),
                                    hint: t('account_status.hints.unknown')
                                };
                            }

                            // Legacy / General Checks
                            const lastError = resp?.last_error;
                            const isReady = detail?.is_ready;

                            if (lastError) return { level: 'error', label: t('account_status.derived.error'), hint: toLocalizedError(lastError) };
                            if (status === 'inactive') return { level: 'warning', label: t('account_status.inactive_badge') };
                            if (isReady === false) return { level: 'warning', label: t('account_status.derived.not_ready'), hint: t('account_status.hints.not_ready') };

                            return { level: 'ok', label: t('account_status.derived.ok') };
                        };

                        const derived = resp ? getDerivedStatus(resp) : { level: 'warning' as const, label: t('account_status.derived.unknown'), hint: t('account_status.hints.unknown') };

                        const dotClass = cn(
                            "w-2 h-2 rounded-full",
                            derived.level === 'ok' && account.is_active ? "bg-profit animate-pulse" : "",
                            derived.level === 'warning' ? "bg-warning animate-pulse" : "",
                            derived.level === 'error' ? "bg-loss animate-pulse" : "",
                            (!account.is_active) && "bg-muted"
                        );

                        return (
                            <div key={accountId} className="p-3 sm:p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={dotClass} />
                                    <div>
                                        <p className="font-medium text-sm">{account.name}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {account.last_order_at
                                                ? t('account_status.last_active', { time: new Date(account.last_order_at).toLocaleString() })
                                                : t('account_status.never_active')}
                                        </p>
                                        {derived.hint && (
                                            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                                {derived.level === 'warning' ? <KeyRound className="w-3 h-3" /> : null}
                                                {derived.hint}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!account.is_active ? (
                                        <Badge variant="secondary" className="text-[10px] h-5">
                                            {t('account_status.inactive_badge')}
                                        </Badge>
                                    ) : derived.level === 'error' ? (
                                        <Badge variant="destructive" className="text-[10px] h-5">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            {derived.label}
                                        </Badge>
                                    ) : derived.level === 'warning' ? (
                                        <Badge variant="secondary" className="text-[10px] h-5">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            {derived.label}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] h-5 bg-profit/10 text-profit border-profit/20">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            {t('account_status.derived.ok')}
                                        </Badge>
                                    )}

                                    {derived.level !== 'ok' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                                            // Accounts management lives in Settings; /accounts is an alias route.
                                            onClick={() => navigate('/accounts')}
                                            title={t('common:edit')}
                                        >
                                            <Settings className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        {t('account_status.empty_text')}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default AccountStatusList;
