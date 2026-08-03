import type { TFunction } from 'i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { parseNumberInput } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play } from 'lucide-react';

type AuditMode = 'local_only' | 'full';

interface AuditRunControlCardProps {
  t: TFunction;
  lookbackDays: number | null;
  setLookbackDays: (value: number | null) => void;
  mode: AuditMode;
  setMode: (value: AuditMode) => void;
  dryRun: boolean;
  setDryRun: (value: boolean) => void;
  isRunning: boolean;
  onRun: () => void;
}

export function AuditRunControlCard({
  t,
  lookbackDays,
  setLookbackDays,
  mode,
  setMode,
  dryRun,
  setDryRun,
  isRunning,
  onRun,
}: AuditRunControlCardProps) {
  return (
    <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
      <CardHeader className="pb-3">
        <CardTitle>{t('admin:start_audit')}</CardTitle>
        <CardDescription>{t('admin:start_audit_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('admin:lookback_days')}</label>
            {/* min/max on a bare input are inert here (no enclosing form), and Number('') is 0 -
                which the API layer's `?? 7` preserves, so a cleared field audited a zero-day
                window and reported a clean ledger it never checked. */}
            <Input
              type="number"
              value={lookbackDays ?? ''}
              onChange={(e) =>
                setLookbackDays(parseNumberInput(e.target.value, { min: 1, max: 30, integer: true }))
              }
              className="w-24 h-10 border-border/50 bg-white/80"
              min={1}
              max={30}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('admin:audit_mode')}</label>
            <Select value={mode} onValueChange={(v) => setMode(v as AuditMode)}>
              <SelectTrigger className="w-[150px] h-10 bg-white/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local_only">{t('admin:mode_local_only')}</SelectItem>
                <SelectItem value="full">{t('admin:mode_full')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('admin:audit_scope')}</label>
            <Select value="turboflow" disabled>
              <SelectTrigger className="w-[200px] h-10 bg-white/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="turboflow">{t('admin:scope_turboflow')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-10 flex items-center gap-2 rounded-lg border border-slate-200/70 bg-white/70 px-3">
            <Switch id="dryRun" checked={dryRun} onCheckedChange={setDryRun} />
            <Label htmlFor="dryRun" className="text-sm">
              {t('admin:dry_run')}
            </Label>
          </div>
          <Button className="h-10 px-5 rounded-xl" onClick={onRun} disabled={isRunning}>
            <Play className="mr-2 h-4 w-4" />
            {isRunning ? t('admin:running') : t('admin:run_audit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
