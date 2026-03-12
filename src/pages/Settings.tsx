/**
 * @anchor-id SETTINGS_PAGE
 * @module-type page
 * @disposable false
 * @mock-data User/profile data should come from backend APIs.
 */

import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { AddAccountDialog } from '@/pages/settings/components/AddAccountDialog';
import { ProfileSection } from '@/pages/settings/components/ProfileSection';
import { SecuritySection } from '@/pages/settings/components/SecuritySection';
import { AppearanceSection } from '@/pages/settings/components/AppearanceSection';
import { NotificationsSection } from '@/pages/settings/components/NotificationsSection';
import { AccountsSection } from '@/pages/settings/components/AccountsSection';
import { useSettingsPageModel } from '@/pages/settings/hooks/useSettingsPageModel';

const Settings = () => {
  const {
    t,
    isProfileLoading,
    profileSectionProps,
    appearanceSectionProps,
    accountsSectionProps,
    addAccountDialogProps,
  } = useSettingsPageModel();

  if (isProfileLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6" id="settings">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </motion.div>

      <ProfileSection {...profileSectionProps} />

      <SecuritySection t={t} />

      <AppearanceSection {...appearanceSectionProps} />

      <AccountsSection {...accountsSectionProps} />

      <AddAccountDialog {...addAccountDialogProps} />

      <NotificationsSection t={t} />
    </div>
  );
};

export default Settings;
