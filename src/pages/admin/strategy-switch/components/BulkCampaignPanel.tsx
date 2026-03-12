import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BulkSwitchStats } from '@/components/StrategySwitch/BulkSwitchStats';
import type { StrategySwitchBulkPreviewResponse, StrategySwitchCampaign } from '@/api';
import { Eye, Loader2, Play } from 'lucide-react';

interface BulkPreviewStat {
  label: string;
  value: number;
}

interface BulkCampaignPanelProps {
  form: {
    from_strategy_id: number;
    to_strategy_id: number;
    symbol: string;
  };
  campaignStatus?: StrategySwitchCampaign;
  bulkPreviewData?: StrategySwitchBulkPreviewResponse;
  bulkPreviewStats: BulkPreviewStat[];
  bulkPreviewPending: boolean;
  bulkExecutePending: boolean;
  getStatusLabel: (status?: string) => string;
  onPreview: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onFromStrategyChange: (value: string) => void;
  onToStrategyChange: (value: string) => void;
  onSymbolChange: (value: string) => void;
}

const PreviewStat = memo(({ label, value }: BulkPreviewStat) => (
  <div className="flex flex-col gap-1 p-3 bg-background rounded-lg border">
    <span className="text-xs text-muted-foreground uppercase font-medium">{label}</span>
    <span className="text-xl font-bold">{value}</span>
  </div>
));

PreviewStat.displayName = 'PreviewStat';

export const BulkCampaignPanel = memo(({
  form,
  campaignStatus,
  bulkPreviewData,
  bulkPreviewStats,
  bulkPreviewPending,
  bulkExecutePending,
  getStatusLabel,
  onPreview,
  onSubmit,
  onFromStrategyChange,
  onToStrategyChange,
  onSymbolChange,
}: BulkCampaignPanelProps) => {
  const { t } = useTranslation(['admin', 'common']);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
          <CardHeader>
            <CardTitle>{t('admin:strategy_switch.bulk_campaign')}</CardTitle>
            <CardDescription>{t('admin:strategy_switch.bulk_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin:strategy_switch.from_strategy_id')}</Label>
                  <Input
                    type="number"
                    value={form.from_strategy_id || ''}
                    onChange={(event) => onFromStrategyChange(event.target.value)}
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin:strategy_switch.to_strategy_id')}</Label>
                  <Input
                    type="number"
                    value={form.to_strategy_id || ''}
                    onChange={(event) => onToStrategyChange(event.target.value)}
                    className="h-10"
                    required
                  />
                </div>
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
                <p className="text-xs text-muted-foreground">
                  {t('admin:strategy_switch.symbol_hint')}
                </p>
              </div>

              <p className="text-xs text-muted-foreground pb-4 uppercase font-medium">
                {t('admin:strategy_switch.migrate_all_hint')}
              </p>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full h-10 rounded-xl"
                  onClick={onPreview}
                  disabled={bulkPreviewPending}
                >
                  {bulkPreviewPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                  {t('admin:strategy_switch.btn_preview')}
                </Button>
                <Button
                  type="submit"
                  className="w-full h-10 rounded-xl"
                  disabled={bulkExecutePending}
                >
                  {bulkExecutePending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  {t('admin:strategy_switch.btn_start_bulk')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {campaignStatus && (
          <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
            <CardHeader>
              <CardTitle className="flex justify-between items-center text-base">
                {t('admin:strategy_switch.campaign_status')}
                <Badge variant={campaignStatus.status === 'SUCCESS' ? 'default' : campaignStatus.status === 'FAILED' ? 'destructive' : 'secondary'}>
                  {getStatusLabel(campaignStatus.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-muted-foreground font-mono">
                {t('admin:strategy_switch_campaign')} {t('admin:column_id')}: #{campaignStatus.campaign_id}
              </div>
              <BulkSwitchStats campaign={campaignStatus} />
            </CardContent>
          </Card>
        )}
      </div>

      {bulkPreviewData && (
        <Card className="bg-white/70 border border-blue-200/60 rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {t('admin:strategy_switch.bulk_preview_result', 'Bulk Preview Results')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {bulkPreviewStats.map((stat) => (
                <PreviewStat key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </div>
            {bulkPreviewData.sample.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider">{t('admin:strategy_switch.sample_accounts', 'Sample Accounts')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {bulkPreviewData.sample.map((sample) => (
                    <div key={`${sample.account_id}-${sample.params_digest}`} className="text-xs font-mono p-2 bg-background rounded border flex justify-between">
                      <span>Acc #{sample.account_id}</span>
                      <span className="text-muted-foreground">{sample.params_digest.slice(0, 16)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
});

BulkCampaignPanel.displayName = 'BulkCampaignPanel';
