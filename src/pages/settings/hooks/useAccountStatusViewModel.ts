import { useCallback, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { accountApi, type Account, type AccountStatusResponse } from '@/api';
import type { ApiError } from '@/api/contracts';
import {
  getStatusBadgeClass,
  normalizeStatusKey,
  toRecord,
  type UiAccountStatusKey,
} from '@/pages/settings/settings-helpers';

type AccountStatusViewModel = {
  account: Account;
  exchangeLabel: string;
  statusText: string;
  statusClass: string;
  statusHint: string | null;
  showVerify: boolean;
  verifyPendingCurrent: boolean;
};

type UseAccountStatusViewModelParams = {
  accounts: Account[] | undefined;
  verifyPending: boolean;
  verifyPendingAccountId?: number;
};

export function useAccountStatusViewModel({
  accounts,
  verifyPending,
  verifyPendingAccountId,
}: UseAccountStatusViewModelParams) {
  const { t, i18n } = useTranslation(['settings', 'common']);

  const accountStatusQueryOptions = useMemo(
    () =>
      (accounts ?? []).map((account) => ({
        queryKey: ['account-status', account.id],
        queryFn: () => accountApi.getStatus(account.id),
        enabled: !!accounts?.length,
        staleTime: 15_000,
      })),
    [accounts]
  );

  const accountStatusQueries = useQueries({
    queries: accountStatusQueryOptions,
  });

  const { accountStatusMap, statusErrorMap, statusLoadingMap } = useMemo(() => {
    const nextStatusMap = new Map<number, AccountStatusResponse>();
    const nextErrorMap = new Map<number, string>();
    const nextLoadingMap = new Map<number, boolean>();

    (accounts ?? []).forEach((account, index) => {
      const statusQuery = accountStatusQueries[index];
      const statusData = statusQuery?.data;
      const statusError = statusQuery?.error as ApiError | null | undefined;
      const statusLoading = Boolean(statusQuery?.isLoading || statusQuery?.isFetching);

      if (statusData) {
        nextStatusMap.set(account.id, statusData);
      }

      if (statusError) {
        const message = typeof statusError.message === 'string' ? statusError.message.trim() : '';
        nextErrorMap.set(account.id, message || t('settings:accounts.status.unknown'));
      }

      if (!statusData && !statusError && statusLoading) {
        nextLoadingMap.set(account.id, true);
      }
    });

    return {
      accountStatusMap: nextStatusMap,
      statusErrorMap: nextErrorMap,
      statusLoadingMap: nextLoadingMap,
    };
  }, [accounts, accountStatusQueries, t]);

  const translateBackendErrorForDisplay = useCallback(
    (raw?: string | null): string | null => {
      if (typeof raw !== 'string') return null;

      const msg = raw.trim();
      if (!msg) return null;

      const directKey = `common:backend_errors.${msg}`;
      if (i18n.exists(directKey)) return t(directKey);

      const dynamicMappings: Array<{ prefix: string; key: string; preserveSuffix?: boolean }> = [
        {
          prefix: 'TurboFlow api_key is already used by another account',
          key: 'common:backend_errors.TurboFlow api_key is already used by another account',
          preserveSuffix: true,
        },
        {
          prefix: 'Accounts limit reached for exchange=',
          key: 'common:backend_errors.Accounts limit reached for exchange',
          preserveSuffix: true,
        },
        { prefix: 'connect failed:', key: 'common:backend_errors.connect failed', preserveSuffix: true },
        { prefix: 'unsupported exchange:', key: 'common:backend_errors.unsupported exchange', preserveSuffix: true },
        {
          prefix: 'connect only works for week accounts, exchange=',
          key: 'common:backend_errors.connect only works for week accounts',
          preserveSuffix: true,
        },
      ];

      for (const mapping of dynamicMappings) {
        if (msg.startsWith(mapping.prefix) && i18n.exists(mapping.key)) {
          const translated = t(mapping.key);
          if (mapping.preserveSuffix) {
            const suffix = msg.slice(mapping.prefix.length).trim();
            return suffix ? `${translated}: ${suffix}` : translated;
          }
          return translated;
        }
      }

      return msg;
    },
    [i18n, t]
  );

  const formatUidMismatchHint = useCallback(
    (detail: Record<string, unknown>): string => {
      const dbUid = detail.db_uid ? String(detail.db_uid) : '';
      const apiUid = detail.api_uid ? String(detail.api_uid) : '';
      if (!dbUid && !apiUid) return t('settings:accounts.hint.uid_mismatch_generic');
      return t('settings:accounts.hint.uid_mismatch', {
        db_uid: dbUid || '-',
        api_uid: apiUid || '-',
      });
    },
    [t]
  );

  const resolveAccountStatus = useCallback(
    (account: Account): UiAccountStatusKey | null => {
      if (statusErrorMap.get(account.id)) return 'unknown';

      const statusData = accountStatusMap.get(account.id);
      if (statusData?.status) return normalizeStatusKey(statusData.status);
      if (statusLoadingMap.get(account.id)) return null;

      return 'unknown';
    },
    [accountStatusMap, statusErrorMap, statusLoadingMap]
  );

  const resolveAccountHint = useCallback(
    (account: Account): string | null => {
      const statusError = statusErrorMap.get(account.id);
      if (statusError) {
        return translateBackendErrorForDisplay(statusError) || statusError;
      }

      const statusData = accountStatusMap.get(account.id);
      const detail = toRecord(statusData?.detail);
      const statusKey = normalizeStatusKey(statusData?.status);

      if (statusKey === 'uid_mismatch') return formatUidMismatchHint(detail);

      const parts = [detail.message, detail.action, detail.hint]
        .map((value) => (typeof value === 'string' ? translateBackendErrorForDisplay(value) || value : value))
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean);

      if (parts.length > 0) return parts.join(' | ');

      const translatedStatusError = translateBackendErrorForDisplay(statusData?.last_error);
      if (translatedStatusError) return translatedStatusError;

      const translatedAccountError = translateBackendErrorForDisplay(account.last_error);
      if (translatedAccountError) return translatedAccountError;

      return null;
    },
    [accountStatusMap, formatUidMismatchHint, statusErrorMap, translateBackendErrorForDisplay]
  );

  const formatVerifyError = useCallback(
    (error: unknown): string => {
      const apiError = error as ApiError;
      const raw = toRecord(apiError.raw);
      const detail = toRecord(apiError.detail ?? raw.detail);
      const rawStatus = typeof raw.status === 'string' ? raw.status : null;
      const statusKey = normalizeStatusKey(
        typeof apiError.status === 'string' ? apiError.status : rawStatus
      );

      if (statusKey === 'uid_mismatch') return formatUidMismatchHint(detail);

      const parts = [apiError.message, detail.message, detail.action, detail.hint]
        .map((value) => (typeof value === 'string' ? translateBackendErrorForDisplay(value) || value : value))
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean);

      const uniq = [...new Set(parts)];
      return uniq.join(' | ') || t('settings:accounts.toast.check_key');
    },
    [formatUidMismatchHint, t, translateBackendErrorForDisplay]
  );

  const accountViewModels = useMemo<AccountStatusViewModel[]>(() => {
    return (accounts ?? []).map((account) => {
      const statusKey = resolveAccountStatus(account);
      const statusHint = resolveAccountHint(account);
      const exchangeKey = `common:exchanges.${account.exchange}`;
      const exchangeLabel = i18n.exists(exchangeKey) ? t(exchangeKey) : account.exchange;
      const statusText = statusKey
        ? t(`settings:accounts.status.${statusKey}`)
        : t('settings:accounts.status_loading');
      const statusClass = statusKey
        ? getStatusBadgeClass(statusKey)
        : 'bg-muted text-muted-foreground border-border';

      return {
        account,
        exchangeLabel,
        statusText,
        statusClass,
        statusHint,
        showVerify:
          account.exchange === 'turboflow' ||
          account.exchange === 'gate_futures' ||
          account.exchange === 'binance_futures',
        verifyPendingCurrent: verifyPending && verifyPendingAccountId === account.id,
      };
    });
  }, [accounts, i18n, resolveAccountHint, resolveAccountStatus, t, verifyPending, verifyPendingAccountId]);

  return {
    accountViewModels,
    formatVerifyError,
    translateBackendErrorForDisplay,
  };
}
