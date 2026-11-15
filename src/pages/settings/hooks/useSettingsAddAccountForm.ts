import { useCallback, useMemo, useState, type ChangeEvent } from 'react';
import type { TFunction } from 'i18next';
import type { AccountCreateDto } from '@/api';

type UseSettingsAddAccountFormParams = {
  t: TFunction;
};

const DEFAULT_NEW_ACCOUNT: Partial<AccountCreateDto> = {
  name: '',
  exchange: 'turboflow',
  type: 'real',
  api_key: '',
  api_secret: '',
};

export function useSettingsAddAccountForm({
  t,
}: UseSettingsAddAccountFormParams) {
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [formRevision, setFormRevision] = useState(0);
  const [newAccount, setNewAccount] = useState<Partial<AccountCreateDto>>(DEFAULT_NEW_ACCOUNT);

  const selectedExchange = (newAccount.exchange || 'turboflow') as AccountCreateDto['exchange'];
  const isApiKeyExchange =
    selectedExchange === 'turboflow' ||
    selectedExchange === 'gate_futures' ||
    selectedExchange === 'binance_futures';

  const resetNewAccount = useCallback(() => {
    setNewAccount(DEFAULT_NEW_ACCOUNT);
  }, []);

  const patchNewAccount = useCallback((patch: Partial<AccountCreateDto>) => {
    setNewAccount((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleOpenAddAccount = useCallback(() => {
    setFormRevision(value => value + 1);
    setIsAddAccountOpen(true);
  }, []);

  const handleCloseAddAccount = useCallback(() => {
    setFormRevision(value => value + 1);
    setIsAddAccountOpen(false);
  }, []);

  const handleAddAccountOpenChange = useCallback((open: boolean) => {
    setFormRevision(value => value + 1);
    setIsAddAccountOpen(open);
  }, []);

  const handleNameInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      patchNewAccount({ name: e.target.value });
    },
    [patchNewAccount]
  );

  const handleExchangeChange = useCallback(
    (exchange: AccountCreateDto['exchange']) => {
      patchNewAccount({ exchange });
    },
    [patchNewAccount]
  );

  const handleApiKeyChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      patchNewAccount({ api_key: e.target.value });
    },
    [patchNewAccount]
  );

  const handleApiSecretChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      patchNewAccount({ api_secret: e.target.value });
    },
    [patchNewAccount]
  );

  const canSubmitNewAccount = useMemo(() => {
    if (!newAccount.name) return false;
    if (isApiKeyExchange && (!newAccount.api_key || !newAccount.api_secret)) return false;
    return true;
  }, [
    isApiKeyExchange,
    newAccount.api_key,
    newAccount.api_secret,
    newAccount.name,
  ]);

  const addAccountDialogBaseProps = useMemo(
    () => ({
      open: isAddAccountOpen,
      onOpenChange: handleAddAccountOpenChange,
      onClose: handleCloseAddAccount,
      onNameChange: handleNameInputChange,
      onExchangeChange: handleExchangeChange,
      onApiKeyChange: handleApiKeyChange,
      onApiSecretChange: handleApiSecretChange,
      newAccount,
      canSubmit: canSubmitNewAccount,
      isApiKeyExchange,
      t,
    }),
    [
      canSubmitNewAccount,
      handleAddAccountOpenChange,
      handleApiKeyChange,
      handleApiSecretChange,
      handleCloseAddAccount,
      handleExchangeChange,
      handleNameInputChange,
      isAddAccountOpen,
      isApiKeyExchange,
      newAccount,
      t,
    ]
  );

  return {
    formRevision,
    newAccount,
    resetNewAccount,
    handleOpenAddAccount,
    handleCloseAddAccount,
    addAccountDialogBaseProps,
  };
}
