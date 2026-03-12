import { motion } from 'framer-motion';
import { Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountItem } from '@/pages/settings/components/AccountItem';
import type { Account } from '@/api';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

type AccountViewModel = {
  account: Account;
  exchangeLabel: string;
  statusText: string;
  statusClass: string;
  statusHint: string | null;
  showVerify: boolean;
  verifyPendingCurrent: boolean;
};

interface AccountsSectionProps {
  isLoading: boolean;
  accounts: Account[] | undefined;
  accountViewModels: AccountViewModel[];
  verifyPending: boolean;
  connectPending: boolean;
  togglePending: boolean;
  deletePending: boolean;
  onOpenAddAccount: () => void;
  onVerify: (account: Account) => void;
  onConnect: (account: Account) => void;
  onResetSessionSoft: (account: Account) => void;
  onToggleActive: (account: Account, checked: boolean) => void;
  onDelete: (account: Account) => void;
  t: TranslateFn;
}

export function AccountsSection({
  isLoading,
  accounts,
  accountViewModels,
  verifyPending,
  connectPending,
  togglePending,
  deletePending,
  onOpenAddAccount,
  onVerify,
  onConnect,
  onResetSessionSoft,
  onToggleActive,
  onDelete,
  t,
}: AccountsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      id="accounts"
      className="bg-card rounded-xl p-6 border border-border/50"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <RefreshCcw className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('settings:section.accounts')}</h2>
        </div>
        <Button size="sm" onClick={onOpenAddAccount} className="gradient-primary">
          <Plus className="w-4 h-4 mr-1" /> {t('settings:accounts.add')}
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !accounts || accounts.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-lg border-border/50">
            <p className="text-muted-foreground">{t('settings:accounts.no_accounts')}</p>
          </div>
        ) : (
          accountViewModels.map((item) => (
            <AccountItem
              key={item.account.id}
              account={item.account}
              exchangeLabel={item.exchangeLabel}
              statusText={item.statusText}
              statusClass={item.statusClass}
              statusHint={item.statusHint}
              verifyPending={verifyPending}
              verifyPendingCurrent={item.verifyPendingCurrent}
              connectPending={connectPending}
              togglePending={togglePending}
              deletePending={deletePending}
              showVerify={item.showVerify}
              onVerify={onVerify}
              onConnect={onConnect}
              onResetSessionSoft={onResetSessionSoft}
              onToggleActive={onToggleActive}
              onDelete={onDelete}
              t={t}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
