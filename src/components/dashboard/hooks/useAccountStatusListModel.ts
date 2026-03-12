import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { accountApi, translateBackendErrorMessage } from '@/api';
import type { AccountStatusResponse } from '@/api';
import type { ApiError } from '@/api/contracts';

export interface DashboardAccount {
  id?: number;
  account_id?: number;
  name: string;
  is_active: boolean;
  deleted_at?: string;
  last_order_at?: string;
}

export interface DerivedStatus {
  level: 'ok' | 'warning' | 'error';
  label: string;
  hint?: string;
}

type StatusLike =
  | AccountStatusResponse
  | { status: 'ERROR'; last_error: string; detail: Record<string, unknown> };

export interface AccountStatusRowModel {
  account: DashboardAccount;
  accountId: number;
  derived: DerivedStatus;
}

export const useAccountStatusListModel = (rawAccounts: DashboardAccount[]) => {
  const { t } = useTranslation(['dashboard', 'common']);

  const toLocalizedError = useCallback((raw?: string | null) => {
    if (!raw) return '';
    return translateBackendErrorMessage(raw);
  }, []);

  const visibleAccounts = useMemo(
    () => (rawAccounts || []).filter((account) => !account.deleted_at && (account?.id ?? account?.account_id) != null),
    [rawAccounts]
  );

  const accountIdsKey = useMemo(() => {
    return visibleAccounts
      .map((account) => Number(account.id ?? account.account_id))
      .sort((a, b) => a - b)
      .join(',');
  }, [visibleAccounts]);

  const { data: statusMap, isFetching: isStatusFetching } = useQuery({
    queryKey: ['account-status-map', accountIdsKey],
    enabled: visibleAccounts.length > 0,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const results = await Promise.all(
        visibleAccounts.map(async (account) => {
          const id = (account.id ?? account.account_id) as number;
          try {
            const response = await accountApi.getStatus(id);
            return [id, response] as const;
          } catch (error: unknown) {
            const apiError = error as Partial<ApiError>;
            return [id, { status: 'ERROR', last_error: apiError.message || t('common:unknown_error'), detail: {} }] as const;
          }
        })
      );
      return Object.fromEntries(results) as Record<number, StatusLike>;
    },
  });

  const getDerivedStatus = useCallback((response: StatusLike): DerivedStatus => {
    const status = response?.status;
    const detail = response?.detail || {};
    const localizedHint = toLocalizedError(detail?.hint as string | null | undefined);
    const localizedMessage = toLocalizedError(detail?.message as string | null | undefined);

    if (status === 'uid_mismatch') {
      return {
        level: 'error',
        label: t('account_status.derived.uid_mismatch'),
        hint:
          detail?.db_uid && detail?.api_uid
            ? `${t('account_status.hints.uid_mismatch')} (DB ${detail.db_uid} / API ${detail.api_uid})`
            : localizedMessage || t('account_status.hints.uid_mismatch'),
      };
    }

    if (status === 'need_verify') {
      return {
        level: 'warning',
        label: t('account_status.derived.need_verify'),
        hint: localizedHint || t('account_status.hints.need_verify'),
      };
    }

    if (status === 'config_missing') {
      return {
        level: 'warning',
        label: t('account_status.derived.config_missing'),
        hint: localizedHint || toLocalizedError(response?.last_error) || t('account_status.hints.config_missing'),
      };
    }

    if (status === 'disabled') {
      return {
        level: 'error',
        label: t('account_status.derived.disabled'),
        hint: localizedHint,
      };
    }

    if (status === 'need_login') {
      return {
        level: 'warning',
        label: t('account_status.derived.need_login'),
        hint: localizedHint || localizedMessage || toLocalizedError(response?.last_error) || t('account_status.hints.need_login'),
      };
    }

    if (status === 'unknown_exchange') {
      return {
        level: 'error',
        label: t('account_status.derived.unknown_exchange'),
        hint: localizedHint || localizedMessage || toLocalizedError(response?.last_error) || t('account_status.hints.unknown_exchange'),
      };
    }

    if (status === 'unknown') {
      return {
        level: 'warning',
        label: t('account_status.derived.unknown'),
        hint: t('account_status.hints.unknown'),
      };
    }

    const lastError = response?.last_error;
    const isReady = (detail as { is_ready?: boolean }).is_ready;

    if (lastError) {
      return {
        level: 'error',
        label: t('account_status.derived.error'),
        hint: toLocalizedError(lastError),
      };
    }

    if (status === 'inactive') {
      return { level: 'warning', label: t('account_status.inactive_badge') };
    }

    if (isReady === false) {
      return {
        level: 'warning',
        label: t('account_status.derived.not_ready'),
        hint: t('account_status.hints.not_ready'),
      };
    }

    return { level: 'ok', label: t('account_status.derived.ok') };
  }, [t, toLocalizedError]);

  const accountRows = useMemo<AccountStatusRowModel[]>(() => {
    return visibleAccounts.map((account) => {
      const accountId = (account.id ?? account.account_id) as number;
      const response = statusMap?.[accountId];
      const derived = response
        ? getDerivedStatus(response)
        : {
            level: 'warning' as const,
            label: t('account_status.derived.unknown'),
            hint: t('account_status.hints.unknown'),
          };

      return { account, accountId, derived };
    });
  }, [getDerivedStatus, statusMap, t, visibleAccounts]);

  return {
    accountRows,
    isStatusFetching,
  };
};
