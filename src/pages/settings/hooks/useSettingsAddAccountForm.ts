import { useCallback, useMemo, useState, type ChangeEvent } from 'react';
import type { TFunction } from 'i18next';
import type { AccountCreateDto } from '@/api';
import { LIMIT_OTHER, LIMIT_TF } from '@/pages/settings/settings-helpers';

type UseSettingsAddAccountFormParams = {
  isLimitReached: (exchange: string) => boolean;
  otherCount: number;
  t: TFunction;
  turboflowCount: number;
};

const DEFAULT_NEW_ACCOUNT: Partial<AccountCreateDto> = {
  name: '',
  exchange: 'turboflow',
  type: 'real',
  api_key: '',
  api_secret: '',
};

export function useSettingsAddAccountForm({
  isLimitReached,
  otherCount,
  t,
  turboflowCount,
}: UseSettingsAddAccountFormParams) {
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<AccountCreateDto>>(DEFAULT_NEW_ACCOUNT);

  const selectedExchange = (newAccount.exchange || 'turboflow') as AccountCreateDto['exchange'];
  const isApiKeyExchange =
    selectedExchange === 'turboflow' ||
    selectedExchange === 'gate_futures' ||
    selectedExchange === 'binance_futures';
  const limitReachedForSelected = isLimitReached(selectedExchange);

  const resetNewAccount = useCallback(() => {
    setNewAccount(DEFAULT_NEW_ACCOUNT);
  }, []);

  const patchNewAccount = useCallback((patch: Partial<AccountCreateDto>) => {
    setNewAccount((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleOpenAddAccount = useCallback(() => {
    setIsAddAccountOpen(true);
  }, []);

  const handleCloseAddAccount = useCallback(() => {
    setIsAddAccountOpen(false);
  }, []);

  const handleAddAccountOpenChange = useCallback((open: boolean) => {
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
    if (limitReachedForSelected) return false;
    return true;
  }, [
    isApiKeyExchange,
    limitReachedForSelected,
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
      limitReachedForSelected,
      limitReachedTurboflow: isLimitReached('turboflow'),
      limitReachedGate: isLimitReached('gate_futures'),
      limitReachedBinance: isLimitReached('binance_futures'),
      limitReachedWeek: isLimitReached('week'),
      turboflowCount,
      otherCount,
      limitTf: LIMIT_TF,
      limitOther: LIMIT_OTHER,
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
      isLimitReached,
      limitReachedForSelected,
      newAccount,
      otherCount,
      t,
      turboflowCount,
    ]
  );

  return {
    newAccount,
    resetNewAccount,
    handleOpenAddAccount,
    handleCloseAddAccount,
    addAccountDialogBaseProps,
  };
}
