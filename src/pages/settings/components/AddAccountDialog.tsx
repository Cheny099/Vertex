import type { ChangeEvent } from 'react';
import type { AccountCreateDto } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onCreate: () => void;
  onNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onExchangeChange: (exchange: AccountCreateDto['exchange']) => void;
  onApiKeyChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onApiSecretChange: (e: ChangeEvent<HTMLInputElement>) => void;
  newAccount: Partial<AccountCreateDto>;
  canSubmit: boolean;
  isPending: boolean;
  isApiKeyExchange: boolean;
  limitReachedForSelected: boolean;
  limitReachedTurboflow: boolean;
  limitReachedGate: boolean;
  limitReachedBinance: boolean;
  limitReachedWeek: boolean;
  turboflowCount: number;
  otherCount: number;
  limitTf: number;
  limitOther: number;
  t: TranslateFn;
}

export function AddAccountDialog({
  open,
  onOpenChange,
  onClose,
  onCreate,
  onNameChange,
  onExchangeChange,
  onApiKeyChange,
  onApiSecretChange,
  newAccount,
  canSubmit,
  isPending,
  isApiKeyExchange,
  limitReachedForSelected,
  limitReachedTurboflow,
  limitReachedGate,
  limitReachedBinance,
  limitReachedWeek,
  turboflowCount,
  otherCount,
  limitTf,
  limitOther,
  t,
}: AddAccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('settings:accounts.dialog.title')}</DialogTitle>
          <DialogDescription>{t('settings:accounts.dialog.desc')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="account-name">{t('settings:accounts.dialog.name_label')}</Label>
            <Input
              id="account-name"
              placeholder={t('settings:accounts.dialog.name_placeholder')}
              value={newAccount.name}
              onChange={onNameChange}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="exchange">{t('settings:accounts.dialog.exchange_label')}</Label>
            <Select
              value={newAccount.exchange}
              onValueChange={(value) => onExchangeChange(value as AccountCreateDto['exchange'])}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('settings:accounts.dialog.exchange_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="turboflow" disabled={limitReachedTurboflow}>
                  {t('common:exchanges.turboflow')} {limitReachedTurboflow ? `(${turboflowCount}/${limitTf} ${t('settings:accounts.limit_full')})` : `(${turboflowCount}/${limitTf})`}
                </SelectItem>
                <SelectItem value="gate_futures" disabled={limitReachedGate}>
                  {t('common:exchanges.gate_futures')}
                </SelectItem>
                <SelectItem value="binance_futures" disabled={limitReachedBinance}>
                  {t('common:exchanges.binance_futures')}
                </SelectItem>
                <SelectItem value="week" disabled={limitReachedWeek}>
                  {t('common:exchanges.week')} ({t('settings:accounts.browser_session')}) {limitReachedWeek ? `(${otherCount}/${limitOther} ${t('settings:accounts.limit_full')})` : `(${otherCount}/${limitOther})`}
                </SelectItem>
              </SelectContent>
            </Select>
            {limitReachedForSelected && (
              <p className="text-[11px] text-destructive mt-1">
                {t('settings:accounts.limit_warning')}
              </p>
            )}
          </div>

          {isApiKeyExchange && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="api-key">{t('settings:accounts.dialog.api_key_label')}</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder={t('settings:accounts.dialog.api_key_placeholder')}
                  value={newAccount.api_key}
                  onChange={onApiKeyChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="api-secret">{t('settings:accounts.dialog.api_secret_label')}</Label>
                <Input
                  id="api-secret"
                  type="password"
                  placeholder={t('settings:accounts.dialog.api_secret_placeholder')}
                  value={newAccount.api_secret}
                  onChange={onApiSecretChange}
                />
              </div>
            </>
          )}

          {newAccount.exchange === 'week' && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground">
                {t('settings:accounts.dialog.weex_note')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('settings:accounts.dialog.cancel')}
          </Button>
          <Button className="gradient-primary" onClick={onCreate} disabled={!canSubmit}>
            {isPending ? t('settings:accounts.dialog.submitting') : t('settings:accounts.dialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
