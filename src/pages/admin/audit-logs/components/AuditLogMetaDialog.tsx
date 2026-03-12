import type { TFunction } from 'i18next';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import type { AdminAuditLogItem } from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CodeBlock } from '@/components/ui/code-block';

interface AuditLogMetaDialogProps {
  t: TFunction<'admin' | 'common'>;
  log: AdminAuditLogItem;
  formatAction: (value: string) => string;
  formatTargetType: (value: string) => string;
}

export function AuditLogMetaDialog({
  t,
  log,
  formatAction,
  formatTargetType,
}: AuditLogMetaDialogProps) {
  if (!log.meta) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-6 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden rounded-3xl">
        <DialogHeader>
          <DialogTitle>{t('admin:log_detail_title', { id: log.id })}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">{t('admin:column_actor')}:</span> {log.actor_email}
            </div>
            <div>
              <span className="font-semibold">{t('admin:column_time')}:</span> {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
            </div>
            <div>
              <span className="font-semibold">{t('admin:column_action')}:</span> {formatAction(log.action)}
            </div>
            <div>
              <span className="font-semibold">{t('admin:column_target')}:</span> {formatTargetType(log.target_type)} {log.target_id && `#${log.target_id}`}
            </div>
          </div>
          <div className="space-y-2">
            <span className="font-semibold text-sm">{t('admin:meta_data')}</span>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/50 font-mono text-xs">
              <CodeBlock code={JSON.stringify(log.meta, null, 2)} language="json" className="mt-2" />
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
