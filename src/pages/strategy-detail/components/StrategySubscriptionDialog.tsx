import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import { Activity, AlertCircle, Shield, Zap } from 'lucide-react';
import type { Account, Subscription } from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { UiMode } from '../utils';
import { clamp } from '../utils';
import type { StrategySubscriptionDraft } from '../hooks/useStrategyDetailState';

interface StrategySubscriptionDialogProps {
  t: TFunction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSub: Subscription | null;
  newSub: StrategySubscriptionDraft;
  setNewSub: Dispatch<SetStateAction<StrategySubscriptionDraft>>;
  accounts?: Account[];
  fixedAmountMax: number;
  availableMargin: number | null;
  isMinNotionalViolated: boolean;
  minNotional: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export function StrategySubscriptionDialog({
  t,
  open,
  onOpenChange,
  editingSub,
  newSub,
  setNewSub,
  accounts,
  fixedAmountMax,
  availableMargin,
  isMinNotionalViolated,
  minNotional,
  isSubmitting,
  onSubmit,
  onCancel,
}: StrategySubscriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none bg-background">
        <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 pb-4">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            {editingSub ? t('strategies:detail.subscription_dialog_title_edit') : t('strategies:detail.subscription_dialog_title_add')}
          </DialogTitle>
          <DialogDescription className="mt-1">
            {editingSub ? t('strategies:detail.subscription_desc_edit') : t('strategies:detail.subscription_desc_add')}
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              {t('strategies:detail.execution_account')}
            </Label>

            <Select
              value={newSub.accountId}
              onValueChange={(val) => setNewSub({ ...newSub, accountId: val })}
              disabled={!!editingSub}
            >
              <SelectTrigger className="w-full bg-secondary/10 border-border h-11">
                <SelectValue placeholder={t('strategies:detail.select_account')} />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  ?.filter((a) => a.is_active || String(a.id) === newSub.accountId)
                  .map((acc) => (
                    <SelectItem key={acc.id} value={String(acc.id)}>
                      {acc.name} ({acc.exchange.toUpperCase()})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="opacity-50" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">{t('strategies:detail.position_settings')}</Label>

              <Select
                value={newSub.positionMode}
                onValueChange={(val) => {
                  const mode = val as UiMode;
                  if (mode === 'fixed_amount') {
                    setNewSub({
                      ...newSub,
                      positionMode: 'fixed_amount',
                      positionValue: clamp(Number(newSub.positionValue || 1), 1, fixedAmountMax),
                    });
                  } else {
                    setNewSub({
                      ...newSub,
                      positionMode: 'fixed',
                      positionPct: clamp(Number(newSub.positionPct || 0.1), 0.02, 1.0),
                    });
                  }
                }}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{t('strategies:detail.mode_fixed')}</SelectItem>
                  <SelectItem value="fixed_amount">{t('strategies:detail.mode_amount')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-secondary/20 p-4 rounded-xl space-y-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">
                  {newSub.positionMode === 'fixed_amount' ? t('strategies:detail.amount_label') : t('strategies:detail.ratio_label')}
                </span>
                <span className="text-sm font-mono font-bold text-primary">
                  {newSub.positionMode === 'fixed'
                    ? `${Math.round(newSub.positionPct * 100)}%`
                    : `${Number(newSub.positionValue || 0).toFixed(2)} USDT`}
                </span>
              </div>

              {newSub.positionMode === 'fixed_amount' ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{t('strategies:detail.available_margin')}</span>
                      <span className="font-mono">{availableMargin ? `${availableMargin.toFixed(2)} USDT` : '--'}</span>
                    </div>

                    <Input
                      type="number"
                      inputMode="decimal"
                      min={1}
                      max={fixedAmountMax}
                      step={0.01}
                      value={newSub.positionValue}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (!Number.isFinite(n)) {
                          setNewSub({ ...newSub, positionValue: 1 });
                          return;
                        }
                        setNewSub({ ...newSub, positionValue: clamp(n, 1, fixedAmountMax) });
                      }}
                    />

                    <div className="text-[10px] text-muted-foreground">{t('strategies:hints.amount_range', { max: fixedAmountMax })}</div>

                    {isMinNotionalViolated && (
                      <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        {t('strategies:validation.min_notional_violation', { min: minNotional })}
                      </p>
                    )}
                  </div>

                  <Slider
                    value={[Number(newSub.positionValue || 1)]}
                    min={1}
                    max={fixedAmountMax}
                    step={1}
                    onValueChange={(val) => setNewSub({ ...newSub, positionValue: val[0] })}
                    className="py-2"
                  />

                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                    * {t('strategies:hints.fixed_amount_desc', { amount: Number(newSub.positionValue || 1).toFixed(2) })}
                  </p>
                </>
              ) : (
                <>
                  <Slider
                    value={[newSub.positionPct * 100]}
                    min={2}
                    max={100}
                    step={1}
                    onValueChange={(val) => setNewSub({ ...newSub, positionPct: val[0] / 100 })}
                    className="py-4"
                  />
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                    * {t('strategies:hints.ratio_desc', { percent: Math.round(newSub.positionPct * 100) })}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">{t('strategies:detail.leverage')}</Label>
              <span className="text-sm font-mono font-bold text-primary">{newSub.leverage}x</span>
            </div>

            <Slider
              value={[newSub.leverage]}
              min={1}
              max={200}
              step={1}
              onValueChange={(val) => setNewSub({ ...newSub, leverage: val[0] })}
              className="py-2"
            />

            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>{t('strategies:risk_levels.conservative')}</span>
              <span>{t('strategies:risk_levels.standard')}</span>
              <span>{t('strategies:risk_levels.aggressive')}</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-secondary/10 flex justify-end gap-3 mt-2">
          <Button variant="ghost" onClick={onCancel}>
            {t('common:cancel')}
          </Button>

          <Button
            className="gradient-primary px-8 shadow-lg shadow-primary/20"
            onClick={onSubmit}
            disabled={
              !newSub.accountId ||
              isSubmitting ||
              (newSub.positionMode === 'fixed_amount' &&
                (Number(newSub.positionValue || 0) < 1 || Number(newSub.positionValue || 0) > fixedAmountMax)) ||
              (newSub.positionMode === 'fixed' && (newSub.positionPct < 0.02 || newSub.positionPct > 1))
            }
          >
            {isSubmitting && (
              <Activity className="w-4 h-4 mr-2 animate-spin" />
            )}
            {editingSub ? t('common:save') : t('strategies:detail.subscribe_now')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
