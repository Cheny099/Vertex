import { useCallback } from 'react';
import { type UseMutationResult, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { TFunction } from 'i18next';
import { accountApi, type Account, type AccountCreateDto } from '@/api';
import type { ApiError } from '@/api/contracts';

type UseSettingsAccountMutationsParams = {
  formatVerifyError: (error: unknown) => string;
  invalidateAccountData: () => void;
  onCreateSuccessReset: () => void;
  t: TFunction;
  translateBackendErrorForDisplay: (message: string) => string;
  verifyAccountMutation: UseMutationResult<unknown, unknown, number, unknown>;
};

export function useSettingsAccountMutations({
  formatVerifyError,
  invalidateAccountData,
  onCreateSuccessReset,
  t,
  translateBackendErrorForDisplay,
  verifyAccountMutation,
}: UseSettingsAccountMutationsParams) {
  const createAccountMutation = useMutation({
    mutationFn: (data: AccountCreateDto) => accountApi.create(data),
    onSuccess: (data: Account) => {
      onCreateSuccessReset();
      toast.success(t('settings:accounts.toast.add_success'));

      if (
        data.exchange === 'turboflow' ||
        data.exchange === 'gate_futures' ||
        data.exchange === 'binance_futures'
      ) {
        toast.promise(
          accountApi.verify(data.id).finally(() => {
            invalidateAccountData();
          }),
          {
            loading: t('settings:accounts.toast.verify_loading', { name: data.name }),
            success: t('settings:accounts.toast.verify_success'),
            error: (err) =>
              `${t('settings:accounts.toast.verify_failed')}: ${formatVerifyError(err)}`,
          }
        );
      }
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      const raw = typeof apiError?.message === 'string' ? apiError.message : '';
      if (/limit reached/i.test(raw) || raw.includes('409')) {
        toast.error(t('settings:accounts.toast.limit_reached'));
        return;
      }

      const translated = translateBackendErrorForDisplay(raw);
      toast.error(translated || t('settings:accounts.toast.add_failed'));
    },
    onSettled: () => {
      invalidateAccountData();
    },
  });

  const toggleAccountMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      accountApi.toggleActive(id, is_active),
    onSuccess: () => {
      toast.success(t('settings:accounts.toast.status_updated'));
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      const raw = typeof apiError?.message === 'string' ? apiError.message : '';
      if (/limit reached/i.test(raw)) {
        toast.error(t('settings:accounts.toast.limit_reached'));
        return;
      }

      const translated = translateBackendErrorForDisplay(raw);
      toast.error(translated || t('common:unknown_error'));
    },
    onSettled: () => {
      invalidateAccountData();
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: number) => accountApi.delete(id),
    onSuccess: () => {
      toast.success(t('settings:accounts.toast.deleted'));
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      const raw = typeof apiError?.message === 'string' ? apiError.message : '';
      const translated = translateBackendErrorForDisplay(raw);
      toast.error(translated || t('settings:accounts.toast.delete_failed'));
    },
    onSettled: () => {
      invalidateAccountData();
    },
  });

  const connectAccountMutation = useMutation({
    mutationFn: (id: number) => accountApi.connect(id),
    onSuccess: () => {
      toast.success(t('settings:accounts.toast.connect_started'));
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      const raw = typeof apiError?.message === 'string' ? apiError.message : '';
      const translated = translateBackendErrorForDisplay(raw);
      toast.error(translated || t('settings:accounts.toast.connect_failed'));
    },
    onSettled: () => {
      invalidateAccountData();
    },
  });

  const resetSessionMutation = useMutation({
    mutationFn: ({ id, mode }: { id: number; mode: 'soft' | 'hard' }) =>
      accountApi.resetSession(id, mode),
    onSuccess: () => {
      toast.success(t('settings:accounts.toast.reset_success'));
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      const raw = typeof apiError?.message === 'string' ? apiError.message : '';
      const translated = translateBackendErrorForDisplay(raw);
      toast.error(translated || t('settings:accounts.toast.reset_failed'));
    },
    onSettled: () => {
      invalidateAccountData();
    },
  });

  const handleVerifyAccount = useCallback(
    (account: Account) => {
      toast.promise(verifyAccountMutation.mutateAsync(account.id), {
        loading: t('settings:accounts.toast.verify_loading'),
        success: t('settings:accounts.toast.verify_success'),
        error: (err) =>
          `${t('settings:accounts.toast.verify_failed')}: ${formatVerifyError(err)}`,
      });
    },
    [formatVerifyError, t, verifyAccountMutation]
  );

  const handleConnectAccount = useCallback(
    (account: Account) => {
      connectAccountMutation.mutate(account.id);
    },
    [connectAccountMutation]
  );

  const handleResetSoft = useCallback(
    (account: Account) => {
      if (confirm(`${t('settings:accounts.reset_session')}? (${t('settings:accounts.reset_mode_soft')})`)) {
        resetSessionMutation.mutate({ id: account.id, mode: 'soft' });
      }
    },
    [resetSessionMutation, t]
  );

  const handleToggleAccount = useCallback(
    (account: Account, checked: boolean) => {
      toggleAccountMutation.mutate({ id: account.id, is_active: checked });
    },
    [toggleAccountMutation]
  );

  const handleDeleteAccount = useCallback(
    (account: Account) => {
      if (confirm(t('settings:accounts.delete_confirm'))) {
        deleteAccountMutation.mutate(account.id);
      }
    },
    [deleteAccountMutation, t]
  );

  return {
    verifyAccountMutation,
    createAccountMutation,
    toggleAccountMutation,
    deleteAccountMutation,
    connectAccountMutation,
    resetSessionMutation,
    handleVerifyAccount,
    handleConnectAccount,
    handleResetSoft,
    handleToggleAccount,
    handleDeleteAccount,
  };
}
