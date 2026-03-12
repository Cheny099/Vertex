import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CloseParams } from '../hooks/useOpsConsoleState';

interface ForceCloseCardProps {
  t: TFunction;
  closeParams: CloseParams;
  setCloseParams: Dispatch<SetStateAction<CloseParams>>;
  isSubmitting: boolean;
  onRequestConfirm: () => void;
}

export function ForceCloseCard({
  t,
  closeParams,
  setCloseParams,
  isSubmitting,
  onRequestConfirm,
}: ForceCloseCardProps) {
  return (
    <Card className="relative bg-white/65 backdrop-blur-md border border-rose-200/60 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] group">
      <div className="absolute top-0 right-0 p-4 opacity-5 bg-destructive/10 rounded-bl-3xl">
        <Zap className="h-20 w-20 text-destructive" />
      </div>
      <CardHeader className="bg-destructive/5 pb-5 border-b border-destructive/5">
        <CardTitle className="flex items-center gap-3 text-destructive text-xl font-black tracking-tighter">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-destructive/10">
            <Zap className="h-5 w-5 animate-pulse" />
          </div>
          {t('admin:force_close')}
        </CardTitle>
        <CardDescription className="text-destructive/80 text-xs">
          {t('admin:ops_manual_close_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin:account_id')}</Label>
            <Input
              placeholder="e.g. 101"
              value={closeParams.account_id}
              onChange={(e) => setCloseParams({ ...closeParams, account_id: e.target.value })}
              className="h-10 focus-visible:ring-destructive/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin:symbol')}</Label>
            <Input
              placeholder="BTCUSDT"
              value={closeParams.symbol}
              onChange={(e) => setCloseParams({ ...closeParams, symbol: e.target.value.toUpperCase() })}
              className="h-10 focus-visible:ring-destructive/30"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin:pos_side')}</Label>
            <Select
              value={closeParams.pos_side}
              onValueChange={(v) => setCloseParams({ ...closeParams, pos_side: v as CloseParams['pos_side'] })}
            >
              <SelectTrigger className="h-10 focus:ring-destructive/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long">{t('admin:long')}</SelectItem>
                <SelectItem value="short">{t('admin:short')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin:qty')}</Label>
            <Input
              placeholder="0.00"
              type="number"
              step="0.0001"
              value={closeParams.qty}
              onChange={(e) => setCloseParams({ ...closeParams, qty: e.target.value })}
              className="h-10 focus-visible:ring-destructive/30"
            />
          </div>
        </div>
        <Button
          className="w-full mt-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground h-10 font-bold tracking-wide transition-all active:scale-[0.98] shadow-sm"
          disabled={!closeParams.account_id || !closeParams.symbol || !closeParams.qty || isSubmitting}
          onClick={onRequestConfirm}
        >
          {isSubmitting ? t('common:loading') : t('admin:force_close')}
        </Button>
      </CardContent>
    </Card>
  );
}
