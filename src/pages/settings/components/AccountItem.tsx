import { memo, useCallback } from 'react';
import { Power, RefreshCcw, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { Account } from '@/api';

interface AccountItemProps {
  account: Account;
  exchangeLabel: string;
  statusText: string;
  statusClass: string;
  statusHint: string | null;
  verifyPending: boolean;
  verifyPendingCurrent: boolean;
  connectPending: boolean;
  togglePending: boolean;
  deletePending: boolean;
  showVerify: boolean;
  onVerify: (account: Account) => void;
  onConnect: (account: Account) => void;
  onResetSessionSoft: (account: Account) => void;
  onToggleActive: (account: Account, checked: boolean) => void;
  onDelete: (account: Account) => void;
  t: (key: string) => string;
}

function AccountItemComponent({
  account,
  exchangeLabel,
  statusText,
  statusClass,
  statusHint,
  verifyPending,
  verifyPendingCurrent,
  connectPending,
  togglePending,
  deletePending,
  showVerify,
  onVerify,
  onConnect,
  onResetSessionSoft,
  onToggleActive,
  onDelete,
  t,
}: AccountItemProps) {
  const handleVerify = useCallback(() => onVerify(account), [account, onVerify]);
  const handleConnect = useCallback(() => onConnect(account), [account, onConnect]);
  const handleResetSoft = useCallback(() => onResetSessionSoft(account), [account, onResetSessionSoft]);
  const handleToggle = useCallback((checked: boolean) => onToggleActive(account, checked), [account, onToggleActive]);
  const handleDelete = useCallback(() => onDelete(account), [account, onDelete]);

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
      <div className="flex items-center gap-4">
        <div className="w-auto px-2 h-6 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="font-bold text-[10px] text-primary whitespace-nowrap">{exchangeLabel}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{account.name}</p>
            <Badge variant="outline" className={`text-[10px] h-4 ${statusClass}`}>
              {statusText}
            </Badge>
            <Badge variant={account.is_active ? 'default' : 'secondary'} className={`text-[10px] h-4 ${account.is_active ? 'bg-green-500 hover:bg-green-600' : ''}`}>
              {account.is_active ? t('settings:accounts.active') : t('settings:accounts.disabled')}
            </Badge>
          </div>
          <div className="flex flex-col gap-0.5 mt-1">
            <div className="flex items-center gap-3 text-[10px]">
              <p className="text-muted-foreground font-mono truncate max-w-[120px]">
                {account.api_key || (account.exchange === 'week' ? t('settings:accounts.browser_session') : '********')}
              </p>
              {account.available_margin !== undefined && (
                <div className="flex items-center gap-1.5 border-l border-border/50 pl-2">
                  <span className="text-muted-foreground">{t('common:finance.available')}:</span>
                  <span className="font-bold text-primary">{account.available_margin} {account.currency || 'USDT'}</span>
                </div>
              )}
            </div>
            {statusHint && (
              <p className="text-[10px] text-destructive truncate max-w-[240px]" title={statusHint}>
                {t('common:error')}: {statusHint}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showVerify ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px] gap-1 px-2"
            onClick={handleVerify}
            disabled={verifyPending}
          >
            <Shield className="w-3 h-3" />
            {verifyPendingCurrent ? t('settings:accounts.verifying') : t('settings:accounts.verify')}
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[11px] gap-1 px-2"
              onClick={handleConnect}
              disabled={connectPending}
            >
              <Power className="w-3 h-3" />
              {t('settings:accounts.connect')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-muted"
              onClick={handleResetSoft}
              title={t('settings:accounts.reset_session')}
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
        <Switch
          checked={account.is_active}
          onCheckedChange={handleToggle}
          disabled={togglePending}
        />
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-muted-foreground hover:text-destructive transition-colors"
          onClick={handleDelete}
          disabled={deletePending}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export const AccountItem = memo(AccountItemComponent);
