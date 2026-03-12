import type { TFunction } from 'i18next';
import { AlertTriangle, CheckCircle, Coins, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { safeT } from '../utils';
import type { SummaryCardItem } from './audit-run-insights-panel-types';

type Props = {
  onSummaryCardClick: (key: string, filterKind: string) => void;
  summaryCards: SummaryCardItem[];
  t: TFunction;
};

export function AuditSummaryCardsGrid({ onSummaryCardClick, summaryCards, t }: Props) {
  if (summaryCards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {summaryCards.map((card) => {
        const displayKey = card.displayKey;
        const count = card.count;

        return (
          <div
            key={card.key}
            onClick={() => onSummaryCardClick(card.key, card.filterKind)}
            className={cn(
              'p-3 rounded-xl border bg-background/40 transition-all duration-300',
              card.filterKind ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : 'cursor-default',
              card.isClicked
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background border-primary bg-primary/5 shadow-lg shadow-primary/10'
                : card.isRelated
                  ? 'border-primary/30 bg-primary/[0.02]'
                  : card.isError
                    ? 'border-destructive/20 hover:bg-destructive/5'
                    : card.isWarn
                      ? 'border-amber-500/20 hover:bg-amber-50'
                      : 'border-border/50 hover:bg-primary/5'
            )}
          >
            <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
              {card.isClicked && !card.isAmount ? <Zap className="h-3.5 w-3.5 text-primary animate-bounce" />
                : card.isRelated && !card.isAmount ? <Zap className="h-3.5 w-3.5 text-primary/40" />
                  : card.isAmount ? <Coins className={cn('h-3.5 w-3.5', card.isClicked ? 'text-primary' : 'text-blue-500')} />
                    : card.isError ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      : card.isWarn ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        : <CheckCircle className="h-3.5 w-3.5 text-blue-500" />}
              <span className={cn('text-xs uppercase font-bold tracking-wider truncate', card.isClicked ? 'text-primary' : 'text-muted-foreground')}>
                {safeT(t, `admin:summary_${card.key}`, displayKey)}
              </span>
            </div>
            <div
              className={cn(
                'text-xl font-black tracking-tighter truncate',
                card.isClicked || card.isRelated
                  ? 'text-primary'
                  : card.isError
                    ? 'text-destructive'
                    : card.isWarn
                      ? 'text-amber-600'
                      : 'text-foreground'
              )}
            >
              {displayKey === 'mode'
                ? safeT(t, `admin:mode_${count}`, String(count))
                : String(count)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
