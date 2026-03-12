import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SwitchRunTimeline } from '@/components/StrategySwitch/SwitchRunTimeline';
import type { StrategySwitchPreviewRequest, StrategySwitchPreviewResponse, StrategySwitchRun } from '@/api';
import { Eye, Loader2, Play } from 'lucide-react';

interface SingleSwitchPanelProps {
  form: StrategySwitchPreviewRequest;
  previewPlan?: StrategySwitchPreviewResponse;
  runStatus?: StrategySwitchRun;
  singlePreviewPending: boolean;
  executePending: boolean;
  cancelPending: boolean;
  isCancelableRun: boolean;
  getStatusLabel: (status?: string) => string;
  onPreview: () => void;
  onCancelRun: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onAccountChange: (value: string) => void;
  onSymbolChange: (value: string) => void;
  onFromSubChange: (value: string) => void;
  onToSubChange: (value: string) => void;
  onHandoverModeChange: (mode: 'FLAT_THEN_SWITCH' | 'KEEP_POSITION_ADOPT') => void;
}

export const SingleSwitchPanel = memo(({
  form,
  previewPlan,
  runStatus,
  singlePreviewPending,
  executePending,
  cancelPending,
  isCancelableRun,
  getStatusLabel,
  onPreview,
  onCancelRun,
  onSubmit,
  onAccountChange,
  onSymbolChange,
  onFromSubChange,
  onToSubChange,
  onHandoverModeChange,
}: SingleSwitchPanelProps) => {
  const { t } = useTranslation(['admin', 'common']);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <CardTitle>{t('admin:strategy_switch.single_switch')}</CardTitle>
            <CardDescription>{t('admin:strategy_switch.single_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin:strategy_switch.account_id')}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.account_id || ''}
                    onChange={(event) => onAccountChange(event.target.value)}
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin:strategy_switch.symbol')}</Label>
                  <Input
                    value={form.symbol}
                    onChange={(event) => onSymbolChange(event.target.value)}
                    placeholder={t('admin:strategy_switch.symbol_placeholder')}
                    className="h-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin:strategy_switch.from_sub_id')}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.from_subscription_id || ''}
                    onChange={(event) => onFromSubChange(event.target.value)}
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin:strategy_switch.to_sub_id')}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.to_subscription_id || ''}
                    onChange={(event) => onToSubChange(event.target.value)}
                    className="h-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('admin:strategy_switch.handover_mode')}</Label>
                <Select value={form.handover_mode} onValueChange={onHandoverModeChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT_THEN_SWITCH">{t('admin:strategy_switch.mode_flat')}</SelectItem>
                    <SelectItem value="KEEP_POSITION_ADOPT">{t('admin:strategy_switch.mode_adopt')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full h-10 rounded-xl"
                  onClick={onPreview}
                  disabled={singlePreviewPending}
                >
                  {singlePreviewPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                  {t('admin:strategy_switch.btn_preview')}
                </Button>
                <Button
                  type="submit"
                  className="w-full h-10 rounded-xl"
                  disabled={executePending}
                >
                  {executePending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  {t('admin:strategy_switch.btn_execute')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {previewPlan && (
            <Card className="bg-white/70 border border-blue-200/60 rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{t('admin:strategy_switch.preview_result')}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-background p-3 rounded-md overflow-auto max-h-[200px]">
                  {JSON.stringify(previewPlan.plan || {}, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {runStatus && (
            <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-base">
                  {t('admin:strategy_switch.execution_status')}
                  <Badge variant={runStatus.status === 'SUCCESS' ? 'default' : runStatus.status === 'FAILED' ? 'destructive' : 'secondary'}>
                    {getStatusLabel(runStatus.status)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs border rounded-lg p-3 bg-muted/20">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin:strategy_switch.run_id')}:</span>
                    <span className="font-mono font-medium">{runStatus.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin:strategy_switch.account_id')}:</span>
                    <span className="font-medium text-primary">#{runStatus.account_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin:strategy_switch.symbol')}:</span>
                    <span className="font-medium uppercase">{runStatus.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin:strategy_switch.from_sub_id')}:</span>
                    <span className="font-medium">#{runStatus.from_subscription_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin:strategy_switch.to_sub_id')}:</span>
                    <span className="font-medium">#{runStatus.to_subscription_id}</span>
                  </div>
                </div>

                {runStatus.error_message && (
                  <Alert variant="destructive">
                    <AlertTitle>{t('common:error')}</AlertTitle>
                    <AlertDescription className="break-all">{runStatus.error_message}</AlertDescription>
                  </Alert>
                )}

                <div className="border rounded-md p-2 bg-muted/30">
                  <SwitchRunTimeline run={runStatus} />
                </div>

                {isCancelableRun && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onCancelRun}
                    disabled={cancelPending}
                    className="w-full"
                  >
                    {cancelPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {t('common:cancel')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
});

SingleSwitchPanel.displayName = 'SingleSwitchPanel';
