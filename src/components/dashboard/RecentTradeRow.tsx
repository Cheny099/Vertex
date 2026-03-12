import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface RecentTradeRowProps {
  timeText: string;
  symbolText: string;
  side: 'buy' | 'sell';
  priceValue: string | number | null | undefined;
  volumeValue: string | number | null | undefined;
  profit: number | null;
  isFilledWithoutPrice: boolean;
  index: number;
  t: (key: string) => string;
}

function RecentTradeRowComponent({
  timeText,
  symbolText,
  side,
  priceValue,
  volumeValue,
  profit,
  isFilledWithoutPrice,
  index,
  t,
}: RecentTradeRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
      className="hover:bg-secondary/30 transition-colors"
    >
      <td className="p-4 text-sm font-mono text-muted-foreground">{timeText}</td>
      <td className="p-4 text-sm font-medium">{symbolText}</td>
      <td className="p-4">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
            side === 'buy' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
          )}
        >
          {side === 'buy' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {side === 'buy' ? t('recent_trades.table.buy') : t('recent_trades.table.sell')}
        </span>
      </td>
      <td className="p-4 text-sm text-right font-mono">
        <div className="flex flex-col items-end">
          <span>{priceValue || '--'}</span>
          {isFilledWithoutPrice && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-[9px] text-warning mt-0.5 cursor-help">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {t('common:audit.missing_price')}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('common:audit.missing_price_desc')}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </td>
      <td className="p-4 text-sm text-right font-mono">
        <div className="flex flex-col items-end">
          <span>{volumeValue || '--'}</span>
        </div>
      </td>
      <td
        className={cn(
          'p-4 text-sm text-right font-mono font-bold',
          profit !== null ? (profit > 0 ? 'text-profit' : profit < 0 ? 'text-loss' : 'text-muted-foreground') : 'text-muted-foreground'
        )}
      >
        {profit !== null ? `${profit > 0 ? '+' : ''}${profit.toFixed(2)}` : '--'}
      </td>
    </motion.tr>
  );
}

export const RecentTradeRow = memo(RecentTradeRowComponent);
