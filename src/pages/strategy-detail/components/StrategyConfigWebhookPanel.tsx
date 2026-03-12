import type { TFunction } from 'i18next';
import { motion } from 'framer-motion';
import { Copy, Globe, Settings2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StrategyConfigWebhookPanelProps {
  t: TFunction;
  showWebhook: boolean;
  webhookUrl: string;
  onCopyWebhook: () => void;
  onOpenSecret: () => void;
  displayParams: Array<[string, unknown]>;
  parameterLabels: Record<string, string>;
}

export function StrategyConfigWebhookPanel({
  t,
  showWebhook,
  webhookUrl,
  onCopyWebhook,
  onOpenSecret,
  displayParams,
  parameterLabels,
}: StrategyConfigWebhookPanelProps) {
  const hasParameters = displayParams.length > 0;

  if (!showWebhook && !hasParameters) return null;

  const parametersCard = hasParameters ? (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-card glass-card rounded-2xl p-6 border border-border/40"
    >
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">{t('strategies:detail.core_params')}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayParams.map(([key, value]) => {
          const translated = t(`strategies:detail.${key}`, { defaultValue: '' }).trim();
          const label = parameterLabels[key] || translated || key.replace(/_/g, ' ');

          return (
            <div key={key} className="p-3.5 rounded-xl bg-secondary/20 border border-border/30 hover:border-primary/30 hover:bg-secondary/30 transition-all">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">
                {label}
              </span>
              <span className="text-sm font-bold text-primary break-words leading-tight block">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  ) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {showWebhook && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="bg-card glass-card rounded-2xl p-6 border border-border/40"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold">{t('strategies:detail.signal_channel')}</h3>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
              {t('strategies:detail.webhook_channel_badge', 'TradingView Webhook')}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="group relative">
              <p className="text-[10px] text-muted-foreground mb-1.5 uppercase font-bold tracking-widest pl-1">
                {t('strategies:detail.endpoint_label')}
              </p>
              <div className="flex items-center gap-2 bg-secondary/30 p-2.5 rounded-xl border border-border/50 group-hover:border-primary/30 transition-colors">
                <code className="flex-1 text-xs font-mono truncate">{webhookUrl}</code>
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 hover:text-primary border-none" onClick={onCopyWebhook}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full justify-between group hover:border-primary/50 hover:bg-primary/5"
              onClick={onOpenSecret}
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                {t('strategies:detail.webhook_secret_btn')}
              </span>
              <Settings2 className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </Button>

            <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                <span className="text-primary font-bold mr-1">{t('strategies:detail.usage_guide')}</span>
                {t('strategies:detail.usage_desc')}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {parametersCard}
    </div>
  );
}
