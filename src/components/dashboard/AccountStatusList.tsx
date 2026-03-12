import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, AlertCircle, Clock, KeyRound, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  type DashboardAccount,
  type DerivedStatus,
  useAccountStatusListModel,
} from '@/components/dashboard/hooks/useAccountStatusListModel';

interface AccountStatusListProps {
  accounts: DashboardAccount[];
  isLoading: boolean;
}

interface AccountStatusRowProps {
  account: DashboardAccount;
  accountId: number;
  derived: DerivedStatus;
  onEdit: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const AccountStatusRow = memo(({ account, accountId, derived, onEdit, t }: AccountStatusRowProps) => {
  const dotClass = cn(
    'w-2 h-2 rounded-full',
    derived.level === 'ok' && account.is_active ? 'bg-profit animate-pulse' : '',
    derived.level === 'warning' ? 'bg-warning animate-pulse' : '',
    derived.level === 'error' ? 'bg-loss animate-pulse' : '',
    !account.is_active ? 'bg-muted' : ''
  );

  return (
    <div key={accountId} className="p-3 sm:p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className={dotClass} />
        <div>
          <p className="font-medium text-sm">{account.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {account.last_order_at
              ? t('account_status.last_active', { time: new Date(account.last_order_at).toLocaleString() })
              : t('account_status.never_active')}
          </p>
          {derived.hint && (
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              {derived.level === 'warning' ? <KeyRound className="w-3 h-3" /> : null}
              {derived.hint}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!account.is_active ? (
          <Badge variant="secondary" className="text-[10px] h-5">
            {t('account_status.inactive_badge')}
          </Badge>
        ) : derived.level === 'error' ? (
          <Badge variant="destructive" className="text-[10px] h-5">
            <AlertCircle className="w-3 h-3 mr-1" />
            {derived.label}
          </Badge>
        ) : derived.level === 'warning' ? (
          <Badge variant="secondary" className="text-[10px] h-5">
            <AlertCircle className="w-3 h-3 mr-1" />
            {derived.label}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] h-5 bg-profit/10 text-profit border-profit/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t('account_status.derived.ok')}
          </Badge>
        )}

        {derived.level !== 'ok' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={onEdit}
            title={t('common:edit')}
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
});

AccountStatusRow.displayName = 'AccountStatusRow';

const AccountStatusList = ({ accounts: rawAccounts, isLoading }: AccountStatusListProps) => {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const { accountRows, isStatusFetching } = useAccountStatusListModel(rawAccounts);

  const handleGoAccounts = useCallback(() => {
    navigate('/accounts');
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-card border border-border/50 p-6 space-y-4">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2].map((item) => (
            <div key={item} className="h-12 w-full bg-muted/50 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="glass-card rounded-xl overflow-hidden h-fit"
    >
      <div className="p-4 sm:p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          {t('account_status.title')}
          {isStatusFetching && (
            <span className="text-xs text-muted-foreground ml-2">{t('account_status.refreshing')}</span>
          )}
        </h3>
      </div>

      <div className="divide-y divide-border">
        {accountRows.length > 0 ? (
          accountRows.map(({ account, accountId, derived }) => (
            <AccountStatusRow
              key={accountId}
              account={account}
              accountId={accountId}
              derived={derived}
              onEdit={handleGoAccounts}
              t={t}
            />
          ))
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t('account_status.empty_text')}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default memo(AccountStatusList);
