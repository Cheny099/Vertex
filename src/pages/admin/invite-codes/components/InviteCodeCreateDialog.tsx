import type React from 'react';
import type { Locale } from 'date-fns';
import { format } from 'date-fns';
import type { TFunction } from 'i18next';
import { Copy, Ticket, Check, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { AdminInviteCreateRequest } from '@/api';
import type { CreatedInviteCode } from '../utils';

interface InviteCodeCreateDialogProps {
  t: TFunction<'admin' | 'common'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createdCode: CreatedInviteCode | null;
  hasCopied: boolean;
  onCopy: (event?: React.MouseEvent) => void;
  newInvite: AdminInviteCreateRequest;
  onNewInviteChange: (next: AdminInviteCreateRequest) => void;
  onSubmit: (event: React.FormEvent) => void;
  isPending: boolean;
  calendarLocale: Locale;
}

export function InviteCodeCreateDialog({
  t,
  open,
  onOpenChange,
  createdCode,
  hasCopied,
  onCopy,
  newInvite,
  onNewInviteChange,
  onSubmit,
  isPending,
  calendarLocale,
}: InviteCodeCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden rounded-3xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold">
            {createdCode ? t('admin:invites.your_new_code', 'Invite Code Ready') : t('admin:invites.create_title', 'Generate Invite Code')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80 mt-1">
            {createdCode
              ? t('admin:invites.copy_save_warning', 'Please copy this code NOW. For security reasons, it will never be shown again.')
              : t('admin:invites.create_desc', 'Create a new invite code to allow users to subscribe.')}
          </DialogDescription>
        </DialogHeader>

        {createdCode ? (
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="p-4 bg-primary/10 rounded-full mb-2">
              <Ticket className="w-8 h-8 text-primary" />
            </div>
            <div className="text-3xl font-mono tracking-widest font-black text-center bg-secondary p-4 rounded-xl border border-primary/20 w-full select-all">
              {createdCode.plainCode}
            </div>
            {createdCode.channel && (
              <div className="text-sm text-muted-foreground">
                {t('admin:invites.channel_prefix', 'Channel:')} <span className="font-medium">{createdCode.channel}</span>
              </div>
            )}
            <Button
              onClick={onCopy}
              className={`w-full mt-4 h-12 text-lg ${hasCopied ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
            >
              {hasCopied ? (
                <><Check className="w-5 h-5 mr-2" /> {t('common:copied', 'Copied!')}</>
              ) : (
                <><Copy className="w-5 h-5 mr-2" /> {t('common:copy', 'Copy Code')}</>
              )}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5 px-1 py-2">
            <div className="space-y-2">
              <Label htmlFor="channel" className="text-sm font-semibold flex items-center justify-between">
                <span>{t('admin:invites.channel', 'Channel')}</span>
                <span className="text-xs text-muted-foreground font-normal">{t('admin:invites.optional', '(Optional)')}</span>
              </Label>
              <Input
                id="channel"
                className="bg-muted/30 focus-visible:ring-primary/20 transition-all"
                placeholder={t('admin:invites.channel_placeholder', 'e.g. TikTok_KOL_John')}
                value={newInvite.channel || ''}
                onChange={(e) => onNewInviteChange({ ...newInvite, channel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_uses" className="text-sm font-semibold text-slate-900">{t('admin:invites.max_uses', 'Max Uses')}</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                max="10000"
                className="bg-muted/30 focus-visible:ring-primary/20 transition-all font-mono"
                value={newInvite.max_uses}
                onChange={(e) => onNewInviteChange({ ...newInvite, max_uses: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at" className="text-sm font-semibold flex items-center justify-between">
                <span>{t('admin:invites.expires_at', 'Expires At')}</span>
                <span className="text-xs text-muted-foreground font-normal">{t('admin:invites.optional', '(Optional)')}</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-muted/30 focus-visible:ring-primary/20 transition-all font-mono',
                      !newInvite.expires_at && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newInvite.expires_at
                      ? format(new Date(newInvite.expires_at), 'PPP', { locale: calendarLocale })
                      : <span>{t('admin:invites.pick_date', 'Pick a date')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newInvite.expires_at ? new Date(newInvite.expires_at) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        date.setHours(23, 59, 59, 999);
                        onNewInviteChange({ ...newInvite, expires_at: date.toISOString() });
                      } else {
                        onNewInviteChange({ ...newInvite, expires_at: '' });
                      }
                    }}
                    initialFocus
                    locale={calendarLocale}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground ml-1">
                {t('admin:invites.expires_at_hint', 'Leave empty for codes that never expire.')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold flex items-center justify-between">
                <span>{t('admin:invites.notes', 'Notes')}</span>
                <span className="text-xs text-muted-foreground font-normal">{t('admin:invites.optional', '(Optional)')}</span>
              </Label>
              <Input
                id="notes"
                className="bg-muted/30 focus-visible:ring-primary/20 transition-all"
                placeholder={t('admin:invites.notes_placeholder', 'Internal reference notes...')}
                value={newInvite.notes || ''}
                onChange={(e) => onNewInviteChange({ ...newInvite, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-6 border-t mt-6">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t('common:cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('admin:invites.generate_btn', 'Generate')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
