import type { TFunction } from 'i18next';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type OpsHeaderProps = {
  t: TFunction;
  isAutoRefresh: boolean;
  onAutoRefreshChange: (checked: boolean) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
};

export function OpsHeader({
  t,
  isAutoRefresh,
  onAutoRefreshChange,
  onRefresh,
  isRefreshing,
}: OpsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-xl border border-destructive/20">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          {t('admin:ops')}
        </h1>
        <p className="text-slate-500 mt-1 font-medium flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive/80"></span>
          </span>
          {t('admin:ops_desc')}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch id="auto-refresh" checked={isAutoRefresh} onCheckedChange={onAutoRefreshChange} />
          <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
            {t('admin:auto_refresh')}
          </Label>
        </div>
        <Button variant="outline" className="h-10 px-4 rounded-xl" onClick={onRefresh}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('admin:refresh')}
        </Button>
      </div>
    </div>
  );
}

