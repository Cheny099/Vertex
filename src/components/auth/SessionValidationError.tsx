import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export function SessionValidationError() {
  const { t } = useTranslation('auth');
  const { retryValidation, logout } = useAuth();
  return <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
    <p>{t('session_validation_failed')}</p>
    <div className="flex gap-3">
      <Button onClick={retryValidation}>{t('session_retry')}</Button>
      <Button variant="outline" onClick={logout}>{t('session_sign_out')}</Button>
    </div>
  </div>;
}
