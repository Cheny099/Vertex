import { useCallback, useMemo, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { accountApi, type Account, type AccountCreateDto } from '@/api';
import { useAccountStatusViewModel } from '@/pages/settings/hooks/useAccountStatusViewModel';
import { useSettingsAccountMutations } from './useSettingsAccountMutations';
import { useSettingsAddAccountForm } from './useSettingsAddAccountForm';
import { useAsyncScope, type IsCurrent } from '@/hooks/use-async-scope';

type UseSettingsAccountActionsParams = {
  accounts: Account[] | undefined;
  invalidateAccountData: () => void;
  t: TFunction;
};

export function useSettingsAccountActions({
  accounts,
  invalidateAccountData,
  t,
}: UseSettingsAccountActionsParams) {
  const {
    newAccount,
    formRevision,
    resetNewAccount,
    handleOpenAddAccount,
    handleCloseAddAccount,
    addAccountDialogBaseProps,
  } = useSettingsAddAccountForm({
    t,
  });
  const { capture: capturePage } = useAsyncScope();
  const { capture: captureEditor } = useAsyncScope(formRevision);
  const creating = useRef<IsCurrent | null>(null);

  // A successful create used to blank the fields and leave the dialog open, which reads exactly
  // like a rejected submission - users retried and created duplicate accounts, burning one of the
  // limited exchange slots. Closing is part of succeeding.
  const handleCreateSuccess = useCallback(() => {
    resetNewAccount();
    handleCloseAddAccount();
  }, [resetNewAccount, handleCloseAddAccount]);

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
    onCreateSuccessReset: handleCreateSuccess,
    t,
    translateBackendErrorForDisplay: accountStatusModel.translateBackendErrorForDisplay,
    verifyAccountMutation,
  });

  const handleCreateAccount = useCallback(() => {
    if (!addAccountDialogBaseProps.canSubmit || creating.current?.()) return;
    const isCurrent = capturePage();
    const isCurrentEditor = captureEditor();
    creating.current = isCurrentEditor;
    const payload = { ...newAccount } as AccountCreateDto;
    if (payload.exchange === 'week') {
      delete payload.api_key;
      delete payload.api_secret;
    }
    createAccountMutation.mutate({ data: payload, isCurrent, isCurrentEditor }, {
      onSettled: () => { if (creating.current === isCurrentEditor) creating.current = null; },
    });
  }, [addAccountDialogBaseProps.canSubmit, captureEditor, capturePage, createAccountMutation, newAccount]);

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
