import { useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { accountApi, type Account, type AccountCreateDto } from '@/api';
import { useAccountStatusViewModel } from '@/pages/settings/hooks/useAccountStatusViewModel';
import { useSettingsAccountMutations } from './useSettingsAccountMutations';
import { useSettingsAddAccountForm } from './useSettingsAddAccountForm';

type UseSettingsAccountActionsParams = {
  accounts: Account[] | undefined;
  invalidateAccountData: () => void;
  isLimitReached: (exchange: string) => boolean;
  otherCount: number;
  t: TFunction;
  turboflowCount: number;
};

export function useSettingsAccountActions({
  accounts,
  invalidateAccountData,
  isLimitReached,
  otherCount,
  t,
  turboflowCount,
}: UseSettingsAccountActionsParams) {
  const {
    newAccount,
    resetNewAccount,
    handleOpenAddAccount,
    addAccountDialogBaseProps,
  } = useSettingsAddAccountForm({
    isLimitReached,
    otherCount,
    t,
    turboflowCount,
  });

  const verifyAccountMutation = useMutation({
    mutationFn: (id: number) => accountApi.verify(id),
    onSettled: () => {
      invalidateAccountData();
    },
  });

  const accountStatusModel = useAccountStatusViewModel({
    accounts,
    verifyPending: verifyAccountMutation.isPending,
    verifyPendingAccountId: verifyAccountMutation.variables,
  });

  const {
    createAccountMutation,
    toggleAccountMutation,
    deleteAccountMutation,
    connectAccountMutation,
    handleVerifyAccount,
    handleConnectAccount,
    handleResetSoft,
    handleToggleAccount,
    handleDeleteAccount,
  } = useSettingsAccountMutations({
    formatVerifyError: accountStatusModel.formatVerifyError,
    invalidateAccountData,
    onCreateSuccessReset: resetNewAccount,
    t,
    translateBackendErrorForDisplay: accountStatusModel.translateBackendErrorForDisplay,
    verifyAccountMutation,
  });

  const handleCreateAccount = useCallback(() => {
    const payload = { ...newAccount } as AccountCreateDto;
    if (payload.exchange === 'week') {
      delete payload.api_key;
      delete payload.api_secret;
    }
    createAccountMutation.mutate(payload);
  }, [createAccountMutation, newAccount]);

  const accountsSectionProps = useMemo(
    () => ({
      isLoading: false,
      accounts,
      accountViewModels: accountStatusModel.accountViewModels,
      verifyPending: verifyAccountMutation.isPending,
      connectPending: connectAccountMutation.isPending,
      togglePending: toggleAccountMutation.isPending,
      deletePending: deleteAccountMutation.isPending,
      onOpenAddAccount: handleOpenAddAccount,
      onVerify: handleVerifyAccount,
      onConnect: handleConnectAccount,
      onResetSessionSoft: handleResetSoft,
      onToggleActive: handleToggleAccount,
      onDelete: handleDeleteAccount,
      t,
    }),
    [
      accountStatusModel.accountViewModels,
      accounts,
      connectAccountMutation.isPending,
      deleteAccountMutation.isPending,
      handleConnectAccount,
      handleDeleteAccount,
      handleOpenAddAccount,
      handleResetSoft,
      handleToggleAccount,
      handleVerifyAccount,
      t,
      toggleAccountMutation.isPending,
      verifyAccountMutation.isPending,
    ]
  );

  const addAccountDialogProps = useMemo(
    () => ({
      ...addAccountDialogBaseProps,
      canSubmit: addAccountDialogBaseProps.canSubmit && !createAccountMutation.isPending,
      isPending: createAccountMutation.isPending,
      onCreate: handleCreateAccount,
    }),
    [addAccountDialogBaseProps, createAccountMutation.isPending, handleCreateAccount]
  );

  return {
    accountsSectionProps,
    addAccountDialogProps,
    handleOpenAddAccount,
  };
}
