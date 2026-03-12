import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import { PauseCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionConfirmState } from '../hooks/useOpsConsoleState';

interface SubscriptionOpsCardProps {
  t: TFunction;
  searchSubId: string;
  setSearchSubId: Dispatch<SetStateAction<string>>;
  freezeReason: string;
  setFreezeReason: Dispatch<SetStateAction<string>>;
  isSubmitting: boolean;
  setActionConfirm: Dispatch<SetStateAction<ActionConfirmState>>;
  onFreeze: (id: number, reason: string) => void;
  onUnfreeze: (id: number, reason: string) => void;
}

export function SubscriptionOpsCard({
  t,
  searchSubId,
  setSearchSubId,
  freezeReason,
  setFreezeReason,
  isSubmitting,
  setActionConfirm,
  onFreeze,
  onUnfreeze,
}: SubscriptionOpsCardProps) {
  return (
    <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
      <CardHeader className="bg-primary/5 pb-5 border-b border-primary/5">
        <CardTitle className="flex items-center gap-3 text-xl font-black tracking-tighter text-slate-900">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-primary/10">
            <PauseCircle className="h-5 w-5 text-primary" />
          </div>
          {t('admin:subscription_ops')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="bg-white/40 backdrop-blur-xl border border-slate-200/60 rounded-xl p-1 shadow-sm transition-all duration-300 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/40 focus-within:bg-white/80 group/sub">
          <div className="grid grid-cols-2 gap-0">
            <div className="flex flex-col border-r border-slate-200/30 pl-3 py-1">
              <Label className="text-xs font-bold text-slate-400 group-focus-within/sub:text-primary transition-colors uppercase tracking-widest">{t('admin:subscription_id')}</Label>
              <Input
                className="border-0 focus-visible:ring-0 h-6 text-xs bg-transparent placeholder:text-slate-300 p-0 font-mono mt-0.5"
                placeholder="ID"
                value={searchSubId}
                onChange={(e) => setSearchSubId(e.target.value)}
              />
            </div>
            <div className="flex flex-col pl-3 py-1">
              <Label className="text-xs font-bold text-slate-400 group-focus-within/sub:text-primary transition-colors uppercase tracking-widest">{t('admin:reason')}</Label>
              <Input
                className="border-0 focus-visible:ring-0 h-6 text-xs bg-transparent placeholder:text-slate-300 p-0 mt-0.5"
                placeholder={t('admin:reason')}
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            className="flex-1 h-10 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold shadow-lg shadow-red-500/20 rounded-xl border-none transition-all active:scale-95 group"
            disabled={!searchSubId || isSubmitting}
            onClick={() => {
              setActionConfirm({
                open: true,
                title: t('admin:confirm', 'Confirm'),
                desc: t('admin:confirm_freeze'),
                onConfirm: () => onFreeze(parseInt(searchSubId), freezeReason || t('admin:freeze_reason_default')),
              });
            }}
          >
            <PauseCircle className="mr-2 h-4 w-4 group-hover:animate-pulse" />
            {t('admin:freeze')}
          </Button>
          <Button
            className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/20 rounded-xl border-none transition-all active:scale-95 group"
            disabled={!searchSubId || isSubmitting}
            onClick={() => onUnfreeze(parseInt(searchSubId), freezeReason || t('admin:unfreeze_reason_default'))}
          >
            <PlayCircle className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
            {t('admin:unfreeze')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
