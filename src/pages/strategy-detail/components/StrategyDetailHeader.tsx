import type { TFunction } from 'i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, History, Plus, Settings2 } from 'lucide-react';
import type { Strategy } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StrategyDetailHeaderProps {
  t: TFunction;
  strategy: Strategy;
  pairText: string;
  onBack: () => void;
  showSignalHistory: boolean;
  onSignalHistory: () => void;
  isSubscribed: boolean;
  onPrimaryAction: () => void;
}

export function StrategyDetailHeader({
  t,
  strategy,
  pairText,
  onBack,
  showSignalHistory,
  onSignalHistory,
  isSubscribed,
  onPrimaryAction,
}: StrategyDetailHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{strategy.name}</h1>
            <Badge variant={strategy.status === 'active' ? 'default' : (strategy.status === 'inactive' ? 'secondary' : 'destructive')}>
              {strategy.status === 'active'
                ? t('strategies:detail.status_active')
                : (strategy.status === 'inactive'
                  ? t('strategies:detail.status_inactive')
                  : t(`strategies:detail.status_${strategy.status}`, { defaultValue: strategy.status }))}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
            <span>{pairText}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>{t('strategies:detail.created_at')} {new Date(strategy.created_at).toLocaleDateString()}</span>
            {strategy.updated_at && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-muted-foreground/80">
                  {t('strategies:detail.updated_at')} {new Date(strategy.updated_at).toLocaleDateString()}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {showSignalHistory && (
          <Button variant="ghost" className="h-10" onClick={onSignalHistory}>
            <History className="w-4 h-4 mr-2" />
            {t('strategies:detail.signal_history')}
          </Button>
        )}

        <Button
          className="gradient-primary px-6 h-10 shadow-lg shadow-primary/20"
          onClick={onPrimaryAction}
        >
          {isSubscribed ? (
            <>
              <Settings2 className="w-4 h-4 mr-2" />
              {t('strategies:detail.edit_subscription')}
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              {t('strategies:detail.subscribe_now')}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
