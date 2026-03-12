import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsAccountActions } from './useSettingsAccountActions';
import { useSettingsQueries } from './useSettingsQueries';

export function useSettingsPageModel() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t, i18n } = useTranslation(['settings', 'common']);

  const {
    profile,
    isProfileLoading,
    accounts,
    isAccountsLoading,
    turboflowCount,
    otherCount,
    isLimitReached,
    invalidateAccountData,
  } = useSettingsQueries();

  const { accountsSectionProps: rawAccountsSectionProps, addAccountDialogProps } =
    useSettingsAccountActions({
      accounts,
      invalidateAccountData,
      isLimitReached,
      otherCount,
      t,
      turboflowCount,
    });

  const handleCopyUserId = useCallback(() => {
    if (!profile?.id) return;
    navigator.clipboard.writeText(String(profile.id));
    toast.success(t('settings:profile.user_id_copied'));
  }, [profile?.id, t]);

  const setLightTheme = useCallback(() => setTheme('light'), [setTheme]);
  const setDarkTheme = useCallback(() => setTheme('dark'), [setTheme]);
  const setSystemTheme = useCallback(() => setTheme('system'), [setTheme]);

  const handleLanguageChange = useCallback(
    (value: string) => {
      i18n.changeLanguage(value);
    },
    [i18n]
  );

  const profileSectionProps = useMemo(
    () => ({
      profile,
      onCopyUserId: handleCopyUserId,
      t,
    }),
    [handleCopyUserId, profile, t]
  );

  const appearanceSectionProps = useMemo(
    () => ({
      theme,
      resolvedTheme,
      language: i18n.language,
      onSetLightTheme: setLightTheme,
      onSetDarkTheme: setDarkTheme,
      onSetSystemTheme: setSystemTheme,
      onLanguageChange: handleLanguageChange,
      t,
    }),
    [
      handleLanguageChange,
      i18n.language,
      resolvedTheme,
      setDarkTheme,
      setLightTheme,
      setSystemTheme,
      t,
      theme,
    ]
  );

  const accountsSectionProps = useMemo(
    () => ({
      ...rawAccountsSectionProps,
      isLoading: isAccountsLoading,
    }),
    [isAccountsLoading, rawAccountsSectionProps]
  );

  return {
    t,
    isProfileLoading,
    profileSectionProps,
    appearanceSectionProps,
    accountsSectionProps,
    addAccountDialogProps,
  };
}
