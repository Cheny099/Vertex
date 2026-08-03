import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import { Eye, RefreshCw } from 'lucide-react';
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
import { parseNumberInput } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BatchRequeueParams } from '../hooks/useOpsConsoleState';

interface BatchRequeueCardProps {
  t: TFunction;
  batchParams: BatchRequeueParams;
  setBatchParams: Dispatch<SetStateAction<BatchRequeueParams>>;
  isPending: boolean;
  onDryRun: () => void;
  onExecute: () => void;
}

export function BatchRequeueCard({
  t,
  batchParams,
  setBatchParams,
  isPending,
  onDryRun,
  onExecute,
}: BatchRequeueCardProps) {
  return (
    <Card className="bg-white/55 backdrop-blur-md border border-orange-200/60 rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.04)]">
      <CardHeader className="bg-orange-500/5 py-4 border-b border-orange-200/10 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-3 text-orange-700 text-lg font-black tracking-tighter">
            <div className="p-1.5 bg-orange-100 rounded-lg">
              <RefreshCw className="h-5 w-5" />
            </div>
            {t('admin:batch_requeue')}
          </CardTitle>
          <CardDescription className="text-orange-600/80 text-xs">
            {t('admin:batch_requeue_desc')}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-10 text-xs border-orange-200 text-orange-700 hover:bg-orange-100 px-4 font-semibold rounded-xl"
            onClick={onDryRun}
            disabled={isPending}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            {t('admin:dry_run_preview')}
          </Button>
          <Button
            size="sm"
            className="h-10 text-xs bg-orange-600 hover:bg-orange-700 text-white px-4 font-semibold shadow-sm rounded-xl"
            onClick={onExecute}
            disabled={isPending}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? t('common:loading') : t('admin:batch_requeue')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-4">
        <div className="flex gap-6 items-end">
          <div className="w-48 space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin:requeue_statuses')}</Label>
            <Select
              value={batchParams.statuses[0]}
              onValueChange={(v) => setBatchParams({ ...batchParams, statuses: [v] })}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FAILED">{t('admin:status_labels.FAILED')}</SelectItem>
                <SelectItem value="CANCELLED">{t('admin:status_labels.CANCELED')}</SelectItem>
                <SelectItem value="PENDING">{t('admin:status_labels.PENDING')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-32 space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin:limit_count')}</Label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={batchParams.limit ?? ''}
              onChange={(e) =>
                setBatchParams((prev) => ({
                  ...prev,
                  // Backend contract: limit is an int in 1..1000.
                  limit: parseNumberInput(e.target.value, { min: 1, max: 1000, integer: true }),
                }))
              }
              className="h-10"
            />
          </div>
          <div className="flex-1 text-xs text-muted-foreground italic text-right pb-2">
            * {t('admin:requeue_disclaimer')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
